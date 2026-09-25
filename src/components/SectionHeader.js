import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';
import { TEMAS } from '../styles/colors';

export default function EncabezadoSeccion({ titulo, descripcion, alVolver, tema = TEMAS.claro }) {
  return (
    <View style={[estilos.contenedor, { backgroundColor: tema.encabezado }]}>
      <View style={estilos.filaSuperior}>
        <Pressable
          accessibilityLabel="Volver"
          accessibilityRole="button"
          onPress={alVolver}
          style={[estilos.botonVolver, { backgroundColor: tema.contenedorVerde }]}
        >
          <Ionicons name="chevron-back" size={30} color={tema.botonPrincipal} />
        </Pressable>
        <Text numberOfLines={1} style={[estilos.titulo, { color: tema.encabezadoTexto }]}>{titulo}</Text>
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
    left: ESPACIADO.pantalla,
    right: ESPACIADO.pantalla,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botonVolver: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDES.radios.boton,
  },
  titulo: {
    marginLeft: ESPACIADO.medio,
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.titulo,
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
});
