import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';
import { TEMAS } from '../styles/colors';

export default function EncabezadoPrincipal({
  titulo = 'Bienvenido',
  descripcion,
  alAbrirNotificaciones,
  alAbrirPerfil,
  accesorioDerecho,
  tema = TEMAS.claro,
  altura = 120,
}) {
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
          <Pressable
            accessibilityLabel="Notificaciones"
            accessibilityRole="button"
            onPress={alAbrirNotificaciones}
            style={[
              estilos.botonAccion,
              { backgroundColor: tema.contenedorVerde },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={tema.botonPrincipal}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Perfil"
            accessibilityRole="button"
            onPress={alAbrirPerfil}
            style={[
              estilos.botonAccion,
              { backgroundColor: tema.contenedorVerde },
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={22}
              color={tema.botonPrincipal}
            />
          </Pressable>
        </View>
      </View>
      {descripcion || accesorioDerecho ? (
        <View
          style={[
            estilos.contenedorDescripcion,
            accesorioDerecho && estilos.contenedorDescripcionConAccesorio,
          ]}
        >
          {descripcion ? (
            <Text style={[estilos.descripcion, { color: tema.encabezadoTexto }]}>
              {descripcion}
            </Text>
          ) : <View />}
          {accesorioDerecho}
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
  contenedorDescripcionConAccesorio: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
