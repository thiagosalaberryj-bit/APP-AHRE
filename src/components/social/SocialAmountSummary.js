import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function ResumenImporteSocial({ etiqueta, valor, icono, color, tema, estilosGlobales, estiloValor, enFila = true }) {
  const estilos = crearEstilosCompartidos(tema);
  return <View style={[enFila && estilos.totalPanel, estilos.importeResumen]}>
    <View style={estilos.etiquetaImportePersona}>
      <Ionicons color={color || tema.foco} name={icono} size={20} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.etiqueta, estilos.textoFlexible]}>{etiqueta}</Text>
    </View>
    <Text numberOfLines={1} ellipsizeMode="tail" style={estiloValor || estilosGlobales.titulo}>{valor}</Text>
  </View>;
}
