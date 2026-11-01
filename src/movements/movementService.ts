import type { Conexion } from '../database/types';
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
import { DatosMovimiento } from '../types/forms';

const TIPOS_MOVIMIENTO_REGISTRABLES = Object.freeze(['ingreso', 'egreso']);

const MENSAJES_ERROR: Readonly<Record<string, string>> = Object.freeze({
  datos_invalidos: 'Revisá los campos marcados antes de guardar el movimiento.',
  sesion_no_disponible: 'No se encontró una sesión local activa. Iniciá sesión e intentá nuevamente.',
  deposito_no_disponible: 'El depósito seleccionado ya no está disponible. Elegí otro depósito.',
  categoria_no_disponible: 'La categoría seleccionada ya no está disponible. Elegí otra categoría.',
  tipo_no_disponible: 'No se pudo identificar el tipo de movimiento.',
});

export interface ErrorMovimiento {
  codigo: string;
  errores: Record<string, string> | null;
}

export class ErrorMovimiento extends Error {

  constructor(codigo: string, errores: Record<string,string> | null = null) {
    super(MENSAJES_ERROR[codigo] || MENSAJES_ERROR.datos_invalidos);
    this.name = 'ErrorMovimiento';
    this.codigo = codigo;
    this.errores = errores;
  }
}

function validarTipoMovimiento(tipo: string) {
  if (!TIPOS_MOVIMIENTO_REGISTRABLES.includes(tipo)) {
    throw new ErrorMovimiento('tipo_no_disponible');
  }
}

function formatearSaldo(saldo: number) {
  const saldoNumerico = Number(saldo);
  if (!Number.isFinite(saldoNumerico)) return 'Saldo actual no disponible';

  return `Saldo actual: $${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(saldoNumerico)}`;
}

function prepararDeposito(deposito: import('../database/types').Deposito) {
  return {
    ...deposito,
    saldoTexto: formatearSaldo(deposito.saldo_actual),
  };
}

export async function cargarDatosMovimiento(tipo: string) {
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

async function consultarUsuarioHistorial(usuarioId: string | null = null) {
  const { usuario } = await obtenerSesionActual();
  if (!usuario || (usuarioId && usuario.id !== usuarioId)) {
    throw new ErrorMovimiento('sesion_no_disponible');
  }
  return usuario;
}

export async function cargarOpcionesHistorialMovimientos() {
  const usuario = await consultarUsuarioHistorial();
  const opciones = await movimientosRepositorio.consultarOpcionesHistorial(usuario.id);
  return { usuarioId: usuario.id, ...opciones };
}

export async function cargarPaginaHistorialMovimientos(usuarioId: string, filtros: import('../types/forms').FiltrosHistorial, cursor: {fecha_hora:string;id:string}|null = null) {
  await consultarUsuarioHistorial(usuarioId);
  return movimientosRepositorio.consultarHistorial(
    usuarioId,
    filtros,
    { limite: 50, cursor },
  );
}

export async function consultarDetalleHistorialMovimiento(movimientoId: string) {
  const usuario = await consultarUsuarioHistorial();
  return movimientosRepositorio.consultarHistorialPorId(usuario.id, movimientoId);
}

async function consultarDepositoDisponible(usuarioId: string, depositoId: string | null, baseDatos: Conexion) {
  const deposito = await depositosRepositorio.consultarPorId(depositoId!, baseDatos);
  if (
    !deposito ||
    deposito.usuario_id !== usuarioId ||
    Number(deposito.activo) !== 1
  ) {
    throw new ErrorMovimiento('deposito_no_disponible');
  }

  return deposito;
}

function consultarCategoriaDisponible(categoriaId: string | null, tipo: string) {
  const categoria = categoriasRepositorio
    .consultar(tipo)
    .find((opcion) => opcion.id === categoriaId);

  if (!categoria) {
    throw new ErrorMovimiento('categoria_no_disponible');
  }

  return categoria;
}

export async function crearMovimiento(datos: import('../types/forms').DatosMovimiento, tipo: 'ingreso' | 'egreso') {
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
      let recurrenciaId: string | null = null;

      if (datos.recurrente) {
        const recurrencia = await recurrenciasRepositorio.crear({
          deposito_id: deposito.id,
          categoria: categoria.id,
          tipo: tipo as "ingreso" | "egreso",
          monto,
          descripcion,
          frecuencia: datos.frecuencia as import('../database/types').Recurrencia['frecuencia'],
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
