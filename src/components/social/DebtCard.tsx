import { View, Text } from 'react-native';
import TarjetaDeuda from '../DebtCard';
import { useDatosSociales } from '../../social/SocialDataContext';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import AccionesDeuda from './DebtActions';
import EnlaceRelacionadoSocial from './SocialRelatedLink';
import { crearEstilosDetalleSocial } from '../../styles/social/SocialDetailStyles';

export default function DeudaPersona({ deuda, abrirSala, abrirRegistro, ...aspecto }: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & { deuda: import('../../social/types').DeudaVista } & Pick<import('../../social/types').AccionesSociales, 'abrirRegistro' | 'abrirSala'>) {
  const { obtenerPersona } = useDatosSociales();
  const estilos = crearEstilosDetalleSocial(aspecto.tema);
  return <View style={estilos.seccion}>
    <TarjetaDeuda deuda={deuda} nombrePersona={nombreCompletoPersona(obtenerPersona(deuda.personaId))} tema={aspecto.tema} alAbrir={() => abrirRegistro('detalleDeuda', { deudaId: deuda.id })} />
    <Text numberOfLines={2} style={estilos.secundario}>{deuda.origen} · Original: {deuda.monto}</Text>
    <AccionesDeuda deuda={deuda} abrirRegistro={abrirRegistro} {...aspecto} />
    {deuda.salaId ? <EnlaceRelacionadoSocial texto="Ver sala de origen" icono="people-outline" alAbrir={() => abrirSala(deuda.salaId!)} {...aspecto} /> : null}
  </View>;
}
