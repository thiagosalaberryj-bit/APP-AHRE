import {CameraView,useCameraPermissions} from 'expo-camera';
import {Linking,Text,View} from 'react-native';
import {useState} from 'react';
import type {AspectoSocial} from '../../social/types';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';
import BotonSocial from './SocialButton';
export default function EscanerInvitacion({alLeer,...aspecto}:AspectoSocial&{alLeer:(texto:string)=>void}){
  const [permiso,pedirPermiso]=useCameraPermissions();
  const [error,cambiarError]=useState('');
  const habilitar=async()=>{cambiarError('');try{if(permiso&&!permiso.canAskAgain)await Linking.openSettings();else await pedirPermiso();}catch{cambiarError('No se pudo habilitar la cámara. Podés pegar el enlace de invitación.');}};
  if(!permiso?.granted)return <View style={crearEstilosSocialOnline(aspecto.tema).grupo}><Text style={aspecto.estilosGlobales.textoSecundario}>{permiso&&!permiso.canAskAgain?'Habilitá la cámara desde los ajustes del teléfono, o elegí Pegar enlace.':'Permití usar la cámara para escanear la invitación. También podés pegar el enlace.'}</Text><BotonSocial texto={permiso&&!permiso.canAskAgain?'Abrir ajustes':'Permitir cámara'} alPresionar={()=>{void habilitar();}} {...aspecto}/>{error?<Text accessibilityRole="alert" style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}</View>;
  const estilos=crearEstilosSocialOnline(aspecto.tema);
  return <View collapsable={false} style={estilos.marcoCamara}><CameraView style={estilos.camara} facing="back" barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={({data})=>alLeer(data)}/></View>;
}
