import type { Conexion } from './types';
import { obtenerBaseDatos } from './initialization';
import { generarIdentificador } from './identifiers';
import { avisarCambiosLocales } from '../sync/journal';

let colaOperaciones = Promise.resolve();

function encolarOperacion<Resultado>(operacion: (conexion: Conexion) => Promise<Resultado>, conexion: Conexion | null): Promise<Resultado> {
  if (conexion) {
    return operacion(conexion);
  }

  const tarea = colaOperaciones.then(async () => {
    const baseDatos = await obtenerBaseDatos();
    return operacion(baseDatos);
  });

  colaOperaciones = tarea.then(
    () => undefined,
    () => undefined,
  );

  return tarea;
}

// Comparte la cola con las escrituras: una lectura nunca entra en una transacción ajena.
export function ejecutarLecturaConConexion<Resultado>(operacion: (conexion: Conexion) => Promise<Resultado>, conexion: Conexion | null = null): Promise<Resultado> {
  return encolarOperacion(operacion, conexion);
}

export function ejecutarConConexion<Resultado>(operacion: (conexion: Conexion) => Promise<Resultado>, conexion: Conexion | null = null): Promise<Resultado> {
  if (conexion) return operacion(conexion);
  return encolarOperacion(async baseDatos => {
    const antes=Number((await baseDatos.getFirstAsync<{n:number}>('SELECT MAX(secuencia) AS n FROM sync_outbox'))?.n||0);
    await baseDatos.runAsync('UPDATE sync_context SET lote=? WHERE id=1',[generarIdentificador()]);
    try { return await operacion(baseDatos); }
    finally {
      await baseDatos.runAsync('UPDATE sync_context SET lote=NULL WHERE id=1');
      const despues=Number((await baseDatos.getFirstAsync<{n:number}>('SELECT MAX(secuencia) AS n FROM sync_outbox'))?.n||0);
      if(despues>antes)avisarCambiosLocales();
    }
  }, null);
}
