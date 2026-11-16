import type {Conexion} from '../database/types';
import {personasRepositorio} from '../database/repositories';
import {validarPersona} from '../social/socialValidation';
import type {VinculoOnline} from '../social/online/types';

/** Solo se llama desde la entrada local de pruebas, sin servidor. */
export async function prepararAjustesVisuales(usuarioId:string,c:Conexion){
 const marca='demo-ajustes-visuales:v1';
 if(await c.getFirstAsync('SELECT clave FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuarioId,marca]))return;
 const ahora=new Date().toISOString();
 await c.runAsync("UPDATE usuarios SET apellido='AHRE' WHERE id=? AND nombre='Cuenta de pruebas' AND apellido=''",[usuarioId]);
 const id='prueba:'+usuarioId+':persona:diego-archivado';
 if(!await personasRepositorio.consultarPorId(id,c))await personasRepositorio.crear({id,usuario_id:usuarioId,...validarPersona({nombre:'Diego',apellido:'Medina',apodo:'Diego anterior'}),activa:0,es_usuario_actual:0},c);
 const fila=await c.getFirstAsync<{datos:string}>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='vinculos'",[usuarioId]);
 const vinculos:VinculoOnline[]=fila?JSON.parse(fila.datos):[];
 for(const v of vinculos.filter(v=>v.id.startsWith('demo-social:'))){
  const persona=await personasRepositorio.consultarPorId(v.persona_id,c);
  if(persona){v.apellido=persona.apellido;v.correo_electronico=persona.nombre.toLowerCase()+'@ejemplo.ahre.test';}
 }
 vinculos.push({id:'demo-social:'+usuarioId+':solicitud-vinculo-martina',persona_id:'',cuenta_id:'demo-social:cuenta-martina',nombre:'Martina',apellido:'Ruiz',correo_electronico:'martina@ejemplo.ahre.test',direccion:'recibida',estado:'solicitado'});
 await c.runAsync("INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,'vinculos',?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos",[usuarioId,JSON.stringify(vinculos)]);
 for(const fila of await c.getAllAsync<{sala_id:string;datos:string}>('SELECT sala_id,datos FROM salas_online_locales WHERE usuario_id=?',[usuarioId])){
  const detalle=JSON.parse(fila.datos) as import('../social/online/types').RespuestaSala;
  if(!fila.sala_id.startsWith('demo-social:'))continue;
  for(const q of detalle.solicitudes.filter(q=>q.tipo==='parte_pagada'&&q.estado==='pendiente'&&q.monto_parte==null)){q.monto_parte=detalle.sala.gastos.find(g=>g.id===q.gasto_id)?.partes.find(p=>p.personaId===q.personaId)?.monto;}
  await c.runAsync('UPDATE salas_online_locales SET datos=? WHERE usuario_id=? AND sala_id=?',[JSON.stringify(detalle),usuarioId,fila.sala_id]);
 }
 await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)',[usuarioId,marca,JSON.stringify({fecha:ahora})]);
}
