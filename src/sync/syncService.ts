import { ejecutarConConexion } from '../database/connectionQueue';
import { obtenerSesionActual } from '../authentication/sessionService';
import { prepararCuentaLocal, aplicarCambios } from './journal';
import { ErrorRemoto, URL_SERVIDOR, disponibilidadServidor, obtenerSesionRemota, solicitarRemoto } from './remote';
import { TABLAS_SYNC, type CambioSync, type VersionSync } from './protocol';

export type EstadoSync='local'|'comprobando'|'sincronizando'|'offline'|'online'|'sesion'|'conflicto';
export interface VistaSync {estado:EstadoSync;pendientes:number;detalle?:string;}
let vista:VistaSync={estado:'comprobando',pendientes:0},enCurso:{usuarioId:string;promesa:Promise<void>}|null=null;
const oyentes=new Set<(v:VistaSync)=>void>();
export const observarSincronizacion=(oyente:(v:VistaSync)=>void)=>{oyentes.add(oyente);oyente(vista);return()=>{oyentes.delete(oyente);};};
function publicar(v:VistaSync){vista=v;for(const oyente of oyentes)oyente(v);}
function validarVersiones(entrada:unknown):{lotes:VersionSync[];mas:boolean} {
  if(!entrada||typeof entrada!=='object'||!('lotes' in entrada)||!Array.isArray(entrada.lotes)||!('mas' in entrada)||typeof entrada.mas!=='boolean')throw new Error('Respuesta de sincronización inválida.');
  for(const version of entrada.lotes) {
    if(!version||!Number.isSafeInteger(version.revision)||version.revision<=0||!version.lote||!Array.isArray(version.lote.cambios))throw new Error('Lote remoto inválido.');
    for(const c of version.lote.cambios)if(!TABLAS_SYNC.includes(c.tabla)||!['guardar','eliminar'].includes(c.accion)||!c.datos||typeof c.datos.id!=='string')throw new Error('Registro remoto inválido.');
  }
  return entrada as {lotes:VersionSync[];mas:boolean};
}
async function ejecutar(usuarioId:string) {
  let pendientes=0;
  try {
    if(!usuarioId){publicar({estado:'local',pendientes:0});return;}
    const remota=await obtenerSesionRemota(usuarioId);
    await ejecutarConConexion(c=>prepararCuentaLocal(c,usuarioId));
    const contar=()=>ejecutarConConexion(async c=>Number((await c.getFirstAsync<{n:number}>('SELECT COUNT(DISTINCT lote) AS n FROM sync_outbox WHERE usuario_id=?',[usuarioId]))?.n||0));
    pendientes=await contar();
    if(!remota){
      if(!URL_SERVIDOR){publicar({estado:'local',pendientes});return;}
      try{await solicitarRemoto('/health');}catch{/* La disponibilidad se informa sin confundirla con una sesión vencida. */}
      publicar({estado:disponibilidadServidor()===false?'offline':'sesion',pendientes});return;
    }
    publicar({estado:pendientes?'sincronizando':'comprobando',pendientes});
    // Un único consumidor. Nunca usar Promise.all para enviar estos lotes.
    while(true) {
      if((await obtenerSesionActual()).usuario?.id!==usuarioId)return;
      const fila=await ejecutarConConexion(c=>c.getFirstAsync<{lote:string}>('SELECT lote FROM sync_outbox WHERE usuario_id=? ORDER BY secuencia LIMIT 1',[usuarioId]));
      if(!fila)break;
      const datos=await ejecutarConConexion(async c=>({base:Number((await c.getFirstAsync<{revision:number}>('SELECT revision FROM sync_state WHERE usuario_id=?',[usuarioId]))?.revision||0),filas:await c.getAllAsync<{cambio:string}>('SELECT cambio FROM sync_outbox WHERE usuario_id=? AND lote=? ORDER BY secuencia',[usuarioId,fila.lote])}));
      const cambios=datos.filas.map(f=>JSON.parse(f.cambio) as CambioSync);
      const respuesta=await solicitarRemoto<{revision:number}>('/sync',{id:fila.lote,base:datos.base,cambios},remota.token);
      if((await obtenerSesionActual()).usuario?.id!==usuarioId)return;
      if(!Number.isSafeInteger(respuesta.revision)||respuesta.revision!==datos.base+1)throw new ErrorRemoto(409,'La revisión del servidor no coincide.');
      await ejecutarConConexion(c=>c.withTransactionAsync(async()=>{
        await c.runAsync('DELETE FROM sync_outbox WHERE usuario_id=? AND lote=?',[usuarioId,fila.lote]);
        await c.runAsync('UPDATE sync_state SET revision=? WHERE usuario_id=?',[respuesta.revision,usuarioId]);
      }));
      pendientes=await contar();publicar({estado:'sincronizando',pendientes});
    }
    let mas=true;
    while(mas) {
      if((await obtenerSesionActual()).usuario?.id!==usuarioId)return;
      const revision=await ejecutarConConexion(async c=>Number((await c.getFirstAsync<{revision:number}>('SELECT revision FROM sync_state WHERE usuario_id=?',[usuarioId]))?.revision||0));
      const respuesta=validarVersiones(await solicitarRemoto<unknown>(`/sync?desde=${revision}`,undefined,remota.token));
      if((await obtenerSesionActual()).usuario?.id!==usuarioId)return;
      for(const version of respuesta.lotes) {
        await ejecutarConConexion(c=>c.withTransactionAsync(async()=>{
          // Si hubo una edición mientras esperábamos la red, no sobrescribirla.
          if(await c.getFirstAsync('SELECT secuencia FROM sync_outbox WHERE usuario_id=? LIMIT 1',[usuarioId]))throw new ErrorRemoto(409,'Hay cambios locales pendientes de revisar.');
          const actual=Number((await c.getFirstAsync<{revision:number}>('SELECT revision FROM sync_state WHERE usuario_id=?',[usuarioId]))?.revision||0);
          if(version.revision!==actual+1)throw new Error('Secuencia remota incompleta.');
          await aplicarCambios(c,version.lote.cambios);
          await c.runAsync('UPDATE sync_state SET revision=? WHERE usuario_id=?',[version.revision,usuarioId]);
        }));
      }mas=respuesta.mas;
      if(mas&&!respuesta.lotes.length)throw new Error('Paginación remota inválida.');
    }
    pendientes=await contar();publicar({estado:pendientes?'sincronizando':'online',pendientes});
  } catch(error) {
    publicar({estado:error instanceof ErrorRemoto?(error.estado===0?'offline':error.estado===401?'sesion':'conflicto'):'conflicto',pendientes,detalle:error instanceof Error?error.message:'No se pudo sincronizar.'});
  }
}
export function sincronizarCuenta(usuarioId:string):Promise<void> {
  if(enCurso)return enCurso.usuarioId===usuarioId?enCurso.promesa:enCurso.promesa.then(()=>sincronizarCuenta(usuarioId));
  const promesa=ejecutar(usuarioId).finally(()=>{enCurso=null;});enCurso={usuarioId,promesa};return promesa;
}
export async function sincronizarSesion(){const {usuario}=await obtenerSesionActual();return sincronizarCuenta(usuario?.id||'');}
