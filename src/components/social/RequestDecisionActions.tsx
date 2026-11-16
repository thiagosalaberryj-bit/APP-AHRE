import {ActivityIndicator,Pressable,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {Tema} from '../../styles/colors';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';

export default function AccionesSolicitud({tema,alAceptar,alRechazar,etiquetaAceptar,etiquetaRechazar,procesando,deshabilitado=false}:{tema:Tema;alAceptar:()=>void;alRechazar:()=>void;etiquetaAceptar:string;etiquetaRechazar:string;procesando?:'aceptar'|'rechazar'|null;deshabilitado?:boolean}){
  const estilos=crearEstilosSocialOnline(tema);
  return <View style={estilos.filaSolicitud}>
    {(['aceptar','rechazar'] as const).map(accion=>{
      const color=accion==='aceptar'?tema.exito:tema.error;
      return <Pressable key={accion} accessibilityRole="button" accessibilityLabel={accion==='aceptar'?etiquetaAceptar:etiquetaRechazar} accessibilityState={{busy:procesando===accion,disabled:deshabilitado||!!procesando}} disabled={deshabilitado||!!procesando} onPress={accion==='aceptar'?alAceptar:alRechazar} style={estilos.accionSolicitud}>
        {procesando===accion?<ActivityIndicator size="small" color={color}/>:<Ionicons name={accion==='aceptar'?'checkmark':'close'} size={23} color={color}/>}
      </Pressable>;
    })}
  </View>;
}
