import { ejecutarConConexion } from '../database/connectionQueue';
import { obtenerSesionActual } from '../authentication/sessionService';
import { prepararCuentaLocal, aplicarCambios } from './journal';
import { ErrorRemoto, URL_SERVIDOR, disponibilidadServidor, obtenerSesionRemota, solicitarRemoto } from './remote';
import { TABLAS_SYNC, type CambioSync, type VersionSync } from './protocol';
import {consultarAutorizacion,marcarRevocada,esPruebaLocal} from './deviceAuthorization';
import {contarRegistrosPendientes} from './pendingService';

export type EstadoSync='local'|'comprobando'|'sincronizando'|'offline'|'online'|'sesion'|'conflicto'|'revocado';
export interface VistaSync {estado:EstadoSync;pendientes:number;detalle?:string;}
let vista:VistaSync={estado:'comprobando',pendientes:0},enCurso:{usuarioId:string;promesa:Promise<void>}|null=null;
const oyentes=new Set<(v:VistaSync)=>void>();
export const observarSincronizacion=(oyente:(v:VistaSync)=>void)=>{oyentes.add(oyente);oyente(vista);return()=>{oyentes.delete(oyente);};};
export const obtenerVistaSincronizacion=()=>vista;
export async function actualizarCantidadPendientes(){
  const {usuario}=await obtenerSesionActual();if(!usuario)return;
  if(esPruebaLocal(await consultarAutorizacion(usuario.id),usuario.correo_electronico))return;
  const pendientes=await contarRegistrosPendientes(usuario.id);
  publicar({...vista,pendientes});
}
function publicar(v:VistaSync){vista=v;for(const oyente of oyentes)oyente(v);}
let comprobandoConexion=false;
// Sonda ligera: no descarga lotes ni muestra carga cuando la conexión sigue bien.
export async function comprobarConexionServidor():Promise<boolean>{
  if(comprobandoConexion||enCurso||!URL_SERVIDOR)return false;
  comprobandoConexion=true;
  try{
    const {usuario}=await obtenerSesionActual();if(!usuario)return false;
    if(esPruebaLocal(await consultarAutorizacion(usuario.id),usuario.correo_electronico))return false;
    const inicial=vista;
    try{
      await solicitarRemoto('/health',undefined,undefined,2500);
      if((await obtenerSesionActual()).usuario?.id!==usuario.id)return false;
      return vista.estado==='offline';
    }catch(error){
      if(error instanceof ErrorRemoto&&error.estado===0&&vista===inicial&&(await obtenerSesionActual()).usuario?.id===usuario.id){
        publicar({...vista,estado:'offline',detalle:'Sin conexión con el servidor. Tus datos se conservan localmente.'});
      }
      return false;
    }
  }finally{comprobandoConexion=false;}
}
function validarVersiones(entrada:unknown):{lotes:VersionSync[];mas:boolean} {
  if(!entrada||typeof entrada!=='object'||!('lotes' in entrada)||!Array.isArray(entrada.lotes)||!('mas' in entrada)||typeof entrada.mas!=='boolean')throw new Error('Respuesta de sincronización inválida.');
  for(const version of entrada.lotes) {
    if(!version||!Number.isSafeInteger(version.revision)||version.revision<=0||!version.lote||!Array.isArray(version.lote.cambios))throw new Error('Lote remoto inválido.');
    for(const c of version.lote.cambios)if(!TABLAS_SYNC.includes(c.tabla)||!['guardar','eliminar'].includes(c.accion)||!c.datos||typeof c.datos.id!=='string')throw new Error('Registro remoto inválido.');
  }
  return entrada as {lotes:VersionSync[];mas:boolean};
}
async function ejecutar(usuarioId:string,silenciosa=false) {
  let pendientes=0;
  try {
    if(!usuarioId){publicar({estado:'local',pendientes:0});return;}
    const autorizacion=await consultarAutorizacion(usuarioId);
    if(autorizacion?.revocada){
      const n=await contarRegistrosPendientes(usuarioId);
      publicar({estado:'revocado',pendientes:n,detalle:'Instalación desvinculada. Pendientes conservados.'});return;
    }
    const actual=await obtenerSesionActual();
    if(actual.usuario&&esPruebaLocal(autorizacion,actual.usuario.correo_electronico)){publicar({estado:'local',pendientes:0});return;}
    const remota=await obtenerSesionRemota(usuarioId);
    await ejecutarConConexion(c=>prepararCuentaLocal(c,usuarioId));
    const contar=()=>contarRegistrosPendientes(usuarioId);
    pendientes=await contar();
    if(!remota){
      if(!URL_SERVIDOR){publicar({estado:'local',pendientes});return;}
      try{await solicitarRemoto('/health');}catch{/* La disponibilidad se informa sin confundirla con una sesión vencida. */}
      publicar({estado:disponibilidadServidor()===false?'offline':'sesion',pendientes});return;
    }
    const reconectando=vista.estado==='offline'||vista.estado==='comprobando';
    if(pendientes||!silenciosa||vista.estado!=='online')publicar({estado:reconectando||!pendientes?'comprobando':'sincronizando',pendientes});
    await solicitarRemoto('/auth/status',undefined,remota.token);
    if(pendientes)publicar({estado:'sincronizando',pendientes});
    // Un único consumidor. Nunca usar Promise.all para enviar estos lotes.
    while(true) {
      if((await obtenerSesionActual()).usuario?.id!==usuarioId)return;
      const fila=await ejecutarConConexion(c=>c.getFirstAsync<{lote:string}>('SELECT lote FROM sync_outbox WHERE usuario_id=? ORDER BY secuencia LIMIT 1',[usuarioId]));
      if(!fila)break;
      const datos=await ejecutarConConexion(async c=>({generacion:(await c.getFirstAsync<{generacion:number}>('SELECT generacion FROM sync_batch_authorization WHERE usuario_id=? AND lote=?',[usuarioId,fila.lote]))?.generacion,base:Number((await c.getFirstAsync<{revision:number}>('SELECT revision FROM sync_state WHERE usuario_id=?',[usuarioId]))?.revision||0),filas:await c.getAllAsync<{cambio:string}>('SELECT cambio FROM sync_outbox WHERE usuario_id=? AND lote=? ORDER BY secuencia',[usuarioId,fila.lote])}));
      if(datos.generacion!==remota.generacion)throw new ErrorRemoto(409,'Hay cambios de otra autorización. Se conservan sin enviarlos.','generacion_distinta');
      const cambios=datos.filas.map(f=>JSON.parse(f.cambio) as CambioSync);
      const respuesta=await solicitarRemoto<{revision:number}>('/sync',{id:fila.lote,base:datos.base,generacion:datos.generacion,cambios},remota.token);
      if((await obtenerSesionActual()).usuario?.id!==usuarioId)return;
      if(!Number.isSafeInteger(respuesta.revision)||respuesta.revision!==datos.base+1)throw new ErrorRemoto(409,'La revisión del servidor no coincide.');
      await ejecutarConConexion(c=>c.withTransactionAsync(async()=>{
        await c.runAsync('DELETE FROM sync_outbox WHERE usuario_id=? AND lote=?',[usuarioId,fila.lote]);
        await c.runAsync('DELETE FROM sync_batch_authorization WHERE usuario_id=? AND lote=?',[usuarioId,fila.lote]);
        await c.runAsync('UPDATE sync_state SET revision=? WHERE usuario_id=?',[respuesta.revision,usuarioId]);
      }));
      pendientes=await contar();publicar({estado:'sincronizando',pendientes});
    }
    let mas=true;
    while(mas) {
      if((await obtenerSesionActual()).usuario?.id!==usuarioId)return;
      const revision=await ejecutarConConexion(async c=>Number((await c.getFirstAsync<{revision:number}>('SELECT revision FROM sync_state WHERE usuario_id=?',[usuarioId]))?.revision||0));
      const respuesta=validarVersiones(await solicitarRemoto<unknown>(`/sync?desde=${revision}`,undefined,remota.token));
      if(respuesta.lotes.length)publicar({estado:'sincronizando',pendientes});
      if((await obtenerSesionActual()).usuario?.id!==usuarioId)return;
      for(const version of respuesta.lotes) {
        await ejecutarConConexion(c=>c.withTransactionAsync(async()=>{
          // Si hubo una edición mientras esperábamos la red, no sobrescribirla.
          if(await c.getFirstAsync('SELECT secuencia FROM sync_outbox WHERE usuario_id=? LIMIT 1',[usuarioId]))throw new ErrorRemoto(409,'Hay nuevos cambios locales pendientes.','pendientes_nuevos');
          const actual=Number((await c.getFirstAsync<{revision:number}>('SELECT revision FROM sync_state WHERE usuario_id=?',[usuarioId]))?.revision||0);
          if(version.revision!==actual+1)throw new Error('Secuencia remota incompleta.');
          await aplicarCambios(c,version.lote.cambios);
          await c.runAsync('UPDATE sync_state SET revision=? WHERE usuario_id=?',[version.revision,usuarioId]);
        }));
      }mas=respuesta.mas;
      if(mas&&!respuesta.lotes.length)throw new Error('Paginación remota inválida.');
    }
    pendientes=await contar();
    if(!pendientes&&(await obtenerSesionActual()).usuario?.id===usuarioId){
      await ejecutarConConexion(c=>c.runAsync('INSERT INTO sync_last_success(usuario_id,fecha) VALUES(?,?) ON CONFLICT(usuario_id) DO UPDATE SET fecha=excluded.fecha',[usuarioId,new Date().toISOString()]));
    }
    publicar({estado:pendientes?'sincronizando':'online',pendientes});
  } catch(error) {
    if(error instanceof ErrorRemoto&&error.codigo==='pendientes_nuevos')return ejecutar(usuarioId,silenciosa);
    if(error instanceof ErrorRemoto&&['dispositivo_revocado','generacion_distinta'].includes(error.codigo||'')){
      const eraActual=(await obtenerSesionActual()).usuario?.id===usuarioId;
      await marcarRevocada(usuarioId);
      if(eraActual)publicar({estado:'revocado',pendientes,detalle:error.message});
      return;
    }
    publicar({estado:error instanceof ErrorRemoto?(error.estado===0?'offline':error.estado===401?'sesion':'conflicto'):'conflicto',pendientes,detalle:error instanceof Error?error.message:'No se pudo sincronizar.'});
  }
}
export function sincronizarCuenta(usuarioId:string,silenciosa=false):Promise<void> {
  if(enCurso)return enCurso.usuarioId===usuarioId?enCurso.promesa:enCurso.promesa.then(()=>sincronizarCuenta(usuarioId,silenciosa));
  const promesa=ejecutar(usuarioId,silenciosa).finally(()=>{enCurso=null;});enCurso={usuarioId,promesa};return promesa;
}
export async function sincronizarSesion(silenciosa=false){const {usuario}=await obtenerSesionActual();if(!usuario&&vista.estado==='revocado')return;return sincronizarCuenta(usuario?.id||'',silenciosa);}
