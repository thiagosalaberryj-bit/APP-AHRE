import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import test from 'node:test';

// Se ejecutan el esquema, servicio y repositorios reales. Solo se sustituyen
// la sesión del dispositivo y el adaptador Expo por SQLite en memoria de Node.
test('OCR crea egresos con el servicio real, valida relaciones y revierte fallos de saldo', async () => {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const base = new DatabaseSync(':memory:');
  const parametros = (valores) => Array.isArray(valores[0]) ? valores[0] : valores;
  const adaptador = {
    execAsync: async (sql) => base.exec(sql),
    getFirstAsync: async (sql, ...valores) => base.prepare(sql).get(...parametros(valores)) || null,
    getAllAsync: async (sql, ...valores) => base.prepare(sql).all(...parametros(valores)),
    runAsync: async (sql, ...valores) => base.prepare(sql).run(...parametros(valores)),
    closeAsync: async () => {},
    withTransactionAsync: async (operacion) => {
      base.exec('BEGIN');
      try {
        await operacion();
        base.exec('COMMIT');
      } catch (error) {
        base.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const contexto = createContext({ console, crypto: globalThis.crypto, __DEV__: false });
  const modulos = new Map();
  const sintetico = (nombre, valores) => new SyntheticModule(Object.keys(valores), function inicializar() {
    for (const [clave, valor] of Object.entries(valores)) this.setExport(clave, valor);
  }, { context: contexto, identifier: nombre });
  const sesion = path.join(raiz, 'src/authentication/sessionService.js');
  modulos.set(sesion, sintetico(sesion, { obtenerSesionActual: async () => ({ usuario: { id: 'usuario-prueba' } }) }));
  modulos.set('expo-sqlite', sintetico('expo-sqlite', { openDatabaseAsync: async () => adaptador }));

  const cargar = async (identificador) => {
    if (modulos.has(identificador)) return modulos.get(identificador);
    const modulo = new SourceTextModule(await readFile(identificador, 'utf8'), { context: contexto, identifier: identificador });
    modulos.set(identificador, modulo);
    return modulo;
  };
  const entrada = new SourceTextModule(`
    export * from './src/movements/movementService.js';
    export * from './src/database/repositories/index.js';
    export * from './src/ocr/receiptParser.js';
    export * from './src/ocr/ocrExpenseDraft.js';
  `, { context: contexto, identifier: path.join(raiz, 'prueba-virtual.js') });
  await entrada.link(async (nombre, origen) => {
    if (modulos.has(nombre)) return modulos.get(nombre);
    const ruta = path.resolve(path.dirname(origen.identifier), nombre);
    return cargar(ruta.endsWith('.js') ? ruta : existsSync(`${ruta}.js`) ? `${ruta}.js` : path.join(ruta, 'index.js'));
  });
  await entrada.evaluate();
  const { usuariosRepositorio, depositosRepositorio, cargarDatosMovimiento, crearMovimiento, interpretarComprobante, prepararEgresoReconocido } = entrada.namespace;
  try {
    for (const id of ['usuario-prueba', 'otro-usuario']) {
      await usuariosRepositorio.crear({ id, nombre: id, correo_electronico: `${id}@example.com`, activo: 1 });
    }
    assert.equal((await cargarDatosMovimiento('egreso')).depositos.length, 0);
    const resultado = interpretarComprobante({ texto: 'ALMACEN\nPan 3840,00\nFECHA: 15/10/26\nHORA: 11:56\n01 ART. TOTALCS$) 3840.00' });
    const borrador = prepararEgresoReconocido(resultado);
    await assert.rejects(crearMovimiento(borrador, 'egreso'), (error) => Boolean(error.errores.deposito_id));

    const crearDeposito = (id, usuario_id, activo = 1) => depositosRepositorio.crear({
      id, usuario_id, activo, nombre: id, tipo: 'efectivo', saldo_inicial: 10000,
      icono: 'cash-outline', fecha_creacion: '2026-01-01T00:00:00.000Z',
    });
    await crearDeposito('deposito-prueba', 'usuario-prueba');
    await crearDeposito('deposito-ajeno', 'otro-usuario');
    await crearDeposito('deposito-inactivo', 'usuario-prueba', 0);
    const opciones = await cargarDatosMovimiento('egreso');
    assert.equal(opciones.depositos.length, 1);
    assert.equal(opciones.depositos[0].id, 'deposito-prueba');
    assert.ok(opciones.categorias.some(({ id }) => id === 'alimentacion'));
    const datos = { ...borrador, categoria: 'alimentacion', deposito_id: 'deposito-prueba' };
    const movimiento = await crearMovimiento(datos, 'egreso');
    assert.equal(movimiento.tipo, 'egreso');
    assert.equal(movimiento.monto, 3840);
    assert.equal(movimiento.descripcion, 'ALMACEN\nPan 3840,00');
    assert.equal(new Date(movimiento.fecha_hora).getDate(), 15);
    const saldo = () => base.prepare('SELECT saldo_actual FROM depositos WHERE id = ?').get('deposito-prueba').saldo_actual;
    const cantidad = () => base.prepare('SELECT COUNT(*) AS cantidad FROM movimientos').get().cantidad;
    assert.equal(saldo(), 6160);
    assert.equal(cantidad(), 1);

    for (const deposito_id of ['deposito-ajeno', 'deposito-inactivo', 'no-existe']) {
      await assert.rejects(crearMovimiento({ ...datos, deposito_id }, 'egreso'), (error) => ['deposito_no_disponible', 'transaccion'].includes(error.codigo));
    }
    await assert.rejects(crearMovimiento({ ...datos, categoria: 'no-existe' }, 'egreso'), (error) => ['categoria_no_disponible', 'transaccion'].includes(error.codigo));
    assert.equal(cantidad(), 1);

    base.exec("CREATE TRIGGER impedir_saldo BEFORE UPDATE ON depositos BEGIN SELECT RAISE(ABORT, 'fallo de prueba'); END;");
    await assert.rejects(crearMovimiento(datos, 'egreso'));
    assert.equal(cantidad(), 1);
    assert.equal(saldo(), 6160);
    base.exec('DROP TRIGGER impedir_saldo');

    await crearMovimiento({ ...datos, fecha: new Date(2025, 10, 1) }, 'egreso');
    assert.equal(cantidad(), 2);
    assert.equal(saldo(), 6160);
  } finally {
    base.close();
  }
});
