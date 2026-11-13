import type { Conexion } from './types';
import * as SQLite from 'expo-sqlite';
import {ejecutarControlSQLite, enTransaccionSQLite} from './sqliteTransaction';
import { estaPreparadoDiario, prepararDiario } from '../sync/journal';

import { ErrorBaseDatos, manejarErrorBaseDatos } from './errors';
import {
  aplicarEsquemaInicial,
  prepararEsquemaIntegraciones,
  VERSION_ESQUEMA_INICIAL,
} from './migrations/001_initialSchema';

// Las bases de desarrollo anteriores no se migran ni se borran: se conservan
// en su archivo original. Las builds instalables mantienen su nombre estable.
const NOMBRE_BASE_DATOS = typeof __DEV__ !== 'undefined' && __DEV__
  ? 'ahre-desarrollo-social-v3.db'
  : 'ahre.db';
const MIGRACIONES = Object.freeze([
  Object.freeze({ version: VERSION_ESQUEMA_INICIAL, aplicar: aplicarEsquemaInicial }),
]);

interface EstadoConexion {
  baseDatosPreparada: Conexion | null;
  promesaPreparacion: Promise<Conexion> | null;
  colaOperaciones: Promise<void>;
}

// Fast Refresh puede reevaluar este módulo mientras sigue activa una operación.
// La conexión y su cola deben sobrevivir juntas durante todo el runtime JS.
const entorno = globalThis as typeof globalThis & { __ahreConexionesSQLite?: Record<string, EstadoConexion> };
const conexiones = entorno.__ahreConexionesSQLite ??= {};
export const estadoConexion = conexiones[NOMBRE_BASE_DATOS] ??= {
  baseDatosPreparada: null,
  promesaPreparacion: null,
  colaOperaciones: Promise.resolve(),
};

async function prepararDiarioSiHaceFalta(baseDatos: Conexion, informarOperacion:(operacion:string)=>void) {
  informarOperacion('comprobar-diario-sincronizacion');
  if(await estaPreparadoDiario(baseDatos))return;
  informarOperacion('reservar-diario-sincronizacion');
  await enTransaccionSQLite(baseDatos,async()=>{
    informarOperacion('preparar-diario-sincronizacion');
    await prepararDiario(baseDatos);
    informarOperacion('confirmar-diario-sincronizacion');
  });
}

async function abrirYPrepararBaseDatos() {
  let baseDatos: Conexion | undefined;
  let operacion = 'abrir-base';

  try {
    baseDatos = await SQLite.openDatabaseAsync(NOMBRE_BASE_DATOS);
    operacion = 'configurar-espera-bloqueo';
    await baseDatos.execAsync('PRAGMA busy_timeout = 2000;');
    operacion = 'configurar-diario-wal';
    const modo=await baseDatos.getFirstAsync<{journal_mode:string}>('PRAGMA journal_mode;');
    if(modo?.journal_mode!=='wal' && modo?.journal_mode!=='memory') {
      await ejecutarControlSQLite(baseDatos,'PRAGMA journal_mode = WAL;');
    }
    operacion = 'activar-claves-foraneas';
    await baseDatos.execAsync('PRAGMA foreign_keys = ON;');

    operacion = 'comprobar-claves-foraneas';
    const clavesForaneas = await baseDatos.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys;');
    if (Number(clavesForaneas?.foreign_keys) !== 1) {
      throw new Error('SQLite no pudo activar las claves foráneas.');
    }

    operacion = 'leer-version';
    const filaVersion = await baseDatos.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    let versionActual = Number(filaVersion?.user_version || 0);

    if (!Number.isInteger(versionActual) || versionActual < 0) {
      throw new Error('La versión de la base de datos no es válida.');
    }

    if (versionActual > VERSION_ESQUEMA_INICIAL) {
      throw new ErrorBaseDatos('version');
    }

    for (const migracion of MIGRACIONES) {
      if (migracion.version <= versionActual) {
        continue;
      }

      operacion = 'aplicar-esquema-inicial';
      await baseDatos.withTransactionAsync(async () => {
        await migracion.aplicar(baseDatos!);
        await baseDatos!.execAsync(`PRAGMA user_version = ${migracion.version};`);
      });
      versionActual = migracion.version;
    }

    if (!await baseDatos.getFirstAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='programaciones_avisos'")) {
      operacion = 'preparar-integraciones';
      await prepararEsquemaIntegraciones(baseDatos);
    }
    operacion = 'preparar-diario-sincronizacion';
    await prepararDiarioSiHaceFalta(baseDatos, paso=>{operacion=paso;});
    return baseDatos;
  } catch (error) {
    if (baseDatos) {
      try {
        await baseDatos.closeAsync();
      } catch (_errorAlCerrar) {
        // Se conserva el error original de apertura o migración.
      }
    }

    throw manejarErrorBaseDatos(operacion === 'aplicar-esquema-inicial' ? 'migracion' : 'inicializacion', error, { operacion });
  }
}

export async function inicializarBaseDatos() {
  return obtenerBaseDatos();
}

export function obtenerBaseDatos() {
  if (estadoConexion.baseDatosPreparada) {
    return Promise.resolve(estadoConexion.baseDatosPreparada);
  }

  if (!estadoConexion.promesaPreparacion) {
    estadoConexion.promesaPreparacion = abrirYPrepararBaseDatos()
      .then((baseDatos) => {
        estadoConexion.baseDatosPreparada = baseDatos;
        return baseDatos;
      })
      .catch((error: unknown) => {
        estadoConexion.promesaPreparacion = null;
        throw error;
      });
  }

  return estadoConexion.promesaPreparacion;
}
