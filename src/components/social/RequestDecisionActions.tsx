import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import PuntosCarga from '../LoadingDots';
import BotonAccion from '../ActionButton';
import { Pressable, View } from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {Tema} from '../../styles/colors';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';

export default function AccionesSolicitud({tema,alAceptar,alRechazar,etiquetaAceptar,etiquetaRechazar,procesando,deshabilitado=false,expandido=false}:{tema:Tema;alAceptar:()=>void;alRechazar:()=>void;etiquetaAceptar:string;etiquetaRechazar:string;procesando?:'aceptar'|'rechazar'|null;deshabilitado?:boolean;expandido?:boolean}){
  const estilos=crearEstilosSocialOnline(tema);
  if(expandido)return <View style={estilos.filaSolicitud}>
    <View style={estilos.flexible}><BotonAccion tema={tema} texto="Rechazar" etiquetaAccesibilidad={etiquetaRechazar} variante="contorno" cargando={procesando==='rechazar'} deshabilitado={deshabilitado||!!procesando} alPresionar={alRechazar}/></View>
    <View style={estilos.flexible}><BotonAccion tema={tema} texto="Aceptar" etiquetaAccesibilidad={etiquetaAceptar} cargando={procesando==='aceptar'} deshabilitado={deshabilitado||!!procesando} alPresionar={alAceptar}/></View>
  </View>;
  return <View style={estilos.filaSolicitud}>
    {(['aceptar','rechazar'] as const).map(accion=>{
      const color=accion==='aceptar'?tema.exito:tema.error;
      return <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={accion} accessibilityRole="button" accessibilityLabel={accion==='aceptar'?etiquetaAceptar:etiquetaRechazar} accessibilityState={{busy:procesando===accion,disabled:deshabilitado||!!procesando}} disabled={deshabilitado||!!procesando} onPress={conRespuestaVisual(accion==='aceptar'?alAceptar:alRechazar)} style={estilos.accionSolicitud}>
        {procesando===accion?<PuntosCarga size="small" color={color}/>:<Ionicons name={accion==='aceptar'?'checkmark':'close'} size={23} color={color}/>}
      </Pressable>;
    })}
  </View>;
}
