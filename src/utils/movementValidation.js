const PATRON_MONTO_LOCAL = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/;
const PATRON_HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const LONGITUD_MAXIMA_DESCRIPCION = 500;

export const FRECUENCIAS_MOVIMIENTO = Object.freeze([
  'diaria',
  'semanal',
  'mensual',
  'anual',
]);

export function convertirMontoMovimiento(valor) {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor) || valor <= 0) return null;
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  if (typeof valor !== 'string') return null;
  const montoNormalizado = valor.trim();
  if (!PATRON_MONTO_LOCAL.test(montoNormalizado)) return null;

  const montoNumerico = Number(montoNormalizado.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) return null;

  return Math.round((montoNumerico + Number.EPSILON) * 100) / 100;
}

export function combinarFechaYHora(fecha, hora) {
  const fechaMovimiento = fecha instanceof Date ? new Date(fecha) : new Date(fecha);
  if (Number.isNaN(fechaMovimiento.getTime()) || typeof hora !== 'string' || !PATRON_HORA.test(hora)) {
    return null;
  }

  const [horas, minutos] = hora.split(':').map(Number);
  fechaMovimiento.setHours(horas, minutos, 0, 0);
  return fechaMovimiento.toISOString();
}

export function validarDatosIngreso(datos) {
  const errores = {};
  const valores = datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : {};
  const descripcion = typeof valores.descripcion === 'string' ? valores.descripcion.trim() : '';

  if (convertirMontoMovimiento(valores.monto) === null) {
    errores.monto = 'Ingresá un monto mayor que cero.';
  }

  if (!descripcion) {
    errores.descripcion = 'La descripción es obligatoria.';
  } else if (descripcion.length > LONGITUD_MAXIMA_DESCRIPCION) {
    errores.descripcion = `La descripción puede tener hasta ${LONGITUD_MAXIMA_DESCRIPCION} caracteres.`;
  }

  if (!valores.deposito_id) {
    errores.deposito_id = 'Seleccioná el depósito del ingreso.';
  }

  if (!valores.categoria) {
    errores.categoria = 'Seleccioná una categoría.';
  }

  if (!combinarFechaYHora(valores.fecha, valores.hora)) {
    errores.fecha_hora = 'Elegí una fecha y hora válidas.';
  }

  if (valores.recurrente && !FRECUENCIAS_MOVIMIENTO.includes(valores.frecuencia)) {
    errores.frecuencia = 'Elegí una frecuencia válida.';
  }

  return errores;
}
