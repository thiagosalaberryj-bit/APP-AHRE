import type {SalaVista} from './types';
import type {RespuestaSala} from './online/types';
export function pendientesCierreLocales(sala:SalaVista):NonNullable<RespuestaSala['pendientesCierre']>{
 return sala.gastos.flatMap(g=>{
  const requeridas=[...(g.pagadorId==='vos'?[{clave:'compra',descripcion:'Compra: '+g.descripcion}]:[]),...g.partes.filter(p=>p.personaId!==g.pagadorId&&p.pagadoNumero>0&&(g.pagadorId==='vos'||p.personaId==='vos')).map(p=>({clave:'parte:'+p.personaId,descripcion:(g.pagadorId==='vos'?'Cobro: ':'Pago: ')+g.descripcion}))];
  return requeridas.filter(o=>!g.asociaciones[o.clave]?.depositoId&&!g.asociaciones[o.clave]?.movimientoId).map(o=>({personaId:'vos',nombre:'Vos',descripcion:o.descripcion,clave:o.clave==='compra'?'compra:'+g.id:'parte:'+g.id+':'+o.clave.slice('parte:'.length)}));
 });
}
export function gastoDePendiente(clave:string,gastos:{id:string}[]){
 if(clave.startsWith('solicitud:'))return undefined;
 if(clave.startsWith('[')){try{const datos:unknown=JSON.parse(clave);if(Array.isArray(datos)&&typeof datos[1]==='string')return gastos.find(g=>g.id===datos[1])?.id;}catch{/* Clave sin procedencia reconocida. */}}
 return gastos.find(g=>clave==='compra:'+g.id||clave.startsWith('parte:'+g.id+':'))?.id;
}
