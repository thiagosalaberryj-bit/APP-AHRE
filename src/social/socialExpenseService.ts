import type { ContextoSocial } from './socialStore';
import { gastosCompartidosRepositorio, participantesGastoRepositorio } from '../database/repositories';
import { conSocial, registroPropio, salaAbierta, idPersistente, leerSocial, exigirDepositoConDinero } from './socialStore';
import { exigir, repartirGasto, textoSocial } from './socialValidation';
import { validarFinanciacion } from './socialPaymentService';
import { leerPlanGasto, operacionesGasto } from './socialRoomDraft';

async function prepararGasto(datos: import('./types').BorradorGasto, contexto: ContextoSocial) {
  const sala = await salaAbierta(datos.salaId, contexto), registros = await leerSocial(contexto);
  const previo = datos.gastoId ? await registroPropio(gastosCompartidosRepositorio, datos.gastoId, contexto) : null;
  if (!previo) await exigirDepositoConDinero(contexto);
  exigir(!previo || previo.sala_id === sala.id && previo.estado === 'vigente', 'El gasto no pertenece a esta sala o fue cancelado.');
  exigir(!previo || previo.version === datos.version, 'El gasto cambió desde que lo abriste. Volvé a abrirlo antes de editar.');
  const anteriores = registros.partes.filter(p => p.gasto_compartido_id === previo?.id);
  exigir(!previo || !registros.pagos.some(p => p.gasto_compartido_id === previo.id || anteriores.some(a => a.id === p.participante_gasto_id)), 'Este gasto ya tiene movimientos confirmados y no puede editarse como borrador.');
  const integrantes = registros.integrantes.filter(p => p.sala_id === sala.id && p.activa && registros.personas.some(x => x.id === p.persona_id && x.activa)).map(p => p.persona_id);
  const permitidas = [...new Set([...integrantes, ...anteriores.map(p => p.persona_id)])];
  const pagadorId = idPersistente(datos.pagadorId, contexto);
  exigir(integrantes.includes(pagadorId) || previo?.pagador_id === pagadorId, 'El pagador ya no está disponible en la sala.');
  const descripcion = textoSocial(datos.descripcion);
  exigir(descripcion && descripcion.length <= 500, 'Ingresá qué se pagó, con hasta 500 caracteres.');
  const involucradas = datos.involucradas?.map((id) => idPersistente(id, contexto));
  const montosManuales = Object.fromEntries(Object.entries(datos.montosManuales || {}).map(([id, monto]) => [idPersistente(id, contexto), monto]));
  const reparto = repartirGasto({ ...datos, involucradas, montosManuales }, permitidas);
  const pagaron = [...new Set((datos.pagaron || []).map((id) => idPersistente(id, contexto)))].filter(id => involucradas.includes(id));
  const gasto = { id: previo?.id || datos.id, pagador_id: pagadorId, descripcion, monto_total: reparto.total / 100 };
  const partes = reparto.partes.map(p => ({ persona_id: p.personaId, monto_correspondiente: p.centavos / 100 }));
  return { sala, previo, anteriores, reparto, pagaron, gasto, operaciones: operacionesGasto(gasto, partes, contexto.propia.id, { pagaron }) };
}

export function previsualizarGasto(datos: import('./types').BorradorGasto) {
  return conSocial(async (contexto) => {
    const plan = await prepararGasto(datos, contexto);
    return { diferido: true, operaciones: plan.operaciones.filter(o => o.tipoMovimiento).map(o => ({ clave: o.clave, tipo: o.tipoMovimiento!, monto: o.monto, descripcion: o.descripcion })) };
  });
}

export function guardarGasto(datos: import('./types').BorradorGasto, financiaciones: import('./types').Financiaciones = {}) {
  return conSocial((contexto) => guardarGastoEnContexto(datos, financiaciones, contexto));
}

async function guardarGastoEnContexto(datos: import('./types').BorradorGasto, financiaciones: import('./types').Financiaciones, contexto: ContextoSocial) {
    exigir(typeof datos.claveOperacion === 'string' && datos.claveOperacion.trim(), 'No se pudo identificar el envío. Volvé a abrir el formulario.');
    if (!datos.gastoId && datos.id) {
      const existente = await gastosCompartidosRepositorio.consultarPorId(datos.id, contexto.conexion);
      if (existente) { exigir(existente.usuario_id === contexto.usuario.id && existente.sala_id === datos.salaId, 'Identificador de gasto no disponible para esta sala.'); return existente; }
    }
    const plan = await prepararGasto(datos, contexto);
    const { previo, anteriores, reparto, pagaron, gasto: valores, sala } = plan;
    const reservas = new Set<string>();
    const previas = previo ? leerPlanGasto(previo).financiaciones : {};
    const elegidas: import('./types').Financiaciones = {};
    for (const operacion of plan.operaciones.filter(o => o.tipoMovimiento)) {
      const seleccion = (await validarFinanciacion(contexto, { ...operacion, fecha: new Date().toISOString() }, financiaciones[operacion.clave] || previas[operacion.clave], previo?.id))!;
      exigir(!seleccion!.movimientoId || !reservas.has(seleccion.movimientoId), 'Ese movimiento ya está asociado a otro gasto de una sala abierta.');
      if (seleccion.movimientoId) reservas.add(seleccion.movimientoId);
      elegidas[operacion.clave] = seleccion;
    }
    const campos = { pagador_id: valores.pagador_id, descripcion: valores.descripcion, monto_total: valores.monto_total,
      reparto: datos.reparto as 'iguales' | 'manual', plan_pagos: JSON.stringify({ pagaron, financiaciones: elegidas }) };
    const cambiaronPartes = anteriores.length !== reparto.partes.length || anteriores.some(a => !reparto.partes.some((p) => p.personaId === a.persona_id && p.centavos / 100 === a.monto_correspondiente && p.orden === a.orden));
    // Sin pagos confirmados, reemplazar el reparto no requiere compensaciones.
    if (cambiaronPartes) for (const parte of anteriores) await participantesGastoRepositorio.eliminar(parte.id, contexto.conexion);
    const gasto = previo ? await gastosCompartidosRepositorio.actualizar(previo.id, { ...campos, version: previo.version + 1 }, contexto.conexion)
      : await gastosCompartidosRepositorio.crear({ ...campos, id: datos.id, usuario_id: contexto.usuario.id, sala_id: sala.id, fecha: new Date().toISOString(), estado: 'vigente', version: 1 }, contexto.conexion);
    for (const parte of reparto.partes) {
      const anterior = !cambiaronPartes && anteriores.find(a => a.persona_id === parte.personaId);
      if (!anterior) await participantesGastoRepositorio.crear({ usuario_id: contexto.usuario.id, gasto_compartido_id: gasto!.id, persona_id: parte.personaId, monto_correspondiente: parte.centavos / 100, orden: parte.orden }, contexto.conexion);
    }
    return gasto;
}

function validarListaGastos(lista: import('./types').BorradorGasto[]) {
  exigir(Array.isArray(lista) && lista.length > 0 && lista.length <= 100, 'Agregá entre 1 y 100 ítems.');
  exigir(new Set(lista.map(g => g.id)).size === lista.length && lista.every(g => g.id && (!g.gastoId || g.gastoId === g.id) && g.salaId === lista[0].salaId), 'Revisá los identificadores y la sala de la lista.');
}

export function previsualizarListaGastos(lista: import('./types').BorradorGasto[]) {
  return conSocial(async (contexto) => {
    validarListaGastos(lista);
    const operaciones: {indice:number;clave:string;tipo:'ingreso'|'egreso';monto:number}[] = [];
    for (let indice = 0; indice < lista.length; indice++) {
      const plan = await prepararGasto(lista[indice], contexto);
      operaciones.push(...plan.operaciones.filter(o => o.tipoMovimiento).map(o => ({ indice, clave: o.clave, tipo: o.tipoMovimiento!, monto: o.monto })));
    }
    return { operaciones };
  });
}

export function guardarListaGastos(lista: import('./types').BorradorGasto[], financiaciones: import('./types').Financiaciones[] = []) {
  return conSocial(async (contexto) => {
    validarListaGastos(lista);
    const resultados: Awaited<ReturnType<typeof guardarGastoEnContexto>>[] = [];
    for (let i = 0; i < lista.length; i++) resultados.push(await guardarGastoEnContexto(lista[i], financiaciones[i] || {}, contexto));
    return resultados;
  });
}
