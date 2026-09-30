import { ejecutarConManejoDeErrores } from './errors';
import { ejecutarConConexion } from './connectionQueue';

export async function ejecutarTransaccion(operacion) {
  return ejecutarConManejoDeErrores('transaccion', () =>
    ejecutarConConexion(async (baseDatos) => {
      let resultado;
      await baseDatos.withTransactionAsync(async () => {
        resultado = await operacion(baseDatos);
      });
      return resultado;
    }),
  );
}
