import { obtenerPersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import TarjetaResumenDeuda from './DebtSummaryCard';
import { DEUDAS_SIMULADAS } from '../../social/socialMockData';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function FormularioEliminarDeuda({ parametros, ...aspecto }) {
  const { tema, estilosGlobales } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  const deuda = DEUDAS_SIMULADAS.find(elemento => elemento.id === parametros.deudaId);
  if (!deuda) return <RegistroNoDisponible {...aspecto} />;
  return <>
    <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <View style={estilos.filaCampos}><Ionicons color={tema.error} name="trash-outline" size={24} /><Text style={estilosGlobales.encabezadoSeccion}>Revisá antes de eliminar</Text></View>
      <Text style={estilosGlobales.textoSecundario}>Esta deuda dejaría de aparecer en tu listado. Eliminarla no registra un pago.</Text>
    </View>
    <TarjetaResumenDeuda deuda={deuda} soloLectura {...aspecto} />
    <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <Text style={estilosGlobales.etiqueta}>Lo que se conserva</Text>
      <Text style={estilosGlobales.textoSecundario}>{deuda.salaId ? 'El ítem de origen y el historial de la sala no se borran.' : 'La persona permanece en tu agenda.'} Los pagos ya registrados se conservan.</Text>
      <Text style={estilosGlobales.textoSecundario}>{deuda.saldada ? 'La deuda ya está saldada; no hay importes pendientes.' : `Pendiente que dejaría de figurar: ${deuda.pendiente}. Si hubo un pago, registralo antes de eliminar la deuda.`}</Text>
    </View>
    <AccionesFormulario texto="Eliminar deuda" peligro confirmacion={{ titulo: "¿Eliminar esta deuda?", descripcion: `${deuda.descripcion} · ${nombreCompletoPersona(obtenerPersona(deuda.personaId))}. ${deuda.saldada ? "Ya está saldada." : `Pendiente: ${deuda.pendiente}.`} Dejaría de aparecer en tu listado; esto no registra un pago.`, textoConfirmar: "Sí, eliminar deuda" }} {...aspecto} />
  </>;
}
