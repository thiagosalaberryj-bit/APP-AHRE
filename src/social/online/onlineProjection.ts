import type {DatosResumenSalaOnline, DetalleSalaOnlineGuardado} from './onlineStore';
import {formatearMontoSocial} from '../socialHelpers';

export function proyectarResumenSalaOnline(registro: DatosResumenSalaOnline) {
  const { sala, personaPropiaId } = registro;
  const gastos = sala.gastos.filter(gasto => gasto.estado === 'vigente');
  return {
    id: sala.id, nombre: sala.nombre, icono: sala.icono, color: sala.color,
    creadaEl: sala.fecha, fechaCreacion: sala.fecha,
    estado: sala.archivadaPorReinicio ? 'cerrada' as const : sala.estado,
    participantes: sala.participantes.filter(p => p.activa && p.id !== personaPropiaId).map(p => p.id),
    categorias: [...new Set(gastos.map(gasto => gasto.categoriaId))],
    totalGastado: formatearMontoSocial(gastos.reduce((total, gasto) => total + gasto.monto, 0)),
    online: true, administrador: Boolean(registro.administrador),
  };
}

export function proyectarSalaOnline(registro: DetalleSalaOnlineGuardado) {
    const {sala,personaPropiaId}=registro,visible=(id:string)=>id===personaPropiaId?'vos':id;
    const obligaciones = new Map<string, NonNullable<typeof sala.obligaciones>[number]>();
    for (const obligacion of sala.obligaciones || []) {
      if (!obligaciones.has(obligacion.participacionId)) obligaciones.set(obligacion.participacionId, obligacion);
    }
    let cobrar=0,pagar=0;
    const gastos=sala.gastos.filter(g=>g.estado==='vigente').map(gasto=>{
      const partes=gasto.partes.map(parte=>{
        const obligacion=obligaciones.get(gasto.id+':'+parte.personaId);
        const pendiente=obligacion?obligacion.pendiente:parte.personaId===gasto.pagadorId||gasto.pagaron.includes(parte.personaId)?0:parte.monto,saldada=pendiente===0;
        if(pendiente){if(gasto.pagadorId===personaPropiaId)cobrar+=pendiente;if(parte.personaId===personaPropiaId)pagar+=pendiente;}
        return {id:gasto.id+':'+parte.personaId,personaId:visible(parte.personaId),monto:formatearMontoSocial(parte.monto),montoNumero:parte.monto,pagadoNumero:Math.max(0,parte.monto-pendiente-(obligacion?.perdonado||0)),pendiente:formatearMontoSocial(pendiente),pendienteNumero:pendiente,deudaId:undefined as string|undefined,cancelada:false,resumen:obligacion?.perdonado?'Perdonado '+formatearMontoSocial(obligacion.perdonado):saldada?'Su parte ya está pagada':'Pendiente '+formatearMontoSocial(pendiente),tipo:saldada?'saldado':'debe'};
      });
      return {id:gasto.id,categoriaId:gasto.categoriaId,descripcion:gasto.descripcion,monto:formatearMontoSocial(gasto.monto),montoNumero:gasto.monto,fecha:new Date(gasto.fecha).toLocaleDateString('es-AR'),fechaISO:gasto.fecha,pagadorId:visible(gasto.pagadorId),reparto:gasto.reparto,version:gasto.version,distribucion:gasto.reparto==='manual'?'Montos manuales':'Partes iguales',partes,asociaciones:{} as Record<string,import('../types').Financiacion>,depositosAsociados:''};
    });
    return {descripcion:sala.descripcion,fecha:sala.fecha,fechaISO:sala.fecha,gastos,porCobrar:formatearMontoSocial(cobrar),porPagar:formatearMontoSocial(pagar),publicacionPendiente:false,puedeEditarGastos:!!(registro.administrador||registro.puedeEditarGastos),cierrePendiente:registro.cierrePendiente,pendientesOnline:registro.pendientes.length,ultimaActualizacion:registro.ultimaActualizacion};
}
