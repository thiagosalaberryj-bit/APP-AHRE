import type { Conexion, Deposito, Usuario } from '../database/types';
import type { Financiacion, PlanGasto } from '../social/types';
import { personasRepositorio, salasRepositorio, personasSalaRepositorio, gastosCompartidosRepositorio, participantesGastoRepositorio, deudasRepositorio } from '../database/repositories';
import { normalizarNombrePersona } from '../social/socialHelpers';
import { repartirGasto, validarPersona } from '../social/socialValidation';
import { operacionesGasto } from '../social/socialRoomDraft';
import { PERSONAS_PRUEBA, GASTOS_SALA_PRUEBA } from './developmentData';

// Comparte la transacción de los ejemplos financieros: un fallo no deja una sala a medias.
export async function prepararSocialPrueba(usuario: Pick<Usuario, 'id' | 'nombre'>, conexion: Conexion, depositos: Map<string, Deposito>, fecha: string) {
  const identificar = (clase: string, clave: string) => `prueba:${usuario.id}:${clase}:${clave}`;
  const salaId = identificar('sala', 'encuentro');
  // Una sala cerrada o editada nunca se restablece al volver a entrar.
  if (await salasRepositorio.consultarPorId(salaId, conexion)) return;
  const deposito = [...depositos.values()].find(d => d.activo && d.saldo_actual > 0);
  if (!deposito) return;
  let propia = (await personasRepositorio.consultar({ usuario_id: usuario.id, es_usuario_actual: 1 }, {}, conexion))[0];
  if (!propia) propia = await personasRepositorio.crear({ id: identificar('persona', 'vos'), usuario_id: usuario.id, nombre: usuario.nombre, nombre_normalizado: normalizarNombrePersona(usuario.nombre), es_usuario_actual: 1, activa: 1 }, conexion);
  const personas = new Map<string, string>([['vos', propia.id]]);
  for (const { clave, ...datos } of PERSONAS_PRUEBA) {
    const id = identificar('persona', clave);
    await personasRepositorio.crear({ id, usuario_id: usuario.id, ...validarPersona(datos), es_usuario_actual: 0, activa: 1 }, conexion);
    personas.set(clave, id);
  }
  const personaId = (clave: string) => {
    const id = personas.get(clave);
    if (!id) throw new Error('El ejemplo social referencia una persona inexistente.');
    return id;
  };
  await salasRepositorio.crear({ id: salaId, usuario_id: usuario.id, nombre: 'Encuentro de prueba', descripcion: 'Cena, compras, taxi y café para probar repartos, pagos y cierre.', categoria: 'alimentacion', icono: 'restaurant-outline', color: '#BED5C8', fecha: fecha.slice(0, 10), estado: 'abierta' }, conexion);
  for (const id of personas.values()) await personasSalaRepositorio.crear({ id: identificar('integrante', id), usuario_id: usuario.id, sala_id: salaId, persona_id: id, activa: 1, fecha_alta: fecha }, conexion);
  for (const ejemplo of GASTOS_SALA_PRUEBA) {
    const id = identificar('gasto', ejemplo.clave);
    const reparto = repartirGasto({ monto: ejemplo.monto, reparto: ejemplo.reparto, involucradas: ejemplo.involucradas.map(personaId), montosManuales: Object.fromEntries(Object.entries(ejemplo.montosManuales || {}).map(([clave, monto]) => [personaId(clave), monto])) }, [...personas.values()]);
    const partes = reparto.partes.map(p => ({ id: identificar('parte', `${ejemplo.clave}:${p.personaId}`), persona_id: p.personaId, monto_correspondiente: p.centavos / 100, orden: p.orden }));
    const valores = { id, pagador_id: personaId(ejemplo.pagador), descripcion: ejemplo.descripcion, monto_total: ejemplo.monto };
    const pagaron = ejemplo.pagaron.map(personaId);
    const financiaciones: Record<string, Financiacion> = {};
    for (const operacion of operacionesGasto(valores, partes, propia.id, { pagaron }).filter(o => o.tipoMovimiento)) financiaciones[operacion.clave] = { depositoId: deposito.id, depositoNombre: deposito.nombre, fecha };
    const plan: PlanGasto = { pagaron, financiaciones };
    await gastosCompartidosRepositorio.crear({ ...valores, usuario_id: usuario.id, sala_id: salaId, fecha, reparto: ejemplo.reparto, estado: 'vigente', version: 1, plan_pagos: JSON.stringify(plan) }, conexion);
    for (const parte of partes) await participantesGastoRepositorio.crear({ ...parte, usuario_id: usuario.id, gasto_compartido_id: id }, conexion);
  }
  // Una deuda manual pendiente permite probar pagos sin tener que cerrar la sala.
  await deudasRepositorio.crear({ id: identificar('deuda', 'entrada'), usuario_id: usuario.id, deudor_id: propia.id, acreedor_id: personaId('ana'), monto: 1800, descripcion: 'Entrada adelantada de prueba', fecha, estado: 'pendiente' }, conexion);
}
