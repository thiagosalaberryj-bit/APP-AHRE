import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/DebtCardStyles';

export default function AccionesDeuda({ deuda, abrirRegistro, tema, estilosGlobales }) {
  if (deuda.saldada) return null;
  const estilos = { ...crearEstilosCompartidos(tema), ...crearEstilosPropios(tema) };
  return <View style={estilos.accionesDeuda}>
    <Pressable accessibilityRole="button" accessibilityLabel={deuda.tipo === 'debo' ? 'Registrar mi pago' : 'Registrar pago recibido'}
      onPress={() => abrirRegistro('pago', { deudaId: deuda.id })} style={[estilos.botonPagoDeuda, estilosGlobales.botonPrincipal]}>
      <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={22} />
      <Text style={[estilosGlobales.textoBotonPrincipal, estilos.textoBotonDeuda]}>Registrar pago</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Eliminar deuda" onPress={() => abrirRegistro('eliminarDeuda', { deudaId: deuda.id })} style={estilos.botonEliminarDeuda}>
      <Ionicons color={tema.error} name="trash-outline" size={22} />
      <Text style={estilos.textoEliminarDeuda}>Eliminar deuda</Text>
    </Pressable>
  </View>;
}
