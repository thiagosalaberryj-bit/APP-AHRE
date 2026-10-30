import { normalizarNombrePersona } from './socialHelpers';
import { convertirMontoMovimiento } from '../utils/movementValidation';
import { ErrorBaseDatos } from '../database/errors';

class ErrorSocial extends ErrorBaseDatos {
  constructor(mensaje) { super('integridad'); this.message = mensaje; this.name = 'ErrorSocial'; }
}

export function exigir(condicion, mensaje) {
  if (!condicion) throw new ErrorSocial(mensaje);
}

export function centavos(valor) {
  exigir(typeof valor !== 'number' || Math.abs(valor * 100 - Math.round(valor * 100)) < 0.00001, 'El importe admite hasta dos decimales.');
  const monto = convertirMontoMovimiento(valor);
  exigir(monto !== null && monto <= 999999999999.99, 'Ingresá un importe válido, mayor que cero y con hasta dos decimales.');
  return Math.round(monto * 100);
}

export const unidades = valor => Math.round(Number(valor || 0) * 100);
export const sumaPagos = pagos => pagos.filter(p => p.estado === 'vigente' && p.clase !== 'origen_deuda').reduce((total, p) => total + unidades(p.monto), 0);
export const textoSocial = valor => String(valor || '').trim().replace(/\s+/g, ' ');

export function validarPersona(datos) {
  const nombre = textoSocial(datos.nombre), apellido = textoSocial(datos.apellido), apodo = textoSocial(datos.apodo);
  exigir(nombre && apellido && apodo && apodo.length <= 20 && nombre.length <= 80 && apellido.length <= 80,
    'Completá nombre, apellido y un apodo de hasta 20 caracteres.');
  return { nombre, apellido, apodo, nombre_normalizado: normalizarNombrePersona(nombre), apellido_normalizado: normalizarNombrePersona(apellido), apodo_normalizado: normalizarNombrePersona(apodo) };
}

export function repartirGasto(datos, personasIds) {
  const total = centavos(datos.monto);
  exigir(['iguales', 'manual'].includes(datos.reparto), 'Elegí cómo se reparte el ítem.');
  exigir(Array.isArray(datos.involucradas) && datos.involucradas.length > 0 && new Set(datos.involucradas).size === datos.involucradas.length,
    'Elegí al menos una persona para el reparto, sin repeticiones.');
  exigir(datos.involucradas.every(id => personasIds.includes(id)), 'Una persona del reparto ya no está disponible.');
  const base = Math.floor(total / datos.involucradas.length), resto = total % datos.involucradas.length;
  const partes = datos.involucradas.map((personaId, orden) => ({ personaId, orden,
    centavos: datos.reparto === 'iguales' ? base + (orden < resto ? 1 : 0) : centavos(datos.montosManuales?.[personaId]),
  }));
  exigir(partes.every(p => p.centavos > 0) && partes.reduce((s, p) => s + p.centavos, 0) === total, 'Las partes deben ser positivas y sumar exactamente el importe del ítem.');
  return { total, partes };
}
