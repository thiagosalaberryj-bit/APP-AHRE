import {ActivityIndicator,Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import Conmutador from './Toggle';
import {avisosHabilitados,estadoEntregaAvisos} from '../notifications/notificationStatus';
import type {Tema} from '../styles/colors';
import type {crearEstilosPerfil} from '../styles/ProfileScreenStyles';

export default function OpcionNotificacionesPerfil({tema,estilos,preferencia,permiso,ocupada,alCambiar}:{tema:Tema;estilos:ReturnType<typeof crearEstilosPerfil>;preferencia:boolean;permiso:string;ocupada:boolean;alCambiar:(valor:boolean)=>void}){
 const habilitadas=avisosHabilitados(preferencia,permiso);
 const bloqueadasEnAndroid=permiso==='Sin permiso'||permiso==='Desactivadas en Ajustes';
 return <Pressable style={estilos.filaSelector} accessibilityRole={bloqueadasEnAndroid?'button':undefined} accessibilityLabel={bloqueadasEnAndroid?'Activar notificaciones':undefined} disabled={ocupada} onPress={bloqueadasEnAndroid?()=>{if(!ocupada)alCambiar(true);}:undefined}>
  <View style={estilos.iconoSelector}><Ionicons color={tema.foco} name="notifications-outline" size={21}/></View>
  <View style={estilos.contenidoSelector}><Text style={estilos.textoFilaSelector}>Notificaciones</Text><Text style={estilos.valorSelector}>{estadoEntregaAvisos(preferencia,permiso)}</Text></View>
  {bloqueadasEnAndroid?(ocupada?<ActivityIndicator size="small" color={tema.foco}/>:<Ionicons name="chevron-forward" size={20} color={tema.textoSecundario}/>):<Conmutador tema={tema} valor={habilitadas} deshabilitado={ocupada||permiso!=='Permitidas'} alCambiar={alCambiar} etiquetaAccesibilidad="Notificaciones"/>}
 </Pressable>;
}
