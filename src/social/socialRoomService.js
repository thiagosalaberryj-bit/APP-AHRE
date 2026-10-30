import { salasRepositorio, personasSalaRepositorio, personasRepositorio, pagosSocialesRepositorio, deudasRepositorio } from '../database/repositories';
import { conSocial, registroPropio, idPersistente, salaAbierta, leerSocial, exigirDepositoConDinero } from './socialStore';
import { exigir, textoSocial, unidades, sumaPagos } from './socialValidation';
import { ICONOS_SALA, LIMITE_SALAS_ACTIVAS } from './socialConstants';
import { COLORES_DEPOSITOS } from '../styles/colors';
import { CATEGORIAS_EGRESO } from '../constants/movimientos';
import { guardarOperacion } from './socialPaymentService';
import { leerPlanGasto, operacionesGasto } from './socialRoomDraft';

export function crearSala(datos) {
  return conSocial(async contexto => {
    if (datos.id) {
      const previa = await salasRepositorio.consultarPorId(datos.id, contexto.conexion);
      if (previa) { exigir(previa.usuario_id === contexto.usuario.id, 'Identificador de sala no disponible.'); return previa; }
    }
    await exigirDepositoConDinero(contexto);
    const nombre = textoSocial(datos.nombre);
    exigir(nombre && nombre.length <= 100 && textoSocial(datos.descripcion).length <= 500, 'Completá un nombre válido y una descripción de hasta 500 caracteres.');
    exigir(CATEGORIAS_EGRESO.some(c => c.id === datos.categoriaId) && ICONOS_SALA.some(c => c.id === datos.icono) && COLORES_DEPOSITOS.includes(datos.color), 'Elegí categoría, icono y color de la sala.');
    const fecha = datos.fecha;
    exigir(typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha)), 'Elegí una fecha válida.');
    const abiertas = await salasRepositorio.consultar({ usuario_id: contexto.usuario.id, estado: 'abierta' }, {}, contexto.conexion);
    exigir(abiertas.length < LIMITE_SALAS_ACTIVAS, 'Ya tenés tres salas abiertas. Cerrá una para crear otra.');
    const ids = [contexto.propia.id, ...new Set((datos.personasIds || []).map(id => idPersistente(id, contexto)))].filter((id, i, lista) => lista.indexOf(id) === i);
    for (const id of ids) exigir((await registroPropio(personasRepositorio, id, contexto)).activa, 'Una persona seleccionada está desactivada.');
    const sala = await salasRepositorio.crear({ id: datos.id, usuario_id: contexto.usuario.id, nombre, descripcion: textoSocial(datos.descripcion),
      categoria: datos.categoriaId, icono: datos.icono, color: datos.color, fecha, estado: 'abierta' }, contexto.conexion);
    for (const persona_id of ids) await personasSalaRepositorio.crear({ usuario_id: contexto.usuario.id, sala_id: sala.id, persona_id, activa: 1, fecha_alta: new Date().toISOString() }, contexto.conexion);
    return sala;
  });
}

export function cambiarPersonasSala(salaId, personasIds) {
  return conSocial(async contexto => {
    await salaAbierta(salaId, contexto);
    const ids = new Set([contexto.propia.id, ...personasIds.map(id => idPersistente(id, contexto))]);
    const previas = await personasSalaRepositorio.consultar({ usuario_id: contexto.usuario.id, sala_id: salaId }, {}, contexto.conexion);
    if ([...ids].some(id => !previas.some(p => p.persona_id === id && p.activa))) await exigirDepositoConDinero(contexto);
    for (const id of ids) {
      const previa = previas.find(p => p.persona_id === id);
      if (previa?.activa) continue; // Una identidad histórica inactiva no se elimina al guardar otra selección.
      exigir((await registroPropio(personasRepositorio, id, contexto)).activa, 'Reactivá la persona antes de agregarla.');
      if (previa) await personasSalaRepositorio.actualizar(previa.id, { activa: 1, fecha_baja: null }, contexto.conexion);
      else await personasSalaRepositorio.crear({ usuario_id: contexto.usuario.id, sala_id: salaId, persona_id: id, activa: 1, fecha_alta: new Date().toISOString() }, contexto.conexion);
    }
    for (const previa of previas.filter(p => p.activa && !ids.has(p.persona_id))) {
      await personasSalaRepositorio.actualizar(previa.id, { activa: 0, fecha_baja: new Date().toISOString() }, contexto.conexion);
    }
  });
}

export function cerrarSala(salaId) {
  return conSocial(async contexto => {
    const sala = await registroPropio(salasRepositorio, salaId, contexto);
    if (sala.estado === 'cerrada') return sala;
    let datos = await leerSocial(contexto);
    if (datos.gastos.some(g => g.sala_id === salaId && g.estado === 'vigente')) await exigirDepositoConDinero(contexto);
    for (const gasto of datos.gastos.filter(g => g.sala_id === salaId && g.estado === 'vigente')) {
      const partes = datos.partes.filter(p => p.gasto_compartido_id === gasto.id), plan = leerPlanGasto(gasto);
      exigir(partes.length && partes.reduce((s, p) => s + unidades(p.monto_correspondiente), 0) === unidades(gasto.monto_total), 'Revisá el reparto antes de cerrar la sala.');
      for (const operacion of operacionesGasto(gasto, partes, contexto.propia.id, plan)) {
        const { clave, ...pago } = operacion;
        await guardarOperacion(contexto, { ...pago, fecha: gasto.fecha,
          clave_operacion: `cierre:${gasto.id}:${gasto.version}:${clave}`, categoria: pago.tipoMovimiento === 'ingreso' ? 'devoluciones' : sala.categoria }, plan.financiaciones[clave]);
      }
    }
    datos = await leerSocial(contexto);
    for (const gasto of datos.gastos.filter(g => g.sala_id === salaId && g.estado === 'vigente')) {
      const partes = datos.partes.filter(p => p.gasto_compartido_id === gasto.id);
      const compra = datos.pagos.find(p => p.gasto_compartido_id === gasto.id && p.estado === 'vigente');
      exigir(compra && partes.length && partes.reduce((s, p) => s + unidades(p.monto_correspondiente), 0) === unidades(gasto.monto_total), 'Revisá las compras y repartos antes de cerrar la sala.');
      for (const parte of partes.filter(p => p.persona_id !== gasto.pagador_id)) {
        const pagos = datos.pagos.filter(p => p.participante_gasto_id === parte.id);
        const pagado = sumaPagos(pagos), original = unidades(parte.monto_correspondiente);
        exigir(pagado <= original, 'Una parte tiene pagos superiores a su importe.');
        if (pagado === original || parte.persona_id !== contexto.propia.id && gasto.pagador_id !== contexto.propia.id) continue;
        let deuda = datos.deudas.find(d => d.participante_gasto_id === parte.id);
        if (!deuda) deuda = await deudasRepositorio.crear({ usuario_id: contexto.usuario.id, deudor_id: parte.persona_id, acreedor_id: gasto.pagador_id,
          participante_gasto_id: parte.id, monto: parte.monto_correspondiente, descripcion: gasto.descripcion, fecha: gasto.fecha,
          estado: pagado ? 'parcial' : 'pendiente' }, contexto.conexion);
        for (const pago of pagos) if (!pago.deuda_id) await pagosSocialesRepositorio.actualizar(pago.id, { deuda_id: deuda.id }, contexto.conexion);
      }
    }
    return salasRepositorio.actualizar(salaId, { estado: 'cerrada', fecha_cierre: new Date().toISOString() }, contexto.conexion);
  });
}
