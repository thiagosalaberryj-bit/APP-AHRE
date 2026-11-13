export const TIPOS_AVISO = ['registro', 'debo', 'me_deben', 'recurrencias', 'salas', 'mensual', 'mercado_pago', 'social', 'cuenta'] as const;
export type TipoAviso = typeof TIPOS_AVISO[number];
export const NOMBRES_AVISO: Record<TipoAviso, string> = {
  registro: 'Registrar movimientos', debo: 'Deudas que debo', me_deben: 'Deudas que me deben',
  recurrencias: 'Movimientos recurrentes', salas: 'Movimientos de salas pendientes', mensual: 'Revisión mensual',
  mercado_pago: 'Movimientos de Mercado Pago', social: 'Novedades de Social', cuenta: 'Vinculaciones y cuenta',
};
export interface DestinoAviso { tipo: 'movimientos' | 'deuda' | 'recurrencia' | 'sala' | 'estadisticas' | 'mercado_pago' | 'personas'; id?: string; depositoId?: string; seccion?: 'gastos' | 'participantes' | 'balances'; }
export interface Aviso { id: string; tipo: TipoAviso; titulo: string; mensaje: string; destino: DestinoAviso; fecha: string; vista: boolean; resuelta: boolean; obtenidos?: number; pendientes?: number; ocurrencia?: string; }
export interface AjusteAviso { activo: boolean; hora: string; anticipacion: number; }
export interface AjustesAvisos { zona: string; mostrarDetalles: boolean; tipos: Record<TipoAviso, AjusteAviso>; }
export function ajustesPredeterminados(): AjustesAvisos {
  return { zona: 'America/Argentina/Buenos_Aires', mostrarDetalles: false, tipos: Object.fromEntries(TIPOS_AVISO.map(tipo => [tipo, { activo: true, hora: ['registro', 'mercado_pago'].includes(tipo) ? '20:00' : tipo === 'mensual' ? '10:00' : '09:00', anticipacion: 1 }])) as AjustesAvisos['tipos'] };
}
export function validarAjustes(datos: AjustesAvisos) {
  try { new Intl.DateTimeFormat('es', { timeZone: datos.zona }).format(); } catch { throw new Error('Elegí una zona horaria válida, por ejemplo America/Argentina/Buenos_Aires.'); }
  for (const tipo of TIPOS_AVISO) {
    const fila = datos.tipos[tipo];
    if (!fila || typeof fila.activo !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(fila.hora) || !Number.isInteger(fila.anticipacion) || fila.anticipacion < 0 || fila.anticipacion > 30) throw new Error('Revisá la hora y la anticipación (0 a 30 días).');
  }
  return datos;
}
