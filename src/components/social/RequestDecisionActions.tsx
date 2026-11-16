import BotonAccion from '../ActionButton';
import {View} from 'react-native';
import type {Tema} from '../../styles/colors';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';

export default function AccionesSolicitud({tema,alAceptar,alRechazar,etiquetaAceptar,etiquetaRechazar,procesando,completado=false,deshabilitado=false}:{tema:Tema;alAceptar:()=>unknown;alRechazar:()=>unknown;etiquetaAceptar:string;etiquetaRechazar:string;completado?:boolean;procesando?:'aceptar'|'rechazar'|null;deshabilitado?:boolean;expandido?:boolean}){
 const estilos=crearEstilosSocialOnline(tema);
 return <View style={[estilos.filaSolicitud,estilos.accionesDecision]}>
  {(['rechazar','aceptar'] as const).map(accion=><View key={accion} style={estilos.flexible}>
   <BotonAccion tema={tema} texto={accion==='aceptar'?'Aceptar':'Rechazar'}
    etiquetaAccesibilidad={accion==='aceptar'?etiquetaAceptar:etiquetaRechazar}
    variante={accion==='aceptar'?'principal':'contorno'}
    cargando={procesando===accion} completado={completado&&procesando===accion}
    deshabilitado={deshabilitado||!!procesando} alPresionar={accion==='aceptar'?alAceptar:alRechazar}/>
  </View>)}
 </View>;
}
