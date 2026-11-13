import IndicadorAvisosNoVistos from './NotificationUnreadBadge';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import EstadoSincronizacion from './SyncStatus';
import { RUTAS } from '../constants/routes';
import { crearEstilosMarcoEncabezado } from '../styles/ScreenHeaderFrameStyles';
import type { EncabezadoProps } from '../types/ui';
import type { Tema } from '../styles/colors';

export default function AccionesEncabezadoCompacto({ tema, alAbrirNotificaciones, alAbrirPerfil, mostrarSincronizacion = true }:
  Pick<EncabezadoProps, 'alAbrirNotificaciones' | 'alAbrirPerfil' | 'mostrarSincronizacion'> & { tema: Tema }) {
  const navegacion = useNavigation<import('../navigation/types').NavegacionRaiz>();
  const estilos = crearEstilosMarcoEncabezado(tema);
  return <View style={estilos.acciones}>
    {mostrarSincronizacion ? <EstadoSincronizacion soloIcono/> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Notificaciones"
      onPress={alAbrirNotificaciones || (() => navegacion.navigate(RUTAS.NOTIFICACIONES))} style={estilos.flecha}>
      <Ionicons name="notifications-outline" size={22} color={tema.botonPrincipal}/><IndicadorAvisosNoVistos tema={tema}/>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Perfil"
      onPress={alAbrirPerfil || (() => navegacion.navigate(RUTAS.PERFIL))} style={estilos.flecha}>
      <Ionicons name="person-circle-outline" size={22} color={tema.botonPrincipal}/>
    </Pressable>
  </View>;
}
