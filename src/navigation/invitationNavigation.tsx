import {useEffect} from 'react';
import {Alert,AppState,Linking} from 'react-native';
import {createNavigationContainerRef} from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import {obtenerSesionActual} from '../authentication/sessionService';
import {aceptarInvitacionOnline} from '../social/online/onlineService';
import {RUTAS} from '../constants/routes';
import type {ParametrosNavegacion} from './types';
import {leerEnlaceInvitacion} from '../social/online/invitationLink';
import {URL_SERVIDOR} from '../sync/remote';

export const referenciaNavegacion=createNavigationContainerRef<ParametrosNavegacion>();
const CLAVE_INVITACION='ahre.invitacion.pendiente';
export default function ControladorInvitaciones(){
  useEffect(()=>{
    let ocupado=false,cerrado=false,avisada=false;
    async function procesar(){
      if(ocupado||cerrado||AppState.currentState!=='active'||!referenciaNavegacion.isReady())return;
      const ruta=referenciaNavegacion.getCurrentRoute()?.name;
      if(!ruta||[RUTAS.INICIO,RUTAS.INICIO_SESION,RUTAS.REGISTRO].includes(ruta as never))return;
      ocupado=true;
      try{
        const pendiente=await SecureStore.getItemAsync(CLAVE_INVITACION);if(!pendiente||!(await obtenerSesionActual()).usuario)return;
        const datos=JSON.parse(pendiente) as {token:string;canje?:string;global?:boolean};
        if(datos.global){referenciaNavegacion.navigate(RUTAS.PRINCIPAL,{screen:RUTAS.SOCIAL});return;}
        const resultado=await aceptarInvitacionOnline(datos.token,datos.canje);
        await SecureStore.deleteItemAsync(CLAVE_INVITACION);
        if(!cerrado&&referenciaNavegacion.isReady())referenciaNavegacion.navigate(RUTAS.SALA_SOCIAL,{salaId:resultado.salaId});
      }catch(error){
        if(!avisada&&!cerrado){avisada=true;Alert.alert('Invitación pendiente',error instanceof Error?error.message:'No se pudo abrir la invitación. Conservamos el enlace para reintentar.',[{text:'Conservar para después',style:'cancel'},{text:'Descartar enlace',onPress:()=>{void SecureStore.deleteItemAsync(CLAVE_INVITACION);}}]);}
      }
      finally{ocupado=false;}
    }
    async function recordar(url:string|null){if(!url)return;try{const datos=leerEnlaceInvitacion(url,URL_SERVIDOR);if(datos){avisada=false;await SecureStore.setItemAsync(CLAVE_INVITACION,JSON.stringify(datos));await procesar();}}catch{}}
    void Linking.getInitialURL().then(recordar);const escucha=Linking.addEventListener('url',evento=>{void recordar(evento.url);});
    const temporizador=setInterval(()=>{void procesar();},3000);
    return()=>{cerrado=true;clearInterval(temporizador);escucha.remove();};
  },[]);
  return null;
}
