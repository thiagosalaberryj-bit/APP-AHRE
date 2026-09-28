import { ejecutarTransaccion } from '../transactions';
import { crearRepositorio } from './repositoryFactory';

const repositorioGastosCompartidos = crearRepositorio({
  tabla: 'gastos_compartidos',
  campos: [
    'usuario_id',
    'movimiento_id',
    'descripcion',
    'monto_total',
    'fecha',
    'estado',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['descripcion'],
  camposFiltrables: ['usuario_id', 'movimiento_id', 'estado'],
  camposOrdenables: ['fecha', 'monto_total', 'estado', 'fecha_creacion'],
  ordenPredeterminado: 'fecha',
  eliminacion: { campo: 'estado', valor: 'cancelado' },
});

async function eliminar(id) {
  return ejecutarTransaccion(async (transaccion) => {
    const gasto = await repositorioGastosCompartidos.consultarPorId(id, transaccion);
    if (!gasto) {
      return false;
    }

    const ahora = new Date().toISOString();
    await repositorioGastosCompartidos.actualizar(id, { estado: 'cancelado' }, transaccion);
    await transaccion.runAsync(
      `UPDATE movimientos
       SET anulado = 1, fecha_actualizacion = ?
       WHERE id = ? AND anulado = 0;`,
      [ahora, gasto.movimiento_id],
    );
    await transaccion.runAsync(
      `UPDATE deudas
       SET estado = 'cancelada', fecha_actualizacion = ?
       WHERE gasto_compartido_id = ? AND estado <> 'cancelada';`,
      [ahora, id],
    );
    return true;
  });
}

export const gastosCompartidosRepositorio = Object.freeze({
  ...repositorioGastosCompartidos,
  eliminar,
});
