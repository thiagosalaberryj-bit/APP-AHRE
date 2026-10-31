import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function EnlaceRelacionadoSocial({ texto, icono, alAbrir, tema, estilosGlobales }) {
  const estilos = crearEstilosCompartidos(tema);
  return <Pressable accessibilityRole="button" accessibilityLabel={texto} onPress={alAbrir} style={[estilosGlobales.botonSecundario, estilos.filaCampos]}>
    <View style={[estilos.iconoHistorialDeuda, { backgroundColor: `${tema.botonSecundarioTexto}18` }]}>
      <Ionicons name={icono} color={tema.botonSecundarioTexto} size={22} />
    </View>
    <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.textoBotonSecundario, estilos.textoFlexible]}>{texto}</Text>
    <Ionicons name="chevron-forward" color={tema.botonSecundarioTexto} size={20} />
  </Pressable>;
}
