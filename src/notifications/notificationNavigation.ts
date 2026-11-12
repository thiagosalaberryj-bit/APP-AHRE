import { RUTAS } from '../constants/routes';
import type { NavegacionRaiz } from '../navigation/types';
import type { DestinoAviso } from './types';
export function esDestinoAviso(valor: unknown): valor is DestinoAviso {
  if (!valor || typeof valor !== 'object') return false;
  const destino = valor as Record<string, unknown>;
  return ['movimientos', 'deuda', 'recurrencia', 'sala', 'estadisticas', 'mercado_pago', 'personas'].includes(String(destino.tipo))
    && ['id', 'depositoId'].every(clave => destino[clave] === undefined || typeof destino[clave] === 'string' && String(destino[clave]).length <= 200)
    && (destino.seccion === undefined || ['gastos', 'participantes', 'balances'].includes(String(destino.seccion)));
}
export function navegarAviso(navegacion: Pick<NavegacionRaiz, 'navigate'>, destino: DestinoAviso) {
  if (!esDestinoAviso(destino)) { navegacion.navigate(RUTAS.NOTIFICACIONES); return; }
  if (destino.tipo === 'mercado_pago') navegacion.navigate(RUTAS.MERCADO_PAGO, { depositoId: destino.depositoId });
  else if (destino.tipo === 'deuda' && destino.id) navegacion.navigate(RUTAS.REGISTRO_SOCIAL, { tipo: 'detalleDeuda', deudaId: destino.id });
  else if (destino.tipo === 'sala' && destino.id) navegacion.navigate(RUTAS.SALA_SOCIAL, { salaId: destino.id, seccionSala: destino.seccion || 'gastos' });
  else if (destino.tipo === 'recurrencia' && destino.depositoId) navegacion.navigate(RUTAS.DETALLE_DEPOSITO, { depositoId: destino.depositoId, seccionDeposito: 'recurrentes' });
  else if (destino.tipo === 'estadisticas') navegacion.navigate(RUTAS.PRINCIPAL, { screen: RUTAS.ESTADISTICAS });
  else if (destino.tipo === 'personas') navegacion.navigate(RUTAS.PERSONAS_SOCIAL, { todas: true });
  else navegacion.navigate(RUTAS.PRINCIPAL, { screen: RUTAS.MOVIMIENTOS });
}
