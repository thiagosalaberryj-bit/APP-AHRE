import { ejecutarConManejoDeErrores, ErrorBaseDatos } from '../errors';
import { ejecutarTransaccion } from '../transactions';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../../constants/movimientos';
import { ajustarSaldoActual } from './depositsRepository';
import { crearRepositorio } from './repositoryFactory';

const TIPOS_MOVIMIENTO = Object.freeze([
  'ingreso',
  'egreso',
  'transferencia_salida',
  'transferencia_entrada',
]);

const TIPOS_INVERSOS = Object.freeze({
  ingreso: 'egreso',
  egreso: 'ingreso',
});

const CATEGORIAS_INVERSAS = Object.freeze({
  ingreso: 'otros_gastos',
  egreso: 'devoluciones',
});

const CATEGORIAS_INGRESO_VALIDAS = new Set(CATEGORIAS_INGRESO.map(({ id }) => id));
const CATEGORIAS_EGRESO_VALIDAS = new Set(CATEGORIAS_EGRESO.map(({ id }) => id));

function esCategoriaValida(tipo, categoria) {
  if (tipo === 'ingreso') {
    return CATEGORIAS_INGRESO_VALIDAS.has(categoria);
  }
  if (tipo === 'egreso') {
    return CATEGORIAS_EGRESO_VALIDAS.has(categoria);
  }
  return tipo.startsWith('transferencia_') && categoria === 'transferencias';
}

const repositorioBaseMovimientos = crearRepositorio({
  tabla: 'movimientos',
  campos: [
    'deposito_id',
    'categoria',
    'recurrencia_id',
    'transferencia_id',
    'tipo',
    'monto',
    'descripcion',
    'fecha_hora',
    'anulado',
    'reversion_de_id',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['categoria', 'descripcion'],
  camposFiltrables: [
    'deposito_id',
    'categoria',
    'recurrencia_id',
    'transferencia_id',
    'tipo',
    'anulado',
    'reversion_de_id',
  ],
  camposOrdenables: ['fecha_hora', 'tipo', 'categoria', 'monto', 'fecha_creacion'],
  ordenPredeterminado: 'fecha_hora',
});

function obtenerMarcaTemporal(fecha) {
  const marcaTemporal = typeof fecha === 'string' ? Date.parse(fecha) : NaN;
  if (!Number.isFinite(marcaTemporal)) {
    throw new ErrorBaseDatos('integridad');
  }
  return marcaTemporal;
}

async function consultarFechaCreacionDeposito(depositoId, conexion) {
  const deposito = await conexion.getFirstAsync(
    'SELECT fecha_creacion FROM depositos WHERE id = ?;',
    [depositoId],
  );
  if (!deposito) {
    throw new ErrorBaseDatos('integridad');
  }
  obtenerMarcaTemporal(deposito.fecha_creacion);
  return deposito.fecha_creacion;
}

async function consultarFechaMovimientoEfectiva(movimiento, conexion) {
  if (movimiento.reversion_de_id) {
    const movimientoOriginal = await conexion.getFirstAsync(
      'SELECT fecha_hora FROM movimientos WHERE id = ?;',
      [movimiento.reversion_de_id],
    );
    if (!movimientoOriginal) {
      throw new ErrorBaseDatos('integridad');
    }
    return movimientoOriginal.fecha_hora;
  }

  if (movimiento.transferencia_id) {
    const transferencia = await conexion.getFirstAsync(
      'SELECT reversion_de_id FROM transferencias WHERE id = ?;',
      [movimiento.transferencia_id],
    );
    if (!transferencia) {
      throw new ErrorBaseDatos('integridad');
    }
    if (transferencia.reversion_de_id) {
      const transferenciaOriginal = await conexion.getFirstAsync(
        'SELECT fecha_hora FROM transferencias WHERE id = ?;',
        [transferencia.reversion_de_id],
      );
      if (!transferenciaOriginal) {
        throw new ErrorBaseDatos('integridad');
      }
      return transferenciaOriginal.fecha_hora;
    }
  }

  return movimiento.fecha_hora;
}

function calcularImpactoSaldo(
  movimiento,
  fechaCreacionDeposito,
  fechaMovimientoEfectiva,
) {
  if (Number(movimiento.anulado) === 1) {
    return 0;
  }

  const monto = Number(movimiento.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new ErrorBaseDatos('integridad');
  }

  if (
    obtenerMarcaTemporal(fechaMovimientoEfectiva) <
    obtenerMarcaTemporal(fechaCreacionDeposito)
  ) {
    return 0;
  }

  if (movimiento.tipo === 'ingreso' || movimiento.tipo === 'transferencia_entrada') {
    return monto;
  }
  if (movimiento.tipo === 'egreso' || movimiento.tipo === 'transferencia_salida') {
    return -monto;
  }

  throw new ErrorBaseDatos('integridad');
}

function ejecutarEnTransaccion(operacion, conexion) {
  return conexion ? operacion(conexion) : ejecutarTransaccion(operacion);
}

async function crearEnTransaccion(datos, conexion) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ErrorBaseDatos('integridad');
  }

  const monto = Number(datos.monto);
  if (
    !Number.isFinite(monto) ||
    monto <= 0 ||
    !TIPOS_MOVIMIENTO.includes(datos.tipo) ||
    !esCategoriaValida(datos.tipo, datos.categoria)
  ) {
    throw new ErrorBaseDatos('integridad');
  }

  const movimiento = await repositorioBaseMovimientos.crear({ ...datos, monto }, conexion);
  const fechaCreacionDeposito = await consultarFechaCreacionDeposito(
    movimiento.deposito_id,
    conexion,
  );
  const fechaMovimientoEfectiva = await consultarFechaMovimientoEfectiva(
    movimiento,
    conexion,
  );
  await ajustarSaldoActual(
    movimiento.deposito_id,
    calcularImpactoSaldo(movimiento, fechaCreacionDeposito, fechaMovimientoEfectiva),
    conexion,
  );
  return movimiento;
}

async function crear(datos, conexion = null) {
  return ejecutarConManejoDeErrores('escritura', () =>
    ejecutarEnTransaccion((baseDatos) => crearEnTransaccion(datos, baseDatos), conexion),
  );
}

async function actualizar(id, cambios, conexion = null) {
  return ejecutarConManejoDeErrores('escritura', async () => {
    if (!cambios || typeof cambios !== 'object' || Array.isArray(cambios)) {
      throw new ErrorBaseDatos('integridad');
    }
    if (
      Object.prototype.hasOwnProperty.call(cambios, 'anulado') ||
      Object.prototype.hasOwnProperty.call(cambios, 'transferencia_id') ||
      Object.prototype.hasOwnProperty.call(cambios, 'reversion_de_id')
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    return ejecutarEnTransaccion(async (baseDatos) => {
      const movimientoAnterior = await repositorioBaseMovimientos.consultarPorId(id, baseDatos);
      if (!movimientoAnterior) {
        return null;
      }
      if (movimientoAnterior.transferencia_id || movimientoAnterior.reversion_de_id) {
        throw new ErrorBaseDatos('integridad');
      }

      const reversoExistente = await baseDatos.getFirstAsync(
        'SELECT id FROM movimientos WHERE reversion_de_id = ?;',
        [id],
      );
      if (reversoExistente) {
        throw new ErrorBaseDatos('integridad');
      }

      const datosActualizados = { ...cambios };
      if (datosActualizados.monto !== undefined) {
        datosActualizados.monto = Number(datosActualizados.monto);
        if (!Number.isFinite(datosActualizados.monto) || datosActualizados.monto <= 0) {
          throw new ErrorBaseDatos('integridad');
        }
      }
      if (datosActualizados.tipo !== undefined && !TIPOS_MOVIMIENTO.includes(datosActualizados.tipo)) {
        throw new ErrorBaseDatos('integridad');
      }
      if (datosActualizados.tipo?.startsWith('transferencia_')) {
        throw new ErrorBaseDatos('integridad');
      }
      const tipoNuevo = datosActualizados.tipo === undefined
        ? movimientoAnterior.tipo
        : datosActualizados.tipo;
      const categoriaNueva = datosActualizados.categoria === undefined
        ? movimientoAnterior.categoria
        : datosActualizados.categoria;
      if (!esCategoriaValida(tipoNuevo, categoriaNueva)) {
        throw new ErrorBaseDatos('integridad');
      }

      const movimientoActualizado = await repositorioBaseMovimientos.actualizar(
        id,
        datosActualizados,
        baseDatos,
      );
      if (!movimientoActualizado) {
        return null;
      }

      const fechaCreacionDepositoAnterior = await consultarFechaCreacionDeposito(
        movimientoAnterior.deposito_id,
        baseDatos,
      );
      const fechaCreacionDepositoActualizado = await consultarFechaCreacionDeposito(
        movimientoActualizado.deposito_id,
        baseDatos,
      );

      await ajustarSaldoActual(
        movimientoAnterior.deposito_id,
        -calcularImpactoSaldo(
          movimientoAnterior,
          fechaCreacionDepositoAnterior,
          movimientoAnterior.fecha_hora,
        ),
        baseDatos,
      );
      await ajustarSaldoActual(
        movimientoActualizado.deposito_id,
        calcularImpactoSaldo(
          movimientoActualizado,
          fechaCreacionDepositoActualizado,
          movimientoActualizado.fecha_hora,
        ),
        baseDatos,
      );
      return movimientoActualizado;
    }, conexion);
  });
}

async function eliminar(id, conexion = null) {
  return ejecutarConManejoDeErrores('escritura', async () =>
    ejecutarEnTransaccion(async (baseDatos) => {
      const movimiento = await repositorioBaseMovimientos.consultarPorId(id, baseDatos);
      if (!movimiento) {
        return false;
      }
      if (movimiento.transferencia_id || Number(movimiento.anulado) === 1) {
        throw new ErrorBaseDatos('integridad');
      }

      const reversoExistente = await baseDatos.getFirstAsync(
        'SELECT id FROM movimientos WHERE reversion_de_id = ?;',
        [id],
      );
      if (reversoExistente) {
        return false;
      }

      const tipoInverso = TIPOS_INVERSOS[movimiento.tipo];
      if (!tipoInverso) {
        throw new ErrorBaseDatos('integridad');
      }

      await crearEnTransaccion({
        deposito_id: movimiento.deposito_id,
        categoria: CATEGORIAS_INVERSAS[movimiento.tipo],
        tipo: tipoInverso,
        monto: movimiento.monto,
        descripcion: `Reversión de movimiento: ${movimiento.descripcion || movimiento.id}`,
        fecha_hora: new Date().toISOString(),
        reversion_de_id: movimiento.id,
      }, baseDatos);

      return true;
    }, conexion),
  );
}

export const movimientosRepositorio = Object.freeze({
  ...repositorioBaseMovimientos,
  crear,
  actualizar,
  eliminar,
});
