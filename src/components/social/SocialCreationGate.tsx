import type { AspectoSocial } from '../../social/types';
import { View, Text } from 'react-native';
import { useDatosSociales } from '../../social/SocialDataContext';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function RequisitoCreacionSocial({ aplicar = true, children = undefined, ...aspecto }: import('../../social/types').AspectoSocial & ({aplicar?:boolean;children?:import('react').ReactNode})) {
  const social = useDatosSociales(), estilos = crearEstilosCompartidos(aspecto.tema);
  if (!aplicar || social.habilitadoParaCrear) return children;
  return <View style={[aspecto.estilosGlobales.tarjeta, estilos.grupo]}>
    <Text style={aspecto.estilosGlobales.encabezadoSeccion}>Primero, un depósito con dinero</Text>
    <Text style={aspecto.estilosGlobales.textoSecundario}>Para crear personas, salas, gastos o deudas necesitás un depósito propio activo con saldo positivo.</Text>
    <BotonSocial texto="Ir a Depósitos" alPresionar={social.abrirDeposito} {...aspecto} />
  </View>;
}
