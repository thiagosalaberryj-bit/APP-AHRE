import { ErrorBaseDatos } from '../errors';
import { generarIdentificador } from '../identifiers';
import { ejecutarTransaccion } from '../transactions';
import { crearRepositorio } from './repositoryFactory';
import { movimientosRepositorio } from './movementsRepository';
import { ajustarSaldoActual } from './depositsRepository';

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
    'reversion_de_id',
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
    if (!transferencia || Number(transferencia.anulada) === 1) {
      return false;
    }

    const movimientos = await transaccion.getAllAsync(
      `SELECT id, tipo, deposito_id, monto, descripcion, fecha_hora
       FROM movimientos
       WHERE transferencia_id = ?
       ORDER BY tipo;`,
      [id],
    );
    const movimientoSalida = movimientos.find((movimiento) => movimiento.tipo === 'transferencia_salida');
    const movimientoEntrada = movimientos.find((movimiento) => movimiento.tipo === 'transferencia_entrada');
    if (
      movimientos.length !== 2 ||
      !movimientoSalida ||
      !movimientoEntrada ||
      Number(movimientoSalida.anulado) === 1 ||
      Number(movimientoEntrada.anulado) === 1 ||
      movimientoSalida.deposito_id !== transferencia.deposito_origen_id ||
      movimientoEntrada.deposito_id !== transferencia.deposito_destino_id ||
      Number(movimientoSalida.monto) !== Number(transferencia.monto) ||
      Number(movimientoEntrada.monto) !== Number(transferencia.monto)
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    await repositorioTransferencias.actualizar(id, { anulada: 1 }, transaccion);
    const fechaHora = new Date().toISOString();
    const idReversion = generarIdentificador();
    const descripcion = `Reversión de transferencia: ${transferencia.descripcion || transferencia.id}`;

    await repositorioTransferencias.crear({
      id: idReversion,
      usuario_id: transferencia.usuario_id,
      deposito_origen_id: transferencia.deposito_destino_id,
      deposito_destino_id: transferencia.deposito_origen_id,
      monto: transferencia.monto,
      fecha_hora: fechaHora,
      descripcion,
      reversion_de_id: transferencia.id,
    }, transaccion);

    await movimientosRepositorio.crear({
      id: generarIdentificador(),
      deposito_id: transferencia.deposito_destino_id,
      categoria: 'transferencias',
      transferencia_id: idReversion,
      tipo: 'transferencia_salida',
      monto: transferencia.monto,
      descripcion,
      fecha_hora: fechaHora,
    }, transaccion);

    await movimientosRepositorio.crear({
      id: generarIdentificador(),
      deposito_id: transferencia.deposito_origen_id,
      categoria: 'transferencias',
      transferencia_id: idReversion,
      tipo: 'transferencia_entrada',
      monto: transferencia.monto,
      descripcion,
      fecha_hora: fechaHora,
    }, transaccion);
    return true;
  });
}

function calcularImpactoSaldoMovimiento(movimiento) {
  if (Number(movimiento.anulado) === 1) {
    return 0;
  }
  return movimiento.tipo === 'transferencia_entrada'
    ? Number(movimiento.monto)
    : -Number(movimiento.monto);
}

async function actualizar(id, cambios) {
  return ejecutarTransaccion(async (transaccion) => {
    if (!cambios || typeof cambios !== 'object' || Array.isArray(cambios)) {
      throw new ErrorBaseDatos('integridad');
    }
    if (
      Object.prototype.hasOwnProperty.call(cambios, 'anulada') ||
      Object.prototype.hasOwnProperty.call(cambios, 'reversion_de_id')
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    const transferenciaAnterior = await repositorioTransferencias.consultarPorId(id, transaccion);
    if (!transferenciaAnterior || Number(transferenciaAnterior.anulada) === 1 || transferenciaAnterior.reversion_de_id) {
      return null;
    }

    const reversionExistente = await transaccion.getFirstAsync(
      'SELECT id FROM transferencias WHERE reversion_de_id = ?;',
      [id],
    );
    if (reversionExistente) {
      return null;
    }

    const filasMovimiento = await transaccion.getAllAsync(
      `SELECT id, tipo, deposito_id, monto, descripcion, fecha_hora, anulado
       FROM movimientos
       WHERE transferencia_id = ?;`,
      [id],
    );
    const movimientoSalida = filasMovimiento.find((movimiento) => movimiento.tipo === 'transferencia_salida');
    const movimientoEntrada = filasMovimiento.find((movimiento) => movimiento.tipo === 'transferencia_entrada');
    if (
      filasMovimiento.length !== 2 ||
      !movimientoSalida ||
      !movimientoEntrada ||
      Number(movimientoSalida.anulado) === 1 ||
      Number(movimientoEntrada.anulado) === 1 ||
      movimientoSalida.deposito_id !== transferenciaAnterior.deposito_origen_id ||
      movimientoEntrada.deposito_id !== transferenciaAnterior.deposito_destino_id ||
      Number(movimientoSalida.monto) !== Number(transferenciaAnterior.monto) ||
      Number(movimientoEntrada.monto) !== Number(transferenciaAnterior.monto)
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    const datosActualizados = { ...cambios };
    if (datosActualizados.monto !== undefined) {
      datosActualizados.monto = Number(datosActualizados.monto);
      if (!Number.isFinite(datosActualizados.monto) || datosActualizados.monto <= 0) {
        throw new ErrorBaseDatos('integridad');
      }
    }

    const transferenciaActualizada = await repositorioTransferencias.actualizar(
      id,
      datosActualizados,
      transaccion,
    );
    if (!transferenciaActualizada) {
      return null;
    }
    if (
      transferenciaActualizada.deposito_origen_id === transferenciaActualizada.deposito_destino_id
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    const depositos = await transaccion.getAllAsync(
      `SELECT id, usuario_id, activo
       FROM depositos
       WHERE id IN (?, ?);`,
      [transferenciaActualizada.deposito_origen_id, transferenciaActualizada.deposito_destino_id],
    );
    if (
      depositos.length !== 2 ||
      depositos.some((deposito) =>
        deposito.usuario_id !== transferenciaActualizada.usuario_id || Number(deposito.activo) !== 1,
      )
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    const descripcionMovimiento = transferenciaActualizada.descripcion || 'Transferencia entre depósitos';
    const movimientosActualizados = [
      {
        movimiento: movimientoSalida,
        deposito_id: transferenciaActualizada.deposito_origen_id,
      },
      {
        movimiento: movimientoEntrada,
        deposito_id: transferenciaActualizada.deposito_destino_id,
      },
    ];

    for (const elemento of movimientosActualizados) {
      const movimiento = elemento.movimiento;
      const movimientoNuevo = {
        ...movimiento,
        deposito_id: elemento.deposito_id,
        monto: transferenciaActualizada.monto,
        descripcion: descripcionMovimiento,
        fecha_hora: transferenciaActualizada.fecha_hora,
      };
      await transaccion.runAsync(
        `UPDATE movimientos
         SET deposito_id = ?, monto = ?, descripcion = ?, fecha_hora = ?, fecha_actualizacion = ?
         WHERE id = ?;`,
        [
          movimientoNuevo.deposito_id,
          movimientoNuevo.monto,
          movimientoNuevo.descripcion,
          movimientoNuevo.fecha_hora,
          new Date().toISOString(),
          movimiento.id,
        ],
      );
      await ajustarSaldoActual(
        movimiento.deposito_id,
        -calcularImpactoSaldoMovimiento(movimiento),
        transaccion,
      );
      await ajustarSaldoActual(
        movimientoNuevo.deposito_id,
        calcularImpactoSaldoMovimiento(movimientoNuevo),
        transaccion,
      );
    }

    return repositorioTransferencias.consultarPorId(id, transaccion);
  });
}

export const transferenciasRepositorio = Object.freeze({
  ...repositorioTransferencias,
  crear: crearConMovimientos,
  crearConMovimientos,
  actualizar,
  eliminar,
});
