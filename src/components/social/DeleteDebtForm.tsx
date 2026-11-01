import type { AspectoSocial } from '../../social/types';
import { useDatosSociales } from '../../social/SocialDataContext';
import { cancelarDeuda } from '../../social/socialService';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import TarjetaResumenDeuda from './DebtSummaryCard';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioEliminarDeuda({
  parametros,
  ...aspecto
}: import('../../social/types').AspectoSocial & ({parametros:import('../../social/types').ParametrosSociales})) {
  const {
    obtenerPersona,
    deudas: deudasSociales
  } = useDatosSociales();
  const {
    tema,
    estilosGlobales
  } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  const deuda = deudasSociales.find(elemento => elemento.id === parametros.deudaId);
  if (!deuda || deuda.saldada) return <RegistroNoDisponible {...aspecto} />;
  return <>
    <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <View style={estilos.filaCampos}><Ionicons color={tema.error} name="trash-outline" size={24} /><Text style={estilosGlobales.encabezadoSeccion}>Revisá antes de eliminar</Text></View>
      <Text style={estilosGlobales.textoSecundario}>Esta deuda dejaría de aparecer en tu listado. Eliminarla no registra un pago.</Text>
    </View>
    <TarjetaResumenDeuda deuda={deuda} soloLectura {...aspecto} />
    <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <Text style={estilosGlobales.etiqueta}>Lo que se conserva</Text>
      <Text style={estilosGlobales.textoSecundario}>{deuda.salaId ? 'El ítem de origen y el historial de la sala no se borran.' : 'La persona permanece en tu agenda.'} Los pagos ya registrados se conservan.</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{deuda.saldada ? 'La deuda ya está saldada; no hay importes pendientes.' : `Pendiente que dejaría de figurar: ${deuda.pendiente}. Si hubo un pago, registralo antes de eliminar la deuda.`}</Text>
    </View>
    <AccionesFormulario texto="Eliminar deuda" peligro alGuardar={() => cancelarDeuda(deuda.id)} confirmacion={{
      titulo: "¿Eliminar esta deuda?",
      descripcion: `${deuda.descripcion} · ${nombreCompletoPersona(obtenerPersona(deuda.personaId))}. ${deuda.saldada ? "Ya está saldada." : `Pendiente: ${deuda.pendiente}.`} Dejaría de aparecer en tu listado; esto no registra un pago.`,
      textoConfirmar: "Sí, eliminar deuda"
    }} {...aspecto} />
  </>;
}
