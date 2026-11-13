import { useEffect, useState } from 'react';
import { Alert, AppState, Pressable, Text, View } from 'react-native';
import { consultarAlarmasExactas, abrirAjustesAlarmasExactas } from '../notifications/nativeAdapter';
import type { EstadoAlarmasExactas } from '../notifications/exactAlarmAdapter';
import type { Tema } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';

export default function AjustesAlarmasExactas({tema,visible,deshabilitado=false}:{tema:Tema;visible:boolean;deshabilitado?:boolean}){
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
 return <View style={e.filaTipoAjuste}>
  <Text style={e.textoAjuste}>Horario preciso de recordatorios</Text>
  <Text style={g.textoAyuda} accessibilityLiveRegion="polite">{texto}</Text>
  {disponible?<Pressable disabled={deshabilitado} accessibilityState={{disabled:deshabilitado}} style={[g.botonSecundario,deshabilitado&&g.botonDeshabilitado]} accessibilityRole="button" onPress={()=>{if(deshabilitado)return;void abrirAjustesAlarmasExactas().catch(()=>Alert.alert('No se pudieron abrir los ajustes','Buscá AHRE en Ajustes del teléfono → Acceso especial → Alarmas y recordatorios.'));}}><Text style={g.textoBotonSecundario}>{estado==='permitidas'?'Configurar horario preciso':'Activar horario preciso'}</Text></Pressable>:null}
 </View>;
}
