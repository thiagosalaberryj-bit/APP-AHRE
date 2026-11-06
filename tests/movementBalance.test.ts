import assert from 'node:assert/strict';
import test from 'node:test';
import {preparar} from './helpers/localDatabase.ts';

test('el cierre anterior respeta depósitos nuevos, históricos y reversiones', async t => {
  const e = await preparar(t); await e.prepararDatosPrueba();
  const { usuario } = await e.obtenerSesionActual(); assert.ok(usuario);
  const corte = '2026-10-01T00:00:00.000Z';
  const base = await e.movimientosRepositorio.consultarSaldoCierreAnterior(usuario.id, corte) ?? 0;
  const deposito = await e.depositosRepositorio.crear({ usuario_id: usuario.id, nombre: 'Anterior', tipo: 'efectivo', icono: 'cash-outline', saldo_inicial: 1000, fecha_creacion: '2026-09-01T12:00:00.000Z' });
  const ingreso = await e.movimientosRepositorio.crear({ deposito_id: deposito.id, tipo: 'ingreso', categoria: 'sueldo', descripcion: 'Ingreso mensual', monto: 300, fecha_hora: '2026-10-02T12:00:00.000Z' });
  await e.movimientosRepositorio.crear({ deposito_id: deposito.id, tipo: 'egreso', categoria: 'alimentacion', descripcion: 'Compra anterior', monto: 50, fecha_hora: '2026-09-15T12:00:00.000Z' });
  await e.movimientosRepositorio.crear({ deposito_id: deposito.id, tipo: 'egreso', categoria: 'alimentacion', descripcion: 'Compra histórica', monto: 90, fecha_hora: '2026-08-15T12:00:00.000Z' });
  await e.depositosRepositorio.crear({ usuario_id: usuario.id, nombre: 'Nuevo', tipo: 'efectivo', icono: 'cash-outline', saldo_inicial: 500, fecha_creacion: '2026-10-03T12:00:00.000Z' });
  assert.equal(await e.movimientosRepositorio.consultarSaldoCierreAnterior(usuario.id, corte), base + 950);
  await e.movimientosRepositorio.eliminar(ingreso.id);
  assert.equal(await e.movimientosRepositorio.consultarSaldoCierreAnterior(usuario.id, corte), base + 950);
});

for(const tipo of ['ingreso','egreso'] as const)test(`${tipo} del formulario actualiza el saldo de un depósito creado en ese mismo minuto`,async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba();
  const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);
  const fechaCreacion=new Date(2026,10,2,18,42,35,750);
  const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Recién creado',tipo:'efectivo',saldo_inicial:1000,icono:'cash-outline',fecha_creacion:fechaCreacion.toISOString()});
  const movimiento=await e.crearMovimiento({monto:'25,50',descripcion:'Mismo minuto',deposito_id:deposito.id,categoria:tipo==='ingreso'?'sueldo':'alimentacion',fecha:fechaCreacion,hora:'18:42',recurrente:true,frecuencia:'mensual'},tipo);
  assert.equal((await e.depositosRepositorio.consultarPorId(deposito.id))!.saldo_actual,tipo==='ingreso'?1025.5:974.5);
  assert.equal(movimiento.fecha_hora,deposito.fecha_creacion);
  const recurrencia=await e.recurrenciasRepositorio.consultarPorId(movimiento.recurrencia_id!);
  assert.equal(recurrencia!.fecha_inicio,movimiento.fecha_hora);
  assert.equal(recurrencia!.proxima_ejecucion,movimiento.fecha_hora);
  // Revertir usa la fecha efectiva del original y devuelve el saldo inicial.
  await e.movimientosRepositorio.eliminar(movimiento.id);
  assert.equal((await e.depositosRepositorio.consultarPorId(deposito.id))!.saldo_actual,1000);
});

test('un movimiento de un minuto anterior sigue siendo histórico y uno posterior impacta el saldo',async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba();
  const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);
  const fechaCreacion=new Date(2026,10,2,0,0,35,750);
  const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Límite temporal',tipo:'efectivo',saldo_inicial:1000,icono:'cash-outline',fecha_creacion:fechaCreacion.toISOString()});
  const datos={monto:'25',descripcion:'Histórico',deposito_id:deposito.id,categoria:'alimentacion',fecha:new Date(2026,10,1),hora:'23:59',recurrente:false};
  const historico=await e.crearMovimiento(datos,'egreso');
  assert.ok(Date.parse(historico.fecha_hora)<Date.parse(deposito.fecha_creacion));
  assert.equal((await e.depositosRepositorio.consultarPorId(deposito.id))!.saldo_actual,1000);
  const posterior=await e.crearMovimiento({...datos,fecha:fechaCreacion,hora:'00:01'},'egreso');
  assert.equal(new Date(posterior.fecha_hora).getMinutes(),1);
  assert.equal((await e.depositosRepositorio.consultarPorId(deposito.id))!.saldo_actual,975);
});
