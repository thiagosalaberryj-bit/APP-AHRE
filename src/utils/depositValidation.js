import { TIPOS_DEPOSITO, ICONOS_DEPOSITO } from '../constants/deposits';
import { COLOR_DEPOSITO_PREDETERMINADO, COLORES_DEPOSITOS } from '../styles/colors';

const LONGITUD_MAXIMA_NOMBRE = 30;
const LONGITUD_MAXIMA_DESCRIPCION = 60;
const PATRON_SALDO_LOCAL = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/;

export function convertirSaldoInicial(valor) {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor) || valor < 0) return null;
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  if (typeof valor !== 'string') return null;
  const saldoSinEspacios = valor.trim();
  if (!PATRON_SALDO_LOCAL.test(saldoSinEspacios)) return null;

  const saldoNormalizado = saldoSinEspacios.replace(/\./g, '').replace(',', '.');
  const saldoNumerico = Number(saldoNormalizado);
  if (!Number.isFinite(saldoNumerico) || saldoNumerico < 0) return null;

  return Math.round((saldoNumerico + Number.EPSILON) * 100) / 100;
}

export function validarDatosDeposito(datos) {
  const errores = {};
  const valores = datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : {};
  const nombre = typeof valores.nombre === 'string' ? valores.nombre.trim() : '';
  const descripcion = valores.descripcion;
  const tipoValido = TIPOS_DEPOSITO.some((tipo) => tipo.id === valores.tipo);
  const iconoValido = ICONOS_DEPOSITO.some((opcion) => opcion.id === valores.icono);
  const colorNoSeleccionado = valores.color === null || valores.color === undefined || valores.color === '';

  if (!nombre) {
    errores.nombre = 'Ingresá el nombre del depósito.';
  } else if (nombre.length > LONGITUD_MAXIMA_NOMBRE) {
    errores.nombre = `El nombre puede tener hasta ${LONGITUD_MAXIMA_NOMBRE} caracteres.`;
  }

  if (convertirSaldoInicial(valores.saldo_inicial) === null) {
    errores.saldo_inicial = 'Ingresá un saldo válido igual o mayor a $ 0.';
  }

  if (!tipoValido) {
    errores.tipo = 'Elegí un tipo de depósito válido.';
  }

  if (!iconoValido) {
    errores.icono = 'Elegí un ícono válido.';
  }

  if (!colorNoSeleccionado && !COLORES_DEPOSITOS.includes(valores.color)) {
    errores.color = 'Elegí un color disponible.';
  }

  if (descripcion !== null && descripcion !== undefined && typeof descripcion !== 'string') {
    errores.descripcion = 'Ingresá una descripción válida.';
  } else if (typeof descripcion === 'string' && descripcion.trim().length > LONGITUD_MAXIMA_DESCRIPCION) {
    errores.descripcion = `La descripción puede tener hasta ${LONGITUD_MAXIMA_DESCRIPCION} caracteres.`;
  }

  return errores;
}

export function resolverColorDeposito(color) {
  return color || COLOR_DEPOSITO_PREDETERMINADO;
}
