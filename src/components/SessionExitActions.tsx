import type {StyleProp,ViewStyle} from 'react-native';
import type {Tema} from '../styles/colors';
import BotonAccion from './ActionButton';

export default function AccionesCierreSesion({tema,accionActiva,completado,alDesvincular,alCerrarSesion,estilo}:{tema:Tema;accionActiva:string;completado:boolean;alDesvincular:()=>unknown;alCerrarSesion:()=>unknown;estilo?:StyleProp<ViewStyle>}){
 const ocupado=!!accionActiva;
 return <>
  <BotonAccion tema={tema} texto="Sincronizar y desvincular" variante="peligro" cargando={accionActiva==='desvincular'} completado={completado&&accionActiva==='desvincular'} deshabilitado={ocupado} alPresionar={alDesvincular} estilo={estilo}/>
  <BotonAccion tema={tema} texto="Cerrar sesión" variante="peligro" cargando={accionActiva==='cerrar'} completado={completado&&accionActiva==='cerrar'} deshabilitado={ocupado} alPresionar={alCerrarSesion} estilo={estilo}/>
 </>;
}
