import {mensajeErrorSocial} from '../../social/socialHelpers';
import BotonSocial from './SocialButton';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';
import {useState} from 'react';
import {Text,View} from 'react-native';
import {proponerDeudaOnline} from '../../social/socialService';
import type {AspectoSocial} from '../../social/types';
export default function PropuestaDeudaOnline({deudaId,...aspecto}:AspectoSocial&{deudaId:string}){
  const [ocupado,establecerOcupado]=useState(false),[mensaje,establecerMensaje]=useState('');
  const estilos=crearEstilosSocialOnline(aspecto.tema);
  return <View style={estilos.grupo}><BotonSocial texto="Proponer deuda online" deshabilitado={ocupado} alPresionar={async()=>{if(ocupado)return;establecerOcupado(true);try{await proponerDeudaOnline(deudaId);establecerMensaje('Propuesta enviada. Espera aceptación de la otra persona.');}catch(error){establecerMensaje(mensajeErrorSocial(error,'No se pudo compartir la deuda.'));}finally{establecerOcupado(false);}}} {...aspecto}/>{mensaje?<Text accessibilityLiveRegion="polite" style={aspecto.estilosGlobales.textoSecundario}>{mensaje}</Text>:null}</View>;
}
