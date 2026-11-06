import crearEstilosReparto from '../../styles/social/ExpenseFormStyles';
import { nombreCompletoPersona } from '../../social/socialHelpers';
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
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosReparto(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales
  } = aspecto;
  return <View style={[estilos.filaReparto, estilos.filaRepartoManual]}><Text style={estilos.nombreReparto}>{nombreCompletoPersona(persona)}</Text><ImporteTicket etiqueta={`Parte de ${persona.nombre}`} valor={valor} alCambiar={alCambiar} {...aspecto} /></View>;
}
