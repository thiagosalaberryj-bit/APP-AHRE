import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {preparar} from './helpers/localDatabase.ts';
import type {VistaReinicio} from '../src/development/dataResetService.ts';

const vista:VistaReinicio={huella:'vista',cantidades:{},cuentas:[],salasActualizadas:0};
async function escenario(t:import('node:test').TestContext,perderRespuesta=false){
 let servidorBorrado=false,usuarioId='',fallar=false,consultasVista=0;
 const e=await preparar(t,true,{url:'https://ahre.test/api/v1',fetch:async(url,opciones)=>{
  if(fallar)throw new Error('sin conexión');
  if(String(url).endsWith('/testing/reset/preview')){consultasVista++;return Response.json(vista);}
  if(String(url).endsWith('/testing/reset')){servidorBorrado=true;if(perderRespuesta)throw new Error('respuesta perdida');return Response.json({reiniciado:true,usuarioId});}
  if(String(url).includes('/testing/reset/receipt'))return Response.json({reiniciado:servidorBorrado,usuarioId});
  return new Response(null,{status:204});
 }});
 await e.prepararDatosPrueba();const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);usuarioId=usuario.id;
 // Simular autorización online de la cuenta sembrada; todos los datos son sintéticos.
 e.base.exec('DELETE FROM sync_outbox;DELETE FROM sync_batch_authorization');
 await e.guardarSesionRemota(usuario.id,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},true);
 const otra=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Otra',correo_electronico:'otra@example.test',activo:1});
 const deposito=await e.depositosRepositorio.crear({usuario_id:otra.id,nombre:'Ajeno',tipo:'efectivo',saldo_inicial:500,icono:'cash-outline'});
 return {...e,usuario,otra,deposito,consultasVista:()=>consultasVista,desconectar:()=>{fallar=true;}};
}
for(const perderRespuesta of [false,true])test('reinicio local limpia relaciones, colas y cachés y conserva cuentas y datos ajenos'+(perderRespuesta?' con respuesta perdida':''),async t=>{
 const e=await escenario(t,perderRespuesta);
 assert.ok(Number(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n)>0);
 await e.reiniciarDatos(vista,e.usuario.correo_electronico,'clave','BORRAR MIS DATOS');
 for(const tabla of ['depositos','movimientos','personas','salas','deudas','pagos_sociales','preferencias','sync_outbox','datos_sociales_online','salas_online_locales','sync_authorization']){
  const sql=tabla==='movimientos'?'SELECT COUNT(*) n FROM movimientos m JOIN depositos d ON d.id=m.deposito_id WHERE d.usuario_id=?':`SELECT COUNT(*) n FROM ${tabla} WHERE usuario_id=?`;
  assert.equal(Number(e.base.prepare(sql).get(e.usuario.id)!.n),0,tabla);
 }
 assert.ok(e.base.prepare('SELECT id FROM usuarios WHERE id=?').get(e.usuario.id));
 assert.ok(e.base.prepare('SELECT usuario_id FROM credenciales_usuario WHERE usuario_id=?').get(e.usuario.id));
 assert.equal(Number(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(e.deposito.id)!.saldo_actual),500);
 assert.equal((await e.obtenerSesionActual()).usuario,null);
 assert.equal(e.almacenamiento.has('ahre.pruebas.reinicio'),false);
 assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('sin confirmación del servidor conserva SQLite y deja recuperación pendiente',async t=>{
 const e=await escenario(t);e.desconectar();
 const antes=e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n;
 await assert.rejects(e.reiniciarDatos(vista,e.usuario.correo_electronico,'clave','BORRAR MIS DATOS'),/confirmar el reinicio/);
 assert.equal(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n,antes);
 assert.equal(e.reinicioEnCurso(),true);
 assert.equal(e.almacenamiento.has('ahre.pruebas.reinicio'),true);
});

test('la APK release dispone del reinicio sin variables y exige iniciar sesión',async t=>{
 const e=await preparar(t,false,{url:'https://ahre.test/api/v1',fetch:async()=>Response.json({})});
 await assert.rejects(e.consultarReinicio(),/Iniciá sesión con conexión/);
});

test('la recuperación al abrir completa un recibo ya confirmado y conserva el acceso',async t=>{
 const e=await escenario(t);
 e.almacenamiento.set('ahre.pruebas.reinicio',JSON.stringify({usuarioId:e.usuario.id,token:'a'.repeat(64),operacion:randomUUID(),confirmado:true}));
 e.desconectar(); // Un recibo persistido como confirmado no necesita otra consulta.
 await e.completarReinicioPendiente();
 assert.equal(Number(e.base.prepare('SELECT COUNT(*) n FROM depositos WHERE usuario_id=?').get(e.usuario.id)!.n),0);
 assert.ok(e.base.prepare('SELECT usuario_id FROM credenciales_usuario WHERE usuario_id=?').get(e.usuario.id));
 assert.equal(e.almacenamiento.has('ahre.pruebas.reinicio'),false);
 assert.equal((await e.obtenerSesionActual()).usuario,null);
});

test('un rechazo explícito conserva datos y no deja una recuperación bloqueada',async t=>{
 let usuarioId='';
 const e=await preparar(t,true,{url:'https://ahre.test/api/v1',fetch:async url=>String(url).endsWith('/testing/reset')?Response.json({error:'El alcance cambió.'},{status:409}):Response.json({})});
 await e.prepararDatosPrueba();const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);usuarioId=usuario.id;
 e.base.exec('DELETE FROM sync_outbox;DELETE FROM sync_batch_authorization');
 await e.guardarSesionRemota(usuarioId,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},true);
 const antes=e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n;
 await assert.rejects(e.reiniciarDatos(vista,usuario.correo_electronico,'clave','BORRAR MIS DATOS'),/alcance cambió/);
 assert.equal(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n,antes);
 assert.equal(e.reinicioEnCurso(),false);assert.equal(e.almacenamiento.has('ahre.pruebas.reinicio'),false);
});


test('la vista previa espera operaciones activas antes de calcular el alcance del reinicio',async t=>{
 const e=await escenario(t),terminar=e.iniciarActividadReinicio();assert.ok(terminar);
 const consulta=e.consultarReinicio();await new Promise<void>(r=>setImmediate(r));
 assert.equal(e.reinicioEnCurso(),true);assert.equal(e.consultasVista(),0);
 terminar();assert.equal((await consulta).huella,'vista');assert.equal(e.consultasVista(),1);assert.equal(e.reinicioEnCurso(),false);
 assert.ok(Number(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n)>0);
});

test('el reinicio administrativo limpia la cuenta local al recuperar un historial remoto reemplazado', async t => {
  let cambioPreferencia: unknown;
  const e = await preparar(t, true, {url: 'https://ahre.test/api/v1', fetch: async (entrada, opciones) => {
    const url = new URL(String(entrada));
    if (url.pathname.endsWith('/auth/status')) return Response.json({});
    if (url.pathname.endsWith('/sync') && opciones?.method !== 'POST') {
      const lotes = Number(url.searchParams.get('desde')) < 5 ? [{revision: 5, lote: {
        id: 'reinicio:de-prueba', base: 4, generacion: 0, reinicioPruebas: true, reinicioCuenta: true,
        cambios: [cambioPreferencia],
      }}] : [];
      return Response.json({lotes, mas: false});
    }
    throw Error('No se esperaba enviar cambios anteriores al reinicio.');
  }});
  await e.prepararDatosPrueba();
  const {usuario} = await e.obtenerSesionActual();
  assert.ok(usuario);
  const otra = await e.usuariosRepositorio.crear({id: randomUUID(), nombre: 'Otra', correo_electronico: 'otra@example.test', activo: 1});
  const depositoAjeno = await e.depositosRepositorio.crear({usuario_id: otra.id, nombre: 'Ajeno', tipo: 'efectivo', saldo_inicial: 500, icono: 'cash-outline'});
  cambioPreferencia = {tabla: 'preferencias', accion: 'guardar', datos: {...e.base.prepare('SELECT * FROM preferencias WHERE usuario_id=?').get(usuario.id), id: randomUUID()}};
  e.base.prepare('INSERT OR REPLACE INTO sync_state(usuario_id,revision,preparada) VALUES(?,2,1)').run(usuario.id);
  e.base.prepare('DELETE FROM sync_outbox WHERE usuario_id=?').run(usuario.id);
  e.base.prepare('DELETE FROM sync_batch_authorization WHERE usuario_id=?').run(usuario.id);
  await e.guardarSesionRemota(usuario.id, {token: 'a'.repeat(64), vence: Date.now() + 86400000, usuario, dispositivoId: await e.obtenerInstalacion(), generacion: 1, revision: 5}, true);
  await e.depositosRepositorio.crear({usuario_id: usuario.id, nombre: 'Depósito local pendiente', tipo: 'efectivo', saldo_inicial: 150, icono: 'cash-outline'});
  assert.ok(Number(e.base.prepare('SELECT COUNT(*) n FROM sync_outbox WHERE usuario_id=?').get(usuario.id)!.n) > 0);
  await e.sincronizarCuenta(usuario.id);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM depositos WHERE usuario_id=?').get(usuario.id)!.n, 0);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM sync_outbox WHERE usuario_id=?').get(usuario.id)!.n, 0);
  assert.equal(e.base.prepare('SELECT revision FROM sync_state WHERE usuario_id=?').get(usuario.id)!.revision, 5);
  assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(depositoAjeno.id)!.saldo_actual, 500);
  assert.equal((await e.obtenerSesionActual()).usuario?.id, usuario.id);
});
