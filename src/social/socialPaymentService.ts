import type { ContextoSocial } from './socialStore';
import type { Tablas } from '../database/types';
import { deudasRepositorio, pagosSocialesRepositorio, movimientosRepositorio, depositosRepositorio, personasRepositorio, participantesGastoRepositorio, gastosCompartidosRepositorio, salasRepositorio } from '../database/repositories';
import { conSocial, registroPropio, exigirDepositoConDinero } from './socialStore';
import { centavos, unidades, sumaPagos, exigir, textoSocial } from './socialValidation';
import { movimientosReservados } from './socialRoomDraft';

export async function validarFinanciacion(contexto: ContextoSocial, operacion: import('./types').DatosOperacion, financiacion: import('./types').Financiacion | null | undefined, gastoReservadoId?: string) {
  if (!operacion.tipoMovimiento) {
    exigir(!financiacion?.movimientoId && !financiacion?.depositoId, 'Los pagos entre otras personas no utilizan tus depósitos.');
    return null;
  }
  exigir(financiacion, 'Elegí el depósito o el movimiento correspondiente a este pago.');
  exigir(Boolean(financiacion.movimientoId) !== Boolean(financiacion.depositoId), 'Elegí un movimiento existente o un depósito para crear uno nuevo.');
  if (financiacion.movimientoId) {
    const movimiento = await movimientosRepositorio.consultarPorId(financiacion.movimientoId, contexto.conexion);
    exigir(movimiento, 'El movimiento seleccionado ya no está disponible.');
    const deposito = await depositosRepositorio.consultarPorId(movimiento.deposito_id, contexto.conexion);
    const reverso = await contexto.conexion.getFirstAsync<Pick<Tablas['movimientos'], 'id'>>('SELECT id FROM movimientos WHERE reversion_de_id = ?;', [movimiento.id]);
    exigir(deposito?.usuario_id === contexto.usuario.id && movimiento.tipo === operacion.tipoMovimiento && unidades(movimiento.monto) === unidades(operacion.monto)
      && !movimiento.anulado && !movimiento.transferencia_id && !movimiento.reversion_de_id && !reverso,
    'El movimiento debe ser propio, vigente y coincidir con el importe y la dirección del pago.');
    const vinculos = await pagosSocialesRepositorio.consultar({ usuario_id: contexto.usuario.id, movimiento_id: movimiento.id }, {}, contexto.conexion);
    exigir(!vinculos.length, 'Ese movimiento ya está vinculado a Social.');
    const gastoId = gastoReservadoId || operacion.gasto_compartido_id || (operacion.participante_gasto_id ? (await participantesGastoRepositorio.consultarPorId(operacion.participante_gasto_id, contexto.conexion))?.gasto_compartido_id : null);
    exigir(!(await movimientosReservados(contexto, gastoId)).has(movimiento.id), 'Ese movimiento ya está asociado a otro gasto de una sala abierta.');
    return { movimientoId: movimiento.id, depositoNombre: deposito.nombre, fecha: movimiento.fecha_hora };
  }
  const deposito = await registroPropio(depositosRepositorio, financiacion.depositoId!, contexto);
  exigir(deposito.activo, 'El depósito seleccionado está desactivado.');
  const fecha = financiacion.fecha || operacion.fecha;
  exigir(typeof fecha === 'string' && Number.isFinite(Date.parse(fecha)), 'Elegí una fecha y hora válidas para el pago.');
  return { depositoId: deposito.id, depositoNombre: deposito.nombre, fecha };
}

export async function guardarOperacion(contexto: ContextoSocial, operacion: import('./types').DatosOperacion, financiacion: import('./types').Financiacion | null | undefined) {
  const previos = await pagosSocialesRepositorio.consultar({ usuario_id: contexto.usuario.id, clave_operacion: operacion.clave_operacion! }, {}, contexto.conexion);
  if (previos.length) {
    const previo = previos[0];
    exigir(unidades(previo.monto) === unidades(operacion.monto) && previo.clase === operacion.clase
      && (previo.participante_gasto_id || null) === (operacion.participante_gasto_id || null)
      && (previo.deuda_id || null) === (operacion.deuda_id || null)
      && (previo.gasto_compartido_id || null) === (operacion.gasto_compartido_id || null), 'La operación ya fue utilizada para otro pago.');
    return previo;
  }
  const { tipoMovimiento, categoria, ...pago } = operacion;
  let movimiento: {id:string} | null = null;
  const seleccion = await validarFinanciacion(contexto, operacion, financiacion);
  if (tipoMovimiento && seleccion) {
    if (seleccion.movimientoId) {
      movimiento = { id: seleccion.movimientoId };
    } else {
      movimiento = await movimientosRepositorio.crear({ deposito_id: seleccion.depositoId, tipo: tipoMovimiento, categoria,
        monto: pago.monto, descripcion: pago.descripcion, fecha_hora: seleccion.fecha }, contexto.conexion);
    }
    pago.fecha = seleccion.fecha;
  }
  return pagosSocialesRepositorio.crear({ ...pago, usuario_id: contexto.usuario.id, movimiento_id: movimiento?.id || null, estado: 'vigente' }, contexto.conexion);
}

async function prepararDeudaPersonal(datos: import('./types').DatosDeuda, contexto: ContextoSocial) {
  const persona = await registroPropio(personasRepositorio, datos.personaId, contexto);
  exigir(persona.activa && !persona.es_usuario_actual, 'Elegí una persona activa de tu agenda.');
  await exigirDepositoConDinero(contexto);
  exigir(['debo', 'me_deben'].includes(datos.direccion), 'Elegí la dirección de la deuda.');
  const descripcion = textoSocial(datos.descripcion), monto = centavos(datos.monto) / 100;
  exigir(descripcion && descripcion.length <= 500, 'Ingresá una descripción de hasta 500 caracteres.');
  const tipo = datos.direccion === 'me_deben' ? 'egreso' as const : null;
  const categoria = 'deudas';
  return { persona, descripcion, monto, tipo, categoria,
    operaciones: tipo ? [{ clave: 'origen', tipo, monto, descripcion: 'Dinero que adelantaste por esta deuda' }] : [] };
}

export function previsualizarDeudaPersonal(datos: import('./types').DatosDeuda) {
  return conSocial(async (contexto) => ({ operaciones: (await prepararDeudaPersonal(datos, contexto)).operaciones }));
}

export function crearDeudaPersonal(datos: import('./types').DatosDeuda, financiacion: import('./types').Financiacion | undefined = undefined) {
  return conSocial(async (contexto) => {
    if (datos.id) {
      const previa = await deudasRepositorio.consultarPorId(datos.id, contexto.conexion);
      if (previa) {
        exigir(previa.usuario_id === contexto.usuario.id && !previa.participante_gasto_id, 'Identificador no disponible.');
        exigir(previa.monto === centavos(datos.monto) / 100 && previa.descripcion === textoSocial(datos.descripcion)
          && (datos.direccion === 'me_deben' ? previa.deudor_id === datos.personaId && previa.acreedor_id === contexto.propia.id
            : datos.direccion === 'debo' && previa.acreedor_id === datos.personaId && previa.deudor_id === contexto.propia.id), 'Ese registro ya fue utilizado para otra deuda.');
        const origen = (await pagosSocialesRepositorio.consultar({ usuario_id: contexto.usuario.id, deuda_id: previa.id, clase: 'origen_deuda' }, {}, contexto.conexion))[0];
        exigir(Boolean(origen) === (datos.direccion === 'me_deben'), 'La deuda ya fue registrada con otro origen.');
        return previa;
      }
    }
    const { persona, descripcion, monto, tipo, categoria } = await prepararDeudaPersonal(datos, contexto);
    let deuda = await deudasRepositorio.crear({ id: datos.id, usuario_id: contexto.usuario.id,
      deudor_id: datos.direccion === 'debo' ? contexto.propia.id : persona.id,
      acreedor_id: datos.direccion === 'debo' ? persona.id : contexto.propia.id,
      monto, descripcion, fecha: new Date().toISOString(), estado: 'pendiente' }, contexto.conexion);
    if (tipo) {
      const origen = await guardarOperacion(contexto, { clase: 'origen_deuda', deuda_id: deuda.id, monto, fecha: deuda.fecha,
        descripcion: `Origen de deuda: ${descripcion}`, clave_operacion: `origen-deuda:${deuda.id}`, tipoMovimiento: tipo, categoria }, financiacion);
      deuda = (await deudasRepositorio.actualizar(deuda.id, { fecha: origen.fecha }, contexto.conexion))!;
    } else exigir(!financiacion?.movimientoId && !financiacion?.depositoId, 'Registrar lo que debés no genera un ingreso. Elegí el depósito al pagar la deuda.');
    return deuda;
  });
}

export function registrarPagoDeuda(datos: import('./types').DatosPago, financiacion: import('./types').Financiacion | undefined = undefined) {
  return conSocial(async (contexto) => {
    exigir(typeof datos.claveOperacion === 'string' && datos.claveOperacion.trim(), 'No se pudo identificar el envío. Volvé a abrir el formulario.');
    const deuda = await registroPropio(deudasRepositorio, datos.deudaId, contexto);
    const existentes = await pagosSocialesRepositorio.consultar({ usuario_id: contexto.usuario.id, clave_operacion: datos.claveOperacion }, {}, contexto.conexion);
    if (existentes.length) {
      exigir(existentes[0].deuda_id === deuda.id && unidades(existentes[0].monto) === centavos(datos.monto), 'El identificador del pago ya fue utilizado.');
      return { ...existentes[0], saldada: deuda.estado === 'pagada' };
    }
    exigir(deuda.estado !== 'cancelada', 'La deuda está cancelada.');
    await exigirDepositoConDinero(contexto);
    const pagos = await pagosSocialesRepositorio.consultar({ usuario_id: contexto.usuario.id, deuda_id: deuda.id }, {}, contexto.conexion);
    const monto = centavos(datos.monto), restante = unidades(deuda.monto) - sumaPagos(pagos);
    exigir(monto <= restante && restante > 0, 'El pago supera el pendiente o la deuda ya está saldada.');
    const esPago = deuda.deudor_id === contexto.propia.id;
    let categoria = esPago ? 'deudas' : 'devoluciones';
    if (esPago && deuda.participante_gasto_id) {
      const parte = await registroPropio(participantesGastoRepositorio, deuda.participante_gasto_id, contexto);
      const gasto = await registroPropio(gastosCompartidosRepositorio, parte.gasto_compartido_id, contexto);
      categoria = (await registroPropio(salasRepositorio, gasto.sala_id, contexto)).categoria;
    }
    const resultado = await guardarOperacion(contexto, {
      clase: deuda.participante_gasto_id ? 'parte' : 'deuda', participante_gasto_id: deuda.participante_gasto_id,
      deuda_id: deuda.id, monto: monto / 100, fecha: new Date().toISOString(), descripcion: `Pago: ${deuda.descripcion}`,
      clave_operacion: datos.claveOperacion, tipoMovimiento: esPago ? 'egreso' : 'ingreso', categoria,
    }, financiacion);
    await deudasRepositorio.actualizar(deuda.id, { estado: monto === restante ? 'pagada' : 'parcial' }, contexto.conexion);
    return { ...resultado, saldada: monto === restante };
  });
}

export function cancelarDeuda(id: string) {
  return conSocial(async (contexto) => {
    const deuda = await registroPropio(deudasRepositorio, id, contexto);
    if (deuda.estado === 'cancelada') return deuda;
    const pagos = await pagosSocialesRepositorio.consultar({ usuario_id: contexto.usuario.id, deuda_id: deuda.id }, {}, contexto.conexion);
    exigir(sumaPagos(pagos) < unidades(deuda.monto), 'Una deuda saldada no se puede eliminar. Queda guardada en el historial.');
    return deudasRepositorio.actualizar(id, { estado: 'cancelada', fecha_cancelacion: new Date().toISOString() }, contexto.conexion);
  });
}

export function consultarMovimientosCompatibles(tipo: string, monto: string | number) {
  return conSocial(async (contexto) => {
    const movimientos = await contexto.conexion.getAllAsync<Tablas['movimientos'] & {deposito:string}>(`
    SELECT m.*, d.nombre AS deposito FROM movimientos m JOIN depositos d ON d.id = m.deposito_id
    WHERE d.usuario_id = ? AND m.tipo = ? AND ROUND(m.monto * 100) = ? AND m.anulado = 0
      AND m.transferencia_id IS NULL AND m.reversion_de_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM movimientos r WHERE r.reversion_de_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM pagos_sociales p WHERE p.movimiento_id = m.id)
    ORDER BY m.fecha_hora DESC, m.id DESC;`, [contexto.usuario.id, tipo, centavos(monto)]);
    const reservados = await movimientosReservados(contexto);
    return movimientos.filter(m => !reservados.has(m.id));
  });
}
