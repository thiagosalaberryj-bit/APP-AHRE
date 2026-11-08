import * as SecureStore from 'expo-secure-store';
import type { Usuario } from '../database/types';
import {obtenerInstalacion,registrarAutorizacion,marcarRevocada} from './deviceAuthorization';
import {ErrorAutenticacion} from '../authentication/errors';

export const URL_SERVIDOR = typeof process !== 'undefined'
  ? (process.env.EXPO_PUBLIC_API_URL || 'https://ahre-server.tailc5dfc5.ts.net/api/v1').replace(/\/$/,'') : '';
export class ErrorRemoto extends Error { constructor(public estado:number,mensaje:string,public codigo?:string){super(mensaje);} }
export interface SesionRemota { token:string; vence:number; usuario:Usuario; dispositivoId:string; generacion:number; revision:number; }
let sesion:{localId:string;datos:SesionRemota}|null=null;
let disponible:boolean|null=null;
export const disponibilidadServidor=()=>disponible;
export async function solicitarRemoto<T>(ruta:string,datos?:unknown,token?:string,tiempoEspera=6000):Promise<T> {
  if(!URL_SERVIDOR) throw new ErrorRemoto(0,'Servidor sin configurar.');
  const url=new URL(URL_SERVIDOR);
  if(url.protocol!=='https:' && !(typeof __DEV__!=='undefined'&&__DEV__&&url.protocol==='http:')) throw new ErrorRemoto(0,'El servidor requiere HTTPS.');
  const controlador=new AbortController(),temporizador=setTimeout(()=>controlador.abort(),tiempoEspera);
  try {
    const respuesta=await fetch(URL_SERVIDOR+ruta,{method:datos===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-AHRE-Protocolo':'3',...(token?{Authorization:`Bearer ${token}`}:{})},...(datos===undefined?{}:{body:JSON.stringify(datos)}),signal:controlador.signal});
    disponible=true;
    if(!respuesta.ok) {
      if(respuesta.status>=500||[404,405,429].includes(respuesta.status)) {
        disponible=false;throw new ErrorRemoto(0,'El servidor no está disponible. Tus datos siguen guardados localmente.');
      }
      const cuerpo:unknown=await respuesta.json().catch(()=>null);
      throw new ErrorRemoto(respuesta.status,cuerpo&&typeof cuerpo==='object'&&'error' in cuerpo&&typeof cuerpo.error==='string'?cuerpo.error:'El servidor rechazó la operación.',cuerpo&&typeof cuerpo==='object'&&'codigo' in cuerpo&&typeof cuerpo.codigo==='string'?cuerpo.codigo:undefined);
    }
    return respuesta.status===204?undefined as T:await respuesta.json() as T;
  } catch(error){if(error instanceof ErrorRemoto)throw error;disponible=false;throw new ErrorRemoto(0,'Sin conexión con el servidor.');}
  finally{clearTimeout(temporizador);}
}
export async function guardarSesionRemota(localId:string,datos:SesionRemota,recordar:boolean) {
  if(datos.usuario.id!==localId) throw new ErrorRemoto(409,'Esta cuenta local tiene otra identidad en el servidor. Conservamos sus datos locales.');
  if(datos.dispositivoId!==await obtenerInstalacion()||!Number.isSafeInteger(datos.generacion)||datos.generacion<1||!Number.isSafeInteger(datos.revision)||datos.revision<0)throw new ErrorRemoto(502,'El servidor debe actualizarse para autorizar esta instalación.');
  try{await registrarAutorizacion(localId,datos.dispositivoId,datos.generacion);}
  catch(error){if(error instanceof ErrorAutenticacion&&error.codigo==='pendientes_otra_autorizacion')await marcarRevocada(localId);throw error;}
  sesion={localId,datos};
  if(recordar) await SecureStore.setItemAsync(`ahre.servidor.${localId}`,JSON.stringify(datos));
  else await SecureStore.deleteItemAsync(`ahre.servidor.${localId}`);
}
export async function comprobarProtocolo(){
  const salud=await solicitarRemoto<{protocolo?:number}>('/health');
  if(!salud||salud.protocolo!==3)throw new ErrorRemoto(502,'El servidor necesita actualizarse para autorizar dispositivos.','protocolo_incompatible');
}
export async function obtenerSesionRemota(localId:string) {
  if(sesion?.localId===localId)return sesion.datos;
  const guardada=await SecureStore.getItemAsync(`ahre.servidor.${localId}`);
  if(!guardada)return null;
  try {const datos=JSON.parse(guardada) as SesionRemota;
    if(typeof datos.token!=='string'||!Number.isFinite(datos.vence)||datos.usuario.id!==localId||datos.dispositivoId!==await obtenerInstalacion()||!Number.isSafeInteger(datos.generacion))return null;
    sesion={localId,datos};return datos;
  } catch{return null;}
}
export async function quitarSesionRemota(localId:string) {
  const anterior=await obtenerSesionRemota(localId);sesion=null;
  await SecureStore.deleteItemAsync(`ahre.servidor.${localId}`);
  if(anterior)void solicitarRemoto('/auth/logout',{},anterior.token).catch(()=>{});
}
export async function autenticarRemoto(correo:string,contrasena:string,crear?:{id:string;nombre:string},reemplazar=false) {
  await comprobarProtocolo();
  let resultado:SesionRemota;
  const dispositivoId=await obtenerInstalacion();
  try {resultado=await solicitarRemoto<SesionRemota>('/auth/login',{correo,contrasena,dispositivoId,reemplazar});}
  catch(error) {
    if(!(error instanceof ErrorRemoto)||error.estado!==401||!crear)throw error;
    resultado=await solicitarRemoto<SesionRemota>('/auth/register',{correo,contrasena,dispositivoId,...crear});
  }
  if(!resultado||typeof resultado.token!=='string'||!Number.isFinite(resultado.vence)||typeof resultado.usuario?.id!=='string')throw new ErrorRemoto(502,'Respuesta de autenticación inválida.');
  return resultado;
}
