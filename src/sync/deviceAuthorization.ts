import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {ejecutarConConexion} from '../database/connectionQueue';
import {ErrorAutenticacion} from '../authentication/errors';

export interface AutorizacionLocal {dispositivo_id:string;generacion:number;revocada:number;}
let instalacion:Promise<string>|null=null;
export function obtenerInstalacion(){
  if(!instalacion)instalacion=(async()=>{
    const clave='ahre.instalacion.id',guardada=await SecureStore.getItemAsync(clave);
    if(guardada&&/^[a-f0-9]{64}$/.test(guardada))return guardada;
    const bytes=await Crypto.getRandomBytesAsync(32),id=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    await SecureStore.setItemAsync(clave,id);return id;
  })().catch(error=>{instalacion=null;throw error;});
  return instalacion;
}
export const consultarAutorizacion=(usuarioId:string)=>ejecutarConConexion(c=>c.getFirstAsync<AutorizacionLocal>('SELECT dispositivo_id,generacion,revocada FROM sync_authorization WHERE usuario_id=?',[usuarioId]));
export const contarPendientes=(usuarioId:string)=>ejecutarConConexion(async c=>Number((await c.getFirstAsync<{n:number}>('SELECT COUNT(*) n FROM sync_outbox WHERE usuario_id=?',[usuarioId]))?.n||0));
export async function registrarAutorizacion(usuarioId:string,dispositivoId:string,generacion:number){
  await ejecutarConConexion(c=>c.withTransactionAsync(async()=>{
    const anterior=await c.getFirstAsync<AutorizacionLocal>('SELECT dispositivo_id,generacion,revocada FROM sync_authorization WHERE usuario_id=?',[usuarioId]);
    const pendiente=await c.getFirstAsync('SELECT secuencia FROM sync_outbox WHERE usuario_id=? LIMIT 1',[usuarioId]);
    if(anterior&&(anterior.generacion!==generacion||anterior.dispositivo_id!==dispositivoId)&&pendiente)throw new ErrorAutenticacion('pendientes_otra_autorizacion');
    await c.runAsync('INSERT INTO sync_authorization(usuario_id,dispositivo_id,generacion,revocada) VALUES(?,?,?,0) ON CONFLICT(usuario_id) DO UPDATE SET dispositivo_id=excluded.dispositivo_id,generacion=excluded.generacion,revocada=0',[usuarioId,dispositivoId,generacion]);
    // Solo la primera vinculación de datos locales anteriores admite lotes sin autorización.
    if(!anterior)await c.runAsync('INSERT OR IGNORE INTO sync_batch_authorization(lote,usuario_id,generacion) SELECT DISTINCT lote,usuario_id,? FROM sync_outbox WHERE usuario_id=?',[generacion,usuarioId]);
  }));
}
export const marcarRevocada=(usuarioId:string)=>ejecutarConConexion(c=>c.runAsync('UPDATE sync_authorization SET revocada=1 WHERE usuario_id=?',[usuarioId]));
export const esPruebaLocal=(autorizacion:AutorizacionLocal|null,correo:string)=>typeof __DEV__!=='undefined'&&__DEV__&&correo==='pruebas@ahre.test'&&autorizacion?.generacion===0;
export async function autorizacionVigenteLocal(autorizacion:AutorizacionLocal|null,correo:string){
  if(!autorizacion||autorizacion.revocada)return false;
  return esPruebaLocal(autorizacion,correo)||(autorizacion.generacion>0&&autorizacion.dispositivo_id===await obtenerInstalacion());
}
