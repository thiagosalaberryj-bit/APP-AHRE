import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { TEMAS } from '../styles/colors';
import { crearEstilosEncabezadoCompacto } from '../styles/CompactHeaderStyles';

export default function EncabezadoCompacto({
  titulo,
  tema = TEMAS.claro,
  alVolver,
  accesorioDerecho,
  etiquetaVolver = 'Volver',
}) {
  const estilos = crearEstilosEncabezadoCompacto(tema);

  return (
    <>
      <StatusBar backgroundColor={tema.encabezado} style="light" translucent={false} />
      <View style={estilos.contenedor}>
        <Pressable
          accessibilityLabel={etiquetaVolver}
          accessibilityRole="button"
          onPress={alVolver}
          style={estilos.botonVolver}
        >
          <Ionicons color={tema.botonPrincipal} name="chevron-back" size={20} />
        </Pressable>
        <View style={estilos.filaTitulo}>
          <Text numberOfLines={1} style={estilos.titulo}>{titulo}</Text>
          {accesorioDerecho}
        </View>
      </View>
    </>
  );
}
