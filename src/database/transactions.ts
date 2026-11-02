import type { Conexion } from './types';
import { ejecutarConManejoDeErrores } from './errors';
import { ejecutarConConexion } from './connectionQueue';

export async function ejecutarTransaccion<Resultado>(operacion: (conexion: Conexion) => Promise<Resultado>): Promise<Resultado> {
  return ejecutarConManejoDeErrores('transaccion', () =>
    ejecutarConConexion(async (baseDatos) => {
      let resultado: Resultado;
      await baseDatos.withTransactionAsync(async () => {
        resultado = await operacion(baseDatos);
      });
      return resultado!;
    }),
  );
}
