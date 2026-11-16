import {conRespuestaVisual} from '../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import Conmutador from './Toggle';
import {crearEstilosPerfil} from '../styles/ProfileScreenStyles';
import {Ionicons} from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, AppState, Pressable, Text, View } from 'react-native';
import { consultarAlarmasExactas, abrirAjustesAlarmasExactas } from '../notifications/nativeAdapter';
import type { EstadoAlarmasExactas } from '../notifications/exactAlarmAdapter';
import type { Tema } from '../styles/colors';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';

export default function AjustesAlarmasExactas({tema,visible,deshabilitado=false,aviso=false}:{tema:Tema;visible:boolean;deshabilitado?:boolean;aviso?:boolean}){
 const [estado,establecerEstado]=useState<EstadoAlarmasExactas|null>(null),e=crearEstilosNotificaciones(tema);
 useEffect(()=>{
  if(!visible)return;let activa=true,revision=0;
  const cargar=()=>{const actual=++revision;void consultarAlarmasExactas().then(valor=>{if(activa&&actual===revision)establecerEstado(valor);}).catch(()=>{if(activa&&actual===revision)establecerEstado('no_disponible');});};
  cargar();const escucha=AppState.addEventListener('change',valor=>{if(valor==='active')cargar();});
  return ()=>{activa=false;escucha.remove();};
 },[visible]);
 if(!estado||estado==='no_requerido')return null;
 if(aviso&&estado==='permitidas')return null;
 const disponible=estado==='permitidas'||estado==='desactivadas';
 const texto=estado==='permitidas'?'Horario preciso activado.':estado==='desactivadas'?'Activá este permiso para reducir retrasos en los recordatorios.':estado==='expo_go'?'Los horarios precisos se activan en la APK. Expo Go conserva los recordatorios compatibles.':estado==='actualizar_apk'?'Instalá una APK nueva para configurar los horarios precisos.':'No se pudo consultar este permiso. Volvé a abrir los ajustes.';
 if(aviso)return <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Paso 2: configurar horarios precisos" disabled={deshabilitado||!disponible} onPress={conRespuestaVisual(()=>{void abrirAjustesAlarmasExactas().catch(()=>Alert.alert('No se pudieron abrir los ajustes','Buscá AHRE en Ajustes → Alarmas y recordatorios.'));})} style={e.avisoPermisos}><Ionicons name="time-outline" size={24} color={tema.foco}/><Text style={e.textoPermisos}>{'Paso 2 · Horarios precisos\n'+(estado==='desactivadas'?'Configurá horarios precisos para reducir retrasos en tus recordatorios.':texto)}</Text><Ionicons name="chevron-forward" size={20} color={tema.textoSecundario}/></Pressable>;
 const perfil=crearEstilosPerfil(tema);
 const abrir=()=>{if(deshabilitado||!disponible)return;void abrirAjustesAlarmasExactas().catch(()=>Alert.alert('No se pudieron abrir los ajustes','Buscá AHRE en Ajustes → Alarmas y recordatorios.'));};
 return <Pressable android_ripple={RETROALIMENTACION_PULSACION} style={perfil.filaSelector} accessibilityRole="button" accessibilityLabel="Horarios precisos. Abrir ajustes de Android" accessibilityState={{disabled:deshabilitado||!disponible}} disabled={deshabilitado||!disponible} onPress={conRespuestaVisual(abrir)}>
  <View style={perfil.iconoSelector}><Ionicons name="time-outline" size={21} color={tema.foco}/></View>
  <View style={perfil.contenidoSelector}><Text style={perfil.textoFilaSelector}>Horarios precisos</Text><Text accessibilityLiveRegion="polite" style={perfil.valorSelector}>{estado==='permitidas'?'Activados · Cambiar en ajustes de Android':estado==='desactivadas'?'Desactivados · Activar en Android':texto}</Text></View>
  {estado==='permitidas'?<Conmutador tema={tema} valor deshabilitado={deshabilitado} etiquetaAccesibilidad="Horarios precisos" alCambiar={abrir}/>:disponible?<Ionicons name="chevron-forward" size={20} color={tema.textoSecundario}/>:null}
 </Pressable>;
}
