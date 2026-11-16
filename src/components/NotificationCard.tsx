import {conRespuestaVisual} from '../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NombreIcono } from '../constants/movimientos';
import type { Aviso, TipoAviso } from '../notifications/types';
import type { Tema } from '../styles/colors';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';

const iconos:Record<TipoAviso,NombreIcono>={registro:'list-outline',debo:'arrow-up-circle-outline',me_deben:'arrow-down-circle-outline',recurrencias:'repeat-outline',salas:'people-outline',mensual:'stats-chart-outline',mercado_pago:'wallet-outline',social:'chatbubbles-outline',cuenta:'shield-checkmark-outline'};
export default function TarjetaNotificacion({aviso,tema,alAbrir,alVer}:{aviso:Aviso;tema:Tema;alAbrir:()=>void;alVer?:()=>void}){
 const [desplegada,establecerDesplegada]=useState(false),e=crearEstilosNotificaciones(tema);
 const evento=aviso.destino.evento||'';
 const iconoSocial:NombreIcono=evento.includes('rechaz')||evento.includes('retirada')||evento.includes('expulsado')?'close-circle-outline':evento.includes('aceptad')||evento.includes('confirmad')||evento.includes('resuelta')?'checkmark-circle-outline':evento.includes('pago')?'cash-outline':evento.includes('deuda')?'swap-horizontal-outline':evento==='sala_cerrada'?'lock-closed-outline':evento==='revision_salida'?'alert-circle-outline':evento.includes('ingreso')||evento.includes('participacion')?'people-outline':'person-add-outline';
 const color=aviso.tipo==='social'&&(evento.includes('rechaz')||evento.includes('expulsado'))?tema.error:aviso.tipo==='debo'?tema.error:aviso.tipo==='me_deben'?tema.exito:tema.foco;
 return <View style={[e.avisoCompacto,!aviso.vista&&e.avisoNoVisto]}>
  <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={`${aviso.vista?'Vista':'Nueva'}: ${aviso.titulo}`} accessibilityState={{expanded:desplegada}} onPress={conRespuestaVisual(()=>{if(!desplegada&&!aviso.vista)alVer?.();establecerDesplegada(v=>!v);})} style={e.cabeceraAviso}>
   <View style={[e.iconoAvisoCompacto,{backgroundColor:color+'15'}]}><Ionicons name={aviso.tipo==='social'?iconoSocial:iconos[aviso.tipo]||'notifications-outline'} size={20} color={color}/></View>
   <Text numberOfLines={desplegada?undefined:1} style={[e.tituloAvisoCompacto,!aviso.vista&&e.tituloNuevo]}>{aviso.titulo}</Text>
   <Text style={e.horaNotificacion}>{new Date(aviso.fecha).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false})}</Text>
   <Ionicons name={desplegada?'chevron-up':'chevron-down'} size={18} color={tema.textoSecundario}/>
  </Pressable>
  {desplegada?<View style={e.detalleAviso}><Text style={e.mensajeNotificacion}>{aviso.mensaje}</Text><Text style={e.horaNotificacion}>{aviso.vista?'Vista':'Nueva'} · {aviso.resuelta?'Resuelta':'Pendiente'}</Text><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={'Abrir detalle de '+aviso.titulo} onPress={conRespuestaVisual(alAbrir)} style={e.accesoPermisos}><Text style={e.enlaceAviso}>Abrir detalle ›</Text></Pressable></View>:null}
 </View>;
}
