import {Ionicons} from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, AppState, Pressable, Text, View } from 'react-native';
import { consultarAlarmasExactas, abrirAjustesAlarmasExactas } from '../notifications/nativeAdapter';
import type { EstadoAlarmasExactas } from '../notifications/exactAlarmAdapter';
import type { Tema } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';

export default function AjustesAlarmasExactas({tema,visible,deshabilitado=false,aviso=false}:{tema:Tema;visible:boolean;deshabilitado?:boolean;aviso?:boolean}){
 const [estado,establecerEstado]=useState<EstadoAlarmasExactas|null>(null),g=crearEstilosGlobales(tema),e=crearEstilosNotificaciones(tema);
 useEffect(()=>{
  if(!visible)return;let activa=true,revision=0;
  const cargar=()=>{const actual=++revision;void consultarAlarmasExactas().then(valor=>{if(activa&&actual===revision)establecerEstado(valor);}).catch(()=>{if(activa&&actual===revision)establecerEstado('no_disponible');});};
  cargar();const escucha=AppState.addEventListener('change',valor=>{if(valor==='active')cargar();});
  return ()=>{activa=false;escucha.remove();};
 },[visible]);
 if(!estado||estado==='no_requerido')return null;
 const disponible=estado==='permitidas'||estado==='desactivadas';
 const texto=estado==='permitidas'?'Horario preciso activado.':estado==='desactivadas'?'Activá este permiso para reducir retrasos en los recordatorios.':estado==='expo_go'?'Los horarios precisos se activan en la APK. Expo Go conserva los recordatorios compatibles.':estado==='actualizar_apk'?'Instalá una APK nueva para configurar los horarios precisos.':'No se pudo consultar este permiso. Volvé a abrir los ajustes.';
 if(aviso)return <Pressable accessibilityRole="button" accessibilityLabel="Paso 2: configurar horarios precisos" disabled={deshabilitado||!disponible} onPress={()=>{void abrirAjustesAlarmasExactas().catch(()=>Alert.alert('No se pudieron abrir los ajustes','Buscá AHRE en Ajustes → Alarmas y recordatorios.'));}} style={e.avisoPermisos}><Ionicons name="time-outline" size={24} color={tema.foco}/><Text style={e.textoPermisos}>{'Paso 2 · Horarios precisos\n'+(estado==='permitidas'?'Activados. Podés revisar esta configuración.':estado==='desactivadas'?'Configurá horarios precisos para reducir retrasos en tus recordatorios.':texto)}</Text><Ionicons name="chevron-forward" size={20} color={tema.textoSecundario}/></Pressable>;
 return <View style={e.filaTipoAjuste}>
  <Text style={e.textoAjuste}>Horario preciso de recordatorios</Text>
  <Text style={g.textoAyuda} accessibilityLiveRegion="polite">{texto}</Text>
  {disponible?<Pressable disabled={deshabilitado} accessibilityState={{disabled:deshabilitado}} style={[g.botonSecundario,deshabilitado&&g.botonDeshabilitado]} accessibilityRole="button" onPress={()=>{if(deshabilitado)return;void abrirAjustesAlarmasExactas().catch(()=>Alert.alert('No se pudieron abrir los ajustes','Buscá AHRE en Ajustes del teléfono → Acceso especial → Alarmas y recordatorios.'));}}><Text style={g.textoBotonSecundario}>{estado==='permitidas'?'Configurar horario preciso':'Activar horario preciso'}</Text></Pressable>:null}
 </View>;
}
