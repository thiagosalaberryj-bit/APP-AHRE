import { TIPOS_DEPOSITO } from '../constants/deposits';
import { depositosRepositorio } from '../database/repositories/depositsRepository';
import { movimientosRepositorio } from '../database/repositories/movementsRepository';
import { obtenerSesionActual } from '../authentication/sessionService';
import { ejecutarTransaccion } from '../database/transactions';
import { desvincularEnConexion, ESTADO_MP_INICIAL } from '../mercadoPago/mercadoPagoService';
import { avisarIntegraciones, leerDato } from '../integrations/integrationStore';
import type { OperacionMp } from '../mercadoPago/types';
import {
  convertirSaldoInicial,
  resolverColorDeposito,
  validarDatosDeposito,
  validarDatosEdicionDeposito,
} from '../utils/depositValidation';

const MENSAJES_ERROR: Readonly<Record<string, string>> = Object.freeze({
  datos_invalidos: 'Revisá los campos marcados antes de continuar.',
  sesion_no_disponible: 'No se encontró una sesión local activa. Iniciá sesión e intentá nuevamente.',
  deposito_no_encontrado: 'No se encontró el depósito solicitado.',
});

export interface ErrorDeposito {
  codigo: string;
  errores: Record<string, string> | null;
}

export class ErrorDeposito extends Error {

  constructor(codigo: string, errores: Record<string,string> | null = null) {
    super(MENSAJES_ERROR[codigo] || MENSAJES_ERROR.datos_invalidos);
    this.name = 'ErrorDeposito';
    this.codigo = codigo;
    this.errores = errores;
  }
}

function generarDescripcionAutomatica(nombre: string, tipoId: string) {
  const tipo = TIPOS_DEPOSITO.find((opcion) => opcion.id === tipoId);
  return `Fuente «${nombre}» · ${tipo!.nombre}`;
}

function calcularComparacionMensual(deposito: import('../database/types').Deposito, impactoMovimientos: number, impactoAjustes: number) {
  const ahora = new Date();
  const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const fechaCierreAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
  const etiquetaFechaCierre = `${fechaCierreAnterior.getDate()}/${fechaCierreAnterior.getMonth() + 1}`;
  const fechaCreacion = new Date(deposito.fecha_creacion);

  if (!Number.isFinite(fechaCreacion.getTime()) || fechaCreacion >= inicioMesActual) {
    return {
      disponible: false as const,
      motivo: 'sin_cierre_anterior',
      fechaReferencia: etiquetaFechaCierre,
    };
  }

  const saldoActual = Number(deposito.saldo_actual);
  const saldoAnterior = Number((saldoActual - impactoMovimientos - impactoAjustes).toFixed(2));
  const diferencia = Number((saldoActual - saldoAnterior).toFixed(2));

  if (!Number.isFinite(saldoAnterior) || !Number.isFinite(diferencia)) {
    return { disponible: false as const, motivo: 'sin_datos', fechaReferencia: etiquetaFechaCierre };
  }

  return {
    disponible: true as const,
    fechaReferencia: etiquetaFechaCierre,
    saldoAnterior,
    diferencia,
    porcentaje: saldoAnterior > 0 ? (diferencia / saldoAnterior) * 100 : null,
  };
}

async function consultarDepositoPropioActivo(depositoId: string) {
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

export async function crearDeposito(datos: import('../types/forms').DatosDeposito) {
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
    tipo: datos.tipo as import('../database/types').Deposito['tipo'],
    saldo_inicial: convertirSaldoInicial(datos.saldo_inicial)!,
    icono: datos.icono,
    color: resolverColorDeposito(datos.color),
    descripcion: descripcionIngresada || generarDescripcionAutomatica(nombre, datos.tipo!),
    activo: 1,
  });
}

export async function consultarDetalleDeposito(depositoId: string) {
  if (typeof depositoId !== 'string' || !depositoId.trim()) {
    throw new ErrorDeposito('deposito_no_encontrado');
  }

  const deposito = await consultarDepositoPropioActivo(depositoId);
  const ahora = new Date();
  const resumen = await movimientosRepositorio.consultarResumenDeposito(deposito.id, new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString());
  const estadoMp = await leerDato(deposito.usuario_id, 'mp:estado', ESTADO_MP_INICIAL);
  const operacionesMp = estadoMp.vinculacion?.deposito_id === deposito.id ? await leerDato<OperacionMp[]>(deposito.usuario_id, 'mp:operaciones', []) : null;

  return {
    deposito,
    mercadoPago: operacionesMp ? { obtenidos: operacionesMp.length, pendientes: operacionesMp.filter(f => f.decision === 'pendiente' || f.revisionPendiente).length } : null,
    cantidadMovimientos: resumen.cantidad,
    categoriasMovimientos: resumen.categorias,
    comparacionMensual: calcularComparacionMensual(deposito, resumen.impactoMovimientos, resumen.impactoAjustes),
  };
}

export async function consultarPaginaMovimientosDeposito(depositoId: string, filtros: import('../types/forms').FiltrosHistorial = {}, cursor: {fecha_hora:string;id:string}|null = null) {
  const deposito = await consultarDepositoPropioActivo(depositoId);
  return movimientosRepositorio.consultarPaginaDeposito(deposito.usuario_id, deposito.id, filtros, cursor);
}

export async function consultarMesesMovimientosDeposito(depositoId: string, filtros: import('../types/forms').FiltrosHistorial) {
  const deposito = await consultarDepositoPropioActivo(depositoId);
  return movimientosRepositorio.consultarMesesHistorial(deposito.usuario_id, { ...filtros, depositoIds: [deposito.id] }, true);
}

export async function actualizarDeposito(depositoId: string, datos: import('../types/forms').DatosDeposito) {
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
    tipo: datos.tipo as import('../database/types').Deposito['tipo'],
    icono: datos.icono,
    color: resolverColorDeposito(datos.color),
    descripcion: descripcionIngresada || generarDescripcionAutomatica(nombre, datos.tipo!),
  });

  if (!actualizado) {
    throw new ErrorDeposito('deposito_no_encontrado');
  }

  return actualizado;
}

export async function eliminarDeposito(depositoId: string) {
  const deposito = await consultarDepositoPropioActivo(depositoId);
  const eliminado = await ejecutarTransaccion(async c => {
    await desvincularEnConexion(c, deposito.usuario_id, deposito.id);
    return depositosRepositorio.eliminar(deposito.id, c);
  });
  if (!eliminado) {
    throw new ErrorDeposito('deposito_no_encontrado');
  }
  avisarIntegraciones();
  return true;
}
