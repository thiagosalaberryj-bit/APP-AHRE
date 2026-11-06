import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { compilarFuente } from './helpers/typescript.ts';

async function prepararInicializacion(fallo: 'apertura' | 'version' | 'esquema' | 'diario', bloqueosDiario = 0) {
  const registros: Record<string, unknown>[] = [];
  const estado = { fallo: true, aperturas: 0, cierres: 0, intentosDiario: 0 };
  const sentencias: string[] = [], esperas: number[] = [];
  const contexto = createContext({ __DEV__: true,
    setTimeout: (resolver: () => void, demora: number) => { esperas.push(demora); queueMicrotask(resolver); },
    console: { error: (_titulo: string, datos: Record<string, unknown>) => registros.push(datos) } });
  const errorNativo = Object.assign(new Error('SQLite: detalle nativo de prueba'), { code: 'ERR_INTERNAL_SQLITE_ERROR' });
  const conexion = {
    execAsync: async (sql: string) => { sentencias.push(sql); },
    getFirstAsync: async (sql: string) => {
      if (sql.includes('foreign_keys')) return { foreign_keys: 1 };
      if (estado.fallo && fallo === 'version') throw errorNativo;
      return { user_version: fallo === 'esquema' ? 0 : 1 };
    },
    withTransactionAsync: async (operacion: () => Promise<void>) => operacion(),
    closeAsync: async () => { estado.cierres++; },
  };
  const sintetico = (nombre: string, valores: Record<string, unknown>) => new SyntheticModule(Object.keys(valores), function () {
    for (const [clave, valor] of Object.entries(valores)) this.setExport(clave, valor);
  }, { context: contexto, identifier: nombre });
  const errores = new SourceTextModule(compilarFuente(await readFile(new URL('../src/database/errors.ts', import.meta.url), 'utf8'), 'errors.ts'), { context: contexto });
  await errores.link(() => { throw new Error('Import inesperado'); });
  const dependencias = {
    'expo-sqlite': sintetico('sqlite', { openDatabaseAsync: async () => { estado.aperturas++; if (estado.fallo && fallo === 'apertura') throw errorNativo; return conexion; } }),
    '../sync/journal': sintetico('diario', { prepararDiario: async () => {
      estado.intentosDiario++;
      if (estado.intentosDiario <= bloqueosDiario) throw Object.assign(new Error("Call to function 'NativeDatabase.execAsync' has been rejected. Caused by: database is locked"), { code: 'ERR_INTERNAL_SQLITE_ERROR' });
      if (estado.fallo && fallo === 'diario') throw errorNativo;
    } }),
    './migrations/001_initialSchema': sintetico('esquema', { VERSION_ESQUEMA_INICIAL: 1, aplicarEsquemaInicial: async () => { if (estado.fallo && fallo === 'esquema') throw errorNativo; } }),
    './errors': errores,
  };
  const modulo = new SourceTextModule(compilarFuente(await readFile(new URL('../src/database/initialization.ts', import.meta.url), 'utf8'), 'initialization.ts'), { context: contexto });
  await modulo.link(nombre => {
    const dependencia = dependencias[nombre as keyof typeof dependencias];
    if (!dependencia) throw new Error(nombre);
    return dependencia;
  });
  await modulo.evaluate();
  return { estado, registros, sentencias, esperas, inicializar: (modulo.namespace as unknown as { inicializarBaseDatos: () => Promise<unknown> }).inicializarBaseDatos };
}

for (const [fallo, operacion] of [
  ['apertura', 'abrir-base'], ['version', 'leer-version'],
  ['esquema', 'aplicar-esquema-inicial'], ['diario', 'preparar-diario-sincronizacion'],
] as const) test(`identifica un error nativo en ${fallo}, conserva el detalle y permite reintentar`, async () => {
  const e = await prepararInicializacion(fallo);
  const primera = e.inicializar();
  const concurrente = e.inicializar();
  const resultados = await Promise.allSettled([primera, concurrente]);
  assert.ok(resultados.every(resultado => resultado.status === 'rejected'));
  assert.equal(e.estado.aperturas, 1);
  assert.equal(e.registros.length, 1);
  assert.equal(e.registros[0].operacion, operacion);
  assert.equal(e.registros[0].codigoTecnico, 'ERR_INTERNAL_SQLITE_ERROR');
  assert.equal(e.registros[0].mensajeTecnico, 'SQLite: detalle nativo de prueba');
  assert.equal(e.estado.cierres, fallo === 'apertura' ? 0 : 1);
  e.estado.fallo = false;
  await e.inicializar();
  await e.inicializar();
  assert.equal(e.estado.aperturas, 2);
});

test('espera y reintenta el bloqueo nativo del diario sin cerrar ni reabrir la base', async () => {
  const e = await prepararInicializacion('diario', 2);
  e.estado.fallo = false;
  await Promise.all([e.inicializar(), e.inicializar()]);
  assert.equal(e.sentencias[0], 'PRAGMA busy_timeout = 2000;');
  assert.equal(e.estado.intentosDiario, 3);
  assert.equal(e.estado.aperturas, 1);
  assert.equal(e.estado.cierres, 0);
  assert.deepEqual(e.esperas, [200, 400]);
  assert.equal(e.registros.length, 0);
});

test('un bloqueo persistente termina los reintentos y mantiene el diagnóstico original', async () => {
  const e = await prepararInicializacion('diario', 10);
  await assert.rejects(e.inicializar(), /No se pudo/);
  assert.equal(e.estado.intentosDiario, 3);
  assert.equal(e.estado.cierres, 1);
  assert.equal(e.registros.length, 1);
  assert.match(String(e.registros[0].mensajeTecnico), /database is locked/);
});
