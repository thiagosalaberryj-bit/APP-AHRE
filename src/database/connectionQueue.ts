import type { Conexion } from './types';
import { estadoConexion, obtenerBaseDatos } from './initialization';
import { generarIdentificador } from './identifiers';
import { enTransaccionSQLite } from './sqliteTransaction';
import { avisarCambiosLocales } from '../sync/journal';

function encolarOperacion<Resultado>(operacion: (conexion: Conexion) => Promise<Resultado>, conexion: Conexion | null): Promise<Resultado> {
  if (conexion) {
    return operacion(conexion);
  }

  const tarea = estadoConexion.colaOperaciones.then(async () => {
    const baseDatos = await obtenerBaseDatos();
    return operacion(baseDatos);
  });

  estadoConexion.colaOperaciones = tarea.then(
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
    let hayCambios=false;
    const resultado=await enTransaccionSQLite(baseDatos,async()=>{
      const antes=Number((await baseDatos.getFirstAsync<{n:number}>('SELECT MAX(secuencia) AS n FROM sync_outbox'))?.n||0);
      await baseDatos.runAsync('UPDATE sync_context SET lote=? WHERE id=1',[generarIdentificador()]);
      const salida=await operacion(baseDatos);
      await baseDatos.runAsync('UPDATE sync_context SET lote=NULL WHERE id=1');
      const despues=Number((await baseDatos.getFirstAsync<{n:number}>('SELECT MAX(secuencia) AS n FROM sync_outbox'))?.n||0);
      hayCambios=despues>antes;
      return salida;
    });
    if(hayCambios)avisarCambiosLocales();
    return resultado;
  }, null);
}
