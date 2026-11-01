import type { Conexion } from './types';
import { obtenerBaseDatos } from './initialization';

let colaOperaciones = Promise.resolve();

export function ejecutarConConexion<Resultado>(operacion: (conexion: Conexion) => Promise<Resultado>, conexion: Conexion | null = null): Promise<Resultado> {
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
