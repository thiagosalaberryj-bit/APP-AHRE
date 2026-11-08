import type {leerSalasOnline} from './onlineStore';
import {formatearMontoSocial} from '../socialHelpers';

export function proyectarSalasOnline(registros:Awaited<ReturnType<typeof leerSalasOnline>>){
  return registros.map(registro=>{
    const {sala,personaPropiaId}=registro,visible=(id:string)=>id===personaPropiaId?'vos':id;
    let cobrar=0,pagar=0;
    const gastos=sala.gastos.filter(g=>g.estado==='vigente').map(gasto=>{
      const partes=gasto.partes.map(parte=>{
        const obligacion=sala.obligaciones?.find(o=>o.participacionId===gasto.id+':'+parte.personaId);
        const pendiente=obligacion?obligacion.pendiente:parte.personaId===gasto.pagadorId||gasto.pagaron.includes(parte.personaId)?0:parte.monto,saldada=pendiente===0;
        if(pendiente){if(gasto.pagadorId===personaPropiaId)cobrar+=pendiente;if(parte.personaId===personaPropiaId)pagar+=pendiente;}
        return {id:gasto.id+':'+parte.personaId,personaId:visible(parte.personaId),monto:formatearMontoSocial(parte.monto),montoNumero:parte.monto,pagadoNumero:Math.max(0,parte.monto-pendiente-(obligacion?.perdonado||0)),pendiente:formatearMontoSocial(pendiente),pendienteNumero:pendiente,deudaId:undefined as string|undefined,cancelada:false,resumen:obligacion?.perdonado?'Perdonado '+formatearMontoSocial(obligacion.perdonado):saldada?'Su parte ya está pagada':'Pendiente '+formatearMontoSocial(pendiente),tipo:saldada?'saldado':'debe'};
      });
      return {id:gasto.id,categoriaId:gasto.categoriaId,descripcion:gasto.descripcion,monto:formatearMontoSocial(gasto.monto),montoNumero:gasto.monto,fecha:new Date(gasto.fecha).toLocaleDateString('es-AR'),fechaISO:gasto.fecha,pagadorId:visible(gasto.pagadorId),reparto:gasto.reparto,version:gasto.version,distribucion:gasto.reparto==='manual'?'Montos manuales':'Partes iguales',partes,asociaciones:{} as Record<string,import('../types').Financiacion>,depositosAsociados:''};
    });
    return {id:sala.id,nombre:sala.nombre,descripcion:sala.descripcion,icono:sala.icono,color:sala.color,fecha:sala.fecha,fechaISO:sala.fecha,creadaEl:sala.fecha,fechaCreacion:sala.fecha,estado:sala.estado,gastos,participantes:sala.participantes.filter(p=>p.activa&&p.id!==personaPropiaId).map(p=>p.id),totalGastado:formatearMontoSocial(gastos.reduce((s,g)=>s+g.montoNumero,0)),porCobrar:formatearMontoSocial(cobrar),porPagar:formatearMontoSocial(pagar),online:true,publicacionPendiente:false,administrador:registro.administrador,puedeEditarGastos:!!(registro.administrador||registro.puedeEditarGastos),cierrePendiente:registro.cierrePendiente,pendientesOnline:registro.pendientes.length,ultimaActualizacion:registro.ultimaActualizacion};
  });
}
