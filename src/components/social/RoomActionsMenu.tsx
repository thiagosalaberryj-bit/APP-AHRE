import * as SecureStore from 'expo-secure-store';
import {observarSocialOnline} from '../../social/socialService';
import {URL_SERVIDOR} from '../../sync/remote';
import {useState,useEffect} from 'react';
import {Pressable,Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial,AccionesSociales} from '../../social/types';
import {useDatosSociales} from '../../social/SocialDataContext';
import {LIMITE_SALAS_ACTIVAS} from '../../social/socialConstants';
import crearEstilosPanel from '../../styles/social/SocialPanelStyles';
import MenuOpcionesSocial from './SocialOptionsMenu';
import UnirseSala from './JoinRoomModal';

export default function OpcionesSalas({abrirRegistro,abrirSala,...aspecto}:AspectoSocial&Pick<AccionesSociales,'abrirRegistro'|'abrirSala'>){
  const [abierto,abrir]=useState<'opciones'|'unirse'|null>(null);
  const [enlaceInicial,cambiarEnlaceInicial]=useState('');
  useEffect(()=>{let activo=true;const revisar=()=>{void SecureStore.getItemAsync('ahre.invitacion.pendiente').then(async valor=>{if(!valor||!activo)return;const datos=JSON.parse(valor);if(datos.global){cambiarEnlaceInicial(new URL(URL_SERVIDOR).origin+'/invitacion/#sala='+datos.token);abrir('unirse');await SecureStore.deleteItemAsync('ahre.invitacion.pendiente');}}).catch(()=>{});};revisar();const dejar=observarSocialOnline(revisar);return()=>{activo=false;dejar();};},[]);
  const social=useDatosSociales(),estilos=crearEstilosPanel(aspecto.tema);
  const limite=social.salas.filter(s=>s.administrador&&s.estado==='abierta').length>=LIMITE_SALAS_ACTIVAS;
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Salas" onPress={()=>abrir('opciones')} style={estilos.accionPanel}>
      <Ionicons name="people-outline" size={20} color={aspecto.tema.botonPrincipalTexto}/><Text style={estilos.textoAccionPanel}>Salas</Text>
    </Pressable>
    {abierto==='opciones'?<MenuOpcionesSocial tema={aspecto.tema} titulo="Salas" descripcion="Elegí cómo querés participar." alCerrar={()=>abrir(null)} opciones={[
      {id:'crear',texto:'Crear sala',descripcion:limite?'Ya tenés tres salas propias activas.': 'Organizá gastos e invitá a otras personas.',icono:'add-circle-outline',deshabilitada:limite||!social.habilitadoParaCrear,alElegir:()=>{abrir(null);abrirRegistro('crear');}},
      {id:'unirse',texto:'Unirme a sala',descripcion:'Entrá con un enlace de invitación o escaneá un QR.',icono:'qr-code-outline',alElegir:()=>abrir('unirse')},
    ]}/>:null}
    {abierto==='unirse'?<UnirseSala {...aspecto} enlaceInicial={enlaceInicial} alCerrar={()=>abrir(null)} alUnirse={abrirSala}/>:null}
  </>;
}
