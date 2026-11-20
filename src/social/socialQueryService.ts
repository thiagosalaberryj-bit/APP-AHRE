import { finanzasDemo } from '../development/demoRoomFinances';
import { pendientesSala } from './roomPending';
import { leerSalasOnline, leerSalasOnlineParaVista } from './online/onlineStore';
import { proyectarResumenSalaOnline, proyectarSalaOnline } from './online/onlineProjection';
import { depositosRepositorio, personasRepositorio, salasRepositorio } from '../database/repositories';
import type { Tablas } from '../database/types';
import { conLecturaSocial, idVisible, type ContextoSocial } from './socialStore';
import { sumaPagos, unidades, perdonLocal } from './socialValidation';
import { formatearMontoSocial } from './socialHelpers';
import { leerPlanGasto } from './socialRoomDraft';

const formatoFecha = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

const diaLocal = (valor: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const fecha = new Date(valor);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
};
const fechaCorta = (valor: string) => {
  const [anio, mes, dia] = diaLocal(valor).split('-').map(Number);
  return formatoFecha.format(new Date(anio, mes - 1, dia));
};

function agruparPor<Registro, Clave>(registros: Registro[], clave: (registro: Registro) => Clave) {
  const grupos = new Map<Clave, Registro[]>();
  for (const registro of registros) {
    const id = clave(registro);
    const grupo = grupos.get(id);
    if (grupo) grupo.push(registro);
    else grupos.set(id, [registro]);
  }
  return grupos;
}

async function leerPanelLocal({ usuario, conexion }: ContextoSocial) {
  const filtros = { usuario_id: usuario.id };
  const [personas, salas, pagos, deudas, integrantes, depositos, categoriasPorSala] = await Promise.all([
    personasRepositorio.consultar(filtros, {}, conexion),
    salasRepositorio.consultar(filtros, {}, conexion),
    conexion.getAllAsync<Tablas['pagos_sociales']>(
      'SELECT * FROM pagos_sociales WHERE usuario_id = ? AND deuda_id IS NOT NULL ORDER BY id', [usuario.id]),
    conexion.getAllAsync<Tablas['deudas'] & { sala_local_id: string | null }>(`
      SELECT d.*, g.sala_id AS sala_local_id FROM deudas d
      LEFT JOIN participantes_gasto p ON p.usuario_id = d.usuario_id AND p.id = d.participante_gasto_id
      LEFT JOIN gastos_compartidos g ON g.usuario_id = p.usuario_id AND g.id = p.gasto_compartido_id
      WHERE d.usuario_id = ? ORDER BY d.id`, [usuario.id]),
    conexion.getAllAsync<Pick<Tablas['personas_sala'], 'sala_id' | 'persona_id'>>(
      'SELECT sala_id, persona_id FROM personas_sala WHERE usuario_id = ? AND activa = 1 ORDER BY id', [usuario.id]),
    depositosRepositorio.consultar({ ...filtros, activo: 1 }, {}, conexion),
    conexion.getAllAsync<{ sala_id: string; categoria: string; total: number }>(`
      SELECT g.sala_id, g.categoria, SUM(ROUND(g.monto_total * 100)) AS total
      FROM gastos_compartidos g
      WHERE g.usuario_id = ? AND g.estado = 'vigente' AND NOT EXISTS (
        SELECT 1 FROM salas_online_locales o WHERE o.usuario_id = g.usuario_id AND o.sala_id = g.sala_id
      )
      GROUP BY g.sala_id, g.categoria ORDER BY g.sala_id, g.categoria`, [usuario.id]),
  ]);
  return { personas, salas, pagos, deudas, integrantes, depositos, categoriasPorSala };
}

async function leerDetalleLocal({ usuario, conexion }: ContextoSocial, salaId?: string) {
  const filtro = "WHERE g.usuario_id = ? AND g.estado = 'vigente'" + (salaId ? ' AND g.sala_id = ?' : '');
  const parametros = salaId ? [usuario.id, salaId] : [usuario.id];
  const origenPartes = 'FROM gastos_compartidos g JOIN participantes_gasto p ON p.usuario_id = g.usuario_id AND p.gasto_compartido_id = g.id';
  const [gastos, partes, pagosPorParte, deudasPorParte, publicaciones] = await Promise.all([
    conexion.getAllAsync<Tablas['gastos_compartidos']>(`SELECT g.* FROM gastos_compartidos g ${filtro} ORDER BY g.id`, parametros),
    conexion.getAllAsync<Tablas['participantes_gasto']>(`SELECT p.* ${origenPartes} ${filtro} ORDER BY p.id`, parametros),
    conexion.getAllAsync<Tablas['pagos_sociales']>(`SELECT ps.* ${origenPartes}
      JOIN pagos_sociales ps ON ps.usuario_id = p.usuario_id AND ps.participante_gasto_id = p.id
      ${filtro} ORDER BY ps.id`, parametros),
    conexion.getAllAsync<Tablas['deudas']>(`SELECT d.* ${origenPartes}
      JOIN deudas d ON d.usuario_id = p.usuario_id AND d.participante_gasto_id = p.id
      ${filtro} ORDER BY d.id`, parametros),
    conexion.getAllAsync<{ clave: string }>(
      salaId
        ? 'SELECT clave FROM datos_sociales_online WHERE usuario_id = ? AND clave = ?'
        : "SELECT clave FROM datos_sociales_online WHERE usuario_id = ? AND clave LIKE 'publicar:%'",
      salaId ? [usuario.id, 'publicar:' + salaId] : [usuario.id],
    ),
  ]);
  return {
    gastos: agruparPor(gastos, g => g.sala_id),
    partes: agruparPor(partes, p => p.gasto_compartido_id),
    pagos: agruparPor(pagosPorParte, p => p.participante_gasto_id),
    deudas: agruparPor(deudasPorParte, d => d.participante_gasto_id),
    publicaciones: new Set(publicaciones.map(p => p.clave.slice('publicar:'.length))),
  };
}

function cargarVistaSocial(alcance?: { salaId?: string }) {
  return conLecturaSocial(async (contexto) => {
    const demo = typeof __DEV__ !== 'undefined' && __DEV__ && contexto.usuario.correo_electronico === 'pruebas@ahre.test';
    const online = alcance
      ? await leerSalasOnlineParaVista(contexto.usuario.id, contexto.conexion, demo, alcance.salaId)
      : (await leerSalasOnline(contexto.usuario.id, contexto.conexion)).map(detalle => ({ resumen: detalle, detalle, respaldo: detalle }));
    const salasOnlinePorId = new Map(online.map(({ resumen }) => [resumen.sala.id, resumen.sala]));
    const datos = await leerPanelLocal(contexto), visibles = (id: string) => idVisible(id, contexto);
    const pagosPorDeuda = agruparPor(datos.pagos, p => p.deuda_id);
    const integrantesPorSala = agruparPor(datos.integrantes, p => p.sala_id);
    const categoriasPorSala = agruparPor(datos.categoriasPorSala, c => c.sala_id);
    const salasPorId = new Map(datos.salas.map(s => [s.id, s]));
    const origenes = await contexto.conexion.getAllAsync<Pick<Tablas['pagos_sociales'], 'deuda_id'> & Pick<Tablas['movimientos'], 'id'|'tipo'|'monto'|'descripcion'|'fecha_hora'> & {deposito:string}>(`SELECT p.deuda_id, m.id, m.tipo, m.monto, m.descripcion, m.fecha_hora, d.nombre AS deposito
      FROM pagos_sociales p JOIN movimientos m ON m.id = p.movimiento_id JOIN depositos d ON d.id = m.deposito_id
      WHERE p.usuario_id = ? AND p.clase = 'origen_deuda' AND p.estado = 'vigente';`, [contexto.usuario.id]);
    const origenesPorDeuda = agruparPor(origenes, o => o.deuda_id);
    const cacheAcuerdos=await contexto.conexion.getFirstAsync<{datos:string}>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='deudas'",[contexto.usuario.id]);
    const acuerdos=cacheAcuerdos?JSON.parse(cacheAcuerdos.datos) as import('./online/types').DeudaOnline[]:[];
    const acuerdosPorOrigen = agruparPor(acuerdos, a => a.origenLocalId);
    const deudasPrivadas = datos.deudas.filter(d => d.estado !== 'cancelada' || perdonLocal(d) > 0).map(deuda => {
      const pagado = sumaPagos(pagosPorDeuda.get(deuda.id) || []);
      const acuerdo=acuerdosPorOrigen.get(deuda.id)?.find(a=>a.estado==='aceptada');
      const perdonado = acuerdo ? unidades(acuerdo.perdon?.monto) : perdonLocal(deuda);
      const pendiente = acuerdo?unidades(acuerdo.pendiente):Math.max(0, unidades(deuda.monto) - pagado - perdonado), esPago = deuda.deudor_id === contexto.propia.id;
      const sala = salasPorId.get(deuda.sala_local_id || '') || salasOnlinePorId.get(deuda.origen_sala_online_id || '');
      const movimientoOrigen = origenesPorDeuda.get(deuda.id)?.[0];
      return { fechaPerdon:acuerdo?.perdon?.fecha || (perdonado ? deuda.fecha_cancelacion : null), perdonadoNumero:perdonado/100,acuerdoOnlineId:acuerdo?.id,id: deuda.id, personaId: visibles(esPago ? deuda.acreedor_id : deuda.deudor_id), tipo: esPago ? 'debo' : 'me_deben',
        descripcion: deuda.descripcion, fecha: diaLocal(deuda.fecha), fechaISO: deuda.fecha, ultimaActividad:[deuda.fecha,deuda.fecha_actualizacion,...(pagosPorDeuda.get(deuda.id)||[]).flatMap(p=>[p.fecha,p.fecha_anulacion||p.fecha])].sort().at(-1)!, monto: formatearMontoSocial(deuda.monto), montoNumero: deuda.monto,
        pendiente: formatearMontoSocial(pendiente / 100), pendienteNumero: pendiente / 100, saldada: pendiente === 0,
        estado: perdonado ? 'Perdonada' : !pendiente ? 'Saldada' : pagado ? `Pago parcial · ${esPago ? 'Pagaste' : 'Recibiste'} ${formatearMontoSocial(pagado / 100)}` : 'Pendiente',
        origen: sala ? `${sala.nombre} · Sala cerrada` : movimientoOrigen ? `Adelanto · ${movimientoOrigen.deposito}` : 'Deuda personal', salaId: sala?.id,
        movimientoOrigen: movimientoOrigen || null,
      };
    });
    const deudasPorPersona = agruparPor(deudasPrivadas, d => d.personaId);
    const personas = datos.personas.filter(p => !p.es_usuario_actual).map(persona => {
      const propias = deudasPorPersona.get(persona.id) || [];
      return { ...persona, activa: Boolean(persona.activa), iniciales: `${persona.nombre[0]}${persona.apellido?.[0] || ''}`.toLocaleUpperCase('es'),
        porCobrar: formatearMontoSocial(propias.filter(d => d.tipo === 'me_deben').reduce((s, d) => s + unidades(d.pendienteNumero), 0) / 100),
        porPagar: formatearMontoSocial(propias.filter(d => d.tipo === 'debo').reduce((s, d) => s + unidades(d.pendienteNumero), 0) / 100) };
    });
    const personaActual = { id: 'vos', idPersistente: contexto.propia.id, nombre: 'Vos', apellido: '', apodo: '', iniciales: 'YO', activa: true };
    const locales = datos.salas.filter(sala => !salasOnlinePorId.has(sala.id)).map(sala => {
      const categorias = categoriasPorSala.get(sala.id) || [];
      const resumen = {
        id: sala.id, nombre: sala.nombre, icono: sala.icono, color: sala.color,
        estado: sala.estado, creadaEl: diaLocal(sala.fecha_creacion), fechaCreacion: sala.fecha_creacion,
        participantes: (integrantesPorSala.get(sala.id) || []).filter(p => p.persona_id !== contexto.propia.id).map(p => p.persona_id),
        categorias: categorias.map(c => c.categoria),
        totalGastado: formatearMontoSocial(categorias.reduce((total, c) => total + c.total, 0) / 100),
        online: false, administrador: true, demo, movimientosPorRegistrar: 0,
      };
      return { sala, resumen };
    });
    const seleccionadas = alcance ? locales.filter(({ sala }) => sala.id === alcance.salaId) : locales;
    const detalleLocal = seleccionadas.length ? await leerDetalleLocal(contexto, alcance?.salaId) : null;
    const detallesLocales = detalleLocal ? seleccionadas.map(({ sala, resumen }) => {
      let cobrar = 0, pagar = 0;
      const gastos = (detalleLocal.gastos.get(sala.id) || []).map(gasto => {
        const plan = leerPlanGasto(gasto);
        const partes = (detalleLocal.partes.get(gasto.id) || []).sort((a, b) => a.orden - b.orden).map(parte => {
          const deuda = detalleLocal.deudas.get(parte.id)?.[0];
          const pagado = parte.persona_id === gasto.pagador_id || sala.estado === 'abierta' && plan.pagaron.includes(parte.persona_id) ? unidades(parte.monto_correspondiente) : sumaPagos(detalleLocal.pagos.get(parte.id) || []);
          const perdonado = deuda ? perdonLocal(deuda) : 0;
          const pendiente = Math.max(0, unidades(parte.monto_correspondiente) - pagado - perdonado), cancelada = deuda?.estado === 'cancelada' && !perdonado;
          if (!cancelada && pendiente) {
            if (gasto.pagador_id === contexto.propia.id) cobrar += pendiente;
            if (parte.persona_id === contexto.propia.id) pagar += pendiente;
          }
          return { id: parte.id, personaId: visibles(parte.persona_id), monto: formatearMontoSocial(parte.monto_correspondiente), montoNumero: parte.monto_correspondiente,
            pagadoNumero: pagado / 100, pendiente: formatearMontoSocial(pendiente / 100), pendienteNumero: pendiente / 100, deudaId: deuda?.id, cancelada,
            resumen: perdonado ? 'Perdonado ' + formatearMontoSocial(perdonado/100) : cancelada ? 'Obligación cancelada' : !pendiente ? 'Su parte ya está pagada' : `${pagado ? `Pagó ${formatearMontoSocial(pagado / 100)} · ` : ''}Pendiente ${formatearMontoSocial(pendiente / 100)}`,
            tipo: cancelada ? 'cancelado' : !pendiente ? 'saldado' : 'debe' };
        });
        return { id: gasto.id, categoriaId: gasto.categoria, descripcion: gasto.descripcion, monto: formatearMontoSocial(gasto.monto_total), montoNumero: gasto.monto_total,
          fecha: fechaCorta(gasto.fecha), fechaISO: gasto.fecha, pagadorId: visibles(gasto.pagador_id), reparto: gasto.reparto, version: gasto.version,
          distribucion: gasto.reparto === 'manual' ? 'Montos manuales' : 'Partes iguales', partes,
          asociaciones: Object.fromEntries(Object.entries(plan.financiaciones).map(([clave,financiacion])=>[clave.startsWith('parte:')?'parte:'+visibles(clave.slice('parte:'.length)):clave,financiacion])),
          depositosAsociados: [...new Set(Object.values(plan.financiaciones).map(f => f.depositoNombre).filter(Boolean))].join(' · ') };
      });
      return { ...resumen, puedeEditarGastos:true,publicacionPendiente:Boolean(sala.publicada||detalleLocal.publicaciones.has(sala.id)),cierrePendiente:false,pendientesOnline:0,ultimaActualizacion:sala.fecha_actualizacion,
        descripcion: sala.descripcion, fecha: fechaCorta(sala.fecha), fechaISO: sala.fecha, gastos,
        porCobrar: formatearMontoSocial(cobrar / 100), porPagar: formatearMontoSocial(pagar / 100) };
    }) : [];
    const incorporaciones = online.length ? await contexto.conexion.getAllAsync<{clave:string}>(
      'SELECT clave FROM incorporaciones_sociales_locales WHERE usuario_id=?',[contexto.usuario.id]) : [];
    const incorporadas=new Set(incorporaciones.map(i=>i.clave));
    const resumenesOnline = online.map(({ resumen, respaldo }) => ({
      ...proyectarResumenSalaOnline(resumen), demo,
      movimientosPorRegistrar: pendientesSala(respaldo ? finanzasDemo(respaldo, demo) : resumen, incorporadas).length,
    }));
    const detallesOnline = online.flatMap(({ detalle }, indice) => detalle
      ? [{ ...proyectarSalaOnline(detalle), ...resumenesOnline[indice] }] : []);
    const salas = [...locales.map(({ resumen }) => resumen), ...resumenesOnline];
    const personasOnline=online.flatMap(({ resumen: o })=>o.sala.participantes.filter(p=>p.id!==o.personaPropiaId).map(p=>({id:p.id,nombre:p.nombre,apellido:'',apodo:'',iniciales:p.nombre.slice(0,2).toLocaleUpperCase('es'),activa:p.activa})));
    const idsPersonas = new Set([...personas, ...personasOnline].map(p => p.id));
    const deudas=deudasPrivadas.map(d=>{const a=acuerdosPorOrigen.get(d.id)?.find(a=>!['rechazada','retirada'].includes(a.estado));return {...d,ultimaActividad:[d.ultimaActividad,...(a?.pagos||[]).map(p=>p.fecha_decision||p.fecha),...(a?.perdon?[a.perdon.fecha]:[])].sort().at(-1)!,desvinculada:!!a?.desvinculada,origen:a?.desvinculada&&d.saldada?'Deuda personal':d.origen,acuerdoOnlineId:a?.id||d.acuerdoOnlineId,invitacionOnline:a?.estado==='pendiente',soloOnline:false,estadoOnline:a?.estado,estado:a?.desvinculada&&!d.saldada?'Cuenta desvinculada':a?.perdon?'Perdonada':d.estado};});
    const privadas=new Set(deudas.map(d=>d.id));
    for(const a of acuerdos.filter(a=>!['rechazada','retirada'].includes(a.estado)&&(!a.origenLocalId||!privadas.has(a.origenLocalId)))){
      const fecha=a.fecha||salasOnlinePorId.get(a.salaId || '')?.fecha||new Date().toISOString();
      deudas.push({fechaPerdon:a.perdon?.fecha||null,perdonadoNumero:a.perdon?.monto||0,id:a.id,desvinculada:!!a.desvinculada,acuerdoOnlineId:a.id,personaId:a.otraPersonaId||'online:'+a.id,tipo:a.esDeudor?'debo':'me_deben',descripcion:a.descripcion,fecha:diaLocal(fecha),fechaISO:fecha,ultimaActividad:[fecha,...a.pagos.map(p=>p.fecha_decision||p.fecha),...(a.perdon?[a.perdon.fecha]:[])].sort().at(-1)!,monto:formatearMontoSocial(a.monto),montoNumero:a.monto,pendiente:formatearMontoSocial(a.pendiente),pendienteNumero:a.pendiente,saldada:a.estado==='aceptada'&&a.pendiente===0,estado:a.desvinculada&&a.pendiente>0?'Cuenta desvinculada':a.perdon?'Perdonada':a.estado==='pendiente'?'Invitación pendiente':a.estado==='rechazada'?'Propuesta rechazada':a.pendiente===0?'Saldada':a.pendiente<a.monto?'Pago parcial':'Pendiente',origen:a.desvinculada&&a.pendiente===0?'Deuda personal':a.salaId?'Sala compartida':'Deuda online',salaId:a.salaId||undefined,movimientoOrigen:null,invitacionOnline:a.estado==='pendiente',soloOnline:true,estadoOnline:a.estado});
      if (!idsPersonas.has(a.otraPersonaId || '')) {
        const id = a.otraPersonaId || 'online:' + a.id;
        idsPersonas.add(id);
        personasOnline.push({id,nombre:a.otraPersonaNombre||'Participante',apellido:'',apodo:'',iniciales:(a.otraPersonaNombre||'PA').slice(0,2).toUpperCase(),activa:true});
      }
    }
    const acuerdosSinRegistroPrivado=acuerdos.filter(a=>a.estado==='aceptada'&&(!a.origenLocalId||!privadas.has(a.origenLocalId)));
    return { usuarioId: contexto.usuario.id, personas,personasOnline, personaActual, salas, detalles: [...detallesLocales, ...detallesOnline], deudas,tienePendientesOnline:acuerdos.some(a=>a.estado==='aceptada'&&a.pendiente>0),
      habilitadoParaCrear: true,
      depositos: datos.depositos.map(d => ({ ...d, saldoTexto: `Saldo actual: ${formatearMontoSocial(d.saldo_actual)}` })),
      totales: { porCobrar: formatearMontoSocial((deudasPrivadas.filter(d => d.tipo === 'me_deben').reduce((s, d) => s + unidades(d.pendienteNumero), 0)+acuerdosSinRegistroPrivado.filter(a=>a.esAcreedor).reduce((s,a)=>s+unidades(a.pendiente),0)) / 100),
        porPagar: formatearMontoSocial((deudasPrivadas.filter(d => d.tipo === 'debo').reduce((s, d) => s + unidades(d.pendienteNumero), 0)+acuerdosSinRegistroPrivado.filter(a=>a.esDeudor).reduce((s,a)=>s+unidades(a.pendiente),0)) / 100) },
    };
  });
}

export async function cargarSocial() {
  const { detalles, ...datos } = await cargarVistaSocial();
  return { ...datos, salas: detalles };
}

export async function cargarResumenSocial(salaId?: string) {
  const { detalles, ...datos } = await cargarVistaSocial({ salaId });
  return { ...datos, sala: detalles.at(0) };
}

export type DatosSocialesVisibles = Awaited<ReturnType<typeof cargarResumenSocial>>;
export type ResumenSalaVisible = DatosSocialesVisibles['salas'][number];
export type SalaVisible = NonNullable<DatosSocialesVisibles['sala']>;
export type DeudaVisible = DatosSocialesVisibles['deudas'][number];
