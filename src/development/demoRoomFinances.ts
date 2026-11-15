import type { OperacionPersonal, RespuestaSala } from '../social/online/types';

export function registrosRequeridosDemo(detalle:RespuestaSala){
 const resultado:{personaId:string;nombre:string;descripcion:string;clave:string}[]=[];
 for(const g of detalle.sala.gastos.filter(g=>g.estado==='vigente')){
  const agregar=(personaId:string,tipo:string,monto:number,descripcion:string)=>{
   if(monto<=0||!detalle.identidades?.some(i=>i.personaId===personaId&&i.conCuenta)&&personaId!==detalle.personaPropiaId)return;
   resultado.push({personaId,nombre:detalle.sala.participantes.find(p=>p.id===personaId)?.nombre||'Participante',descripcion,clave:JSON.stringify([personaId,g.id,tipo,monto,g.pagadorId,g.partes])});
  };
  agregar(g.pagadorId,'compra',g.monto,'Compra: '+g.descripcion);
  for(const p of g.partes.filter(p=>p.personaId!==g.pagadorId&&g.pagaron.includes(p.personaId))){agregar(p.personaId,'salida',p.monto,'Pago: '+g.descripcion);agregar(g.pagadorId,'entrada:'+p.personaId,p.monto,'Cobro: '+g.descripcion);}
 }
 return resultado;
}

export function finanzasDemo<T extends RespuestaSala>(detalle: T, simulacion=false): T {
  if (!detalle.sala.id.startsWith('demo-social:')&&!simulacion) return detalle;
  const opciones: OperacionPersonal[] = [], propia = detalle.personaPropiaId;
  for (const g of detalle.sala.gastos.filter(g => g.estado === 'vigente')) {
    const agregar = (clave: string, tipo: 'ingreso'|'egreso', monto: number, descripcion: string) => {
      const anterior = detalle.misFinanzas?.find(o=>o.clave===clave)||detalle.misFinanzas?.find(o=>o.gastoId===g.id&&o.tipo===tipo&&o.monto===monto&&o.clave.startsWith('compra:')===clave.startsWith('compra:')&&!o.clave.startsWith('parte:'+detalle.sala.id+':'+g.id+':'));
      opciones.push({clave, tipo, monto, descripcion, categoria: tipo === 'ingreso' ? 'devoluciones' : g.categoriaId, fecha: g.fecha, gastoId: g.id, salaId: detalle.sala.id, seleccion: anterior?.monto===monto?anterior.seleccion:undefined,necesitaRevision:!!anterior?.seleccion&&anterior.monto!==monto});
    };
    if (g.pagadorId === propia) {
      agregar(`compra:${detalle.sala.id}:${g.id}`, 'egreso', g.monto, 'Compra: ' + g.descripcion);
      for (const p of g.partes.filter(p => p.personaId !== propia && g.pagaron.includes(p.personaId)))
        agregar(`parte:${detalle.sala.id}:${g.id}:${p.personaId}`, 'ingreso', p.monto, 'Parte recibida: ' + g.descripcion);
    } else {
      const parte = g.partes.find(p => p.personaId === propia);
      if (parte) agregar(`parte:${detalle.sala.id}:${g.id}:${propia}`, 'egreso', parte.monto, 'Mi parte: ' + g.descripcion);
    }
  }
  const registradas=new Set(detalle.registrosIntegrantesDemo||[]);
  const faltantes=registrosRequeridosDemo(detalle).filter(r=>{
   if(r.personaId!==propia)return !registradas.has(r.clave);
   const [,_gasto,tipo]=JSON.parse(r.clave) as string[];
   const opcion=opciones.find(o=>o.gastoId===_gasto&&(tipo==='compra'?o.clave.startsWith('compra:'):tipo==='salida'?o.tipo==='egreso':o.tipo==='ingreso'&&o.clave.endsWith(tipo.slice('entrada:'.length))));
   return !opcion?.seleccion;
  });
  for(const q of detalle.solicitudes.filter(q=>q.tipo==='parte_pagada'&&q.estado==='pendiente'))faltantes.push({personaId:q.personaId||'',nombre:detalle.sala.participantes.find(p=>p.id===q.personaId)?.nombre||'Participante',descripcion:'Responder aviso de pago',clave:'solicitud:'+q.id});
  return {...detalle, misFinanzas: opciones,pendientesCierre:detalle.sala.estado==='abierta'?faltantes:[]};
}

