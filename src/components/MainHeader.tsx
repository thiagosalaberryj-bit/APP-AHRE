import {conEstiloDePulsacion} from '../styles/globalStyles';
import {conRespuestaVisual} from '../utils/pressFeedback';
import {useAccionEnCurso} from '../hooks/useActionInProgress';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import IndicadorAvisosNoVistos from './NotificationUnreadBadge';
import type { Tema } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';
import { TEMAS } from '../styles/colors';
import EstadoSincronizacion from './SyncStatus';

export default function EncabezadoPrincipal({
  titulo = 'Bienvenido',
  descripcion,
  alAbrirNotificaciones,
  alAbrirPerfil,
  tema = TEMAS.claro as Tema,
  altura = 120,
}: import('../types/ui').EncabezadoProps) {
  const accionOcupada=useAccionEnCurso();
  return (
    <View
      style={[
        estilos.contenedor,
        { backgroundColor: tema.encabezado, height: altura },
      ]}
    >
      <View style={estilos.filaSuperior}>
        <Image
          accessibilityLabel="Logo de AHRE"
          resizeMode="contain"
          source={require('../../assets/ahre-logo.png')}
          style={estilos.logo}
        />
        <Text
          numberOfLines={1}
          style={[
            estilos.titulo,
            { color: tema.encabezadoTexto },
          ]}
        >
          {titulo}
        </Text>
        <View style={estilos.acciones}>
          <EstadoSincronizacion />
          <Pressable disabled={accionOcupada} android_ripple={RETROALIMENTACION_PULSACION}
            accessibilityLabel="Notificaciones"
            accessibilityRole="button"
            onPress={conRespuestaVisual(alAbrirNotificaciones)}
            style={conEstiloDePulsacion([
              estilos.botonAccion,
              { backgroundColor: tema.botonEncabezado },
            ])}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={tema.botonPrincipal}
            /><IndicadorAvisosNoVistos tema={tema}/>
          </Pressable>
          <Pressable disabled={accionOcupada} android_ripple={RETROALIMENTACION_PULSACION}
            accessibilityLabel="Perfil"
            accessibilityRole="button"
            onPress={conRespuestaVisual(alAbrirPerfil)}
            style={conEstiloDePulsacion([
              estilos.botonAccion,
              { backgroundColor: tema.botonEncabezado },
            ])}
          >
            <Ionicons
              name="person-circle-outline"
              size={22}
              color={tema.botonPrincipal}
            />
          </Pressable>
        </View>
      </View>
      {descripcion ? (
        <View style={estilos.contenedorDescripcion}>
          <Text style={[estilos.descripcion, { color: tema.encabezadoTexto }]}>{descripcion}</Text>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    height: 120,
    paddingHorizontal: ESPACIADO.pantalla,
    borderBottomLeftRadius: BORDES.radios.contenedor,
    borderBottomRightRadius: BORDES.radios.contenedor,
  },
  filaSuperior: {
    position: 'absolute',
    top: ESPACIADO.pequeno,
    left: ESPACIADO.medio,
    right: ESPACIADO.medio,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 56,
    height: 56,
  },
  titulo: {
    marginLeft: ESPACIADO.medio,
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.subtitulo,
    fontWeight: TIPOGRAFIA.pesos.negrita,
    flexShrink: 1,
  },
  descripcion: {
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.cuerpo,
    fontWeight: TIPOGRAFIA.pesos.regular,
  },
  contenedorDescripcion: {
    position: 'absolute',
    left: ESPACIADO.pantalla,
    right: ESPACIADO.pantalla,
    bottom: 0,
    height: 56,
    justifyContent: 'center',
  },
  acciones: {
    flexDirection: 'row',
    gap: ESPACIADO.pequeno,
    marginLeft: 'auto',
  },
  botonAccion: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDES.radios.boton,
  },
});
