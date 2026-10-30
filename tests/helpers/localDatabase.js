import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';

export async function preparar(prueba, desarrollo = true) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const base = new DatabaseSync(':memory:');
  prueba.after(() => base.close());
  const parametros = valores => Array.isArray(valores[0]) ? valores[0] : valores;
  const adaptador = {
    execAsync: async sql => base.exec(sql),
    getFirstAsync: async (sql, ...valores) => base.prepare(sql).get(...parametros(valores)) || null,
    getAllAsync: async (sql, ...valores) => base.prepare(sql).all(...parametros(valores)),
    runAsync: async (sql, ...valores) => base.prepare(sql).run(...parametros(valores)),
    closeAsync: async () => {},
    withTransactionAsync: async operacion => {
      base.exec('BEGIN');
      try { await operacion(); base.exec('COMMIT'); }
      catch (error) { base.exec('ROLLBACK'); throw error; }
    },
  };
  const almacenamiento = new Map();
  const contexto = createContext({ console, crypto: globalThis.crypto, __DEV__: desarrollo });
  const modulos = new Map();
  const sintetico = (nombre, valores) => new SyntheticModule(Object.keys(valores), function inicializar() {
    for (const [clave, valor] of Object.entries(valores)) this.setExport(clave, valor);
  }, { context: contexto, identifier: nombre });
  modulos.set('expo-sqlite', sintetico('expo-sqlite', { openDatabaseAsync: async () => adaptador }));
  modulos.set('expo-secure-store', sintetico('expo-secure-store', {
    getItemAsync: async clave => almacenamiento.get(clave) || null,
    setItemAsync: async (clave, valor) => { almacenamiento.set(clave, valor); },
    deleteItemAsync: async clave => { almacenamiento.delete(clave); },
  }));
  modulos.set('expo-crypto', sintetico('expo-crypto', {
    CryptoDigestAlgorithm: { SHA256: 'sha256' }, CryptoEncoding: { HEX: 'hex' },
    getRandomBytesAsync: async longitud => new Uint8Array(randomBytes(longitud)),
    digestStringAsync: async (_algoritmo, valor) => createHash('sha256').update(valor).digest('hex'),
  }));
  const cargar = async identificador => {
    if (modulos.has(identificador)) return modulos.get(identificador);
    const pendiente = readFile(identificador, 'utf8').then(codigo =>
      new SourceTextModule(codigo, { context: contexto, identifier: identificador }));
    modulos.set(identificador, pendiente);
    return pendiente;
  };
  const entrada = new SourceTextModule(`
    export * from './src/development/seedDevelopmentData.js';
    export * from './src/development/developmentData.js';
    export * from './src/authentication/authenticationService.js';
    export * from './src/authentication/sessionService.js';
    export * from './src/database/repositories/index.js';
    export * from './src/database/initialization.js';
    export * from './src/social/socialService.js';
  `, { context: contexto, identifier: path.join(raiz, 'prueba-desarrollo-virtual.js') });
  await entrada.link(async (nombre, origen) => {
    if (modulos.has(nombre)) return modulos.get(nombre);
    const ruta = path.resolve(path.dirname(origen.identifier), nombre);
    return cargar(ruta.endsWith('.js') ? ruta : existsSync(`${ruta}.js`) ? `${ruta}.js` : path.join(ruta, 'index.js'));
  });
  await entrada.evaluate();
  return { base, almacenamiento, ...entrada.namespace };
}
