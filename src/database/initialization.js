import * as SQLite from 'expo-sqlite';

import { ejecutarConManejoDeErrores, ErrorBaseDatos, manejarErrorBaseDatos } from './errors';
import {
  aplicarEsquemaInicial,
  VERSION_ESQUEMA_INICIAL,
} from './migrations/001_initialSchema';

const NOMBRE_BASE_DATOS = 'ahre.db';
const MIGRACIONES = Object.freeze([
  Object.freeze({ version: VERSION_ESQUEMA_INICIAL, aplicar: aplicarEsquemaInicial }),
]);

let baseDatosPreparada = null;
let promesaPreparacion = null;

async function abrirYPrepararBaseDatos() {
  let baseDatos;

  try {
    baseDatos = await SQLite.openDatabaseAsync(NOMBRE_BASE_DATOS);
    await baseDatos.execAsync('PRAGMA foreign_keys = ON;');

    const clavesForaneas = await baseDatos.getFirstAsync('PRAGMA foreign_keys;');
    if (Number(clavesForaneas?.foreign_keys) !== 1) {
      throw new Error('SQLite no pudo activar las claves foráneas.');
    }

    const filaVersion = await baseDatos.getFirstAsync('PRAGMA user_version;');
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

      await ejecutarConManejoDeErrores('migracion', () =>
        baseDatos.withTransactionAsync(async () => {
          await migracion.aplicar(baseDatos);
          await baseDatos.execAsync(`PRAGMA user_version = ${migracion.version};`);
        }),
      );
      versionActual = migracion.version;
    }

    return baseDatos;
  } catch (error) {
    if (baseDatos) {
      try {
        await baseDatos.closeAsync();
      } catch (_errorAlCerrar) {
        // Se conserva el error original de apertura o migración.
      }
    }

    throw manejarErrorBaseDatos('inicializacion', error);
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
      .catch((error) => {
        promesaPreparacion = null;
        throw error;
      });
  }

  return promesaPreparacion;
}
