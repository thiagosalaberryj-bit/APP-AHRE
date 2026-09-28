import { obtenerBaseDatos } from './initialization';

let colaOperaciones = Promise.resolve();

export function ejecutarConConexion(operacion, conexion = null) {
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
