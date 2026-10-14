import { TIPOS_DEPOSITO } from '../constants/deposits';
import { depositosRepositorio } from '../database/repositories/depositsRepository';
import { movimientosRepositorio } from '../database/repositories/movementsRepository';
import { obtenerSesionActual } from '../authentication/sessionService';
import {
  convertirSaldoInicial,
  resolverColorDeposito,
  validarDatosDeposito,
  validarDatosEdicionDeposito,
} from '../utils/depositValidation';

const MENSAJES_ERROR = Object.freeze({
  datos_invalidos: 'Revisá los campos marcados antes de continuar.',
  sesion_no_disponible: 'No se encontró una sesión local activa. Iniciá sesión e intentá nuevamente.',
  deposito_no_encontrado: 'No se encontró el depósito solicitado.',
});

export class ErrorDeposito extends Error {
  constructor(codigo, errores = null) {
    super(MENSAJES_ERROR[codigo] || MENSAJES_ERROR.datos_invalidos);
    this.name = 'ErrorDeposito';
    this.codigo = codigo;
    this.errores = errores;
  }
}

function generarDescripcionAutomatica(nombre, tipoId) {
  const tipo = TIPOS_DEPOSITO.find((opcion) => opcion.id === tipoId);
  return `Fuente «${nombre}» · ${tipo.nombre}`;
}

function calcularImpactoMovimiento(movimiento) {
  const monto = Number(movimiento.monto);
  if (!Number.isFinite(monto)) return 0;
  if (movimiento.tipo === 'ingreso' || movimiento.tipo === 'transferencia_entrada') return monto;
  if (movimiento.tipo === 'egreso' || movimiento.tipo === 'transferencia_salida') return -monto;
  return 0;
}

function calcularComparacionMensual(deposito, movimientos, historialSaldos) {
  const ahora = new Date();
  const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const fechaCierreAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
  const etiquetaFechaCierre = `${fechaCierreAnterior.getDate()}/${fechaCierreAnterior.getMonth() + 1}`;
  const fechaCreacion = new Date(deposito.fecha_creacion);

  if (!Number.isFinite(fechaCreacion.getTime()) || fechaCreacion >= inicioMesActual) {
    return {
      disponible: false,
      motivo: 'sin_cierre_anterior',
      fechaReferencia: etiquetaFechaCierre,
    };
  }

  const impactoMovimientos = movimientos.reduce((total, movimiento) => {
    const fecha = new Date(movimiento.fecha_hora);
    return Number.isFinite(fecha.getTime()) && fecha >= inicioMesActual
      ? total + calcularImpactoMovimiento(movimiento)
      : total;
  }, 0);
  const impactoAjustes = historialSaldos.reduce((total, ajuste) => {
    const fecha = new Date(ajuste.fecha_hora);
    const anterior = Number(ajuste.saldo_anterior);
    const informado = Number(ajuste.saldo_informado);
    return Number.isFinite(fecha.getTime())
      && fecha >= inicioMesActual
      && Number.isFinite(anterior)
      && Number.isFinite(informado)
      ? total + informado - anterior
      : total;
  }, 0);
  const saldoActual = Number(deposito.saldo_actual);
  const saldoAnterior = Number((saldoActual - impactoMovimientos - impactoAjustes).toFixed(2));
  const diferencia = Number((saldoActual - saldoAnterior).toFixed(2));

  if (!Number.isFinite(saldoAnterior) || !Number.isFinite(diferencia)) {
    return { disponible: false, motivo: 'sin_datos', fechaReferencia: etiquetaFechaCierre };
  }

  return {
    disponible: true,
    fechaReferencia: etiquetaFechaCierre,
    saldoAnterior,
    diferencia,
    porcentaje: saldoAnterior > 0 ? (diferencia / saldoAnterior) * 100 : null,
  };
}

async function consultarDepositoPropioActivo(depositoId) {
  const { usuario } = await obtenerSesionActual();
  if (!usuario) {
    throw new ErrorDeposito('sesion_no_disponible');
  }

  const deposito = await depositosRepositorio.consultarPorId(depositoId);
  if (
    !deposito
    || deposito.usuario_id !== usuario.id
    || Number(deposito.activo) !== 1
  ) {
    throw new ErrorDeposito('deposito_no_encontrado');
  }

  return deposito;
}

export async function crearDeposito(datos) {
  const errores = validarDatosDeposito(datos);
  if (Object.keys(errores).length > 0) {
    throw new ErrorDeposito('datos_invalidos', errores);
  }

  const { usuario } = await obtenerSesionActual();
  if (!usuario) {
    throw new ErrorDeposito('sesion_no_disponible');
  }

  const nombre = datos.nombre.trim();
  const descripcionIngresada = typeof datos.descripcion === 'string'
    ? datos.descripcion.trim()
    : '';

  return depositosRepositorio.crear({
    usuario_id: usuario.id,
    nombre,
    tipo: datos.tipo,
    saldo_inicial: convertirSaldoInicial(datos.saldo_inicial),
    icono: datos.icono,
    color: resolverColorDeposito(datos.color),
    descripcion: descripcionIngresada || generarDescripcionAutomatica(nombre, datos.tipo),
    activo: 1,
  });
}

export async function consultarDetalleDeposito(depositoId) {
  if (typeof depositoId !== 'string' || !depositoId.trim()) {
    throw new ErrorDeposito('deposito_no_encontrado');
  }

  const deposito = await consultarDepositoPropioActivo(depositoId);
  const movimientos = await movimientosRepositorio.consultar(
    { deposito_id: deposito.id, anulado: 0 },
    { ordenarPor: 'fecha_hora', direccion: 'DESC' },
  );
  const historialSaldos = await depositosRepositorio.consultarHistorialSaldos(deposito.id);

  return {
    deposito,
    movimientos,
    comparacionMensual: calcularComparacionMensual(deposito, movimientos, historialSaldos),
  };
}

export async function actualizarDeposito(depositoId, datos) {
  const errores = validarDatosEdicionDeposito(datos);
  if (Object.keys(errores).length > 0) {
    throw new ErrorDeposito('datos_invalidos', errores);
  }

  const deposito = await consultarDepositoPropioActivo(depositoId);
  const nombre = datos.nombre.trim();
  const descripcionIngresada = typeof datos.descripcion === 'string'
    ? datos.descripcion.trim()
    : '';

  const actualizado = await depositosRepositorio.actualizar(deposito.id, {
    nombre,
    tipo: datos.tipo,
    icono: datos.icono,
    color: resolverColorDeposito(datos.color),
    descripcion: descripcionIngresada || generarDescripcionAutomatica(nombre, datos.tipo),
  });

  if (!actualizado) {
    throw new ErrorDeposito('deposito_no_encontrado');
  }

  return actualizado;
}

export async function eliminarDeposito(depositoId) {
  const deposito = await consultarDepositoPropioActivo(depositoId);
  const eliminado = await depositosRepositorio.eliminar(deposito.id);
  if (!eliminado) {
    throw new ErrorDeposito('deposito_no_encontrado');
  }
  return true;
}
