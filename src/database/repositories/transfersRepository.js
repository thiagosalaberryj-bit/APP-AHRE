import { ErrorBaseDatos } from '../errors';
import { generarIdentificador } from '../identifiers';
import { ejecutarTransaccion } from '../transactions';
import { crearRepositorio } from './repositoryFactory';
import { movimientosRepositorio } from './movementsRepository';

const repositorioTransferencias = crearRepositorio({
  tabla: 'transferencias',
  campos: [
    'usuario_id',
    'deposito_origen_id',
    'deposito_destino_id',
    'monto',
    'fecha_hora',
    'descripcion',
    'anulada',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['descripcion'],
  camposFiltrables: ['usuario_id', 'deposito_origen_id', 'deposito_destino_id', 'anulada'],
  camposOrdenables: ['fecha_hora', 'monto', 'fecha_creacion'],
  ordenPredeterminado: 'fecha_hora',
  eliminacion: { campo: 'anulada', valor: 1 },
});

async function crearConMovimientos(datos) {
  if (!datos || typeof datos !== 'object') {
    throw new ErrorBaseDatos('integridad');
  }

  const monto = Number(datos.monto);
  if (
    !Number.isFinite(monto) ||
    monto <= 0 ||
    !datos.usuario_id ||
    !datos.deposito_origen_id ||
    !datos.deposito_destino_id ||
    datos.deposito_origen_id === datos.deposito_destino_id
  ) {
    throw new ErrorBaseDatos('integridad');
  }

  return ejecutarTransaccion(async (transaccion) => {
    const origen = await transaccion.getFirstAsync(
      'SELECT usuario_id, activo FROM depositos WHERE id = ?;',
      [datos.deposito_origen_id],
    );
    const destino = await transaccion.getFirstAsync(
      'SELECT usuario_id, activo FROM depositos WHERE id = ?;',
      [datos.deposito_destino_id],
    );

    if (
      !origen ||
      !destino ||
      Number(origen.activo) !== 1 ||
      Number(destino.activo) !== 1 ||
      origen.usuario_id !== datos.usuario_id ||
      destino.usuario_id !== datos.usuario_id
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    const id = datos.id || generarIdentificador();
    const fechaHora = datos.fecha_hora || new Date().toISOString();
    const descripcion = datos.descripcion || null;
    const descripcionMovimiento = descripcion || 'Transferencia entre depósitos';

    const transferencia = await repositorioTransferencias.crear({
      id,
      usuario_id: datos.usuario_id,
      deposito_origen_id: datos.deposito_origen_id,
      deposito_destino_id: datos.deposito_destino_id,
      monto,
      fecha_hora: fechaHora,
      descripcion,
    }, transaccion);

    const movimientoSalida = await movimientosRepositorio.crear({
      id: generarIdentificador(),
      deposito_id: datos.deposito_origen_id,
      categoria: 'transferencias',
      transferencia_id: id,
      tipo: 'transferencia_salida',
      monto,
      descripcion: descripcionMovimiento,
      fecha_hora: fechaHora,
    }, transaccion);

    const movimientoEntrada = await movimientosRepositorio.crear({
      id: generarIdentificador(),
      deposito_id: datos.deposito_destino_id,
      categoria: 'transferencias',
      transferencia_id: id,
      tipo: 'transferencia_entrada',
      monto,
      descripcion: descripcionMovimiento,
      fecha_hora: fechaHora,
    }, transaccion);

    return {
      transferencia,
      movimientos: [movimientoSalida, movimientoEntrada],
    };
  });
}

async function eliminar(id) {
  return ejecutarTransaccion(async (transaccion) => {
    const transferencia = await repositorioTransferencias.consultarPorId(id, transaccion);
    if (!transferencia) {
      return false;
    }

    await repositorioTransferencias.actualizar(id, { anulada: 1 }, transaccion);
    await transaccion.runAsync(
      `UPDATE movimientos
       SET anulado = 1, fecha_actualizacion = ?
       WHERE transferencia_id = ? AND anulado = 0;`,
      [new Date().toISOString(), id],
    );
    return true;
  });
}

export const transferenciasRepositorio = Object.freeze({
  ...repositorioTransferencias,
  crear: crearConMovimientos,
  crearConMovimientos,
  eliminar,
});
