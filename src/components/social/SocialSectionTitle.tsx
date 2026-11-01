import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/SocialSectionTitleStyles';
export default function TituloSeccionSocial(propiedades: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({titulo:string;etiqueta?:string;alAbrir?:()=>void})) {
  const {
    titulo,
    etiqueta,
    alAbrir,
    tema,
    estilos,
    estilosGlobales
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  return <View style={estilos.tituloSeccionPanel}>
      <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>{titulo}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={etiqueta} onPress={alAbrir} hitSlop={4} style={estilos.flechaSeccionPanel}>
        <Text style={estilos.textoVerTodas}>{etiqueta}</Text>
        <Ionicons color={tema.foco} name="chevron-forward" size={20} />
      </Pressable>
    </View>;
}
