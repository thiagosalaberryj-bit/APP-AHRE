export function normalizarNombrePersona(nombre: string) {
  return String(nombre || '').trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}
export function nombreCompletoPersona(persona: {nombre?:string;apellido?:string|null;apodo?:string|null} | null | undefined) {
  return [persona?.nombre, persona?.apellido].filter(Boolean).join(' ');
}

export const formatearMontoSocial = (monto: number) => `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(monto || 0)}`;
export const montoParaEntrada = (monto: number) => Number(monto || 0).toFixed(2).replace(/\.00$/, '').replace('.', ',');
