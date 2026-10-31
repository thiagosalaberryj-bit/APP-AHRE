import { exigir } from './socialValidation';

export function leerPlanGasto(gasto) {
  let plan;
  try { plan = JSON.parse(gasto.plan_pagos || '{}'); } catch { exigir(false, 'No se pudo leer el borrador del gasto. Volvé a editarlo.'); }
  exigir(plan && typeof plan === 'object' && !Array.isArray(plan), 'El borrador del gasto no es válido.');
  exigir(!plan.pagaron || Array.isArray(plan.pagaron), 'Revisá los pagos del borrador.');
  return { pagaron: plan.pagaron || [], financiaciones: plan.financiaciones || {} };
}

export function operacionesGasto(gasto, partes, propiaId, plan) {
  const operaciones = [{ clave: 'compra', clase: 'compra', gasto_compartido_id: gasto.id, monto: gasto.monto_total,
    descripcion: `Compra: ${gasto.descripcion}`, tipoMovimiento: gasto.pagador_id === propiaId ? 'egreso' : null }];
  exigir(plan.pagaron.every(id => partes.some(p => p.persona_id === id)), 'Una persona marcada como pagada ya no está en el reparto.');
  for (const parte of partes.filter(p => p.persona_id !== gasto.pagador_id && plan.pagaron.includes(p.persona_id))) {
    operaciones.push({ clave: `parte:${parte.persona_id}`, clase: 'parte', participante_gasto_id: parte.id, monto: parte.monto_correspondiente,
      descripcion: `Parte: ${gasto.descripcion}`, tipoMovimiento: gasto.pagador_id === propiaId ? 'ingreso' : parte.persona_id === propiaId ? 'egreso' : null });
  }
  return operaciones;
}

export async function movimientosReservados(contexto, exceptoGastoId = null) {
  const gastos = await contexto.conexion.getAllAsync(`SELECT g.plan_pagos FROM gastos_compartidos g JOIN salas s ON s.id = g.sala_id
    WHERE g.usuario_id = ? AND s.estado = 'abierta' AND g.estado = 'vigente' AND g.id <> ?;`, [contexto.usuario.id, exceptoGastoId || '']);
  return new Set(gastos.flatMap(g => Object.values(leerPlanGasto(g).financiaciones).map(f => f.movimientoId).filter(Boolean)));
}
