import type {Conexion} from '../../database/types';
import {ejecutarLecturaConConexion} from '../../database/connectionQueue';
import {ejecutarTransaccion} from '../../database/transactions';
import type {RespuestaSala,ComandoOnline,PendienteOnline,SalaOnline} from './types';

const oyentes=new Set<()=>void>();
export function observarSocialOnline(oyente:()=>void){oyentes.add(oyente);return()=>{oyentes.delete(oyente);};}
export function avisarSocialOnline(){for(const oyente of oyentes)oyente();}
export async function guardarCacheSala(usuarioId:string,respuesta:RespuestaSala){
  if(!respuesta?.sala?.id||!Array.isArray(respuesta.sala.gastos)||!Array.isArray(respuesta.sala.participantes)||!Number.isSafeInteger(respuesta.sala.revision)||typeof respuesta.personaPropiaId!=='string')throw new Error('Respuesta de sala inválida.');
  await ejecutarTransaccion(async c=>{
    const previa=await c.getFirstAsync<{datos:string}>('SELECT datos FROM salas_online_locales WHERE usuario_id=? AND sala_id=?',[usuarioId,respuesta.sala.id]);
    if(previa&&(JSON.parse(previa.datos) as RespuestaSala).sala.revision>respuesta.sala.revision)return;
    await c.runAsync('INSERT INTO salas_online_locales(usuario_id,sala_id,datos,administrador,persona_propia_id,fecha_actualizacion) VALUES(?,?,?,?,?,?) ON CONFLICT(usuario_id,sala_id) DO UPDATE SET datos=excluded.datos,administrador=excluded.administrador,persona_propia_id=excluded.persona_propia_id,fecha_actualizacion=excluded.fecha_actualizacion',[usuarioId,respuesta.sala.id,JSON.stringify(respuesta),respuesta.administrador?1:0,respuesta.personaPropiaId,new Date().toISOString()]);
    if(respuesta.administrador)await c.runAsync('UPDATE salas SET publicada=1,fecha_actualizacion=? WHERE id=? AND usuario_id=? AND publicada=0',[new Date().toISOString(),respuesta.sala.id,usuarioId]);
  });avisarSocialOnline();
}
export async function confirmarComandoOnline(usuarioId:string,pendiente:PendienteOnline,sala:SalaOnline){
  await ejecutarTransaccion(async c=>{
    const fila=await c.getFirstAsync<{datos:string}>('SELECT datos FROM salas_online_locales WHERE usuario_id=? AND sala_id=?',[usuarioId,pendiente.sala_id]);
    if(!fila)throw new Error('La sala dejó de estar disponible. Conservamos el envío.');
    const respuesta=JSON.parse(fila.datos) as RespuestaSala;
    if(sala.id!==pendiente.sala_id||!Number.isSafeInteger(sala.revision))throw new Error('Confirmación de sala inválida.');
    if(sala.revision>=respuesta.sala.revision)await c.runAsync('UPDATE salas_online_locales SET datos=?,fecha_actualizacion=? WHERE usuario_id=? AND sala_id=?',[JSON.stringify({...respuesta,sala}),new Date().toISOString(),usuarioId,sala.id]);
    await c.runAsync('DELETE FROM comandos_sociales_locales WHERE id=? AND usuario_id=?',[pendiente.id,usuarioId]);
  });avisarSocialOnline();
}
export async function leerSalasOnline(usuarioId:string,conexion?:Conexion,salaId?:string){
  const leer=async(c:Conexion)=>{
    const parametros=salaId?[usuarioId,salaId]:[usuarioId],filtro=salaId?' AND sala_id=?':'';
    const filas=await c.getAllAsync<{datos:string;fecha_actualizacion:string}>('SELECT datos,fecha_actualizacion FROM salas_online_locales WHERE usuario_id=?'+filtro+' ORDER BY sala_id',parametros);
    const pendientes=await c.getAllAsync<PendienteOnline>('SELECT id,sala_id,datos,error FROM comandos_sociales_locales WHERE usuario_id=?'+filtro+' ORDER BY secuencia',parametros);
    return filas.map(fila=>{
      const respuesta=JSON.parse(fila.datos) as RespuestaSala;const propios=pendientes.filter(p=>p.sala_id===respuesta.sala.id);
      for(const pendiente of propios){const comando=JSON.parse(pendiente.datos) as ComandoOnline;if(comando.tipo==='guardar_lista'&&comando.gastos){for(const gasto of comando.gastos){const i=respuesta.sala.gastos.findIndex(g=>g.id===gasto.id);if(i<0)respuesta.sala.gastos.push(gasto);else respuesta.sala.gastos[i]={...gasto,version:gasto.version+1};}respuesta.sala.revision++;}else if(comando.tipo==='guardar_gasto'&&comando.gasto){const i=respuesta.sala.gastos.findIndex(g=>g.id===comando.gasto!.id);const gasto={...comando.gasto,version:i<0?1:respuesta.sala.gastos[i].version+1};if(i<0)respuesta.sala.gastos.push(gasto);else respuesta.sala.gastos[i]=gasto;respuesta.sala.revision++;}else if(comando.tipo==='parte_pagada'){const gasto=respuesta.sala.gastos.find(g=>g.id===comando.gastoId);if(gasto){gasto.pagaron=gasto.pagaron.filter(id=>id!==comando.personaId);if(comando.pagada&&comando.personaId)gasto.pagaron.push(comando.personaId);gasto.version++;respuesta.sala.revision++;}}else if(comando.tipo==='integrantes'&&comando.personas){const ids=new Set(comando.personas.map(p=>p.id));for(const p of respuesta.sala.participantes)p.activa=ids.has(p.id);for(const p of comando.personas)if(!respuesta.sala.participantes.some(a=>a.id===p.id))respuesta.sala.participantes.push({...p,activa:true});respuesta.sala.revision++;}}
      return {...respuesta,pendientes:propios,ultimaActualizacion:fila.fecha_actualizacion,cierrePendiente:propios.some(p=>(JSON.parse(p.datos) as ComandoOnline).tipo==='cerrar')};
    });
  };
  return conexion?leer(conexion):ejecutarLecturaConConexion(leer);
}
export async function guardarDatosOnline(usuarioId:string,clave:string,datos:unknown){await ejecutarTransaccion(c=>c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos',[usuarioId,clave,JSON.stringify(datos)]));avisarSocialOnline();}
export async function leerDatosOnline<T>(usuarioId:string,clave:string,defecto:T){return ejecutarLecturaConConexion(async c=>{const fila=await c.getFirstAsync<{datos:string}>('SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuarioId,clave]);return fila?JSON.parse(fila.datos) as T:defecto;});}
