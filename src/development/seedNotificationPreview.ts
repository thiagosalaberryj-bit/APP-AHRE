import type { Conexion } from '../database/types';
import { TIPOS_AVISO, type Aviso, type DestinoAviso, type TipoAviso } from '../notifications/types';

const ejemplos:Record<TipoAviso,[string,string]>={
 registro:['¿Registraste tus movimientos de hoy?','Todavía estás a tiempo de completar tu día'],
 debo:['Recordá revisar tus deudas','Tenés una deuda pendiente para revisar'],
 me_deben:['Recordá las deudas que te deben','Tenés un cobro pendiente'],
 recurrencias:['Mañana se repite un movimiento','Hay una recurrencia pendiente de aceptar'],
 salas:['Hay gastos de sala por registrar','Un pago de la sala está listo para incorporar'],
 mensual:['Revisá cómo cerraste el mes','Compará tu balance con el mes anterior'],
 mercado_pago:['Mercado Pago tiene movimientos nuevos','Todavía tenés movimientos de Mercado Pago por revisar'],
 social:['Recibiste una solicitud en Social','Hay una decisión sobre un pago compartido'],
 cuenta:['Mercado Pago necesita autorización','No se pudo completar la búsqueda de Mercado Pago'],
};
export async function prepararAvisosDemo(usuarioId:string,c:Conexion){
 const deuda=await c.getFirstAsync<{id:string}>('SELECT id FROM deudas WHERE usuario_id=? LIMIT 1',[usuarioId]);
 const sala=await c.getFirstAsync<{id:string}>('SELECT id FROM salas WHERE usuario_id=? LIMIT 1',[usuarioId]);
 const deposito=await c.getFirstAsync<{id:string}>('SELECT id FROM depositos WHERE usuario_id=? AND activo=1 LIMIT 1',[usuarioId]);
 let indice=0;
 for(const tipo of TIPOS_AVISO)for(const titulo of ejemplos[tipo]){
  const id=`demo-aviso:${tipo}:${indice}`;
  const destino:DestinoAviso=tipo==='debo'||tipo==='me_deben'?deuda?{tipo:'deuda',id:deuda.id}:{tipo:'movimientos'}:tipo==='salas'?sala?{tipo:'sala',id:sala.id,seccion:'gastos'}:{tipo:'movimientos'}:tipo==='mensual'?{tipo:'estadisticas'}:tipo==='social'?{tipo:'personas'}:tipo==='mercado_pago'||tipo==='cuenta'?{tipo:'mercado_pago'}:tipo==='recurrencias'?{tipo:'recurrencia',depositoId:deposito?.id}:{tipo:'movimientos'};
  const aviso:Aviso={id,tipo,titulo:'Demo · '+titulo,mensaje:'Ejemplo de notificación. Tocá para abrir su apartado en la cuenta de prueba.',destino,fecha:new Date(Date.now()-indice*60000).toISOString(),vista:indice%4===0,resuelta:indice%3===0};
  await c.runAsync('INSERT INTO avisos_locales(usuario_id,id,datos,fecha,vista,resuelta) VALUES(?,?,?,?,?,?) ON CONFLICT(usuario_id,id) DO UPDATE SET datos=json_set(excluded.datos,\'$.fecha\',avisos_locales.fecha)',[usuarioId,id,JSON.stringify(aviso),aviso.fecha,aviso.vista?1:0,aviso.resuelta?1:0]);indice++;
 }
}
