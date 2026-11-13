import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NombreIcono } from '../constants/movimientos';
import type { Aviso, TipoAviso } from '../notifications/types';
import type { Tema } from '../styles/colors';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';

const iconos:Record<TipoAviso,NombreIcono>={registro:'list-outline',debo:'arrow-up-circle-outline',me_deben:'arrow-down-circle-outline',recurrencias:'repeat-outline',salas:'people-outline',mensual:'stats-chart-outline',mercado_pago:'wallet-outline',social:'chatbubbles-outline',cuenta:'shield-checkmark-outline'};
export default function TarjetaNotificacion({aviso,tema,alAbrir}:{aviso:Aviso;tema:Tema;alAbrir:()=>void}){
 const [desplegada,establecerDesplegada]=useState(false),e=crearEstilosNotificaciones(tema);
 const color=aviso.tipo==='debo'?tema.error:aviso.tipo==='me_deben'?tema.exito:tema.foco;
 return <View style={[e.avisoCompacto,!aviso.vista&&e.avisoNoVisto]}>
  <Pressable accessibilityRole="button" accessibilityLabel={`${aviso.vista?'Vista':'Nueva'}: ${aviso.titulo}`} accessibilityState={{expanded:desplegada}} onPress={()=>establecerDesplegada(v=>!v)} style={e.cabeceraAviso}>
   <View style={[e.iconoAvisoCompacto,{backgroundColor:color+'15'}]}><Ionicons name={iconos[aviso.tipo]||'notifications-outline'} size={20} color={color}/></View>
   <Text numberOfLines={desplegada?undefined:1} style={[e.tituloAvisoCompacto,!aviso.vista&&e.tituloNuevo]}>{aviso.titulo}</Text>
   <Text style={e.horaNotificacion}>{new Date(aviso.fecha).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',hour12:false})}</Text>
   <Ionicons name={desplegada?'chevron-up':'chevron-down'} size={18} color={tema.textoSecundario}/>
  </Pressable>
  {desplegada?<View style={e.detalleAviso}><Text style={e.mensajeNotificacion}>{aviso.mensaje}</Text><Text style={e.horaNotificacion}>{aviso.vista?'Vista':'Nueva'} · {aviso.resuelta?'Resuelta':'Pendiente'}</Text><Pressable accessibilityRole="button" accessibilityLabel={'Abrir detalle de '+aviso.titulo} onPress={alAbrir} style={e.accesoPermisos}><Text style={e.enlaceAviso}>Abrir detalle ›</Text></Pressable></View>:null}
 </View>;
}
