import { View, Text } from 'react-native';
import TarjetaDeuda from '../DebtCard';
import { useDatosSociales } from '../../social/SocialDataContext';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import { crearEstilosDetalleSocial } from '../../styles/social/SocialDetailStyles';

export default function DeudaPersona({ deuda, abrirRegistro, ...aspecto }: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & { deuda: import('../../social/types').DeudaVista } & Pick<import('../../social/types').AccionesSociales, 'abrirRegistro'>) {
  const { obtenerPersona } = useDatosSociales();
  const estilos = crearEstilosDetalleSocial(aspecto.tema);
  return <View style={estilos.seccion}>
    <TarjetaDeuda deuda={deuda} nombrePersona={nombreCompletoPersona(obtenerPersona(deuda.personaId))} tema={aspecto.tema} alAbrir={() => abrirRegistro('detalleDeuda', { deudaId: deuda.id })} />
    <Text numberOfLines={2} style={estilos.secundario}>{deuda.origen} · Original: {deuda.monto}</Text>
  </View>;
}
