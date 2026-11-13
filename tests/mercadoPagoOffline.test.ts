import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { preparar } from './helpers/localDatabase.ts';
import type { OperacionMp } from '../src/mercadoPago/types.ts';
import { ajustesPredeterminados } from '../src/notifications/types.ts';

async function escenario(t: TestContext) {
  const e = await preparar(t); await e.prepararDatosPrueba();
  const { usuario } = await e.obtenerSesionActual(); assert.ok(usuario);
  const deposito = e.base.prepare('SELECT * FROM depositos WHERE usuario_id=? ORDER BY id LIMIT 1').get(usuario.id)!;
  const pago: OperacionMp = { id: 'pago-1', monto: 123.45, moneda: 'ARS', descripcion: 'Compra MP', fecha: new Date().toISOString(), actualizado: new Date().toISOString(), estado: 'approved', tipo: 'egreso', categoria: 'transferencias', contraparte: null, registrable: true, version: 'version-1', decision: 'pendiente', movimientoId: null, revisionPendiente: false, huella: 'hash-1' };
  const guardar = async (operaciones = [pago]) => e.ejecutarTransaccion(async c => {
    await e.guardarDato(c, usuario.id, 'mp:estado', { configurada: true, manualesRestantes: 2, trabajo: null, vinculacion: { deposito_id: deposito.id, cuenta_id: 'cuenta-mp', version: 'version-1', activa: 1, meses: 1, desde: null, hasta: null, error: null } });
    await e.guardarDato(c, usuario.id, 'mp:operaciones', operaciones);
  }); await guardar();
  return { e, usuario, deposito, pago, guardar, saldo: () => Number(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id!)!.saldo_actual) };
}
test('Mercado Pago offline registra una sola vez, actualiza saldo y conserva la decisión para sincronizar', async t => {
  const { e, saldo } = await escenario(t), antes = saldo();
  await e.decidirMovimientosMp(['pago-1'], 'registrado');
  assert.equal(Math.round(saldo() * 100), Math.round(antes * 100) - 12345);
  await e.decidirMovimientosMp(['pago-1'], 'registrado');
  assert.equal(Math.round(saldo() * 100), Math.round(antes * 100) - 12345);
  assert.equal(e.base.prepare("SELECT COUNT(*) n FROM integraciones_outbox WHERE ruta='/mercado-pago/decisiones'").get()!.n, 1);
});
test('Mercado Pago reutiliza históricos sin modificar el saldo del depósito', async t => {
  const { e, saldo, pago, guardar } = await escenario(t), antes = saldo();
  await guardar([{ ...pago, fecha: '2020-01-01T12:00:00.000Z' }]);
  await e.decidirMovimientosMp(['pago-1'], 'registrado'); assert.equal(saldo(), antes);
});

test('la descripción editada persiste offline y se registra sin alterar el dato original de Mercado Pago', async t => {
  const { e, pago } = await escenario(t);
  await e.guardarBorradorMp(pago.id, { tipo: pago.tipo, categoria: pago.categoria, descripcion: '  Almuerzo del viernes  ' });
  assert.equal((await e.cargarBorradoresMp())[pago.id].descripcion, '  Almuerzo del viernes  ');
  await e.decidirMovimientosMp([pago.id], 'registrado');
  assert.equal(e.base.prepare("SELECT descripcion FROM movimientos WHERE id LIKE 'mp:%'").get()!.descripcion, 'Almuerzo del viernes');
  assert.equal((await e.cargarMercadoPago()).operaciones[0].descripcion, pago.descripcion);
});

test('una descripción vacía impide registrar el lote completo y no modifica el saldo', async t => {
  const { e, pago, guardar, saldo } = await escenario(t), antes = saldo();
  await guardar([pago, { ...pago, id: 'pago-2' }]);
  await assert.rejects(e.decidirMovimientosMp([pago.id, 'pago-2'], 'registrado', { 'pago-2': { tipo: pago.tipo, categoria: pago.categoria, descripcion: '  ' } }), /descripción/);
  assert.equal(saldo(), antes);
  assert.equal(e.base.prepare("SELECT COUNT(*) n FROM movimientos WHERE id LIKE 'mp:%'").get()!.n, 0);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM integraciones_outbox').get()!.n, 0);
});

test('los indicadores cuentan pendientes y revisiones, se actualizan al decidir y desaparecen al desvincular', async t => {
  const { e, deposito, pago, guardar } = await escenario(t);
  await guardar([
    pago,
    { ...pago, id: 'cero', monto: 0, registrable: false },
    { ...pago, id: 'ignorado', decision: 'ignorado' },
    { ...pago, id: 'registrado', decision: 'registrado' },
    { ...pago, id: 'actualizado', decision: 'registrado', revisionPendiente: true },
  ]);
  const resumen = await e.consultarResumenMp();
  assert.equal(resumen?.depositoId, deposito.id);
  assert.equal(resumen?.obtenidos, 5);
  assert.equal(resumen?.pendientes, 3);
  await e.decidirMovimientosMp([pago.id, 'cero'], 'ignorado');
  assert.equal((await e.consultarResumenMp())?.pendientes, 1);
  await e.decidirMovimientosMp(['actualizado'], 'revisado');
  assert.equal((await e.consultarResumenMp())?.pendientes, 0);
  await e.desvincularMercadoPago();
  assert.equal(await e.consultarResumenMp(), null);
});

test('un pago de importe cero se puede revisar e ignorar pero no registrar ni alterar el saldo',async t=>{
 const {e,saldo,pago,guardar}=await escenario(t),antes=saldo();
 await guardar([{...pago,monto:0,registrable:false}]);
 await assert.rejects(e.decidirMovimientosMp([pago.id],'registrado'));
 assert.equal(saldo(),antes);
 await e.decidirMovimientosMp([pago.id],'ignorado');
 assert.equal((await e.cargarMercadoPago()).operaciones[0].decision,'ignorado');assert.equal(saldo(),antes);
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM movimientos WHERE id LIKE 'mp:%'").get()!.n,0);
});
test('ignorar y recuperar conserva otros pendientes y no registra dinero', async t => {
  const { e, saldo, pago, guardar } = await escenario(t), antes = saldo();
  await guardar([pago, { ...pago, id: 'pago-2' }]);
  await e.decidirMovimientosMp(['pago-1'], 'ignorado');
  let datos = await e.cargarMercadoPago(); assert.equal(datos.operaciones[0].decision, 'ignorado'); assert.equal(datos.operaciones[1].decision, 'pendiente');
  await e.decidirMovimientosMp(['pago-1'], 'recuperado'); datos = await e.cargarMercadoPago(); assert.equal(datos.operaciones[0].decision, 'pendiente'); assert.equal(saldo(), antes);
});
test('un lote con dirección sin confirmar revierte todos sus movimientos y decisiones', async t => {
  const { e, saldo, pago, guardar } = await escenario(t), antes = saldo(); await guardar([pago, { ...pago, id: 'pago-2', tipo: null }]);
  await assert.rejects(e.decidirMovimientosMp(['pago-1', 'pago-2'], 'registrado'));
  assert.equal(saldo(), antes); assert.equal(e.base.prepare('SELECT COUNT(*) n FROM integraciones_outbox').get()!.n, 0);
  assert.ok((await e.cargarMercadoPago()).operaciones.every(f => f.decision === 'pendiente'));
});
test('asociar un movimiento existente no duplica dinero y rechaza una segunda asociación', async t => {
  const { e, saldo, pago, guardar, deposito } = await escenario(t); await guardar([pago, { ...pago, id: 'pago-2' }]);
  const movimiento = await e.movimientosRepositorio.crear({ deposito_id: String(deposito.id), tipo: 'egreso', categoria: 'transferencias', monto: pago.monto, descripcion: 'Ya registrado', fecha_hora: pago.fecha }); const antes = saldo();
  await e.decidirMovimientosMp(['pago-1'], 'registrado', {}, movimiento.id); assert.equal(saldo(), antes);
  await assert.rejects(e.decidirMovimientosMp(['pago-2'], 'registrado', {}, movimiento.id));
});
test('eliminar el depósito vinculado offline conserva los registros y encola la cancelación primero', async t => {
  const { e, deposito } = await escenario(t); await e.decidirMovimientosMp(['pago-1'], 'registrado');
  await e.eliminarDeposito(String(deposito.id)); const datos = await e.cargarMercadoPago(); assert.equal(datos.estado.vinculacion, null); assert.equal(datos.operaciones.length, 0);
  assert.equal(e.base.prepare('SELECT ruta FROM integraciones_outbox ORDER BY prioridad,secuencia LIMIT 1').get()!.ruta, '/mercado-pago/desvincular');
  assert.equal(e.base.prepare("SELECT COUNT(*) n FROM movimientos WHERE id LIKE 'mp:%'").get()!.n, 1);
});
test('marcar una notificación como vista conserva su estado pendiente y su historial', async t => {
  const { e } = await escenario(t);
  await e.guardarAvisoLocal({ id: 'local:prueba', tipo: 'mercado_pago', titulo: 'Revisar', mensaje: '1 pendiente', fecha: new Date().toISOString(), destino: { tipo: 'mercado_pago' }, vista: false, resuelta: false });
  await e.marcarAvisoVisto('local:prueba'); const vista = await e.consultarAvisos('pendientes'); assert.equal(vista.avisos.length, 1); assert.equal(vista.avisos[0].vista, true); assert.equal(vista.avisos[0].resuelta, false); assert.equal(vista.noVistas, 0);
});
test('refrescar y seguir una descarga no piden otra automática, y las sincronizaciones concurrentes esperan el mismo resultado', async t => {
  let usadaHoy = false, automaticas = 0;
  const estado = () => ({ configurada: true, manualesRestantes: 2, trabajo: null, vinculacion: { deposito_id: 'deposito', version: 'v1' }, automatica: { usadaHoy, zona: 'America/Argentina/Buenos_Aires', proximaDisponible: new Date().toISOString() } });
  const e = await preparar(t, true, { url: 'http://example.test/api/v1', fetch: async (entrada, opciones) => {
    const ruta = new URL(String(entrada)).pathname;
    if (ruta.endsWith('/mercado-pago/consultas')) { automaticas++; usadaHoy = true; assert.equal(JSON.parse(String(opciones?.body)).clase, 'automatica'); return Response.json({ estado: 'pendiente' }); }
    if (ruta.endsWith('/mercado-pago')) return Response.json(estado());
    if (ruta.endsWith('/mercado-pago/operaciones')) return Response.json({ operaciones: [], siguiente: null });
    if (ruta.endsWith('/notificaciones')) return Response.json({ avisos: [], siguiente: null });
    if (ruta.endsWith('/notificaciones/preferencias')) return Response.json(ajustesPredeterminados());
    throw Error('Ruta inesperada: ' + ruta);
  } });
  await e.prepararDatosPrueba(); const { usuario } = await e.obtenerSesionActual(); assert.ok(usuario);
  // Esta base sintética ya parte de la autorización de desarrollo; aquí se simula una cuenta sincronizada.
  e.base.exec('DELETE FROM sync_outbox');
  await e.guardarSesionRemota(usuario.id, { token: 'ab'.repeat(32), vence: Date.now() + 3600000, usuario, dispositivoId: await e.obtenerInstalacion(), generacion: 1, revision: 0 }, false);
  const primera = e.sincronizarIntegraciones(false, false), segunda = e.sincronizarIntegraciones(false, false);
  assert.equal(primera, segunda); await Promise.all([primera, segunda]); assert.equal(automaticas, 0);
  await e.sincronizarIntegraciones(); assert.equal(automaticas, 1);
  await e.sincronizarIntegraciones(); assert.equal(automaticas, 1);
});
test('historial espera la respuesta remota, la conserva y recupera la copia cuando falla Internet', async t => {
  let offline = false, solicitudes = 0;
  const consulta = { id: 'consulta-remota', clase: 'manual', estado: 'completo', creado: Date.now() };
  const e = await preparar(t, true, { url: 'http://example.test/api/v1', fetch: async () => {
    solicitudes++; if (offline) throw Error('sin conexión'); return Response.json({ consultas: [consulta] });
  } });
  await e.prepararDatosPrueba(); const { usuario } = await e.obtenerSesionActual(); assert.ok(usuario);
  e.base.exec('DELETE FROM sync_outbox');
  await e.guardarSesionRemota(usuario.id, { token: 'ab'.repeat(32), vence: Date.now()+3600000, usuario, dispositivoId: await e.obtenerInstalacion(), generacion: 1, revision: 0 }, false);
  assert.equal((await e.consultarHistorialMp())[0].id, consulta.id);
  offline = true;
  const guardadas = await e.consultarHistorialMp(); assert.equal(guardadas.length, 1); assert.equal(guardadas[0].id, consulta.id);
  assert.equal(solicitudes, 2);
});
test('el sentido obtenido del proveedor reemplaza borradores antiguos sin permitir inventar uno',async t=>{
  const {e,pago}=await escenario(t);
  const corregido=e.resolverBorradorMp({...pago,tipo:'ingreso',categoria:'ventas'},{tipo:'egreso',categoria:'compras'});
  assert.equal(corregido.tipo,'ingreso');assert.equal(corregido.categoria,'ventas');
  assert.equal(e.resolverBorradorMp({...pago,tipo:null},{tipo:'egreso',categoria:'compras'}).tipo,null);
});
test('la sincronización repara metadatos con cero usos y reemplaza el sentido antiguo sin solicitar una búsqueda',async t=>{
 let reparando=false,identificaciones=0;
 const pago:OperacionMp={id:'antiguo',monto:25,moneda:'ARS',descripcion:'Pago antiguo',fecha:'2026-11-01T12:00:00Z',actualizado:'2026-11-01T12:00:00Z',estado:'approved',tipo:'egreso',categoria:'compras',contraparte:null,registrable:true,version:'v1',decision:'pendiente',movimientoId:null,revisionPendiente:false,huella:'actual'};
 const e=await preparar(t,true,{url:'http://example.test/api/v1',fetch:async(entrada)=>{
  const ruta=new URL(String(entrada)).pathname;
  if(ruta.endsWith('/mercado-pago/identificar')){identificaciones++;reparando=true;return Response.json({estado:'pendiente'});}
  if(ruta.endsWith('/mercado-pago'))return Response.json({configurada:true,manualesRestantes:0,identificacionDisponible:!reparando,automatica:{usadaHoy:true,zona:'America/Argentina/Buenos_Aires',proximaDisponible:new Date().toISOString()},vinculacion:{deposito_id:'deposito',version:'v1'},trabajo:null});
  if(ruta.endsWith('/mercado-pago/operaciones'))return Response.json({operaciones:[pago],siguiente:null});
  if(ruta.endsWith('/notificaciones'))return Response.json({avisos:[],siguiente:null});
  if(ruta.endsWith('/notificaciones/preferencias'))return Response.json(ajustesPredeterminados());
  throw Error('No debe solicitar búsquedas: '+ruta);
 }});
 await e.prepararDatosPrueba();const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);e.base.exec('DELETE FROM sync_outbox');
 await e.guardarSesionRemota(usuario.id,{token:'ab'.repeat(32),vence:Date.now()+3600000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
 await e.ejecutarTransaccion(c=>e.guardarDato(c,usuario.id,'mp:operaciones',[{...pago,tipo:null,huella:'anterior'}]));
 await e.guardarBorradorMp(pago.id,{tipo:null,categoria:'transferencias'});
 await e.sincronizarIntegraciones(false,false);const datos=await e.cargarMercadoPago();
 assert.equal(datos.estado.manualesRestantes,0);assert.equal(datos.operaciones[0].tipo,'egreso');assert.equal(datos.operaciones[0].categoria,'compras');
 const borradores=await e.cargarBorradoresMp();assert.equal(e.resolverBorradorMp(datos.operaciones[0],borradores[pago.id]).tipo,'egreso');
 await e.sincronizarIntegraciones(false,false);assert.equal(identificaciones,1);
});
