import { View, Text, TextInput } from 'react-native';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/TicketAmountInputStyles';
export default function ImporteTicket(propiedades: import('../../social/types').AspectoSocial & ({etiqueta:string;valor:string;alCambiar:(valor:string)=>void})) {
  const {
    etiqueta,
    valor,
    alCambiar,
    tema,
    estilos
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  return <View style={estilos.campoImporteTicket}>
      <Text style={estilos.simboloTicket}>$</Text>
      <TextInput accessibilityLabel={etiqueta} value={valor} onChangeText={alCambiar} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={estilos.entradaImporteTicket} />
    </View>;
}
