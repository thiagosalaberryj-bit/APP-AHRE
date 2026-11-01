import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.ts';
import { presente } from './helpers/assertions.ts';

test('crear, editar y revertir una transferencia conserva el total y restaura ambos depósitos', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const datos = await e.cargarSocial(), [origen, destino] = datos.depositos;
  const saldos = () => e.base.prepare('SELECT id, ROUND(saldo_actual * 100) AS centavos FROM depositos ORDER BY id').all();
  const antes = saldos();
  const { transferencia } = await e.transferenciasRepositorio.crearConMovimientos({ usuario_id: datos.usuarioId, deposito_origen_id: origen.id, deposito_destino_id: destino.id, monto: 1250.50 });
  assert.equal(presente(await e.depositosRepositorio.consultarPorId(origen.id)).saldo_actual, origen.saldo_actual - 1250.50);
  assert.equal(presente(await e.depositosRepositorio.consultarPorId(destino.id)).saldo_actual, destino.saldo_actual + 1250.50);
  await e.transferenciasRepositorio.actualizar(transferencia.id, { monto: 2250.75, descripcion: 'Transferencia corregida' });
  assert.equal(presente(await e.depositosRepositorio.consultarPorId(origen.id)).saldo_actual, origen.saldo_actual - 2250.75);
  assert.equal(await e.transferenciasRepositorio.eliminar(transferencia.id), true);
  assert.equal(await e.transferenciasRepositorio.eliminar(transferencia.id), false);
  assert.deepEqual(saldos(), antes);
  assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(), []);
});

test('SQLite impide anular un movimiento suelto de una transferencia y conserva sus saldos', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const datos = await e.cargarSocial(), [origen, destino] = datos.depositos;
  const { transferencia, movimientos: [movimientoSalida] } = await e.transferenciasRepositorio.crearConMovimientos({ usuario_id: datos.usuarioId, deposito_origen_id: origen.id, deposito_destino_id: destino.id, monto: 500 });
  const antes = JSON.stringify(e.base.prepare('SELECT * FROM depositos ORDER BY id').all());
  assert.throws(() => e.base.prepare('UPDATE movimientos SET anulado = 1 WHERE id = ?').run(movimientoSalida.id), /transferencia debe anularse/);
  assert.equal(JSON.stringify(e.base.prepare('SELECT * FROM depositos ORDER BY id').all()), antes);
  assert.equal(presente(await e.transferenciasRepositorio.consultarPorId(transferencia.id)).anulada, 0);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM transferencias WHERE reversion_de_id = ?').get(transferencia.id)).n, 0);
  assert.equal(await e.transferenciasRepositorio.eliminar(transferencia.id), true);
});
