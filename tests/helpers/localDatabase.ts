import type { SQLInputValue } from 'node:sqlite';
import type { Module } from 'node:vm';
import { compilarFuente, resolverFuente } from './typescript.ts';
import { readFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';

type ServiciosPrueba =
  typeof import('../../src/development/seedDevelopmentData.ts')
  & typeof import('../../src/development/developmentData.ts')
  & typeof import('../../src/authentication/authenticationService.ts')
  & typeof import('../../src/authentication/sessionService.ts')
  & typeof import('../../src/profile/profileService.ts')
  & typeof import('../../src/movements/movementService.ts')
  & typeof import('../../src/database/repositories/index.ts')
  & typeof import('../../src/database/initialization.ts')
  & typeof import('../../src/social/socialService.ts')
  & typeof import('../../src/statistics/statisticsService.ts');
type ServiciosRecurrencias = typeof import('../../src/recurrences/recurrenceService.ts');
type ServiciosSync = typeof import('../../src/sync/syncService.ts') & typeof import('../../src/sync/remote.ts') & typeof import('../../src/sync/deviceAuthorization.ts') & typeof import('../../src/sync/pendingService.ts') & Pick<typeof import('../../src/sync/journal.ts'),'observarCambiosLocales'> & typeof import('../../src/database/connectionQueue.ts') & typeof import('../../src/database/transactions.ts');

export async function preparar(prueba: import('node:test').TestContext, desarrollo = true, remoto?:{url:string;fetch:typeof fetch;almacenamiento?:Map<string,string>;base?:DatabaseSync;registrarSql?:(sql:string)=>void;reloj?:(new () => Date) & Pick<typeof Date,'now'|'parse'|'UTC'>}) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const base = remoto?.base || new DatabaseSync(':memory:');
  if (!remoto?.base) prueba.after(() => base.close());
  const parametros = (valores: (SQLInputValue | SQLInputValue[])[]) => Array.isArray(valores[0]) ? valores[0] : valores as SQLInputValue[];
  const adaptador = {
    execAsync: async (sql: string) => {remoto?.registrarSql?.(sql);return base.exec(sql);},
    getFirstAsync: async (sql: string, ...valores: (SQLInputValue | SQLInputValue[])[]) => {remoto?.registrarSql?.(sql);return base.prepare(sql).get(...parametros(valores)) || null;},
    getAllAsync: async (sql: string, ...valores: (SQLInputValue | SQLInputValue[])[]) => {remoto?.registrarSql?.(sql);return base.prepare(sql).all(...parametros(valores));},
    runAsync: async (sql: string, ...valores: (SQLInputValue | SQLInputValue[])[]) => {remoto?.registrarSql?.(sql);return base.prepare(sql).run(...parametros(valores));},
    closeAsync: async () => {},
    withTransactionAsync: async (operacion: ()=>Promise<void>) => {
      base.exec('BEGIN');
      try { await operacion(); base.exec('COMMIT'); }
      catch (error) { base.exec('ROLLBACK'); throw error; }
    },
  };
  const almacenamiento = remoto?.almacenamiento||new Map<string, string>();
  const contexto = createContext({ console, Date, crypto: globalThis.crypto, __DEV__: desarrollo, URL, AbortController, setTimeout, clearTimeout, ...(remoto?.reloj?{Date:remoto.reloj}:{}), ...(remoto?{process:{env:{EXPO_PUBLIC_API_URL:remoto.url}},fetch:remoto.fetch}:{}) });
  const modulos = new Map<string, Module | Promise<Module>>();
  const sintetico = (nombre: string, valores: Record<string,unknown>) => new SyntheticModule(Object.keys(valores), function inicializar() {
    for (const [clave, valor] of Object.entries(valores)) this.setExport(clave, valor);
  }, { context: contexto, identifier: nombre });
  modulos.set('expo-sqlite', sintetico('expo-sqlite', { openDatabaseAsync: async () => adaptador }));
  modulos.set('expo-secure-store', sintetico('expo-secure-store', {
    getItemAsync: async (clave: string) => almacenamiento.get(clave) || null,
    setItemAsync: async (clave: string, valor: string) => { almacenamiento.set(clave, valor); },
    deleteItemAsync: async (clave: string) => { almacenamiento.delete(clave); },
  }));
  modulos.set('expo-crypto', sintetico('expo-crypto', {
    CryptoDigestAlgorithm: { SHA256: 'sha256' }, CryptoEncoding: { HEX: 'hex' },
    getRandomBytesAsync: async (longitud: number) => new Uint8Array(randomBytes(longitud)),
    digestStringAsync: async (_algoritmo: string, valor: string) => createHash('sha256').update(valor).digest('hex'),
  }));
  const cargar = async (identificador: string): Promise<Module> => {
    if (modulos.has(identificador)) return modulos.get(identificador)!;
    const pendiente = readFile(identificador, 'utf8').then(codigo =>
      new SourceTextModule(compilarFuente(codigo, identificador), { context: contexto, identifier: identificador }));
    modulos.set(identificador, pendiente);
    return pendiente;
  };
  const entrada = new SourceTextModule(`
    export * from './src/development/seedDevelopmentData.ts';
    export * from './src/development/developmentData.ts';
    export * from './src/authentication/authenticationService.ts';
    export * from './src/authentication/sessionService.ts';
    export * from './src/profile/profileService.ts';
    export * from './src/movements/movementService.ts';
    export * from './src/database/repositories/index.ts';
    export * from './src/database/initialization.ts';
    export * from './src/social/socialService.ts';
    export * from './src/statistics/statisticsService.ts';
    export * from './src/recurrences/recurrenceService.ts';
    export * from './src/sync/syncService.ts';
    export * from './src/sync/remote.ts';
    export * from './src/sync/deviceAuthorization.ts';
    export * from './src/sync/pendingService.ts';
    export * from './src/database/connectionQueue.ts';
    export * from './src/database/transactions.ts';
    export {observarCambiosLocales} from './src/sync/journal.ts';
  `, { context: contexto, identifier: path.join(raiz, 'prueba-desarrollo-virtual.ts') });
  await entrada.link(async (nombre, origen) => {
    if (modulos.has(nombre)) return modulos.get(nombre)!;
    const ruta = path.resolve(path.dirname(origen.identifier), nombre);
    return cargar(resolverFuente(ruta));
  });
  await entrada.evaluate();
  return { base, almacenamiento, ...(entrada.namespace as unknown as ServiciosPrueba & ServiciosSync & ServiciosRecurrencias) };
}
