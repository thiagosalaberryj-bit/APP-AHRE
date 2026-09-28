import { ejecutarTransaccion } from '../transactions';
import { crearRepositorio } from './repositoryFactory';
import { deudasRepositorio } from './debtsRepository';

const repositorioPagosDeuda = crearRepositorio({
  tabla: 'pagos_deuda',
  campos: ['deuda_id', 'monto', 'fecha', 'movimiento_id', 'descripcion'],
  camposBusqueda: ['descripcion'],
  camposFiltrables: ['deuda_id', 'movimiento_id'],
  camposOrdenables: ['fecha', 'monto'],
  ordenPredeterminado: 'fecha',
});

async function eliminar(id) {
  return ejecutarTransaccion(async (transaccion) => {
    const pago = await repositorioPagosDeuda.consultarPorId(id, transaccion);
    if (!pago) {
      return false;
    }

    const deuda = await deudasRepositorio.consultarPorId(pago.deuda_id, transaccion);
    await transaccion.runAsync(
      `UPDATE movimientos
       SET anulado = 1, fecha_actualizacion = ?
       WHERE id = ? AND anulado = 0;`,
      [new Date().toISOString(), pago.movimiento_id],
    );
    await repositorioPagosDeuda.eliminar(id, transaccion);

    if (deuda && deuda.estado !== 'cancelada') {
      const resumen = await transaccion.getFirstAsync(
        `SELECT COALESCE(SUM(monto), 0) AS monto_pagado
         FROM pagos_deuda
         WHERE deuda_id = ?;`,
        [deuda.id],
      );
      const montoPagado = Number(resumen?.monto_pagado || 0);
      const nuevoEstado = montoPagado === 0
        ? 'pendiente'
        : montoPagado >= Number(deuda.monto)
          ? 'pagada'
          : 'parcial';
      await deudasRepositorio.actualizar(deuda.id, { estado: nuevoEstado }, transaccion);
    }

    return true;
  });
}

export const pagosDeudaRepositorio = Object.freeze({
  ...repositorioPagosDeuda,
  eliminar,
});
