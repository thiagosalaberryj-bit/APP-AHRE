import type { SQLInputValue } from 'node:sqlite';
import type { Module } from 'node:vm';
import { presente } from './helpers/assertions.ts';
import { compilarFuente, resolverFuente } from './helpers/typescript.ts';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
  const parametros = (valores: (SQLInputValue | SQLInputValue[])[]) => Array.isArray(valores[0]) ? valores[0] : valores as SQLInputValue[];
  const adaptador = {
    execAsync: async (sql: string) => base.exec(sql),
    getFirstAsync: async (sql: string, ...valores: (SQLInputValue | SQLInputValue[])[]) => base.prepare(sql).get(...parametros(valores)) || null,
    getAllAsync: async (sql: string, ...valores: (SQLInputValue | SQLInputValue[])[]) => base.prepare(sql).all(...parametros(valores)),
    runAsync: async (sql: string, ...valores: (SQLInputValue | SQLInputValue[])[]) => base.prepare(sql).run(...parametros(valores)),
    closeAsync: async () => {},
    withTransactionAsync: async (operacion: ()=>Promise<void>) => {
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
  const modulos = new Map<string, Module | Promise<Module>>();
  const sintetico = (nombre: string, valores: Record<string,unknown>) => new SyntheticModule(Object.keys(valores), function inicializar() {
    for (const [clave, valor] of Object.entries(valores)) this.setExport(clave, valor);
  }, { context: contexto, identifier: nombre });
  const sesion = path.join(raiz, 'src/authentication/sessionService.ts');
  modulos.set(sesion, sintetico(sesion, { obtenerSesionActual: async () => ({ usuario: { id: 'usuario-prueba' } }) }));
  modulos.set('expo-sqlite', sintetico('expo-sqlite', { openDatabaseAsync: async () => adaptador }));

  const cargar = async (identificador: string): Promise<Module> => {
    if (modulos.has(identificador)) return modulos.get(identificador)!;
    const modulo = new SourceTextModule(compilarFuente(await readFile(identificador, 'utf8'), identificador), { context: contexto, identifier: identificador });
    modulos.set(identificador, modulo);
    return modulo;
  };
  const entrada = new SourceTextModule(`
    export * from './src/movements/movementService.ts';
    export * from './src/database/repositories/index.ts';
    export * from './src/ocr/receiptParser.ts';
    export * from './src/ocr/ocrExpenseDraft.ts';
  `, { context: contexto, identifier: path.join(raiz, 'prueba-virtual.ts') });
  await entrada.link(async (nombre, origen) => {
    if (modulos.has(nombre)) return modulos.get(nombre)!;
    const ruta = path.resolve(path.dirname(origen.identifier), nombre);
    return cargar(resolverFuente(ruta));
  });
  await entrada.evaluate();
  const { usuariosRepositorio, depositosRepositorio, cargarDatosMovimiento, crearMovimiento, interpretarComprobante, prepararEgresoReconocido } = entrada.namespace as unknown as (typeof import('../src/database/repositories/index.ts') & typeof import('../src/movements/movementService.ts') & typeof import('../src/ocr/receiptParser.ts') & typeof import('../src/ocr/ocrExpenseDraft.ts'));
  try {
    for (const id of ['usuario-prueba', 'otro-usuario']) {
      await usuariosRepositorio.crear({ id, nombre: id, correo_electronico: `${id}@example.com`, activo: 1 });
    }
    assert.equal((await cargarDatosMovimiento('egreso')).depositos.length, 0);
    const resultado = interpretarComprobante({ texto: 'ALMACEN\nPan 3840,00\nFECHA: 15/10/26\nHORA: 11:56\n01 ART. TOTALCS$) 3840.00' });
    const borrador = prepararEgresoReconocido(resultado);
    await assert.rejects(crearMovimiento(borrador, 'egreso'), (error) => Boolean((error as { errores: Record<string, string> }).errores.deposito_id));

    const crearDeposito = (id: string, usuario_id: string, activo = 1) => depositosRepositorio.crear({
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
    const saldo = () => presente(base.prepare('SELECT saldo_actual FROM depositos WHERE id = ?').get('deposito-prueba')).saldo_actual;
    const cantidad = () => presente(base.prepare('SELECT COUNT(*) AS cantidad FROM movimientos').get()).cantidad;
    assert.equal(saldo(), 6160);
    assert.equal(cantidad(), 1);

    for (const deposito_id of ['deposito-ajeno', 'deposito-inactivo', 'no-existe']) {
      await assert.rejects(crearMovimiento({ ...datos, deposito_id }, 'egreso'), (error) => ['deposito_no_disponible', 'transaccion'].includes((error as { codigo: string }).codigo));
    }
    await assert.rejects(crearMovimiento({ ...datos, categoria: 'no-existe' }, 'egreso'), (error) => ['categoria_no_disponible', 'transaccion'].includes((error as { codigo: string }).codigo));
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
