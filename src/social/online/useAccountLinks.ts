import {useEffect,useState} from 'react';
import {leerDatosOnline,observarSocialOnline,observarSincronizacion,obtenerVistaSincronizacion} from '../socialService';
import type {VinculoOnline} from './types';

export default function useVinculosOnline(usuarioId:string){
  const [vinculos,cambiarVinculos]=useState<VinculoOnline[]>([]);
  const [conexion,cambiarConexion]=useState(obtenerVistaSincronizacion);
  useEffect(()=>observarSincronizacion(cambiarConexion),[]);
  useEffect(()=>{
    let activo=true;
    const cargar=()=>{void leerDatosOnline<VinculoOnline[]>(usuarioId,'vinculos',[]).then(datos=>{if(activo)cambiarVinculos(datos);}).catch(()=>{});};
    cargar();const dejar=observarSocialOnline(cargar);
    return()=>{activo=false;dejar();};
  },[usuarioId]);
  return {vinculos,sinConexion:['offline','sesion','revocado','local'].includes(conexion.estado)};
}
