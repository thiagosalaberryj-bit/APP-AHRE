import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function OpcionPersona(propiedades) {
  const {
    persona,
    marcada,
    alPresionar,
    detalle,
    deshabilitada,
    tema,
    estilos,
    estilosGlobales
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  return <Pressable accessibilityRole="checkbox" accessibilityState={{
    checked: marcada,
    disabled: Boolean(deshabilitada)
  }} disabled={deshabilitada} onPress={alPresionar} style={estilos.opcionPersona}>
      <Ionicons color={tema.foco} name={marcada ? 'checkbox' : 'square-outline'} size={24} />
      <View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.texto}>{persona.nombre}</Text>{detalle ? <Text style={estilosGlobales.textoAyuda}>{detalle}</Text> : null}</View>
    </Pressable>;
}
