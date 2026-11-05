import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/DebtCardStyles';

export default function AccionesDeuda({ deuda, abrirRegistro, tema, estilosGlobales, mostrarTextoEliminar = false }: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({deuda:import('../../social/types').DeudaVista;mostrarTextoEliminar?:boolean} & Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  if (deuda.saldada) return null;
  const estilos = { ...crearEstilosCompartidos(tema), ...crearEstilosPropios(tema) };
  return <View style={estilos.accionesDeuda}>
    <Pressable accessibilityRole="button" accessibilityLabel={deuda.tipo === 'debo' ? 'Registrar mi pago' : 'Registrar pago recibido'}
      onPress={() => abrirRegistro('pago', { deudaId: deuda.id })} style={[estilosGlobales.botonPrincipal, estilos.botonPagoDeuda]}>
      <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={20} />
      <Text style={[estilosGlobales.textoBotonPrincipal, estilos.textoBotonDeuda]}>Registrar pago</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Eliminar deuda" onPress={() => abrirRegistro('eliminarDeuda', { deudaId: deuda.id })} style={[estilos.botonEliminarDeuda, mostrarTextoEliminar && estilos.botonEliminarConTexto]}>
      <Ionicons color={tema.error} name="trash-outline" size={20} />
      {mostrarTextoEliminar ? <Text style={estilos.textoEliminar}>Eliminar deuda</Text> : null}
    </Pressable>
  </View>;
}
