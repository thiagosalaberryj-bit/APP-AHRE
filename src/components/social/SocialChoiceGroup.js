import { View, Pressable, Text } from 'react-native';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/SocialChoiceGroupStyles';
export default function OpcionesSeleccion(propiedades) {
  const {
    opciones,
    enLinea = false,
    elegida,
    alElegir,
    estilos
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  return <View style={enLinea ? estilos.repartoEnLinea : estilos.opciones}>
      {opciones.map(opcion => <Pressable key={opcion.id} accessibilityRole="radio" accessibilityLabel={opcion.nombre} accessibilityState={{
      checked: elegida === opcion.id
    }} onPress={() => alElegir(opcion.id)} style={[enLinea ? estilos.opcionReparto : estilos.pestana, elegida === opcion.id && estilos.pestanaActiva]}><Text style={[estilos.textoPestana, elegida === opcion.id && estilos.textoPestanaActiva]}>{opcion.nombre}</Text></Pressable>)}
    </View>;
}
