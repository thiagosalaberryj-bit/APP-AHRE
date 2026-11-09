import {leerSalasOnline} from './online/onlineStore';
import {proyectarSalasOnline} from './online/onlineProjection';
import type { Tablas } from '../database/types';
import { conLecturaSocial, leerSocial, idVisible } from './socialStore';
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

export function cargarSocial() {
  return conLecturaSocial(async (contexto) => {
    const online=await leerSalasOnline(contexto.usuario.id,contexto.conexion);
    const idsOnline=new Set(online.map(o=>o.sala.id));
    const publicaciones=await contexto.conexion.getAllAsync<{clave:string}>("SELECT clave FROM datos_sociales_online WHERE usuario_id=? AND clave LIKE 'publicar:%'",[contexto.usuario.id]);
    const publicando=new Set(publicaciones.map(p=>p.clave.slice('publicar:'.length)));
    const datos = await leerSocial(contexto), visibles = (id: string) => idVisible(id, contexto);
    const pagosPorDeuda = agruparPor(datos.pagos, p => p.deuda_id);
    const pagosPorParte = agruparPor(datos.pagos, p => p.participante_gasto_id);
    const deudasPorParte = agruparPor(datos.deudas, d => d.participante_gasto_id);
    const partesPorGasto = agruparPor(datos.partes, p => p.gasto_compartido_id);
    const gastosPorSala = agruparPor(datos.gastos.filter(g => g.estado === 'vigente'), g => g.sala_id);
    const integrantesPorSala = agruparPor(datos.integrantes, p => p.sala_id);
    const partesPorId = new Map(datos.partes.map(p => [p.id, p]));
    const gastosPorId = new Map(datos.gastos.map(g => [g.id, g]));
    const salasPorId = new Map(datos.salas.map(s => [s.id, s]));
    const origenes = await contexto.conexion.getAllAsync<Pick<Tablas['pagos_sociales'], 'deuda_id'> & Pick<Tablas['movimientos'], 'id'|'tipo'|'monto'|'descripcion'|'fecha_hora'> & {deposito:string}>(`SELECT p.deuda_id, m.id, m.tipo, m.monto, m.descripcion, m.fecha_hora, d.nombre AS deposito
      FROM pagos_sociales p JOIN movimientos m ON m.id = p.movimiento_id JOIN depositos d ON d.id = m.deposito_id
      WHERE p.usuario_id = ? AND p.clase = 'origen_deuda' AND p.estado = 'vigente';`, [contexto.usuario.id]);
    const origenesPorDeuda = agruparPor(origenes, o => o.deuda_id);
    const cacheAcuerdos=await contexto.conexion.getFirstAsync<{datos:string}>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='deudas'",[contexto.usuario.id]);
    const acuerdos=cacheAcuerdos?JSON.parse(cacheAcuerdos.datos) as import('./online/types').DeudaOnline[]:[];
    const deudasPrivadas = datos.deudas.filter(d => d.estado !== 'cancelada' || perdonLocal(d) > 0).map(deuda => {
      const pagado = sumaPagos(pagosPorDeuda.get(deuda.id) || []);
      const acuerdo=acuerdos.find(a=>a.estado==='aceptada'&&a.origenLocalId===deuda.id);
      const perdonado = acuerdo ? unidades(acuerdo.perdon?.monto) : perdonLocal(deuda);
      const pendiente = acuerdo?unidades(acuerdo.pendiente):Math.max(0, unidades(deuda.monto) - pagado - perdonado), esPago = deuda.deudor_id === contexto.propia.id;
      const parte = partesPorId.get(deuda.participante_gasto_id || '');
      const gasto = gastosPorId.get(parte?.gasto_compartido_id || '');
      const sala = salasPorId.get(gasto?.sala_id || '');
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
    const salasLocales = datos.salas.filter(sala=>!idsOnline.has(sala.id)).map(sala => {
      let cobrar = 0, pagar = 0;
      const gastos = (gastosPorSala.get(sala.id) || []).map(gasto => {
        const plan = leerPlanGasto(gasto);
        const partes = (partesPorGasto.get(gasto.id) || []).sort((a, b) => a.orden - b.orden).map(parte => {
          const deuda = deudasPorParte.get(parte.id)?.[0];
          const pagado = parte.persona_id === gasto.pagador_id || sala.estado === 'abierta' && plan.pagaron.includes(parte.persona_id) ? unidades(parte.monto_correspondiente) : sumaPagos(pagosPorParte.get(parte.id) || []);
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
          distribucion: gasto.reparto === 'manual' ? 'Montos manuales' : 'Partes iguales', partes, asociaciones: plan.financiaciones,
          depositosAsociados: [...new Set(Object.values(plan.financiaciones).map(f => f.depositoNombre).filter(Boolean))].join(' · ') };
      });
      return { online:false,administrador:true,puedeEditarGastos:true,publicacionPendiente:Boolean(sala.publicada||publicando.has(sala.id)),cierrePendiente:false,pendientesOnline:0,ultimaActualizacion:sala.fecha_actualizacion,id: sala.id, nombre: sala.nombre, descripcion: sala.descripcion, icono: sala.icono, color: sala.color,
        fecha: fechaCorta(sala.fecha), fechaISO: sala.fecha, creadaEl: diaLocal(sala.fecha_creacion), fechaCreacion: sala.fecha_creacion, estado: sala.estado, gastos,
        participantes: (integrantesPorSala.get(sala.id) || []).filter(p => p.activa && p.persona_id !== contexto.propia.id).map(p => p.persona_id),
        totalGastado: formatearMontoSocial(gastos.reduce((s, g) => s + unidades(g.montoNumero), 0) / 100),
        porCobrar: formatearMontoSocial(cobrar / 100), porPagar: formatearMontoSocial(pagar / 100) };
    });
    const demo=typeof __DEV__!=='undefined'&&__DEV__&&contexto.usuario.correo_electronico==='pruebas@ahre.test';
    const salas=[...salasLocales,...proyectarSalasOnline(online)].map(sala=>({...sala,demo}));
    const personasOnline=online.flatMap(o=>o.sala.participantes.filter(p=>p.id!==o.personaPropiaId).map(p=>({id:p.id,nombre:p.nombre,apellido:'',apodo:'',iniciales:p.nombre.slice(0,2).toLocaleUpperCase('es'),activa:p.activa})));
    const deudas=deudasPrivadas.map(d=>{const a=acuerdos.find(a=>a.origenLocalId===d.id&&a.estado!=='rechazada');return {...d,ultimaActividad:[d.ultimaActividad,...(a?.pagos||[]).map(p=>p.fecha_decision||p.fecha),...(a?.perdon?[a.perdon.fecha]:[])].sort().at(-1)!,acuerdoOnlineId:a?.id||d.acuerdoOnlineId,invitacionOnline:a?.estado==='pendiente',soloOnline:false,estadoOnline:a?.estado,estado:a?.perdon?'Perdonada':d.estado};});
    const privadas=new Set(deudas.map(d=>d.id));
    for(const a of acuerdos.filter(a=>a.estado!=='rechazada'&&(!a.origenLocalId||!privadas.has(a.origenLocalId)))){
      const fecha=a.fecha||online.find(s=>s.sala.id===a.salaId)?.sala.fecha||new Date().toISOString();
      deudas.push({fechaPerdon:a.perdon?.fecha||null,perdonadoNumero:a.perdon?.monto||0,id:a.id,acuerdoOnlineId:a.id,personaId:a.otraPersonaId||'online:'+a.id,tipo:a.esDeudor?'debo':'me_deben',descripcion:a.descripcion,fecha:diaLocal(fecha),fechaISO:fecha,ultimaActividad:[fecha,...a.pagos.map(p=>p.fecha_decision||p.fecha),...(a.perdon?[a.perdon.fecha]:[])].sort().at(-1)!,monto:formatearMontoSocial(a.monto),montoNumero:a.monto,pendiente:formatearMontoSocial(a.pendiente),pendienteNumero:a.pendiente,saldada:a.estado==='aceptada'&&a.pendiente===0,estado:a.perdon?'Perdonada':a.estado==='pendiente'?'Invitación pendiente':a.estado==='rechazada'?'Propuesta rechazada':a.pendiente===0?'Saldada':a.pendiente<a.monto?'Pago parcial':'Pendiente',origen:a.salaId?'Sala compartida':'Deuda online',salaId:a.salaId||undefined,movimientoOrigen:null,invitacionOnline:a.estado==='pendiente',soloOnline:true,estadoOnline:a.estado});
      if(!personas.some(p=>p.id===a.otraPersonaId)&&!personasOnline.some(p=>p.id===a.otraPersonaId))personasOnline.push({id:a.otraPersonaId||'online:'+a.id,nombre:a.otraPersonaNombre||'Participante',apellido:'',apodo:'',iniciales:(a.otraPersonaNombre||'PA').slice(0,2).toUpperCase(),activa:true});
    }
    const acuerdosSinRegistroPrivado=acuerdos.filter(a=>a.estado==='aceptada'&&(!a.origenLocalId||!privadas.has(a.origenLocalId)));
    return { usuarioId: contexto.usuario.id, personas,personasOnline, personaActual, salas, deudas,tienePendientesOnline:acuerdos.some(a=>a.estado==='aceptada'&&a.pendiente>0),
      habilitadoParaCrear: true,
      depositos: datos.depositos.map(d => ({ ...d, saldoTexto: `Saldo actual: ${formatearMontoSocial(d.saldo_actual)}` })),
      totales: { porCobrar: formatearMontoSocial((deudasPrivadas.filter(d => d.tipo === 'me_deben').reduce((s, d) => s + unidades(d.pendienteNumero), 0)+acuerdosSinRegistroPrivado.filter(a=>a.esAcreedor).reduce((s,a)=>s+unidades(a.pendiente),0)) / 100),
        porPagar: formatearMontoSocial((deudasPrivadas.filter(d => d.tipo === 'debo').reduce((s, d) => s + unidades(d.pendienteNumero), 0)+acuerdosSinRegistroPrivado.filter(a=>a.esDeudor).reduce((s,a)=>s+unidades(a.pendiente),0)) / 100) },
    };
  });
}

export type DatosSocialesVisibles = Awaited<ReturnType<typeof cargarSocial>>;
export type SalaVisible = DatosSocialesVisibles['salas'][number];
export type DeudaVisible = DatosSocialesVisibles['deudas'][number];
