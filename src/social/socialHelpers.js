export function normalizarNombrePersona(nombre) {
  return String(nombre || '').trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}
export function nombreCompletoPersona(persona) {
  return [persona?.nombre, persona?.apellido].filter(Boolean).join(' ');
}

export const formatearMontoSocial = monto => `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(monto || 0)}`;
export const montoParaEntrada = monto => Number(monto || 0).toFixed(2).replace(/\.00$/, '').replace('.', ',');
