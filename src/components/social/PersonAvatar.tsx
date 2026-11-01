import { useContext } from 'react';
import { ContextoApariencia } from '../../contexts/AppearanceContext';
import { View, Text } from 'react-native';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/PersonAvatarStyles';
export default function AvatarPersona(propiedades: {persona:import('../../social/types').PersonaVista;estilos?:import('../../types/ui').Estilos}) {
  const {
    tema
  } = useContext(ContextoApariencia);
  const {
    persona,
    estilos
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(tema),
      ...crearEstilosPropios(tema)
    }
  };
  return <View style={estilos.avatar}><Text style={estilos.textoAvatar}>{persona.iniciales}</Text></View>;
}
