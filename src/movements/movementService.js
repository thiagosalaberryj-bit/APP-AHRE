import { obtenerSesionActual } from '../authentication/sessionService';
import { ErrorBaseDatos } from '../database/errors';
import { ejecutarTransaccion } from '../database/transactions';
import {
  categoriasRepositorio,
  depositosRepositorio,
  movimientosRepositorio,
  recurrenciasRepositorio,
} from '../database/repositories';
import {
  combinarFechaYHora,
  convertirMontoMovimiento,
  validarDatosMovimiento,
} from '../utils/movementValidation';

const TIPOS_MOVIMIENTO_REGISTRABLES = Object.freeze(['ingreso', 'egreso']);

const MENSAJES_ERROR = Object.freeze({
  datos_invalidos: 'Revisá los campos marcados antes de guardar el movimiento.',
  sesion_no_disponible: 'No se encontró una sesión local activa. Iniciá sesión e intentá nuevamente.',
  deposito_no_disponible: 'El depósito seleccionado ya no está disponible. Elegí otro depósito.',
  categoria_no_disponible: 'La categoría seleccionada ya no está disponible. Elegí otra categoría.',
  tipo_no_disponible: 'No se pudo identificar el tipo de movimiento.',
});

export class ErrorMovimiento extends Error {
  constructor(codigo, errores = null) {
    super(MENSAJES_ERROR[codigo] || MENSAJES_ERROR.datos_invalidos);
    this.name = 'ErrorMovimiento';
    this.codigo = codigo;
    this.errores = errores;
  }
}

function validarTipoMovimiento(tipo) {
  if (!TIPOS_MOVIMIENTO_REGISTRABLES.includes(tipo)) {
    throw new ErrorMovimiento('tipo_no_disponible');
  }
}

function formatearSaldo(saldo) {
  const saldoNumerico = Number(saldo);
  if (!Number.isFinite(saldoNumerico)) return 'Saldo actual no disponible';

  return `Saldo actual: $${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(saldoNumerico)}`;
}

function prepararDeposito(deposito) {
  return {
    ...deposito,
    saldoTexto: formatearSaldo(deposito.saldo_actual),
  };
}

export async function cargarDatosMovimiento(tipo) {
  validarTipoMovimiento(tipo);
  const { usuario } = await obtenerSesionActual();
  if (!usuario) {
    throw new ErrorMovimiento('sesion_no_disponible');
  }

  const [depositos, categorias] = await Promise.all([
    depositosRepositorio.consultar(
      { usuario_id: usuario.id, activo: 1 },
      { ordenarPor: 'fecha_creacion', direccion: 'ASC' },
    ),
    Promise.resolve(categoriasRepositorio.consultar(tipo)),
  ]);

  return {
    usuario,
    depositos: depositos.map(prepararDeposito),
    categorias,
  };
}

async function consultarDepositoDisponible(usuarioId, depositoId, baseDatos) {
  const deposito = await depositosRepositorio.consultarPorId(depositoId, baseDatos);
  if (
    !deposito ||
    deposito.usuario_id !== usuarioId ||
    Number(deposito.activo) !== 1
  ) {
    throw new ErrorMovimiento('deposito_no_disponible');
  }

  return deposito;
}

function consultarCategoriaDisponible(categoriaId, tipo) {
  const categoria = categoriasRepositorio
    .consultar(tipo)
    .find((opcion) => opcion.id === categoriaId);

  if (!categoria) {
    throw new ErrorMovimiento('categoria_no_disponible');
  }

  return categoria;
}

export async function crearMovimiento(datos, tipo) {
  validarTipoMovimiento(tipo);
  const errores = validarDatosMovimiento(datos, tipo);
  if (Object.keys(errores).length > 0) {
    throw new ErrorMovimiento('datos_invalidos', errores);
  }

  const { usuario } = await obtenerSesionActual();
  if (!usuario) {
    throw new ErrorMovimiento('sesion_no_disponible');
  }

  const monto = convertirMontoMovimiento(datos.monto);
  const descripcion = datos.descripcion.trim();
  const fechaHora = combinarFechaYHora(datos.fecha, datos.hora);

  if (monto === null || !fechaHora) {
    throw new ErrorMovimiento('datos_invalidos', validarDatosMovimiento(datos, tipo));
  }

  try {
    return await ejecutarTransaccion(async (baseDatos) => {
      const deposito = await consultarDepositoDisponible(
        usuario.id,
        datos.deposito_id,
        baseDatos,
      );
      const categoria = consultarCategoriaDisponible(datos.categoria, tipo);
      let recurrenciaId = null;

      if (datos.recurrente) {
        const recurrencia = await recurrenciasRepositorio.crear({
          deposito_id: deposito.id,
          categoria: categoria.id,
          tipo,
          monto,
          descripcion,
          frecuencia: datos.frecuencia,
          fecha_inicio: fechaHora,
          fecha_fin: null,
          proxima_ejecucion: fechaHora,
          activa: 1,
        }, baseDatos);
        recurrenciaId = recurrencia.id;
      }

      return movimientosRepositorio.crear({
        deposito_id: deposito.id,
        categoria: categoria.id,
        recurrencia_id: recurrenciaId,
        transferencia_id: null,
        tipo,
        monto,
        descripcion,
        fecha_hora: fechaHora,
        anulado: 0,
        reversion_de_id: null,
      }, baseDatos);
    });
  } catch (error) {
    if (error instanceof ErrorMovimiento) throw error;
    if (error instanceof ErrorBaseDatos) throw error;
    throw new ErrorBaseDatos('transaccion');
  }
}
