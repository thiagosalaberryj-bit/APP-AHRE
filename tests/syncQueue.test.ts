import assert from 'node:assert/strict';
import test, {type TestContext} from 'node:test';
import { randomUUID } from 'node:crypto';
import { preparar } from './helpers/localDatabase.ts';
import type { LoteSync } from '../src/sync/protocol.ts';
import {crearProgramadorSincronizacion} from '../src/sync/syncScheduler.ts';

async function escenario(prueba:TestContext) {
  let revision=0,offline=false,perderRespuesta=false,conflicto=false;
  const recibidos:LoteSync[]=[],aceptados=new Map<string,number>();
  const transporte:typeof fetch=async(_url,opciones)=>{
    if(offline)throw new Error('sin red');
    if(opciones?.method==='POST') {
      const lote=JSON.parse(String(opciones.body)) as LoteSync;recibidos.push(lote);
      const previa=aceptados.get(lote.id);
      if(previa)return Response.json({revision:previa});
      if(conflicto||lote.base!==revision)return Response.json({error:'Conflicto de revisión.'},{status:409});
      revision++;aceptados.set(lote.id,revision);
      if(perderRespuesta){perderRespuesta=false;throw new Error('respuesta perdida');}
      return Response.json({revision});
    }return Response.json({lotes:[],mas:false});
  };
  const e=await preparar(prueba,true,{url:'http://127.0.0.1:4000/api/v1',fetch:transporte});
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
  assert.equal(estado,'conflicto');assert.equal(e.recibidos.length,1);assert.equal(e.cola().length,n);
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
