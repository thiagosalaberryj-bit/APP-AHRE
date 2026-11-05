import type { Conexion } from './types';
import * as SQLite from 'expo-sqlite';
import { prepararDiario } from '../sync/journal';

import { ErrorBaseDatos, manejarErrorBaseDatos } from './errors';
import {
  aplicarEsquemaInicial,
  VERSION_ESQUEMA_INICIAL,
} from './migrations/001_initialSchema';

const NOMBRE_BASE_DATOS = 'ahre.db';
const MIGRACIONES = Object.freeze([
  Object.freeze({ version: VERSION_ESQUEMA_INICIAL, aplicar: aplicarEsquemaInicial }),
]);

let baseDatosPreparada: Conexion | null = null;
let promesaPreparacion: Promise<Conexion> | null = null;

function esBloqueoSQLite(error: unknown) {
  const fallo = error as { message?: unknown; code?: unknown; errcode?: unknown; extendedCode?: unknown } | null;
  const codigo = Number(fallo?.errcode ?? fallo?.extendedCode);
  return /database (?:is |table is )?(?:locked|busy)/i.test(String(fallo?.message || ''))
    || /SQLITE_(?:BUSY|LOCKED)/i.test(String(fallo?.code || ''))
    || (Number.isInteger(codigo) && [5, 6].includes(codigo & 0xff));
}

async function prepararDiarioConReintentos(baseDatos: Conexion) {
  for (let intento = 0; ; intento++) {
    try {
      await prepararDiario(baseDatos);
      return;
    } catch (error) {
      if (intento >= 2 || !esBloqueoSQLite(error)) throw error;
      // El diario usa CREATE IF NOT EXISTS e INSERT OR IGNORE: se puede retomar
      // sin duplicar registros si una escritura de otra conexión lo bloqueó.
      await new Promise<void>(resolver => setTimeout(resolver, 200 * (intento + 1)));
    }
  }
}

async function abrirYPrepararBaseDatos() {
  let baseDatos: Conexion | undefined;
  let operacion = 'abrir-base';

  try {
    baseDatos = await SQLite.openDatabaseAsync(NOMBRE_BASE_DATOS);
    operacion = 'configurar-espera-bloqueo';
    await baseDatos.execAsync('PRAGMA busy_timeout = 2000;');
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

    operacion = 'preparar-diario-sincronizacion';
    await prepararDiarioConReintentos(baseDatos);
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
  if (baseDatosPreparada) {
    return Promise.resolve(baseDatosPreparada);
  }

  if (!promesaPreparacion) {
    promesaPreparacion = abrirYPrepararBaseDatos()
      .then((baseDatos) => {
        baseDatosPreparada = baseDatos;
        return baseDatos;
      })
      .catch((error: unknown) => {
        promesaPreparacion = null;
        throw error;
      });
  }

  return promesaPreparacion;
}
