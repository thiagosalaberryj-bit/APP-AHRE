import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosPropios from '../../styles/social/DebtCardStyles';

export default function AccionesDeuda({ deuda, abrirRegistro, tema, estilosGlobales }: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({deuda:import('../../social/types').DeudaVista} & Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  if (deuda.invitacionOnline) return null;
  const estilos = crearEstilosPropios();
  return <View style={estilos.grupoAccionesDeuda}><View style={estilos.accionesDeuda}>
    {!deuda.saldada?<Pressable accessibilityRole="button" accessibilityLabel={deuda.tipo === 'debo' ? 'Registrar mi pago' : 'Registrar pago recibido'}
      onPress={() => abrirRegistro('pago', { deudaId: deuda.id })} style={[estilosGlobales.botonPrincipal, estilos.botonPagoDeuda]}>
      <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={20} />
      <Text style={[estilosGlobales.textoBotonPrincipal, estilos.textoBotonDeuda]}>Registrar pago</Text>
    </Pressable>:null}
    {!deuda.saldada&&deuda.tipo==='me_deben'?<Pressable accessibilityRole="button" accessibilityLabel="Perdonar deuda" onPress={() => abrirRegistro('eliminarDeuda', { deudaId: deuda.id })} style={[estilosGlobales.botonSecundario, estilos.botonPagoDeuda]}>
      <Ionicons color={tema.botonSecundarioTexto} name="heart-outline" size={20} />
      <Text style={[estilosGlobales.textoBotonSecundario, estilos.textoBotonDeuda]}>Perdonar deuda</Text>
    </Pressable>:null}
    </View>
    {!deuda.acuerdoOnlineId?<Pressable accessibilityRole="button" accessibilityLabel="Eliminar deuda personal" onPress={()=>abrirRegistro('eliminarDeuda',{deudaId:deuda.id,modo:'eliminar-personal'})} style={estilos.accionEliminarDeuda}><Ionicons name="trash-outline" color={tema.error} size={20}/><Text style={[estilos.textoBotonDeuda,{color:tema.error}]}>Eliminar deuda</Text></Pressable>:null}
  </View>;
}
