import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosPropios from '../../styles/social/DebtCardStyles';

export default function AccionesDeuda({ deuda, abrirRegistro, tema, estilosGlobales }: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({deuda:import('../../social/types').DeudaVista} & Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  if (deuda.saldada||deuda.invitacionOnline||deuda.estadoOnline==='rechazada') return null;
  const estilos = crearEstilosPropios();
  return <View style={estilos.accionesDeuda}>
    <Pressable accessibilityRole="button" accessibilityLabel={deuda.tipo === 'debo' ? 'Registrar mi pago' : 'Registrar pago recibido'}
      onPress={() => abrirRegistro('pago', { deudaId: deuda.id })} style={[estilosGlobales.botonPrincipal, estilos.botonPagoDeuda]}>
      <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={20} />
      <Text style={[estilosGlobales.textoBotonPrincipal, estilos.textoBotonDeuda]}>Registrar pago</Text>
    </Pressable>
    {deuda.tipo==='me_deben'?<Pressable accessibilityRole="button" accessibilityLabel="Perdonar deuda" onPress={() => abrirRegistro('eliminarDeuda', { deudaId: deuda.id })} style={[estilosGlobales.botonSecundario, estilos.botonPagoDeuda]}>
      <Ionicons color={tema.botonSecundarioTexto} name="heart-outline" size={20} />
      <Text style={[estilosGlobales.textoBotonSecundario, estilos.textoBotonDeuda]}>Perdonar deuda</Text>
    </Pressable>:null}
  </View>;
}
