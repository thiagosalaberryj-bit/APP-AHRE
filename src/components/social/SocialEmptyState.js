import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/SocialEmptyStateStyles';
export default function EstadoVacio(propiedades) {
  const {
    icono,
    titulo,
    descripcion,
    estilos,
    estilosGlobales,
    tema
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  return <View style={[estilosGlobales.tarjeta, estilos.estadoVacio]}><Ionicons color={tema.foco} name={icono} size={34} /><Text style={[estilosGlobales.encabezadoSeccion, estilos.textoCentrado]}>{titulo}</Text><Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.textoSecundario, estilos.textoCentrado]}>{descripcion}</Text></View>;
}
