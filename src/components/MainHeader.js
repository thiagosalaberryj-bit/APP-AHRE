import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';
import { TEMAS } from '../styles/colors';

export default function MainHeader({
  title = 'Bienvenido',
  description,
  onNotifications,
  onProfile,
  theme = TEMAS.claro,
}) {
  return (
    <View style={[styles.container, { backgroundColor: theme.encabezado }]}>
      <View style={styles.topRow}>
        <Image
          accessibilityLabel="Logo de AHRE"
          resizeMode="contain"
          source={require('../../assets/ahre-logo.png')}
          style={styles.logo}
        />
        <Text numberOfLines={1} style={[styles.title, { color: theme.encabezadoTexto }]}>{title}</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="Notificaciones"
            accessibilityRole="button"
            onPress={onNotifications}
            style={[styles.actionButton, { backgroundColor: theme.contenedorVerde }]}
          >
            <Ionicons name="notifications-outline" size={27} color={theme.botonPrincipal} />
          </Pressable>
          <Pressable
            accessibilityLabel="Perfil"
            accessibilityRole="button"
            onPress={onProfile}
            style={[styles.actionButton, { backgroundColor: theme.contenedorVerde }]}
          >
            <Ionicons name="person-circle-outline" size={29} color={theme.botonPrincipal} />
          </Pressable>
        </View>
      </View>
      {description ? (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: theme.encabezadoTexto }]}>{description}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    justifyContent: 'flex-end',
    paddingHorizontal: ESPACIADO.pantalla,
    paddingBottom: ESPACIADO.extraGrande,
    borderBottomLeftRadius: BORDES.radios.contenedor,
    borderBottomRightRadius: BORDES.radios.contenedor,
  },
  topRow: {
    position: 'absolute',
    top: ESPACIADO.grande,
    left: ESPACIADO.pequeno,
    right: ESPACIADO.grande,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 84,
    height: 84,
  },
  title: {
    marginLeft: ESPACIADO.minimo,
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.titulo,
    fontWeight: TIPOGRAFIA.pesos.negrita,
    flexShrink: 1,
  },
  description: {
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.cuerpo,
    fontWeight: TIPOGRAFIA.pesos.regular,
  },
  descriptionContainer: {
    position: 'absolute',
    left: ESPACIADO.pantalla,
    right: ESPACIADO.pantalla,
    bottom: 0,
    height: 54,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: ESPACIADO.pequeno,
    marginLeft: 'auto',
  },
  actionButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDES.radios.boton,
  },
});
