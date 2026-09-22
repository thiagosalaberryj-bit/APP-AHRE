import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';
import { TEMAS } from '../styles/colors';

export default function SectionHeader({ title, description, onBack, theme = TEMAS.claro }) {
  return (
    <View style={[styles.container, { backgroundColor: theme.encabezado }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel="Volver"
          accessibilityRole="button"
          onPress={onBack}
          style={[styles.backButton, { backgroundColor: theme.contenedorVerde }]}
        >
          <Ionicons name="chevron-back" size={30} color={theme.botonPrincipal} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.title, { color: theme.encabezadoTexto }]}>{title}</Text>
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
    paddingHorizontal: ESPACIADO.pantalla,
    paddingBottom: ESPACIADO.extraGrande,
    borderBottomLeftRadius: BORDES.radios.contenedor,
    borderBottomRightRadius: BORDES.radios.contenedor,
  },
  topRow: {
    position: 'absolute',
    top: ESPACIADO.grande,
    left: ESPACIADO.pantalla,
    right: ESPACIADO.pantalla,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDES.radios.boton,
  },
  title: {
    marginLeft: ESPACIADO.medio,
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
});
