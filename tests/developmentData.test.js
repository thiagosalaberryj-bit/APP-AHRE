import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.js';

test('el acceso prepara cuenta, depósitos y movimientos con saldos reales y sesión no recordada', async prueba => {
  const { base, almacenamiento, prepararDatosPrueba, obtenerSesionActual } = await preparar(prueba);
  await prepararDatosPrueba();
  const { usuario } = await obtenerSesionActual();
  assert.equal(usuario.correo_electronico, 'pruebas@ahre.test');
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n, 1);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM depositos').get().n, 3);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM movimientos').get().n, 6);
  assert.equal(base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get().saldo, 872800);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM personas').get().n, 0);
  assert.equal(almacenamiento.size, 0);
  assert.deepEqual(base.prepare('PRAGMA foreign_key_check').all(), []);
});

test('doble envío y reentrada no duplican ni restablecen datos modificados o anulados', async prueba => {
  const { base, prepararDatosPrueba, depositosRepositorio, movimientosRepositorio } = await preparar(prueba);
  const primera = prepararDatosPrueba();
  assert.equal(prepararDatosPrueba(), primera);
  await primera;
  const deposito = base.prepare("SELECT id FROM depositos WHERE tipo = 'efectivo'").get();
  await depositosRepositorio.actualizar(deposito.id, { nombre: 'Nombre cambiado' });
  await depositosRepositorio.eliminar(deposito.id);
  const movimiento = base.prepare("SELECT m.id FROM movimientos m JOIN depositos d ON d.id = m.deposito_id WHERE d.tipo = 'banco'").get();
  await movimientosRepositorio.eliminar(movimiento.id);
  const saldos = JSON.stringify(base.prepare('SELECT * FROM depositos ORDER BY id').all());
  const movimientos = JSON.stringify(base.prepare('SELECT * FROM movimientos ORDER BY id').all());
  await prepararDatosPrueba();
  assert.equal(JSON.stringify(base.prepare('SELECT * FROM depositos ORDER BY id').all()), saldos);
  assert.equal(JSON.stringify(base.prepare('SELECT * FROM movimientos ORDER BY id').all()), movimientos);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n, 1);
});

test('la cuenta habitual y sus depósitos permanecen intactos al entrar a pruebas', async prueba => {
  const { base, prepararDatosPrueba, registrarUsuario, crearSesion, depositosRepositorio } = await preparar(prueba);
  const usuario = await registrarUsuario({ nombre: 'Habitual', correo: 'habitual@example.test', contrasena: 'ClaveHabitual123', confirmacion: 'ClaveHabitual123' });
  await crearSesion(usuario.id, true);
  const deposito = await depositosRepositorio.crear({ usuario_id: usuario.id, nombre: 'Personal', tipo: 'efectivo', saldo_inicial: 12345, icono: 'cash-outline' });
  await prepararDatosPrueba();
  assert.equal(base.prepare('SELECT saldo_actual FROM depositos WHERE id = ?').get(deposito.id).saldo_actual, 12345);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM depositos WHERE usuario_id = ?').get(usuario.id).n, 1);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n, 2);
});

test('un fallo revierte todos los depósitos y movimientos y permite reintentar', async prueba => {
  const { base, inicializarBaseDatos, prepararDatosPrueba } = await preparar(prueba);
  await inicializarBaseDatos();
  base.exec("CREATE TRIGGER fallo_prueba BEFORE INSERT ON movimientos BEGIN SELECT RAISE(ABORT, 'fallo de prueba'); END;");
  await assert.rejects(prepararDatosPrueba());
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM depositos').get().n, 0);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM movimientos').get().n, 0);
  base.exec('DROP TRIGGER fallo_prueba');
  await prepararDatosPrueba();
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM depositos').get().n, 3);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM movimientos').get().n, 6);
});

test('no sobrescribe una cuenta con el correo de prueba y otra contraseña', async prueba => {
  const { base, registrarUsuario, prepararDatosPrueba } = await preparar(prueba);
  await registrarUsuario({ nombre: 'Otra cuenta', correo: 'pruebas@ahre.test', contrasena: 'OtraClave123', confirmacion: 'OtraClave123' });
  await assert.rejects(prepararDatosPrueba(), /Iniciá sesión manualmente/);
  assert.equal(base.prepare('SELECT COUNT(*) AS n FROM depositos').get().n, 0);
});

test('fuera de desarrollo no inicializa la base ni crea una sesión de pruebas', async prueba => {
  const { base, prepararDatosPrueba, almacenamiento } = await preparar(prueba, false);
  await assert.rejects(prepararDatosPrueba(), /solo están disponibles en desarrollo/);
  assert.equal(base.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'").get().n, 0);
  assert.equal(almacenamiento.size, 0);
});
