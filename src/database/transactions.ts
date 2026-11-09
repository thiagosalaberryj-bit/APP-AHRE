import type { Conexion } from './types';
import { ejecutarConManejoDeErrores } from './errors';
import { ejecutarConConexion } from './connectionQueue';

export async function ejecutarTransaccion<Resultado>(operacion: (conexion: Conexion) => Promise<Resultado>, nombreOperacion = 'ejecutar-transaccion'): Promise<Resultado> {
  return ejecutarConManejoDeErrores('transaccion', () => ejecutarConConexion(operacion), {operacion:nombreOperacion});
}
