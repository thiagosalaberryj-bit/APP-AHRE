import assert from 'node:assert/strict';
import test from 'node:test';
import {preparar} from './helpers/localDatabase.ts';
import {siguienteEjecucion} from '../src/recurrences/recurrenceCalendar.ts';

test('el día 31 usa el último día del mes y recupera el ancla al mes siguiente',()=>{
  const regla={frecuencia:'mensual' as const,zona_horaria:'America/Argentina/Buenos_Aires',dia_ancla:31};
  const febrero=siguienteEjecucion(regla,'2026-01-31T15:00:00.000Z');
  assert.equal(febrero,'2026-02-28T15:00:00.000Z');
  assert.equal(siguienteEjecucion(regla,febrero),'2026-03-31T15:00:00.000Z');
});
test('el 29 de febrero conserva el ancla anual hasta el siguiente año bisiesto',()=>{
  const regla={frecuencia:'anual' as const,zona_horaria:'UTC',dia_ancla:29};
  let fecha='2024-02-29T09:30:00.000Z';
  fecha=siguienteEjecucion(regla,fecha);assert.equal(fecha,'2025-02-28T09:30:00.000Z');
  for(let i=0;i<3;i++)fecha=siguienteEjecucion(regla,fecha);
  assert.equal(fecha,'2028-02-29T09:30:00.000Z');
});
test('la programación mantiene la hora civil de su zona al cambiar el horario de verano',()=>{
  const regla={frecuencia:'diaria' as const,zona_horaria:'America/New_York',dia_ancla:7};
  assert.equal(siguienteEjecucion(regla,'2026-03-07T14:00:00.000Z'),'2026-03-08T13:00:00.000Z');
});

async function escenario(t:import('node:test').TestContext){
  const e=await preparar(t);await e.prepararDatosPrueba({incluirSocial:false});
  const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);
  const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Recurrencias',tipo:'efectivo',icono:'cash-outline',saldo_inicial:1000,fecha_creacion:'2020-01-01T00:00:00.000Z'});
  const movimiento=await e.crearMovimiento({monto:'100',descripcion:'Servicio',deposito_id:deposito.id,categoria:'servicios',fecha:new Date(2026,0,1,12),hora:'12:00',recurrente:true,frecuencia:'mensual'},'egreso');
  return {...e,usuario,deposito,movimiento,recurrenciaId:movimiento.recurrencia_id!};
}

test('editar el importe afecta solo registros futuros y conserva el inicial aunque se elimine',async t=>{
  const e=await escenario(t),proxima=new Date(Date.now()+86400000).toISOString();
  await e.actualizarRecurrencia(e.recurrenciaId,{activa:true,proximaEjecucion:proxima,monto:'150,50'});
  assert.equal((await e.movimientosRepositorio.consultarPorId(e.movimiento.id))!.monto,100);
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,900);
  assert.equal((await e.consultarHistorialRecurrencia(e.recurrenciaId)).montoInicial,100);
  await e.procesarRecurrencias(new Date(proxima));
  const resumen=await e.consultarHistorialRecurrencia(e.recurrenciaId);
  assert.equal(resumen.total,250.5);assert.equal(resumen.repeticiones,2);
  await e.eliminarMovimiento(e.movimiento.id);
  const eliminado=await e.consultarHistorialRecurrencia(e.recurrenciaId);
  assert.equal(eliminado.total,150.5);assert.equal(eliminado.montoInicial,100);assert.equal(eliminado.repeticiones,2);
  await assert.rejects(e.actualizarRecurrencia(e.recurrenciaId,{activa:true,monto:'0'}),/importe válido/);
  await assert.rejects(e.actualizarRecurrencia(e.recurrenciaId,{activa:true,monto:'-1'}),/importe válido/);
  assert.equal((await e.recurrenciasRepositorio.consultarPorId(e.recurrenciaId))!.monto,150.5);
});
test('recupera las fechas vencidas una sola vez y conserva las fechas previstas',async t=>{
  const e=await escenario(t);assert.equal(await e.procesarRecurrencias(new Date(2026,3,2)),3);
  assert.equal(await e.procesarRecurrencias(new Date(2026,3,2)),0);
  const filas=e.base.prepare('SELECT fecha_programada FROM ejecuciones_recurrencia WHERE recurrencia_id=? ORDER BY fecha_programada').all(e.recurrenciaId);
  assert.equal(filas.length,4);assert.ok(String(filas[1].fecha_programada).startsWith('2026-02-01'));
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,600);
});
test('dos ejecuciones simultáneas no duplican movimientos ni saldos',async t=>{
  const e=await escenario(t);await Promise.all([e.procesarRecurrencias(new Date(2026,2,2)),e.procesarRecurrencias(new Date(2026,2,2))]);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM ejecuciones_recurrencia WHERE recurrencia_id=?').get(e.recurrenciaId)!.n,3);
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,700);
});
test('eliminar una ocurrencia no permite generarla de nuevo al reintentar su fecha',async t=>{
  const e=await escenario(t);await e.procesarRecurrencias(new Date(2026,1,2));
  const ejecucion=e.base.prepare('SELECT * FROM ejecuciones_recurrencia WHERE recurrencia_id=? ORDER BY fecha_programada DESC LIMIT 1').get(e.recurrenciaId)!;
  await e.eliminarMovimiento(String(ejecucion.movimiento_id));
  await e.recurrenciasRepositorio.actualizar(e.recurrenciaId,{proxima_ejecucion:String(ejecucion.fecha_programada)});
  assert.equal(await e.procesarRecurrencias(new Date(2026,1,2)),0);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos WHERE recurrencia_id=?').get(e.recurrenciaId)!.n,2);
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,900);
});
test('desactivar o revocar la instalación impide nuevas ocurrencias',async t=>{
  const e=await escenario(t);await e.recurrenciasRepositorio.actualizar(e.recurrenciaId,{activa:0});
  assert.equal(await e.procesarRecurrencias(new Date(2026,2,2)),0);
  await e.recurrenciasRepositorio.actualizar(e.recurrenciaId,{activa:1});await e.marcarRevocada(e.usuario.id);
  assert.equal(await e.procesarRecurrencias(new Date(2026,2,2)),0);
});
test('un fallo al registrar la ejecución revierte movimiento, saldo, próxima fecha y lote',async t=>{
  const e=await escenario(t),previa=(await e.recurrenciasRepositorio.consultarPorId(e.recurrenciaId))!.proxima_ejecucion;
  const pendientes=e.base.prepare('SELECT COUNT(*) AS n FROM sync_outbox').get()!.n;
  e.base.exec("CREATE TRIGGER fallo_ejecucion BEFORE INSERT ON ejecuciones_recurrencia BEGIN SELECT RAISE(ABORT,'fallo'); END");
  await assert.rejects(e.procesarRecurrencias(new Date(2026,1,2)));
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,900);
  assert.equal((await e.recurrenciasRepositorio.consultarPorId(e.recurrenciaId))!.proxima_ejecucion,previa);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM sync_outbox').get()!.n,pendientes);
  e.base.exec('DROP TRIGGER fallo_ejecucion');assert.equal(await e.procesarRecurrencias(new Date(2026,1,2)),1);
});
test('eliminar y detener la recurrencia conserva el historial y excluye saldo y estadísticas',async t=>{
  const e=await escenario(t);await e.eliminarMovimiento(e.movimiento.id,true);await e.eliminarMovimiento(e.movimiento.id,true);
  assert.ok((await e.consultarDetalleHistorialMovimiento(e.movimiento.id))!.fecha_eliminacion);
  assert.equal((await e.recurrenciasRepositorio.consultarPorId(e.recurrenciaId))!.activa,0);
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,1000);
  const resumen=await e.movimientosRepositorio.consultarResumenPorCategoria(e.usuario.id,'egreso','2026-01-01T00:00:00.000Z','2026-02-01T00:00:00.000Z');
  assert.equal(resumen.filter(f=>f.categoria==='servicios').reduce((s,f)=>s+f.total,0),0);
});

test('editar una ocurrencia ajusta el saldo sin modificar los pagos futuros',async t=>{
  const e=await escenario(t);
  await e.editarMovimiento(e.movimiento.id,{monto:'150',descripcion:'Importe corregido',categoria:'servicios',depositoId:e.deposito.id});
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,850);
  assert.equal((await e.recurrenciasRepositorio.consultarPorId(e.recurrenciaId))!.monto,100);
});
test('la eliminación conserva el original y crea una sola corrección vinculada',async t=>{
  const e=await escenario(t);
  await e.eliminarMovimiento(e.movimiento.id);await e.eliminarMovimiento(e.movimiento.id);
  const original=await e.movimientosRepositorio.consultarPorId(e.movimiento.id);assert.ok(original!.fecha_eliminacion);
  const correcciones=e.base.prepare('SELECT * FROM movimientos WHERE reversion_de_id=?').all(e.movimiento.id);
  assert.equal(correcciones.length,1);assert.equal(correcciones[0].tipo,'ingreso');assert.equal(correcciones[0].monto,100);
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,1000);
});

test('el historial recurrente acumula importes reales y excluye eliminados y correcciones',async t=>{
  const e=await escenario(t);await e.procesarRecurrencias(new Date(2026,2,2));
  await e.editarMovimiento(e.movimiento.id,{monto:'150',descripcion:'Servicio corregido',categoria:'servicios',depositoId:e.deposito.id});
  let historial=await e.consultarHistorialRecurrencia(e.recurrenciaId);
  assert.equal(historial.total,350);assert.equal(historial.cantidad,3);
  const segunda=historial.ultimos.find(m=>m.id!==e.movimiento.id)!;
  await e.eliminarMovimiento(segunda.id);
  historial=await e.consultarHistorialRecurrencia(e.recurrenciaId);
  assert.equal(historial.total,250);assert.equal(historial.cantidad,2);assert.equal(historial.ultimos.length,3);
  assert.ok(historial.ultimos.find(m=>m.id===segunda.id)!.fecha_eliminacion);
  await assert.rejects(e.consultarHistorialRecurrencia('inexistente'),/no está disponible/);
});

test('corregir desde el formulario conserva el original y aplica solo la diferencia sin duplicar',async t=>{
  const e=await escenario(t),fecha=new Date(e.movimiento.fecha_hora);
  const datos={monto:'150',descripcion:'Servicio corregido',categoria:'servicios',deposito_id:e.deposito.id,fecha,hora:String(fecha.getHours()).padStart(2,'0')+':'+String(fecha.getMinutes()).padStart(2,'0'),recurrente:false,frecuencia:'mensual'};
  const actualizado=await e.corregirMovimiento(e.movimiento.id,datos,'egreso','envio-unico');
  assert.equal((await e.corregirMovimiento(e.movimiento.id,datos,'egreso','envio-unico')).id,actualizado.id);
  assert.equal((await e.movimientosRepositorio.consultarPorId(e.movimiento.id))!.monto,100);
  assert.ok((await e.movimientosRepositorio.consultarPorId(e.movimiento.id))!.fecha_eliminacion);
  assert.equal((await e.depositosRepositorio.consultarPorId(e.deposito.id))!.saldo_actual,850);
  assert.equal((await e.consultarHistorialRecurrencia(e.recurrenciaId)).total,150);
  assert.equal((await e.recurrenciasRepositorio.consultarPorId(e.recurrenciaId))!.monto,100);
});
