import * as Crypto from 'expo-crypto';
import {esRecursoDemo,esRutaDemo,usuarioDemoActual,comandoDemo,accionDemo,seleccionarFinanzasDemo,incorporarDemo,leerSalaDemo,finanzasDemo,prepararOperacionesDemo,publicarSalaDemo,solicitarIngresoDemo} from '../../development/socialDemoService';
import {obtenerSesionActual} from '../../authentication/sessionService';
import {obtenerSesionRemota,solicitarRemoto,URL_SERVIDOR} from '../../sync/remote';
import {consultarAutorizacion} from '../../sync/deviceAuthorization';
import {sincronizarCuenta} from '../../sync/syncService';
import {ejecutarLecturaConConexion} from '../../database/connectionQueue';
import {ejecutarTransaccion} from '../../database/transactions';
import {generarIdentificador} from '../../database/identifiers';
import {movimientosRepositorio,depositosRepositorio} from '../../database/repositories';
import {CATEGORIAS_EGRESO} from '../../constants/movimientos';
import {repartirGasto,exigir} from '../socialValidation';
import {guardarCacheSala,confirmarComandoOnline,leerSalasOnline,guardarDatosOnline,leerDatosOnline,avisarSocialOnline} from './onlineStore';
import type {RespuestaSala,ComandoOnline,PendienteOnline,OperacionPersonal,DeudaOnline,VinculoOnline,SalaOnline} from './types';
import type {BorradorGasto} from '../types';
import type {GastoCompartido,ParticipanteGasto,Persona,Sala} from '../../database/types';
import {leerPlanGasto} from '../socialRoomDraft';

export async function sesionOnline(){const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión para usar Social online.');const remota=await obtenerSesionRemota(usuario.id);exigir(remota,'Iniciá sesión con conexión para compartir salas.');const autorizacion=await consultarAutorizacion(usuario.id);exigir(autorizacion&&!autorizacion.revocada,'La instalación fue desvinculada. Se conservan tus pendientes.');return {usuario,token:remota.token};}
export async function solicitarSocial<T>(ruta:string,datos?:unknown):Promise<T>{const {usuario,token}=await sesionOnline();const resultado=await solicitarRemoto<T>('/social'+ruta,datos,token);exigir((await obtenerSesionActual()).usuario?.id===usuario.id,'La sesión cambió durante la operación.');return resultado;}
export async function esSalaOnline(id:string){const {usuario}=await obtenerSesionActual();if(!usuario)return false;return ejecutarLecturaConConexion(async c=>!!await c.getFirstAsync('SELECT sala_id FROM salas_online_locales WHERE usuario_id=? AND sala_id=?',[usuario.id,id]));}
export async function publicarSalaOnline(id:string){
  if(await usuarioDemoActual())return publicarSalaDemo(id);
  const {usuario}=await sesionOnline();await sincronizarCuenta(usuario.id);
  const datos=await ejecutarTransaccion(async c=>{
    const anterior=await c.getFirstAsync<{datos:string}>('SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,'publicar:'+id]);
    if(anterior)return JSON.parse(anterior.datos);
    const sala=await c.getFirstAsync<Sala>('SELECT * FROM salas WHERE id=? AND usuario_id=? AND estado=\'abierta\'',[id,usuario.id]);exigir(sala,'La sala local no está disponible.');
    const personas=await c.getAllAsync<Persona>('SELECT p.* FROM personas p JOIN personas_sala i ON i.persona_id=p.id WHERE i.sala_id=? AND i.usuario_id=?',[id,usuario.id]);
    const propia=personas.find(p=>p.es_usuario_actual);exigir(propia,'No se encontró tu participación.');
    const gastos=await c.getAllAsync<GastoCompartido>('SELECT * FROM gastos_compartidos WHERE sala_id=? AND usuario_id=?',[id,usuario.id]);
    const partes=await c.getAllAsync<ParticipanteGasto>('SELECT p.* FROM participantes_gasto p JOIN gastos_compartidos g ON g.id=p.gasto_compartido_id WHERE g.sala_id=? AND g.usuario_id=? ORDER BY p.orden',[id,usuario.id]);
    const participantes=await c.getAllAsync<{persona_id:string;activa:number}>('SELECT persona_id,activa FROM personas_sala WHERE sala_id=? AND usuario_id=?',[id,usuario.id]);
    const entrada={idOperacion:'publicar:'+id,personaPropiaId:propia.id,sala:{id,nombre:sala.nombre,descripcion:sala.descripcion||'',icono:sala.icono,color:sala.color,fecha:sala.fecha,participantes:personas.map(p=>({id:p.id,nombre:[p.nombre,p.apellido].filter(Boolean).join(' '),activa:!!participantes.find(i=>i.persona_id===p.id)?.activa})),gastos:gastos.map(g=>({id:g.id,pagadorId:g.pagador_id,categoriaId:g.categoria,descripcion:g.descripcion,monto:g.monto_total,fecha:g.fecha,version:g.version,reparto:g.reparto,estado:g.estado,partes:partes.filter(p=>p.gasto_compartido_id===g.id).map(p=>({personaId:p.persona_id,monto:p.monto_correspondiente,orden:p.orden})),pagaron:(JSON.parse(g.plan_pagos) as {pagaron:string[]}).pagaron||[]}))}};
    const financiaciones=gastos.filter(g=>g.estado==='vigente').flatMap(g=>Object.entries(leerPlanGasto(g).financiaciones).map(([clave,seleccion])=>({
      clave:clave==='compra'?'compra:'+g.id:'parte:'+g.id+':'+clave.slice('parte:'.length)+(g.pagador_id===propia.id?':entrada':':salida'),
      ...(seleccion.movimientoId?{movimientoId:seleccion.movimientoId}:{depositoId:seleccion.depositoId}),
    })));
    const publicacion={...entrada,financiaciones};
    await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)',[usuario.id,'publicar:'+id,JSON.stringify(publicacion)]);
    return publicacion;
  });avisarSocialOnline();
  exigir((await obtenerSesionActual()).usuario?.id===usuario.id,'La sesión cambió.');
  try{await solicitarSocial('/salas/publicar',datos);}
  catch(error){
    // Un rechazo transaccional confirmado permite corregir la sala local.
    // Los errores de red conservan el envío para recuperar una respuesta perdida.
    if(error instanceof Error&&'estado' in error&&[400,403,404,409,422].includes(Number(error.estado))){
      await ejecutarTransaccion(c=>c.runAsync('DELETE FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,'publicar:'+id]));avisarSocialOnline();
    }
    throw error;
  }
  await recuperarSalaOnline(id);return {id};
}
export async function recuperarSalaOnline(id:string){if(esRecursoDemo(id)||await usuarioDemoActual())return leerSalaDemo(id);const {usuario}=await sesionOnline();const respuesta=await solicitarSocial<RespuestaSala>('/salas/'+encodeURIComponent(id));exigir((await obtenerSesionActual()).usuario?.id===usuario.id,'La sesión cambió.');await guardarCacheSala(usuario.id,respuesta);return respuesta;}
export async function obtenerSalaOnline(id:string){const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');const sala=(await leerSalasOnline(usuario.id,undefined,id))[0];exigir(sala,'La sala compartida no está descargada.');return finanzasDemo(sala,!!await usuarioDemoActual());}
async function encolar(id:string,comando:Omit<ComandoOnline,'idOperacion'|'versionBase'>,clave=generarIdentificador()){
  if(esRecursoDemo(id)||await usuarioDemoActual()){await comandoDemo(id,{...comando,idOperacion:clave});return;}
  const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión para modificar la sala.');
  const autorizacion=await consultarAutorizacion(usuario.id);exigir(autorizacion&&!autorizacion.revocada,'La instalación fue desvinculada.');
  const resultado=await ejecutarTransaccion(async c=>{
    const actual=(await leerSalasOnline(usuario.id,c)).find(s=>s.sala.id===id);
    exigir(actual&&(actual.administrador||actual.puedeEditarGastos&&['guardar_gasto','guardar_lista','cancelar_gasto'].includes(comando.tipo))&&actual.sala.estado==='abierta'&&!actual.cierrePendiente,'Solo el administrador puede editar una sala abierta sin cierre pendiente.');
    const datos:ComandoOnline={...comando,idOperacion:clave,versionBase:actual.sala.revision};
    const previa=await c.getFirstAsync<{datos:string}>('SELECT datos FROM comandos_sociales_locales WHERE id=? AND usuario_id=?',[clave,usuario.id]);
    if(previa){exigir(JSON.stringify(JSON.parse(previa.datos))===JSON.stringify(datos),'El envío ya contiene otros datos.');return datos;}
    await c.runAsync('INSERT INTO comandos_sociales_locales(id,usuario_id,sala_id,datos,fecha_creacion) VALUES(?,?,?,?,?)',[clave,usuario.id,id,JSON.stringify(datos),new Date().toISOString()]);
    return datos;
  });avisarSocialOnline();return resultado;
}
export async function prepararGastoOnline(datos:BorradorGasto){
  const actual=await obtenerSalaOnline(datos.salaId),sala=actual.sala;exigir((actual.administrador||actual.puedeEditarGastos)&&sala.estado==='abierta'&&!actual.cierrePendiente,'Esta sala es de solo lectura.');
  exigir(CATEGORIAS_EGRESO.some(c=>c.id===datos.categoriaId)&&datos.descripcion.trim().length>0&&datos.descripcion.trim().length<=500,'Completá la descripción y elegí una categoría válida.');
  const persistente=(id:string)=>id==='vos'?actual.personaPropiaId:id;
  const previo=datos.gastoId?sala.gastos.find(g=>g.id===datos.gastoId):null;exigir(!datos.gastoId||previo&&previo.version===datos.version,'El gasto cambió. Volvé a abrirlo.');
  const reparto=repartirGasto({...datos,involucradas:datos.involucradas.map(persistente),montosManuales:Object.fromEntries(Object.entries(datos.montosManuales||{}).map(([id,monto])=>[persistente(id),monto]))},sala.participantes.filter(p=>p.activa||previo?.partes.some(a=>a.personaId===p.id)).map(p=>p.id));
  return {id:datos.gastoId||datos.id||generarIdentificador(),pagadorId:persistente(datos.pagadorId),categoriaId:datos.categoriaId,descripcion:datos.descripcion.trim(),monto:reparto.total/100,fecha:previo?.fecha||new Date().toISOString(),version:previo?.version||1,reparto:datos.reparto as 'iguales'|'manual',estado:'vigente' as const,partes:reparto.partes.map(p=>({personaId:p.personaId,monto:p.centavos/100,orden:p.orden})),pagaron:datos.pagaron.map(persistente)};
}
export async function guardarGastoOnline(datos:BorradorGasto){const gasto=await prepararGastoOnline(datos);await encolar(datos.salaId,{tipo:'guardar_gasto',gasto},datos.claveOperacion);void sincronizarSocialOnline().catch(()=>{});return {id:gasto.id};}
export async function cambiarIntegrantesOnline(id:string,ids:string[]){const actual=await obtenerSalaOnline(id);const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');const personas=await ejecutarLecturaConConexion(c=>c.getAllAsync<Persona>('SELECT * FROM personas WHERE usuario_id=?',[usuario.id]));const seleccionadas=[...new Set([actual.personaPropiaId,...ids.map(p=>p==='vos'?actual.personaPropiaId:p)])];await encolar(id,{tipo:'integrantes',personas:seleccionadas.map(personaId=>({id:personaId,nombre:actual.sala.participantes.find(p=>p.id===personaId)?.nombre||personas.find(p=>p.id===personaId)?.nombre||'Participante'}))});void sincronizarSocialOnline().catch(()=>{});}
export async function cerrarSalaOnline(id:string){if(esRecursoDemo(id)||await usuarioDemoActual()){const actual=await leerSalaDemo(id);if(actual.sala.estado!=='cerrada')await comandoDemo(id,{tipo:'cerrar',idOperacion:'cerrar:'+id});return {id};}await sincronizarSocialOnline();const actual=await obtenerSalaOnline(id);if(actual.sala.estado==='cerrada')return {id};exigir(!actual.pendientes.length,'Esperá a sincronizar los cambios antes de cerrar.');await solicitarSocial('/auth/status');await encolar(id,{tipo:'cerrar'});await sincronizarSocialOnline();const resultado=await obtenerSalaOnline(id);exigir(resultado.sala.estado==='cerrada','El cierre todavía no fue confirmado. Se conserva para recuperar su resultado.');return {id};}
let sincronizando:{usuarioId:string;promesa:Promise<void>;repetir:boolean}|null=null;
let ultimaReconciliacion:{usuarioId:string;fecha:number}|null=null;
export async function sincronizarSocialOnline():Promise<void>{
  if(await usuarioDemoActual()){await prepararOperacionesDemo();return;}
  const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');
  if(sincronizando){
    if(sincronizando.usuarioId===usuario.id){sincronizando.repetir=true;return sincronizando.promesa;}
    await sincronizando.promesa.catch(()=>{});return sincronizarSocialOnline();
  }
  const estado={usuarioId:usuario.id,promesa:Promise.resolve(),repetir:false};
  sincronizando=estado;
  estado.promesa=(async()=>{
    do{
      estado.repetir=false;
      exigir((await obtenerSesionActual()).usuario?.id===estado.usuarioId,'La sesión cambió durante la sincronización social.');
      await ejecutarSincronizacion();
      // Un aviso o comando recibido durante la descarga necesita otra consulta:
      // esperar el envío anterior no garantiza recuperar ese cambio posterior.
    }while(estado.repetir);
  })().finally(()=>{if(sincronizando===estado)sincronizando=null;});
  return estado.promesa;
}
async function ejecutarSincronizacion(){
  const {usuario,token}=await sesionOnline();
  const pedir=async<T>(ruta:string,datos?:unknown):Promise<T>=>{
    exigir((await obtenerSesionActual()).usuario?.id===usuario.id,'La sesión cambió durante la sincronización social.');
    const respuesta=await solicitarRemoto<T>('/social'+ruta,datos,token);
    exigir((await obtenerSesionActual()).usuario?.id===usuario.id,'La sesión cambió durante la sincronización social.');
    return respuesta;
  };
  const recuperar=async(id:string)=>guardarCacheSala(usuario.id,await pedir<RespuestaSala>('/salas/'+encodeURIComponent(id)));
  const selecciones=await ejecutarLecturaConConexion(c=>c.getAllAsync<{clave:string;datos:string}>("SELECT clave,datos FROM datos_sociales_online WHERE usuario_id=? AND clave LIKE 'finanza-pendiente:%'",[usuario.id]));
  if(selecciones.length){await confirmarDatosPrivados(usuario.id);for(const fila of selecciones){const pendiente=JSON.parse(fila.datos) as {salaId:string;datos:Record<string,unknown>;error?:string};if(pendiente.error)continue;try{await pedir('/salas/'+pendiente.salaId+'/mis-finanzas',pendiente.datos);await ejecutarTransaccion(c=>c.runAsync('DELETE FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,fila.clave]));}catch(error){if(error instanceof Error&&'estado' in error&&[400,403,409].includes(Number(error.estado))){await guardarDatosOnline(usuario.id,fila.clave,{...pendiente,error:error.message});continue;}throw error;}}}
  while(true){
    const pendiente=await ejecutarLecturaConConexion(c=>c.getFirstAsync<PendienteOnline>('SELECT id,sala_id,datos,error FROM comandos_sociales_locales WHERE usuario_id=? AND error IS NULL AND sala_id NOT IN (SELECT sala_id FROM comandos_sociales_locales WHERE usuario_id=? AND error IS NOT NULL) ORDER BY secuencia LIMIT 1',[usuario.id,usuario.id]));if(!pendiente)break;
    try{const respuesta=await pedir<{sala:SalaOnline}>('/salas/'+encodeURIComponent(pendiente.sala_id)+'/comandos',JSON.parse(pendiente.datos));await confirmarComandoOnline(usuario.id,pendiente,respuesta.sala);}catch(error){if(error instanceof Error&&'estado' in error&&[400,403,404,409].includes(Number(error.estado))){await ejecutarTransaccion(c=>c.runAsync('UPDATE comandos_sociales_locales SET error=? WHERE id=? AND usuario_id=?',[error.message,pendiente.id,usuario.id]));continue;}throw error;}
  }
  const solicitudes=await ejecutarLecturaConConexion(c=>c.getAllAsync<{clave:string;datos:string}>("SELECT clave,datos FROM datos_sociales_online WHERE usuario_id=? AND clave LIKE 'solicitud-pendiente:%' ORDER BY clave",[usuario.id]));
  for(const fila of solicitudes){
    const pendiente=JSON.parse(fila.datos) as {salaId:string;datos:Record<string,unknown>;error?:string};
    if(pendiente.error)continue;
    try{await pedir('/salas/'+encodeURIComponent(pendiente.salaId)+'/solicitudes',pendiente.datos);await ejecutarTransaccion(c=>c.runAsync('DELETE FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,fila.clave]));}
    catch(error){if(error instanceof Error&&'estado' in error&&[400,403,404,409].includes(Number(error.estado))){await guardarDatosOnline(usuario.id,fila.clave,{...pendiente,error:error.message});continue;}throw error;}
  }
  await guardarDatosOnline(usuario.id,'ingresos',(await pedir<{ingresos?:unknown[]}>('/ingresos')).ingresos||[]);
  const listado=await pedir<{salas:{id:string}[]}>('/salas');
  const permitidas=new Set(listado.salas.map(s=>s.id));
  await ejecutarTransaccion(async c=>{const locales=await c.getAllAsync<{sala_id:string}>('SELECT sala_id FROM salas_online_locales WHERE usuario_id=?',[usuario.id]);for(const local of locales)if(!permitidas.has(local.sala_id))await c.runAsync('DELETE FROM salas_online_locales WHERE usuario_id=? AND sala_id=?',[usuario.id,local.sala_id]);});
  for(const sala of listado.salas)await recuperar(sala.id);
  await guardarDatosOnline(usuario.id,'deudas',(await pedir<{deudas:DeudaOnline[]}>('/deudas')).deudas);
  await guardarDatosOnline(usuario.id,'vinculos',(await pedir<{vinculos:VinculoOnline[]}>('/vinculos')).vinculos);
  const operaciones=(await pedir<{operaciones:OperacionPersonal[]}>('/operaciones-personales')).operaciones;
  for(const operacion of operaciones.filter(o=>o.seleccion&&!o.incorporada)){
    const ya=await ejecutarLecturaConConexion(c=>c.getFirstAsync('SELECT clave FROM incorporaciones_sociales_locales WHERE usuario_id=? AND clave=?',[usuario.id,operacion.clave]));
    if(!ya)try{await incorporarOperacionPersonal(operacion,operacion.seleccion!);}catch{/* Conservada como pendiente en el detalle del gasto. */}
  }
  const locales=await ejecutarLecturaConConexion(c=>c.getAllAsync<{clave:string}>('SELECT clave FROM incorporaciones_sociales_locales WHERE usuario_id=?',[usuario.id]));
  const claves=new Set(locales.map(o=>o.clave));
  await guardarDatosOnline(usuario.id,'operaciones',operaciones.map(o=>({...o,incorporada:o.incorporada||claves.has(o.clave)})));
  const incorporaciones=await ejecutarLecturaConConexion(c=>c.getAllAsync<{clave:string;movimiento_id:string}>('SELECT clave,movimiento_id FROM incorporaciones_sociales_locales WHERE usuario_id=? AND confirmada=0',[usuario.id]));
  if(incorporaciones.length){await sincronizarCuenta(usuario.id);for(const fila of incorporaciones){await pedir('/incorporaciones',{idOperacion:'incorporar:'+usuario.id+':'+fila.clave,clave:fila.clave,movimientoId:fila.movimiento_id});await ejecutarTransaccion(c=>c.runAsync('UPDATE incorporaciones_sociales_locales SET confirmada=1 WHERE usuario_id=? AND clave=?',[usuario.id,fila.clave]));}}
  ultimaReconciliacion={usuarioId:usuario.id,fecha:Date.now()};
}
export async function invitarPersonaOnline(salaId:string,personaId:string){const {usuario}=await sesionOnline();await confirmarDatosPrivados(usuario.id);await sincronizarSocialOnline();const actual=await obtenerSalaOnline(salaId);exigir(actual.administrador&&!actual.pendientes.length,'Confirmá los cambios pendientes de la sala antes de invitar.');const id=personaId==='vos'?actual.personaPropiaId:personaId;const bytes=await Crypto.getRandomBytesAsync(32),token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');return solicitarSocial<{enlace:string}>('/salas/'+encodeURIComponent(salaId)+'/invitaciones',{idOperacion:generarIdentificador(),personaId:id,token});}
export async function aceptarInvitacionOnline(token:string,canje?:string){const {usuario}=await sesionOnline();const clave='canje:'+token.slice(0,16),previo=await leerDatosOnline<string|null>(usuario.id,clave,null),idOperacion=canje||previo||generarIdentificador();if(!previo)await guardarDatosOnline(usuario.id,clave,idOperacion);const respuesta=await solicitarSocial<{salaId:string}>('/invitaciones/aceptar',{token,idOperacion});await recuperarSalaOnline(respuesta.salaId);return respuesta;}
export async function incorporarOperacionPersonal(operacion:OperacionPersonal,seleccion:{depositoId?:string;movimientoId?:string}){
  if(esRecursoDemo(operacion.salaId)||esRecursoDemo(operacion.deudaId)||await usuarioDemoActual())return incorporarDemo(operacion,seleccion);
  const {usuario}=await sesionOnline();
  await ejecutarTransaccion(async c=>{
    if(await c.getFirstAsync('SELECT clave FROM incorporaciones_sociales_locales WHERE usuario_id=? AND clave=?',[usuario.id,operacion.clave]))return;
    const cache=await c.getFirstAsync<{datos:string}>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='deudas'",[usuario.id]);
    const deudas:DeudaOnline[]=cache?JSON.parse(cache.datos):[];
    exigir(!deudas.some(d=>d.id===operacion.deudaId&&d.pagos.some(p=>p.id===operacion.pagoId&&p.estado==='rechazado')), 'El pago fue rechazado. No se genera un movimiento desde ese registro.');
    exigir(Boolean(seleccion.depositoId)!==Boolean(seleccion.movimientoId),'Elegí un depósito o un movimiento existente.');
    let movimientoId=seleccion.movimientoId;
    if(movimientoId){const movimiento=await movimientosRepositorio.consultarPorId(movimientoId,c),deposito=movimiento&&await depositosRepositorio.consultarPorId(movimiento.deposito_id,c);exigir(movimiento&&deposito?.usuario_id===usuario.id&&!movimiento.anulado&&!movimiento.transferencia_id&&!movimiento.reversion_de_id&&movimiento.tipo===operacion.tipo&&Math.round(movimiento.monto*100)===Math.round(operacion.monto*100),'El movimiento debe ser propio y coincidir con el importe y dirección.');exigir(!await c.getFirstAsync('SELECT id FROM pagos_sociales WHERE movimiento_id=?',[movimientoId])&&!await c.getFirstAsync('SELECT id FROM movimientos WHERE reversion_de_id=?',[movimientoId]),'El movimiento ya está vinculado o fue corregido.');}
    else{const deposito=await depositosRepositorio.consultarPorId(seleccion.depositoId!,c);exigir(deposito?.usuario_id===usuario.id&&deposito.activo,'Elegí un depósito propio activo.');movimientoId=(await movimientosRepositorio.crear({deposito_id:deposito.id,tipo:operacion.tipo,categoria:operacion.categoria,monto:operacion.monto,descripcion:operacion.descripcion,fecha_hora:operacion.fecha},c)).id;}
    await c.runAsync('INSERT INTO incorporaciones_sociales_locales(usuario_id,clave,movimiento_id) VALUES(?,?,?)',[usuario.id,operacion.clave,movimientoId]);
    if(operacion.pagoId){
      const envios=await c.getAllAsync<{clave:string;datos:string}>("SELECT clave,datos FROM datos_sociales_online WHERE usuario_id=? AND clave LIKE 'accion:%'",[usuario.id]);
      for(const fila of envios){const envio=JSON.parse(fila.datos) as {ruta:string;envio:{pagoId?:string}};
        if(envio.envio.pagoId===operacion.pagoId||envio.ruta==='/pagos/'+operacion.pagoId+'/decidir')await c.runAsync('DELETE FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,fila.clave]);
      }
    }
  });avisarSocialOnline();void sincronizarSocialOnline().catch(()=>{});
}

export async function guardarListaOnline(lista:BorradorGasto[]){const gastos=[];for(const datos of lista)gastos.push(await prepararGastoOnline(datos));await encolar(lista[0].salaId,{tipo:'guardar_lista',gastos},'lista:'+lista[0].claveOperacion);void sincronizarSocialOnline().catch(()=>{});return gastos.map(g=>({id:g.id}));}

/** Conserva el identificador y el contenido al perder la respuesta HTTP. */
export async function enviarAccionSocial<T>(clave:string,ruta:string,datos:Record<string,unknown>,alConfirmar?:(resultado:T)=>Promise<void>,metadatos?:Record<string,unknown>):Promise<T>{
  if(esRutaDemo(ruta)||await usuarioDemoActual())return accionDemo(ruta,datos) as Promise<T>;
  const {usuario}=await sesionOnline(),almacen='accion:'+clave;
  const contenido=await ejecutarTransaccion(async c=>{
    const fila=await c.getFirstAsync<{datos:string}>('SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,almacen]);
    if(fila){
      const anterior=JSON.parse(fila.datos) as {ruta:string;entrada:Record<string,unknown>;envio:Record<string,unknown>;metadatos?:Record<string,unknown>};
      exigir(anterior.ruta===ruta&&JSON.stringify(anterior.entrada)===JSON.stringify(datos),'Hay un envío pendiente con otro contenido. Reintentá primero el importe original.');
      if(metadatos){
        exigir(!anterior.metadatos||JSON.stringify(anterior.metadatos)===JSON.stringify(metadatos),'Hay un pago pendiente con otro depósito. Reintentá con el depósito elegido inicialmente.');
        if(!anterior.metadatos)await c.runAsync('UPDATE datos_sociales_online SET datos=? WHERE usuario_id=? AND clave=?',[JSON.stringify({...anterior,metadatos}),usuario.id,almacen]);
      }
      return anterior.envio;
    }
    const envio={...datos,idOperacion:generarIdentificador(),...(ruta.endsWith('/pagos')?{pagoId:generarIdentificador()}:{}),...(ruta.endsWith('/solicitudes')?{solicitudId:generarIdentificador()}:{})};
    await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)',[usuario.id,almacen,JSON.stringify({ruta,entrada:datos,envio,...(metadatos?{metadatos}:{})})]);return envio;
  });
  exigir((await obtenerSesionActual()).usuario?.id===usuario.id,'La sesión cambió.');
  let respuesta:T;
  try{respuesta=await solicitarSocial<T>(ruta,contenido);}
  catch(error){
    // Un rechazo confirmado permite corregir el formulario. Un fallo de red
    // conserva el envío y su identificador para recuperar un resultado incierto.
    if(error instanceof Error&&'estado' in error&&[400,403,404,409,422].includes(Number(error.estado)))await ejecutarTransaccion(c=>c.runAsync('DELETE FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,almacen]));
    throw error;
  }
  if(alConfirmar)await alConfirmar(respuesta);
  await ejecutarTransaccion(c=>c.runAsync('DELETE FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,almacen]));
  return respuesta;
}
export async function guardarSolicitudOnline(salaId:string,texto:string){
  if(esRecursoDemo(salaId)||await usuarioDemoActual()){exigir(texto.trim().length>0&&texto.length<=500,'Escribí una observación de hasta 500 caracteres.');await accionDemo('/salas/'+salaId+'/solicitudes',{texto:texto.trim()});return {id:generarIdentificador()};}
  const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');await obtenerSalaOnline(salaId);
  exigir(texto.trim().length>0&&texto.length<=500,'Escribí una observación de hasta 500 caracteres.');
  const id=generarIdentificador();
  await guardarDatosOnline(usuario.id,'solicitud-pendiente:'+id,{salaId,fecha:new Date().toISOString(),datos:{idOperacion:id,solicitudId:id,texto:texto.trim()}});
  void sincronizarSocialOnline().catch(()=>{});return {id};
}
export async function consultarSolicitudesPendientes(salaId:string){
  const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');
  return ejecutarLecturaConConexion(async c=>(await c.getAllAsync<{clave:string;datos:string}>("SELECT clave,datos FROM datos_sociales_online WHERE usuario_id=? AND clave LIKE 'solicitud-pendiente:%'",[usuario.id])).map(f=>({clave:f.clave,...JSON.parse(f.datos) as {salaId:string;datos:{texto:string};error?:string}})).filter(f=>f.salaId===salaId));
}
export async function resolverConflictoSala(id:string,decision:'reaplicar'|'descartar'){
  const {usuario}=await sesionOnline(),remota=await recuperarSalaOnline(id);
  exigir(remota.administrador||decision==='descartar'||remota.puedeEditarGastos,'Necesitás permiso para reenviar cambios de gastos.');
  await ejecutarTransaccion(async c=>{
    const filas=await c.getAllAsync<PendienteOnline>('SELECT id,sala_id,datos,error FROM comandos_sociales_locales WHERE usuario_id=? AND sala_id=? ORDER BY secuencia',[usuario.id,id]);
    exigir(filas.some(f=>f.error),'No hay conflictos para revisar.');
    if(!remota.administrador&&decision==='reaplicar')exigir(filas.every(f=>['guardar_gasto','guardar_lista','cancelar_gasto'].includes((JSON.parse(f.datos) as ComandoOnline).tipo)),'Solo podés reenviar tus cambios de gastos.');
    exigir(decision==='descartar'||remota.sala.estado==='abierta','La sala ya cerró. Conservá los cambios en el archivo de revisión.');
    await c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?)',[usuario.id,'revision:'+generarIdentificador(),JSON.stringify({salaId:id,fecha:new Date().toISOString(),decision,filas})]);
    await c.runAsync('DELETE FROM comandos_sociales_locales WHERE usuario_id=? AND sala_id=?',[usuario.id,id]);
    if(decision==='descartar')return;
    let revision=remota.sala.revision;const versiones=new Map(remota.sala.gastos.map(g=>[g.id,g.version]));
    for(const fila of filas){
      const comando=JSON.parse(fila.datos) as ComandoOnline;
      comando.idOperacion=generarIdentificador();comando.versionBase=revision++;
      for(const gasto of [...(comando.gasto?[comando.gasto]:[]),...(comando.gastos||[])]){const previa=versiones.get(gasto.id);gasto.version=previa||1;versiones.set(gasto.id,previa?previa+1:1);}
      await c.runAsync('INSERT INTO comandos_sociales_locales(id,usuario_id,sala_id,datos,fecha_creacion) VALUES(?,?,?,?,?)',[comando.idOperacion,usuario.id,id,JSON.stringify(comando),new Date().toISOString()]);
    }
  });avisarSocialOnline();await sincronizarSocialOnline();
}
export async function consultarMovimientosOnline(operacion:OperacionPersonal){
  const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');
  return ejecutarLecturaConConexion(c=>c.getAllAsync<{id:string;descripcion:string;fecha_hora:string;deposito:string}>(`SELECT m.id,m.descripcion,m.fecha_hora,d.nombre AS deposito FROM movimientos m JOIN depositos d ON d.id=m.deposito_id
    WHERE d.usuario_id=? AND m.tipo=? AND ROUND(m.monto*100)=? AND m.anulado=0 AND m.transferencia_id IS NULL AND m.reversion_de_id IS NULL
    AND NOT EXISTS(SELECT 1 FROM movimientos r WHERE r.reversion_de_id=m.id)
    AND NOT EXISTS(SELECT 1 FROM pagos_sociales p WHERE p.movimiento_id=m.id)
    AND NOT EXISTS(SELECT 1 FROM incorporaciones_sociales_locales i WHERE i.movimiento_id=m.id) ORDER BY m.fecha_hora DESC`,[usuario.id,operacion.tipo,Math.round(operacion.monto*100)]));
}

export async function recuperarEventosSociales(forzar=false){
  const {usuario}=await sesionOnline(),salas=await leerSalasOnline(usuario.id),deudas=await leerDatosOnline<DeudaOnline[]>(usuario.id,'deudas',[]);
  const canales=['usuario:'+usuario.id,...salas.map(s=>'sala:'+s.sala.id),...deudas.filter(d=>!d.salaId).map(d=>'deuda:'+d.id)];
  const cursores=await leerDatosOnline<Record<string,number>>(usuario.id,'cursores-eventos',{});
  const anteriores=JSON.stringify(cursores);let novedades=false;
  for(const canal of canales){
    if(cursores[canal]===undefined){cursores[canal]=0;novedades=true;}
    let mas=true;
    while(mas){
      let respuesta:{eventos:{id:number}[];mas:boolean};
      try{respuesta=await solicitarSocial('/eventos?canal='+encodeURIComponent(canal)+'&desde='+(cursores[canal]||0));}
      catch(error){
        // Un canal retirado no debe impedir recuperar el listado autorizado.
        // Los errores de sesión y de red siguen conservando la copia offline.
        if(error instanceof Error&&'estado' in error&&[403,404].includes(Number(error.estado))&&(canal.startsWith('sala:')||canal.startsWith('deuda:'))){delete cursores[canal];novedades=true;break;}
        throw error;
      }
      for(const evento of respuesta.eventos){exigir(Number.isSafeInteger(evento.id)&&evento.id>0,'Evento inválido.');if(evento.id>(cursores[canal]||0)){cursores[canal]=evento.id;novedades=true;}}
      mas=respuesta.mas&&respuesta.eventos.length>0;
    }
  }
  const pendientes=await ejecutarLecturaConConexion(c=>c.getFirstAsync(`SELECT 1 FROM comandos_sociales_locales WHERE usuario_id=? AND error IS NULL
    UNION ALL SELECT 1 FROM incorporaciones_sociales_locales WHERE usuario_id=? AND confirmada=0
    UNION ALL SELECT 1 FROM datos_sociales_online WHERE usuario_id=? AND (clave LIKE 'finanza-pendiente:%' OR clave LIKE 'solicitud-pendiente:%') AND json_extract(datos,'$.error') IS NULL LIMIT 1`,[usuario.id,usuario.id,usuario.id]));
  // Los eventos mantienen la inmediatez; la revisión completa periódica cubre
  // altas de canales y cambios anteriores al cursor sin descargar todo cada 15 s.
  if(forzar||novedades||pendientes||ultimaReconciliacion?.usuarioId!==usuario.id||Date.now()<ultimaReconciliacion.fecha||Date.now()-ultimaReconciliacion.fecha>=60000)await sincronizarSocialOnline();
  if(JSON.stringify(cursores)!==anteriores)await guardarDatosOnline(usuario.id,'cursores-eventos',cursores);
  const actuales=await leerSalasOnline(usuario.id),deudasActuales=await leerDatosOnline<DeudaOnline[]>(usuario.id,'deudas',[]);
  return ['usuario:'+usuario.id,...actuales.map(s=>'sala:'+s.sala.id),...deudasActuales.filter(d=>!d.salaId).map(d=>'deuda:'+d.id)];
}

export async function consultarRevisionesSala(salaId:string){
  const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');
  return ejecutarLecturaConConexion(async c=>(await c.getAllAsync<{clave:string;datos:string}>("SELECT clave,datos FROM datos_sociales_online WHERE usuario_id=? AND clave LIKE 'revision:%'",[usuario.id])).map(f=>({clave:f.clave,...JSON.parse(f.datos) as {salaId:string;fecha:string;filas:PendienteOnline[]}})).filter(f=>f.salaId===salaId));
}

export async function cambiarPermisoGastos(salaId:string,personaId:string,puedeEditar:boolean){await encolar(salaId,{tipo:'permisos',personaId,puedeEditar});await sincronizarSocialOnline();}


async function confirmarDatosPrivados(usuarioId:string){
  await sincronizarCuenta(usuarioId);
  const pendiente=await ejecutarLecturaConConexion(c=>c.getFirstAsync('SELECT secuencia FROM sync_outbox WHERE usuario_id=? LIMIT 1',[usuarioId]));
  exigir(!pendiente,'Tus registros todavía tienen cambios pendientes de sincronizar.');
}

export async function proponerDeudaOnline(deudaId:string) {
  const {usuario}=await sesionOnline();
  await confirmarDatosPrivados(usuario.id);
  const resultado=await solicitarSocial('/deudas/propuestas',{idOperacion:'propuesta:'+deudaId,propuestaId:'deuda:'+deudaId,deudaLocalId:deudaId});
  await sincronizarSocialOnline();
  return resultado;
}

export async function solicitarVinculoOnline(personaId:string,correo:string){
  const {usuario}=await sesionOnline();await confirmarDatosPrivados(usuario.id);
  const clave='solicitar-vinculo:'+personaId+':'+correo.trim().toLowerCase();
  const vinculos=await leerDatosOnline<VinculoOnline[]>(usuario.id,'vinculos',[]);
  if(vinculos.some(v=>v.persona_id===personaId&&['rechazado','cancelado'].includes(v.estado)))
    await ejecutarTransaccion(c=>c.runAsync('DELETE FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuario.id,'accion:'+clave]));
  const resultado=await enviarAccionSocial(clave,'/vinculos/solicitar',{personaId,correo:correo.trim().toLowerCase()});
  await sincronizarSocialOnline();return resultado;
}
export async function responderVinculoOnline(id:string,decision:'aceptado'|'rechazado'){
  await enviarAccionSocial('responder-vinculo:'+id,'/vinculos/'+encodeURIComponent(id)+'/responder',{decision});await sincronizarSocialOnline();
}
export async function cancelarVinculoOnline(id:string){
  await enviarAccionSocial('cancelar-vinculo:'+id,'/vinculos/'+encodeURIComponent(id)+'/cancelar',{});await sincronizarSocialOnline();
}


async function pagoConDeposito(clave:string,ruta:string,datos:Record<string,unknown>,depositoId:string,tipo:'ingreso'|'egreso'){
  return pagoConSeleccion(clave,ruta,datos,{depositoId},tipo);
}
async function pagoConSeleccion(clave:string,ruta:string,datos:Record<string,unknown>,seleccion:{depositoId?:string;movimientoId?:string},tipo:'ingreso'|'egreso'){
  if(esRutaDemo(ruta)||await usuarioDemoActual())return accionDemo(ruta,{...datos,...seleccion});
  const {usuario}=await sesionOnline();
  exigir(Boolean(seleccion.depositoId)!==Boolean(seleccion.movimientoId),'Elegí un depósito o un movimiento existente.');
  if(seleccion.depositoId){const deposito=await depositosRepositorio.consultarPorId(seleccion.depositoId);exigir(deposito?.usuario_id===usuario.id&&deposito.activo,'Elegí un depósito propio activo.');}
  if(seleccion.movimientoId){const movimiento=await movimientosRepositorio.consultarPorId(seleccion.movimientoId);const deposito=movimiento&&await depositosRepositorio.consultarPorId(movimiento.deposito_id);exigir(movimiento&&deposito?.usuario_id===usuario.id&&!movimiento.anulado&&!movimiento.transferencia_id&&!movimiento.reversion_de_id&&movimiento.tipo===tipo,'Elegí un movimiento propio compatible.');const cache=await leerDatosOnline<DeudaOnline[]>(usuario.id,'deudas',[]);const monto=typeof datos.monto==='number'?datos.monto:cache.flatMap(d=>d.pagos).find(p=>p.id===ruta.split('/')[2])?.monto;exigir(typeof monto==='number'&&Math.round(movimiento.monto*100)===Math.round(monto*100),'El importe no coincide con el movimiento.');const previo=await leerDatosOnline<{ruta:string;metadatos?:unknown}|null>(usuario.id,'accion:'+clave,null);if(!previo){const permitidos=await consultarMovimientosOnline({clave:'validar',tipo,monto,categoria:tipo==='ingreso'?'devoluciones':'deudas',descripcion:'Pago',fecha:new Date().toISOString(),salaId:null});exigir(permitidos.some(m=>m.id===seleccion.movimientoId),'El movimiento ya está vinculado o fue corregido.');}}
  return enviarAccionSocial<{pagoId:string}>(clave,ruta,datos,async resultado=>{
    await sincronizarSocialOnline();
    const operaciones=await leerDatosOnline<OperacionPersonal[]>(usuario.id,'operaciones',[]);
    const operacion=operaciones.find(o=>o.pagoId===resultado.pagoId&&o.tipo===tipo);
    exigir(operacion,'El pago está registrado online. Falta recuperar su movimiento para incorporarlo.');
    await incorporarOperacionPersonal(operacion,seleccion);
  },seleccion);
}
export const informarPagoConDeposito=(deudaId:string,monto:number,depositoId:string)=>pagoConDeposito('pago:'+deudaId,'/deudas/'+deudaId+'/pagos',{monto},depositoId,'egreso');
export const confirmarPagoConDeposito=(pagoId:string,depositoId:string)=>pagoConDeposito('pago-decision:'+pagoId,'/pagos/'+pagoId+'/decidir',{decision:'confirmado'},depositoId,'ingreso');

export function enlaceGlobalSala(codigo:string){return new URL(URL_SERVIDOR).origin+'/invitacion/#sala='+codigo;}
export async function configurarAccesoSala(salaId:string,contrasena:string,opciones:{renovar?:boolean;habilitado?:boolean}={}){
 await enviarAccionSocial('acceso:'+salaId,'/salas/'+salaId+'/acceso',{contrasena,...opciones});await recuperarSalaOnline(salaId);
}
export async function solicitarIngresoSala(codigo:string,nombre:string,contrasena:string){
 if(await usuarioDemoActual())return solicitarIngresoDemo(codigo,nombre,contrasena);
 const resultado=await enviarAccionSocial<{id:string|null;estado:string;salaId:string}>('ingreso:'+codigo,'/accesos/'+codigo+'/solicitar',{nombre,contrasena});
 await sincronizarSocialOnline();return resultado;
}
export async function consultarIngresosSala(){return (await solicitarSocial<{ingresos:{id:string;salaId:string;nombre:string;estado:string}[]}>('/ingresos')).ingresos;}
export async function decidirIngresoSala(id:string,decision:'aceptada'|'rechazada',personaId?:string,recuperar=false){
 if(esRecursoDemo(id)||await usuarioDemoActual()){await accionDemo('/ingresos/'+id+'/decidir',{decision,personaId,recuperar});return;}
 await confirmarDatosPrivados((await sesionOnline()).usuario.id);
 await enviarAccionSocial('admision:'+id,'/ingresos/'+id+'/decidir',{decision,...(personaId?{personaId}:{}),recuperar});await sincronizarSocialOnline();
}
export async function marcarPartePagada(salaId:string,gastoId:string,personaId:string,pagada:boolean){const actual=await obtenerSalaOnline(salaId);await encolar(salaId,{tipo:'parte_pagada',gastoId,personaId:personaId==='vos'?actual.personaPropiaId:personaId,pagada});void sincronizarSocialOnline().catch(()=>{});}
export async function informarPartePagada(salaId:string,gastoId:string){
 await enviarAccionSocial('aviso:'+gastoId,'/salas/'+salaId+'/solicitudes',{tipo:'parte_pagada',gastoId});await sincronizarSocialOnline();
}
export async function elegirFinanciacionSala(salaId:string,opcion:OperacionPersonal,seleccion:{depositoId?:string;movimientoId?:string},quitar=false){
 if(esRecursoDemo(salaId)||await usuarioDemoActual())return seleccionarFinanzasDemo(salaId,opcion,seleccion,quitar);
 const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');
 if(seleccion.depositoId){const deposito=await depositosRepositorio.consultarPorId(seleccion.depositoId);exigir(deposito?.usuario_id===usuario.id&&deposito.activo,'Elegí un depósito propio activo.');}
 const clave='finanza-pendiente:'+salaId+':'+opcion.clave;
 await guardarDatosOnline(usuario.id,clave,{salaId,datos:{clave:opcion.clave,huella:opcion.huella,...seleccion,quitar,idOperacion:generarIdentificador()}});
 const actual=await obtenerSalaOnline(salaId);
 await guardarCacheSala(usuario.id,{...actual,misFinanzas:actual.misFinanzas?.map(o=>o.clave===opcion.clave?{...o,seleccion:quitar?undefined:seleccion,necesitaRevision:false}:o)});
 void sincronizarSocialOnline().catch(()=>{});
}

export const registrarPagoConSeleccion=(id:string,monto:number,seleccion:{depositoId?:string;movimientoId?:string},esIngreso:boolean)=>pagoConSeleccion('pago:'+id,'/deudas/'+id+'/pagos',{monto},seleccion,esIngreso?'ingreso':'egreso');
export const confirmarPagoConSeleccion=(id:string,seleccion:{depositoId?:string;movimientoId?:string})=>pagoConSeleccion('pago-decision:'+id,'/pagos/'+id+'/decidir',{decision:'confirmado'},seleccion,'ingreso');
export async function consultarMovimientosSociales(){const {usuario}=await obtenerSesionActual();exigir(usuario,'Iniciá sesión.');return ejecutarLecturaConConexion(c=>c.getAllAsync<{clave:string;movimiento_id:string}>('SELECT clave,movimiento_id FROM incorporaciones_sociales_locales WHERE usuario_id=?',[usuario.id]));}

export async function perdonarDeudaOnline(id:string,pendienteEsperado:number){await enviarAccionSocial('perdonar:'+id,'/deudas/'+id+'/perdonar',{pendienteEsperado});await sincronizarSocialOnline();}
