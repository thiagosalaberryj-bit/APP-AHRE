import assert from 'node:assert/strict';
import test, {type TestContext} from 'node:test';
import { randomUUID } from 'node:crypto';
import { preparar } from './helpers/localDatabase.ts';
import type { LoteSync } from '../src/sync/protocol.ts';
import {crearProgramadorSincronizacion} from '../src/sync/syncScheduler.ts';

async function escenarioCorreo(prueba:TestContext,recordar:boolean) {
  let offline=false,revision=0,identidadDistinta=false;
  let usuario:import('../src/database/types').Usuario;
  let dispositivoId='';
  const clave='CorreoPrueba123!';
  const transporte:typeof fetch=async(url,opciones)=>{
    if(offline)throw new Error('sin red');
    const ruta=String(url),datos=opciones?.body?JSON.parse(String(opciones.body)):{};
    if(ruta.endsWith('/health'))return Response.json({protocolo:3});
    if(ruta.endsWith('/auth/register')){
      const fecha=new Date().toISOString();
      usuario={id:datos.id,nombre:datos.nombre,correo_electronico:datos.correo,activo:1,fecha_creacion:fecha,fecha_actualizacion:fecha};
      dispositivoId=datos.dispositivoId;
    }
    if(ruta.endsWith('/auth/login')&&(datos.correo!==usuario.correo_electronico||datos.contrasena!==clave))return Response.json({error:'Credenciales incorrectas.'},{status:401});
    if(ruta.endsWith('/auth/login')||ruta.endsWith('/auth/register'))return Response.json({token:'a'.repeat(64),vence:Date.now()+86400000,usuario:identidadDistinta?{...usuario,id:randomUUID()}:usuario,dispositivoId,generacion:1,revision});
    if(ruta.endsWith('/auth/logout'))return new Response(null,{status:204});
    if(ruta.endsWith('/sync')&&opciones?.method==='POST'){
      for(const cambio of (datos as LoteSync).cambios)if(cambio.tabla==='usuarios')usuario={...usuario,...cambio.datos} as typeof usuario;
      return Response.json({revision:++revision});
    }
    return Response.json({lotes:[],mas:false});
  };
  const configuracion={url:'http://127.0.0.1:4000/api/v1',fetch:transporte};
  const e=await preparar(prueba,true,configuracion);
  const cuenta=await e.registrarUsuario({nombre:'Cuenta correo',correo:'anterior@example.test',contrasena:clave,confirmacion:clave});
  await e.iniciarSesion({correo:'anterior@example.test',contrasena:clave,recordar});
  return {...e,cuenta,clave,configuracion,desconectar:()=>{offline=true;},conectar:()=>{offline=false;},otraIdentidad:()=>{identidadDistinta=true;}};
}

for(const recordar of [false,true])test(`cambiar correo offline permite recuperar la cuenta por ID tras reiniciar (recordar=${recordar})`,async t=>{
  const e=await escenarioCorreo(t,recordar);
  const deposito=await e.depositosRepositorio.crear({usuario_id:e.cuenta.id,nombre:'Ahorros',tipo:'efectivo',saldo_inicial:500,icono:'cash-outline'});
  await e.sincronizarCuenta(e.cuenta.id);e.desconectar();
  const perfil=await e.actualizarPerfil({nombre:'Nombre pendiente',correo:'nuevo@example.test'});
  assert.equal(perfil.correoModificado,true);
  await e.movimientosRepositorio.crear({deposito_id:deposito.id,tipo:'egreso',categoria:'alimentacion',monto:25,descripcion:'Offline',fecha_hora:new Date().toISOString()});
  const cola=e.base.prepare('SELECT * FROM sync_outbox ORDER BY secuencia').all();
  await e.cerrarSesion();e.conectar();
  const reiniciada=await preparar(t,true,{...e.configuracion,base:e.base,almacenamiento:e.almacenamiento});
  await assert.rejects(reiniciada.iniciarSesion({correo:'nuevo@example.test',contrasena:e.clave,recordar}),{codigo:'credenciales_invalidas'});
  assert.equal((await reiniciada.obtenerSesionActual()).usuario,null);
  assert.deepEqual(e.base.prepare('SELECT * FROM sync_outbox ORDER BY secuencia').all(),cola);
  const usuario=await reiniciada.iniciarSesion({correo:'anterior@example.test',contrasena:e.clave,recordar});
  assert.equal(usuario.id,e.cuenta.id);assert.equal(usuario.nombre,'Nombre pendiente');assert.equal(usuario.correo_electronico,'nuevo@example.test');
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM usuarios').get()!.n,1);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM preferencias').get()!.n,1);
  assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual,475);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM sync_outbox').get()!.n,0);
  const sesion=await preparar(t,true,{...e.configuracion,base:e.base,almacenamiento:e.almacenamiento});
  assert.equal((await sesion.obtenerSesionActual()).usuario?.id,recordar?e.cuenta.id:undefined);
  await reiniciada.cerrarSesion();
  await assert.rejects(reiniciada.iniciarSesion({correo:'nuevo@example.test',contrasena:'Incorrecta123!',recordar}),{codigo:'credenciales_invalidas'});
  assert.equal((await reiniciada.obtenerSesionActual()).usuario,null);
  await reiniciada.iniciarSesion({correo:'nuevo@example.test',contrasena:e.clave,recordar});
});

test('el correo coincidente con otro ID remoto no vincula cuentas ni consume pendientes',async t=>{
  const e=await escenarioCorreo(t,false);e.desconectar();
  await e.actualizarPerfil({nombre:'Pendiente',correo:'anterior@example.test'});
  await e.cerrarSesion();const cola=JSON.stringify(e.base.prepare('SELECT * FROM sync_outbox').all());
  e.conectar();e.otraIdentidad();
  await assert.rejects(e.iniciarSesion({correo:'anterior@example.test',contrasena:e.clave}),{codigo:'identidad_incompatible'});
  assert.equal(JSON.stringify(e.base.prepare('SELECT * FROM sync_outbox').all()),cola);
  assert.equal((await e.obtenerSesionActual()).usuario,null);
});

test('recuperar por ID no permite reenviar pendientes de una autorización revocada',async t=>{
  const e=await escenarioCorreo(t,false);e.desconectar();
  await e.actualizarPerfil({nombre:'Pendiente',correo:'nuevo@example.test'});
  await e.cerrarSesion();await e.marcarRevocada(e.cuenta.id);
  const cola=JSON.stringify(e.base.prepare('SELECT * FROM sync_outbox').all());e.conectar();
  await assert.rejects(e.iniciarSesion({correo:'anterior@example.test',contrasena:e.clave}),{codigo:'pendientes_otra_autorizacion'});
  assert.equal(JSON.stringify(e.base.prepare('SELECT * FROM sync_outbox').all()),cola);
  assert.equal((await e.obtenerSesionActual()).usuario,null);
});

async function escenario(prueba:TestContext,instrumentacion:{registrarSql?:(sql:string)=>void;reloj?:(new () => Date) & Pick<typeof Date,'now'|'parse'|'UTC'>}={}) {
  let revision=0,offline=false,perderRespuesta=false,conflicto=false;
  const recibidos:LoteSync[]=[],aceptados=new Map<string,number>(),contenidos=new Map<string,string>();
  const transporte:typeof fetch=async(_url,opciones)=>{
    if(offline)throw new Error('sin red');
    if(opciones?.method==='POST') {
      const lote=JSON.parse(String(opciones.body)) as LoteSync;recibidos.push(lote);
      const previa=aceptados.get(lote.id);
      if(previa){
        if(contenidos.get(lote.id)!==JSON.stringify(lote))return Response.json({error:'Contenido confirmado distinto.',codigo:'lote_confirmado_otro_contenido'},{status:409});
        return Response.json({revision:previa});
      }
      if(conflicto||lote.base!==revision)return Response.json({error:'Conflicto de revisión.'},{status:409});
      revision++;aceptados.set(lote.id,revision);contenidos.set(lote.id,JSON.stringify(lote));
      if(perderRespuesta){perderRespuesta=false;throw new Error('respuesta perdida');}
      return Response.json({revision});
    }return Response.json({lotes:[],mas:false});
  };
  const e=await preparar(prueba,true,{url:'http://127.0.0.1:4000/api/v1',fetch:transporte,...instrumentacion});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Sincronización',correo_electronico:'sync@example.test',activo:1});
  await e.guardarSesionRemota(usuario.id,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
  await e.crearSesion(usuario.id,false);
  await e.sincronizarCuenta(usuario.id);recibidos.length=0;
  const deposito=()=>e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Nuevo',tipo:'efectivo',saldo_inicial:1000,icono:'cash-outline',fecha_creacion:'2020-01-01T00:00:00.000Z'});
  const movimiento=(depositoId:string)=>e.movimientosRepositorio.crear({deposito_id:depositoId,tipo:'egreso',categoria:'alimentacion',monto:50,descripcion:'Compra offline',fecha_hora:new Date().toISOString()});
  const cola=()=>e.base.prepare('SELECT lote,cambio FROM sync_outbox WHERE usuario_id=? ORDER BY secuencia').all(usuario.id);
  return {...e,usuario,deposito,movimiento,cola,recibidos,aceptados,desconectar:()=>{offline=true;},conectar:()=>{offline=false;},perderRespuesta:()=>{perderRespuesta=true;},crearConflicto:()=>{conflicto=true;}};
}

test('la cola sube primero el depósito y luego el movimiento, con el saldo en su mismo lote',async prueba=>{
  const e=await escenario(prueba);e.desconectar();
  const deposito=await e.deposito();await e.movimiento(deposito.id);
  await e.sincronizarCuenta(e.usuario.id);assert.ok(e.cola().length>0);
  e.conectar();await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.cola().length,0);assert.equal(e.recibidos.length,2);
  assert.equal(e.recibidos[0].cambios[0].tabla,'depositos');
  assert.ok(e.recibidos[1].cambios.some(c=>c.tabla==='movimientos'));
  assert.ok(e.recibidos[1].cambios.some(c=>c.tabla==='depositos'&&c.datos.saldo_actual===950));
  assert.equal(e.recibidos[1].base,e.recibidos[0].base+1);
});
test('una respuesta perdida conserva el lote y reintenta el mismo envío sin duplicarlo',async prueba=>{
  const e=await escenario(prueba);await e.deposito();e.perderRespuesta();
  await e.sincronizarCuenta(e.usuario.id);const antes=e.cola().length;assert.ok(antes>0);
  const n=e.aceptados.size;await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.cola().length,0);assert.equal(e.aceptados.size,n);
  assert.deepEqual(e.recibidos[0],e.recibidos[1]);
});
test('un conflicto detiene el orden y conserva ese lote y todos los siguientes',async prueba=>{
  const e=await escenario(prueba);const deposito=await e.deposito();await e.movimiento(deposito.id);
  const n=e.cola().length;e.crearConflicto();let estado='';const dejar=e.observarSincronizacion(v=>{estado=v.estado;});
  await e.sincronizarCuenta(e.usuario.id);dejar();
  assert.equal(estado,'conflicto');assert.equal(await e.consultarReparacionPerfil(),null);assert.equal(e.recibidos.length,1);assert.equal(e.cola().length,n);
});
test('un rollback no deja registros ni eventos de una transacción incompleta',async prueba=>{
  const e=await escenario(prueba);const deposito=await e.deposito();const antes=e.cola().length;
  e.base.exec("CREATE TRIGGER fallo_saldo BEFORE UPDATE OF saldo_actual ON depositos BEGIN SELECT RAISE(ABORT,'fallo');END;");
  await assert.rejects(e.movimiento(deposito.id));
  assert.equal(e.cola().length,antes);assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()!.n,0);
});
test('la cola persiste en SQLite y el orden no depende del reloj del dispositivo',async prueba=>{
  const e=await escenario(prueba);const deposito=await e.deposito();await e.movimiento(deposito.id);
  const antes=JSON.stringify(e.cola());
  await e.sincronizarCuenta('');assert.equal(JSON.stringify(e.cola()),antes);
  const secuencias=e.base.prepare('SELECT secuencia FROM sync_outbox ORDER BY secuencia').all().map(f=>Number(f.secuencia));
  assert.ok(secuencias.every((n,i)=>i===0||n>secuencias[i-1]));
  await e.sincronizarCuenta(e.usuario.id);assert.equal(e.cola().length,0);
});
test('un primer registro sin conexión no crea cuenta ni pendientes locales',async prueba=>{
  const e=await preparar(prueba,true,{url:'http://127.0.0.1/api/v1',fetch:async()=>{throw new Error('sin red');}});
  await assert.rejects(e.registrarUsuario({nombre:'Sin señal',correo:'nueva@example.test',contrasena:'ClaveNueva123!',confirmacion:'ClaveNueva123!'}),/Conectate/);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM usuarios').get()!.n,0);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM sync_outbox').get()!.n,0);
});
test('un servidor sin desplegar o en mantenimiento requiere conexión para el primer ingreso',async prueba=>{
  for(const codigo of [404,503]) {
    const e=await preparar(prueba,true,{url:'http://127.0.0.1/api/v1',fetch:async()=>Response.json({error:'no disponible'},{status:codigo})});
    await assert.rejects(e.registrarUsuario({nombre:'Local',correo:`local${codigo}@example.test`,contrasena:'ClaveLocal123!',confirmacion:'ClaveLocal123!'}),/Conectate/);
    await assert.rejects(e.iniciarSesion({correo:`local${codigo}@example.test`,contrasena:'ClaveLocal123!',recordar:false}),/Conectate/);
    assert.equal((await e.obtenerSesionActual()).usuario,null);
    assert.equal(e.base.prepare('SELECT COUNT(*) n FROM sync_outbox').get()!.n,0);
  }
});

test('una instalación revocada conserva sus pendientes y bloquea nuevas escrituras',async prueba=>{
  const e=await escenario(prueba);await e.deposito();const pendientes=JSON.stringify(e.cola());
  await e.marcarRevocada(e.usuario.id);
  assert.equal((await e.obtenerSesionActual()).usuario,null);
  await assert.rejects(e.deposito());
  assert.equal(JSON.stringify(e.cola()),pendientes);
  await assert.rejects(e.registrarAutorizacion(e.usuario.id,await e.obtenerInstalacion(),2),/autorización anterior/);
  assert.equal(JSON.stringify(e.cola()),pendientes);
});

test('la identidad de instalación persiste al recargar y se genera una sola vez',async prueba=>{
  const opciones={url:'http://127.0.0.1/api/v1',fetch,almacenamiento:new Map<string,string>()};
  const uno=await preparar(prueba,true,opciones);
  const ids=await Promise.all(Array.from({length:12},()=>uno.obtenerInstalacion()));
  assert.equal(new Set(ids).size,1);
  const dos=await preparar(prueba,true,opciones);
  assert.equal(await dos.obtenerInstalacion(),ids[0]);
});

test('la cuenta de prueba de desarrollo funciona sin red y no llama a la API',async prueba=>{
  let llamadas=0;
  const e=await preparar(prueba,true,{url:'http://127.0.0.1/api/v1',fetch:async()=>{llamadas++;throw new Error('sin red');}});
  await e.prepararDatosPrueba();await e.sincronizarSesion();
  assert.equal(llamadas,0);assert.equal((await e.cargarSocial()).salas[0].gastos.length,4);
});

test('una base local con la autorización de otra instalación no habilita el ingreso offline',async prueba=>{
  const e=await preparar(prueba,true,{url:'http://127.0.0.1/api/v1',fetch:async()=>{throw new Error('sin red');}});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Otra instalación',correo_electronico:'otra@example.test',activo:1});
  await e.registrarAutorizacion(usuario.id,'b'.repeat(64),1);
  await assert.rejects(e.crearSesion(usuario.id),/Conectate/);
  e.almacenamiento.set('ahre.sesion.usuario_id',usuario.id);
  assert.equal((await e.obtenerSesionActual()).usuario,null);
});

test('un backend anterior se detecta antes de enviar un registro o un ingreso',async prueba=>{
  const rutas:string[]=[];
  const e=await preparar(prueba,true,{url:'http://127.0.0.1/api/v1',fetch:async url=>{rutas.push(String(url));return Response.json({protocolo:1});}});
  await assert.rejects(e.registrarUsuario({nombre:'Nueva',correo:'nueva@example.test',contrasena:'ClaveNueva123!',confirmacion:'ClaveNueva123!'}),/necesita actualizarse/);
  await assert.rejects(e.iniciarSesion({correo:'nueva@example.test',contrasena:'ClaveNueva123!'}),/necesita actualizarse/);
  assert.ok(rutas.every(r=>r.endsWith('/health')));
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM usuarios').get()!.n,0);
});

test('la lista de pendientes agrupa por registro, muestra recientes primero y no modifica la cola',async prueba=>{
  const e=await escenario(prueba);e.desconectar();
  const deposito=await e.deposito();
  await e.depositosRepositorio.actualizar(deposito.id,{nombre:'Nombre actualizado'});
  await e.movimiento(deposito.id);
  const antes=JSON.stringify(e.cola());
  await e.actualizarCantidadPendientes();
  assert.equal(e.obtenerVistaSincronizacion().pendientes,2);
  const paginaUno=await e.consultarPendientes(1,0),paginaDos=await e.consultarPendientes(1,1);
  assert.equal(paginaUno.total,2);assert.equal(paginaUno.registros.length,1);
  // El ajuste de saldo del depósito es la última escritura del mismo lote.
  assert.match(paginaUno.registros[0].titulo,/Nombre actualizado/);
  assert.equal(paginaUno.registros[0].importe,950);
  assert.match(paginaDos.registros[0].titulo,/Egreso/);
  assert.equal(paginaDos.registros[0].importe,50);
  assert.equal(JSON.stringify(e.cola()),antes);
  e.conectar();await e.sincronizarCuenta(e.usuario.id);
  assert.equal((await e.consultarPendientes()).total,0);
});

test('los pendientes usan la hora de escritura local y no la fecha histórica del movimiento',async prueba=>{
  const e=await escenario(prueba);e.desconectar();
  const deposito=await e.deposito();
  await e.movimientosRepositorio.crear({deposito_id:deposito.id,tipo:'egreso',categoria:'alimentacion',monto:25,descripcion:'Compra antigua',fecha_hora:'2020-01-01T12:00:00.000Z'});
  const registro=(await e.consultarPendientes()).registros.find(r=>r.titulo.includes('Compra antigua'))!;
  assert.ok(registro);
  assert.ok(Math.abs(Date.now()-new Date(registro.fecha).getTime())<10000);
  assert.equal(registro.accion,'Actualización');
  assert.ok(e.base.prepare('SELECT COUNT(*) n FROM sync_local_dates').get()!.n);
  e.conectar();await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM sync_local_dates').get()!.n,0);
});

test('la última sincronización exitosa persiste por cuenta y los fallos no la reemplazan',async prueba=>{
  const e=await escenario(prueba);
  const anterior=(await e.consultarPendientes()).ultimaSincronizacion;
  assert.ok(anterior);
  assert.equal(e.base.prepare('SELECT fecha FROM sync_last_success WHERE usuario_id=?').get(e.usuario.id)!.fecha,anterior);
  e.desconectar();await e.deposito();await e.sincronizarCuenta(e.usuario.id);
  assert.equal((await e.consultarPendientes()).ultimaSincronizacion,anterior);
  const otra=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Sin historial',correo_electronico:'sin-historial@example.test',activo:1});
  await e.registrarAutorizacion(otra.id,await e.obtenerInstalacion(),1);
  await e.crearSesion(otra.id,false);
  assert.equal((await e.consultarPendientes()).ultimaSincronizacion,null);
});

test('la paginación respeta los meses y un registro sin fecha local no inventa un horario',async prueba=>{
  const e=await escenario(prueba);e.desconectar();
  const primero=await e.deposito(),segundo=await e.deposito();
  const filas=e.base.prepare('SELECT secuencia FROM sync_outbox ORDER BY secuencia').all();
  e.base.prepare('UPDATE sync_local_dates SET fecha=? WHERE secuencia=?').run('2026-09-01T12:00:00.000Z',filas[0].secuencia);
  e.base.prepare('UPDATE sync_local_dates SET fecha=? WHERE secuencia=?').run('2026-10-01T12:00:00.000Z',filas[1].secuencia);
  assert.equal((await e.consultarPendientes(1,0)).registros[0].id,`depositos:${segundo.id}`);
  assert.equal((await e.consultarPendientes(1,1)).registros[0].id,`depositos:${primero.id}`);
  e.base.prepare('DELETE FROM sync_local_dates WHERE secuencia=?').run(filas[0].secuencia);
  assert.equal((await e.consultarPendientes(1,1)).registros[0].fecha,'');
});

test('una comprobación silenciosa sin pendientes conserva el estado sincronizado',async prueba=>{
  const e=await escenario(prueba);const estados:string[]=[];
  const dejar=e.observarSincronizacion(v=>estados.push(v.estado));
  await e.sincronizarCuenta(e.usuario.id,true);dejar();
  assert.ok(estados.every(estado=>estado==='online'));
  assert.equal(e.obtenerVistaSincronizacion().pendientes,0);
  e.desconectar();await e.sincronizarCuenta(e.usuario.id,true);
  assert.equal(e.obtenerVistaSincronizacion().estado,'offline');
});

test('el contador compacto admite tres dígitos y muestra puntos cuando se exceden',async prueba=>{
  const e=await escenario(prueba);
  assert.equal(e.formatearCantidadPendientes(0),'0');
  assert.equal(e.formatearCantidadPendientes(999),'999');
  assert.equal(e.formatearCantidadPendientes(1000),'...');
  assert.equal(e.formatearCantidadPendientes(100000),'...');
});

test('los pendientes de otra cuenta no aparecen al cambiar la sesión',async prueba=>{
  const e=await escenario(prueba);const deposito=await e.deposito();
  const otra=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Otra cuenta',correo_electronico:'otra-lista@example.test',activo:1});
  await e.registrarAutorizacion(otra.id,await e.obtenerInstalacion(),1);
  await e.crearSesion(otra.id,false);
  const lista=await e.consultarPendientes();
  assert.ok(lista.registros.every(r=>r.id!==`depositos:${deposito.id}`));
  assert.equal(lista.total,1);
});

test('desactivar un depósito aparece en pendientes y se envía conservando el registro',async prueba=>{
  const e=await escenario(prueba);const deposito=await e.deposito();await e.sincronizarCuenta(e.usuario.id);e.recibidos.length=0;
  e.desconectar();await e.depositosRepositorio.eliminar(deposito.id);
  const lista=await e.consultarPendientes();
  assert.equal(lista.total,1);assert.match(lista.registros[0].descripcion,/Desactivación pendiente/);
  assert.equal(e.base.prepare('SELECT activo FROM depositos WHERE id=?').get(deposito.id)!.activo,0);
  e.conectar();await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.recibidos.length,1);
  assert.ok(e.recibidos[0].cambios.some(c=>c.tabla==='depositos'&&c.datos.id===deposito.id&&c.datos.activo===0));
  assert.equal((await e.consultarPendientes()).total,0);
});

test('el diario también incluye perfil, preferencias y cancelación de deudas',async prueba=>{
  const e=await escenario(prueba);e.desconectar();
  await e.usuariosRepositorio.actualizar(e.usuario.id,{nombre:'Perfil editado'});
  await e.preferenciasRepositorio.crear({usuario_id:e.usuario.id,idioma:'es',apariencia:'oscuro',notificaciones_activas:1});
  const propia=await e.personasRepositorio.crear({usuario_id:e.usuario.id,nombre:'Yo',nombre_normalizado:'yo',es_usuario_actual:1});
  const otra=await e.personasRepositorio.crear({usuario_id:e.usuario.id,nombre:'Otra',apellido:'Persona',apodo:'otra',nombre_normalizado:'otra',apellido_normalizado:'persona',apodo_normalizado:'otra',es_usuario_actual:0});
  const deuda=await e.deudasRepositorio.crear({usuario_id:e.usuario.id,deudor_id:propia.id,acreedor_id:otra.id,monto:100,descripcion:'Deuda de prueba',fecha:new Date().toISOString()});
  await e.deudasRepositorio.actualizar(deuda.id,{estado:'cancelada',fecha_cancelacion:new Date().toISOString()});
  const lista=await e.consultarPendientes();
  assert.ok(lista.registros.some(r=>r.id===`usuarios:${e.usuario.id}`));
  assert.ok(lista.registros.some(r=>r.id.startsWith('preferencias:')));
  assert.match(lista.registros.find(r=>r.id===`deudas:${deuda.id}`)!.descripcion,/Cancelación pendiente/);
});

test('guardar y desactivar un depósito disparan la sincronización sin abrir la pantalla',async prueba=>{
  const e=await escenario(prueba);
  const programador=crearProgramadorSincronizacion({sincronizar:e.sincronizarSesion,obtenerVista:e.obtenerVistaSincronizacion,estaActiva:()=>true});
  const dejar=e.observarCambiosLocales(()=>programador.solicitar(false,0));
  prueba.after(()=>{dejar();programador.cerrar();});
  const esperarConfirmacion=async()=>{
    const limite=Date.now()+3000;
    while((e.cola().length||e.obtenerVistaSincronizacion().estado!=='online')&&Date.now()<limite)await new Promise(r=>setTimeout(r,10));
    assert.equal(e.cola().length,0);assert.equal(e.obtenerVistaSincronizacion().estado,'online');
  };
  const deposito=await e.deposito();await esperarConfirmacion();
  assert.ok(e.recibidos.some(l=>l.cambios.some(c=>c.tabla==='depositos'&&c.datos.id===deposito.id)));
  e.recibidos.length=0;
  await e.depositosRepositorio.eliminar(deposito.id);await esperarConfirmacion();
  assert.ok(e.recibidos.some(l=>l.cambios.some(c=>c.tabla==='depositos'&&c.datos.activo===0)));
});

test('la sonda detecta pérdida y recuperación de conexión sin movimientos ni abrir pantallas',async prueba=>{
  const e=await escenario(prueba);const cantidad=e.recibidos.length;
  assert.equal(await e.comprobarConexionServidor(),false);
  assert.equal(e.obtenerVistaSincronizacion().estado,'online');
  e.desconectar();
  await e.comprobarConexionServidor();
  assert.equal(e.obtenerVistaSincronizacion().estado,'offline');
  e.conectar();
  assert.equal(await e.comprobarConexionServidor(),true);
  // Encontrar red no equivale a confirmar datos: el tick espera la sincronización.
  assert.equal(e.obtenerVistaSincronizacion().estado,'offline');
  await e.sincronizarSesion();
  assert.equal(e.obtenerVistaSincronizacion().estado,'online');
  assert.equal(e.recibidos.length,cantidad);
});

test('un contenido confirmado distinto restaura el respaldo pendiente y reconoce el ACK original',async t=>{
  const e=await escenario(t);
  await e.usuariosRepositorio.actualizar(e.usuario.id,{nombre:'Original confirmado'});
  e.perderRespuesta();await e.sincronizarCuenta(e.usuario.id);
  const fila=e.base.prepare('SELECT secuencia,lote,cambio FROM sync_outbox ORDER BY secuencia LIMIT 1').get()!;
  e.base.prepare('INSERT INTO sync_profile_backup(usuario_id,secuencia,lote,cambio) VALUES(?,?,?,?)').run(e.usuario.id,fila.secuencia,fila.lote,fila.cambio);
  const alterado=JSON.parse(String(fila.cambio));alterado.datos.correo_electronico='otro@example.test';
  e.base.prepare('UPDATE sync_outbox SET cambio=? WHERE secuencia=?').run(JSON.stringify(alterado),fila.secuencia);
  await e.deposito();
  await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.obtenerVistaSincronizacion().estado,'online');
  assert.equal(e.cola().length,0);
  assert.equal(e.base.prepare('SELECT cambio FROM sync_profile_backup').get()!.cambio,fila.cambio);
  assert.equal(e.recibidos.filter(l=>l.id===fila.lote).length,3);
});


test('las lecturas no escriben el contexto, no buscan máximos ni emiten cambios locales',async t=>{
  const consultas:string[]=[];
  const e=await escenario(t,{registrarSql:sql=>consultas.push(sql)});
  const deposito=await e.deposito();await e.movimiento(deposito.id);
  let avisos=0;const dejar=e.observarCambiosLocales(()=>{avisos++;});
  t.after(dejar);
  const antes=JSON.stringify(e.cola());consultas.length=0;
  await e.obtenerSesionActual();await e.consultarAutorizacion(e.usuario.id);
  await e.usuariosRepositorio.consultarPorId(e.usuario.id);
  await e.usuariosRepositorio.consultar();await e.usuariosRepositorio.buscar('Sincronización');
  await e.autenticacionRepositorio.consultarCredencialesPorCorreo('sync@example.test');
  await e.autenticacionRepositorio.consultarCredencialesPorId(e.usuario.id);
  await e.autenticacionRepositorio.existeCorreoRegistrado('sync@example.test');
  await e.depositosRepositorio.consultarSaldoActual(deposito.id);
  await e.depositosRepositorio.consultarHistorialSaldos(deposito.id);
  await e.movimientosRepositorio.consultarHistorial(e.usuario.id);
  await e.consultarReparacionPerfil();
  assert.equal((await e.consultarPendientes()).total,2);
  assert.equal(await e.contarRegistrosPendientes(e.usuario.id),2);
  assert.ok(consultas.length>0);
  assert.ok(consultas.every(sql=>/^SELECT/i.test(sql)));
  assert.ok(consultas.every(sql=>!sql.includes('SELECT MAX(secuencia) AS n')));
  assert.equal(avisos,0);assert.equal(JSON.stringify(e.cola()),antes);
  const ultimaSecuencia=Number(e.base.prepare('SELECT MAX(secuencia) n FROM sync_outbox').get()!.n);
  await e.movimiento(deposito.id);
  assert.equal(avisos,1); // La escritura y sus efectos sobre el saldo conservan un lote.
  const lotes=e.base.prepare('SELECT COUNT(DISTINCT lote) n FROM sync_outbox WHERE secuencia>?').get(ultimaSecuencia);
  assert.equal(lotes!.n,1);
});

for(const revertir of [false,true])test(`las lecturas esperan la transacción completa y la cola sigue tras rollback=${revertir}`,async t=>{
  const e=await escenario(t);const deposito=await e.deposito();
  let liberar!:()=>void,avisarEntrada!:()=>void;
  const pausa=new Promise<void>(resolver=>{liberar=resolver;});
  const entrada=new Promise<void>(resolver=>{avisarEntrada=resolver;});
  const escritura=e.ejecutarTransaccion(async c=>{
    await e.depositosRepositorio.actualizar(deposito.id,{nombre:'Confirmado'},c);
    // La lectura anidada usa la conexión recibida, sin volver a encolarse.
    assert.equal((await e.depositosRepositorio.consultarPorId(deposito.id,c))!.nombre,'Confirmado');
    avisarEntrada();await pausa;
    if(revertir)throw new Error('rollback de prueba');
  });
  const terminacion=revertir?assert.rejects(escritura,{codigo:'transaccion'}):escritura;
  await entrada;let leida=false;
  const lectura=e.depositosRepositorio.consultarPorId(deposito.id).then(f=>{leida=true;return f;});
  await Promise.resolve();assert.equal(leida,false);
  liberar();await terminacion;
  assert.equal((await lectura)!.nombre,revertir?'Nuevo':'Confirmado');
  await e.depositosRepositorio.actualizar(deposito.id,{nombre:'Siguiente'});
  assert.equal((await e.depositosRepositorio.consultarPorId(deposito.id))!.nombre,'Siguiente');
});

test('el índice de lote evita recorrer los eventos de otros lotes y conserva el orden',async t=>{
  const e=await escenario(t);const deposito=await e.deposito();await e.movimiento(deposito.id);
  const consulta='SELECT cambio FROM sync_outbox WHERE usuario_id=? AND lote=? ORDER BY secuencia';
  const lote=String(e.base.prepare('SELECT lote FROM sync_outbox ORDER BY secuencia DESC LIMIT 1').get()!.lote);
  const plan=e.base.prepare('EXPLAIN QUERY PLAN '+consulta).all(e.usuario.id,lote).map(f=>String(f.detail)).join(' ');
  assert.match(plan,/sync_outbox_usuario_lote/);assert.doesNotMatch(plan,/TEMP B-TREE|SCAN sync_outbox/);
  const antes=JSON.stringify(e.base.prepare(consulta).all(e.usuario.id,lote));
  e.base.exec('DROP INDEX sync_outbox_usuario_lote');
  assert.equal(JSON.stringify(e.base.prepare(consulta).all(e.usuario.id,lote)),antes);
  const reiniciada=await preparar(t,true,{url:'http://127.0.0.1/api/v1',fetch,base:e.base,almacenamiento:e.almacenamiento});
  await reiniciada.inicializarBaseDatos();
  assert.ok(e.base.prepare("SELECT name FROM sqlite_master WHERE name='sync_outbox_usuario_lote'").get());
  assert.equal(JSON.stringify(e.base.prepare(consulta).all(e.usuario.id,lote)),antes);
});

test('una ráfaga confirma todos los lotes sin reagrupar toda la cola por cada ACK',async t=>{
  const consultas:string[]=[];
  class RelojFijo extends Date {static override now(){return 1800000000000;}}
  const e=await escenario(t,{registrarSql:sql=>consultas.push(sql),reloj:RelojFijo});
  const deposito=await e.deposito();
  for(let i=0;i<20;i++)await e.movimiento(deposito.id);
  const cambios=JSON.stringify(e.cola());assert.ok(cambios.length>0);
  consultas.length=0;await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.recibidos.length,21);assert.equal(e.cola().length,0);
  assert.equal(e.obtenerVistaSincronizacion().pendientes,0);
  assert.equal(e.obtenerVistaSincronizacion().estado,'online');
  const recuentos=consultas.filter(sql=>sql.includes('SELECT COUNT(*) n FROM (SELECT json_extract'));
  assert.equal(recuentos.length,2); // Inicio y cierre; durante el envío se limita a uno cada 250 ms.
  assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual,0);
});


test('un rechazo tras un ACK muestra el recuento exacto aunque no haya vencido el intervalo',async t=>{
  let provocarConflicto=()=>{};
  class RelojFijo extends Date {static override now(){return 1800000000000;}}
  const e=await escenario(t,{reloj:RelojFijo,registrarSql:sql=>{
    if(sql.startsWith('DELETE FROM sync_outbox WHERE usuario_id=? AND lote=?'))provocarConflicto();
  }});
  await e.deposito();await e.deposito();await e.deposito();
  provocarConflicto=e.crearConflicto;
  await e.sincronizarCuenta(e.usuario.id);
  assert.equal(e.recibidos.length,2);
  assert.equal(e.obtenerVistaSincronizacion().estado,'conflicto');
  assert.equal(e.obtenerVistaSincronizacion().pendientes,2);
  assert.equal(await e.contarRegistrosPendientes(e.usuario.id),2);
});
