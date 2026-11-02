import type { AspectoSocial } from '../../social/types';
import { View, Text } from 'react-native';
import ImporteTicket from './TicketAmountInput';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FilaMontoManual(propiedades: import('../../social/types').AspectoSocial & ({persona:import('../../social/types').PersonaVista;valor:string;alCambiar:(valor:string)=>void})) {
  const {
    persona,
    valor,
    alCambiar,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales
  } = aspecto;
  return <View style={estilos.filaTactil}><Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.texto, estilos.textoFlexible]}>{persona.nombre}</Text><ImporteTicket etiqueta={`Parte de ${persona.nombre}`} valor={valor} alCambiar={alCambiar} {...aspecto} /></View>;
}
