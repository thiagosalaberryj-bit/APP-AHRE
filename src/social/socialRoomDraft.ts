import type { PlanGasto, OperacionSocial, Financiacion } from './types';
import type { ContextoSocial } from './socialStore';
import type { GastoCompartido, Tablas } from '../database/types';
import { exigir } from './socialValidation';

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return Boolean(valor && typeof valor === 'object' && !Array.isArray(valor));
}

function esFinanciacion(valor: unknown): valor is Financiacion {
  return esObjeto(valor)
    && ['depositoId', 'movimientoId', 'fecha'].every(campo => valor[campo] == null || typeof valor[campo] === 'string')
    && (valor.depositoNombre === undefined || typeof valor.depositoNombre === 'string');
}

export function leerPlanGasto(gasto: {plan_pagos?: string | null}): PlanGasto {
  let plan: unknown;
  try { plan = JSON.parse(gasto.plan_pagos || '{}'); } catch { exigir(false, 'No se pudo leer el borrador del gasto. Volvé a editarlo.'); }
  exigir(esObjeto(plan), 'El borrador del gasto no es válido.');
  const pagaron = plan.pagaron ?? [], fondos = plan.financiaciones ?? {};
  exigir(Array.isArray(pagaron) && pagaron.every((id: unknown) => typeof id === 'string'), 'Revisá los pagos del borrador.');
  exigir(esObjeto(fondos), 'Revisá las asociaciones del borrador.');
  const financiaciones = Object.fromEntries(Object.entries(fondos).map(([clave, valor]) => {
    exigir(esFinanciacion(valor), 'Revisá las asociaciones del borrador.');
    return [clave, valor];
  }));
  return { pagaron, financiaciones };
}

export function operacionesGasto(gasto: import('./types').GastoBorradorPersistido, partes: Array<Pick<import('../database/types').ParticipanteGasto,'persona_id'|'monto_correspondiente'> & {id?: string}>, propiaId: string, plan: Pick<import('./types').PlanGasto,'pagaron'>) {
  const operaciones: OperacionSocial[] = [{ clave: 'compra', clase: 'compra', gasto_compartido_id: gasto.id, monto: gasto.monto_total,
    descripcion: `Compra: ${gasto.descripcion}`, tipoMovimiento: gasto.pagador_id === propiaId ? 'egreso' : null }];
  exigir(plan.pagaron.every(id => partes.some(p => p.persona_id === id)), 'Una persona marcada como pagada ya no está en el reparto.');
  for (const parte of partes.filter(p => p.persona_id !== gasto.pagador_id && plan.pagaron.includes(p.persona_id))) {
    operaciones.push({ clave: `parte:${parte.persona_id}`, clase: 'parte', participante_gasto_id: parte.id, monto: parte.monto_correspondiente,
      descripcion: `Parte: ${gasto.descripcion}`, tipoMovimiento: gasto.pagador_id === propiaId ? 'ingreso' : parte.persona_id === propiaId ? 'egreso' : null });
  }
  return operaciones;
}

export async function movimientosReservados(contexto: ContextoSocial, exceptoGastoId: string | null = null) {
  const gastos = await contexto.conexion.getAllAsync<Pick<Tablas['gastos_compartidos'], 'plan_pagos'>>(`SELECT g.plan_pagos FROM gastos_compartidos g JOIN salas s ON s.id = g.sala_id
    WHERE g.usuario_id = ? AND s.estado = 'abierta' AND g.estado = 'vigente' AND g.id <> ?;`, [contexto.usuario.id, exceptoGastoId || '']);
  return new Set(gastos.flatMap(g => Object.values(leerPlanGasto(g).financiaciones).map(f => f.movimientoId).filter(Boolean)));
}
