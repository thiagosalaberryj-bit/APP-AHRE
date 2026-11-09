import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.ts';
import { presente } from './helpers/assertions.ts';

test('10.000 movimientos en SQLite: categorías, fechas, saldos, lotes y cero tráfico al servidor', async prueba => {
  let solicitudes = 0;
  const sentencias: string[] = [];
  const e = await preparar(prueba, true, { url: 'https://servidor.example.test',
    fetch: async () => { solicitudes++; throw new Error('No debe acceder a la red'); },
    registrarSql: sql => sentencias.push(sql),
  });
  await e.prepararDatosPrueba({ volumenMovimientos: true, vistaSocialOnline: true });
  const deposito = presente(e.base.prepare("SELECT * FROM depositos WHERE id LIKE '%:deposito:volumen-v1'").get());
  const movimientos = e.base.prepare('SELECT * FROM movimientos WHERE deposito_id = ? ORDER BY id').all(deposito.id!);
  assert.equal(movimientos.length, 10000);
  assert.equal(movimientos.filter(m => m.tipo === 'ingreso').length, 5000);
  assert.equal(movimientos.filter(m => m.tipo === 'egreso').length, 5000);
  assert.equal(new Set(movimientos.filter(m => m.tipo === 'ingreso').map(m => m.categoria)).size, 10);
  assert.equal(new Set(movimientos.filter(m => m.tipo === 'egreso').map(m => m.categoria)).size, 17);
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
  assert.equal(movimientos.filter(m => Date.parse(String(m.fecha_hora)) >= inicioMes).length, 7000);
  assert.equal(new Set(movimientos.map(m => { const fecha = new Date(String(m.fecha_hora)); return `${fecha.getFullYear()}-${fecha.getMonth()}`; })).size, 24);
  assert.ok(movimientos.every(m => Date.parse(String(m.fecha_hora)) <= Date.now() && Date.parse(String(m.fecha_hora)) >= Date.parse(String(deposito.fecha_creacion))));
  assert.equal(movimientos.reduce((saldo, m) => saldo + Number(m.monto) * (m.tipo === 'ingreso' ? 1 : -1), 0), 0);
  assert.equal(deposito.saldo_actual, 1000000);
  assert.equal(deposito.saldo_actual, deposito.saldo_inicial);
  assert.equal(sentencias.filter(sql => /^INSERT INTO movimientos\s/.test(sql)).length, 125);
  assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(solicitudes, 0);
  assert.equal(presente((await e.obtenerSesionActual()).usuario).correo_electronico, 'pruebas@ahre.test');
});

test('reentrada masiva conserva la cuenta habitual, modificaciones y movimientos eliminados sin duplicar', async prueba => {
  const e = await preparar(prueba);
  const usuario = await e.registrarUsuario({ nombre: 'Habitual', correo: 'habitual@example.test', contrasena: 'ClaveHabitual123', confirmacion: 'ClaveHabitual123' });
  await e.crearSesion(usuario.id, true);
  const personal = await e.depositosRepositorio.crear({ usuario_id: usuario.id, nombre: 'Personal', tipo: 'efectivo', saldo_inicial: 12345, icono: 'cash-outline' });
  await e.movimientosRepositorio.crear({ deposito_id: personal.id, tipo: 'ingreso', categoria: 'sueldo', monto: 250, descripcion: 'Real', fecha_hora: new Date().toISOString() });
  const instantaneaHabitual = () => JSON.stringify([
    e.base.prepare('SELECT * FROM usuarios WHERE id = ?').all(usuario.id),
    e.base.prepare('SELECT * FROM depositos WHERE usuario_id = ?').all(usuario.id),
    e.base.prepare('SELECT m.* FROM movimientos m JOIN depositos d ON d.id=m.deposito_id WHERE d.usuario_id = ?').all(usuario.id),
    e.base.prepare('SELECT * FROM sync_authorization WHERE usuario_id = ?').all(usuario.id),
    e.base.prepare('SELECT * FROM sync_outbox WHERE usuario_id = ? ORDER BY secuencia').all(usuario.id),
  ]);
  const habitualAntes = instantaneaHabitual();
  const primera = e.prepararDatosPrueba({ volumenMovimientos: true });
  assert.equal(e.prepararDatosPrueba({ volumenMovimientos: true }), primera);
  await primera;
  const deposito = presente(e.base.prepare("SELECT id FROM depositos WHERE id LIKE '%:deposito:volumen-v1'").get());
  await e.depositosRepositorio.actualizar(String(deposito.id), { nombre: 'Mi prueba editada' });
  const movimiento = presente(e.base.prepare('SELECT id FROM movimientos WHERE deposito_id = ? ORDER BY id LIMIT 1').get(deposito.id!));
  await e.movimientosRepositorio.eliminar(String(movimiento.id));
  const instantanea = () => JSON.stringify([
    e.base.prepare('SELECT * FROM depositos WHERE id = ?').all(deposito.id!),
    e.base.prepare('SELECT * FROM movimientos WHERE deposito_id = ? ORDER BY id').all(deposito.id!),
  ]);
  const antes = instantanea();
  await e.prepararDatosPrueba({ volumenMovimientos: true });
  assert.equal(instantanea(), antes);
  assert.equal(instantaneaHabitual(), habitualAntes);
});

test('fallo a mitad de la carga masiva revierte depósito, movimientos y diario y permite reintentar', async prueba => {
  const e = await preparar(prueba);
  await e.prepararDatosPrueba();
  const instantanea = () => JSON.stringify([
    e.base.prepare('SELECT * FROM depositos ORDER BY id').all(),
    e.base.prepare('SELECT * FROM movimientos ORDER BY id').all(),
    e.base.prepare('SELECT * FROM sync_outbox ORDER BY secuencia').all(),
  ]);
  const antes = instantanea();
  e.base.exec("CREATE TRIGGER fallo_volumen BEFORE INSERT ON movimientos WHEN NEW.id LIKE '%:volumen-v1:00800' BEGIN SELECT RAISE(ABORT, 'fallo a mitad de carga'); END;");
  await assert.rejects(e.prepararDatosPrueba({ volumenMovimientos: true }));
  assert.equal(instantanea(), antes);
  e.base.exec('DROP TRIGGER fallo_volumen');
  await e.prepararDatosPrueba({ volumenMovimientos: true });
  assert.equal(presente(e.base.prepare("SELECT COUNT(*) AS n FROM movimientos WHERE id LIKE '%:volumen-v1:%'").get()).n, 10000);
});

test('la carga masiva rechaza sincronización y producción antes de inicializar datos', async prueba => {
  for (const desarrollo of [false, true]) {
    const e = await preparar(prueba, desarrollo);
    await assert.rejects(e.prepararDatosPrueba({ volumenMovimientos: true, sincronizar: desarrollo }), desarrollo ? /exclusivamente local/ : /solo están disponibles en desarrollo/);
    assert.equal(presente(e.base.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'").get()).n, 0);
  }
});

test('la carga masiva conserva una cuenta de prueba ya vinculada al servidor', async prueba => {
  const e = await preparar(prueba);
  await e.prepararDatosPrueba();
  const usuario = presente((await e.obtenerSesionActual()).usuario);
  e.base.prepare('UPDATE sync_authorization SET generacion=1 WHERE usuario_id=?').run(usuario.id);
  const antes = JSON.stringify(e.base.prepare('SELECT * FROM sync_authorization').all());
  await assert.rejects(e.prepararDatosPrueba({ volumenMovimientos: true }), /vinculada al servidor/);
  assert.equal(JSON.stringify(e.base.prepare('SELECT * FROM sync_authorization').all()), antes);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM depositos').get()).n, 3);
});

test('una solicitud masiva durante la carga normal informa que hay que reintentar', async prueba => {
  const e = await preparar(prueba);
  const normal = e.prepararDatosPrueba();
  await assert.rejects(e.prepararDatosPrueba({ volumenMovimientos: true }), /Ya se están preparando/);
  await normal;
});
