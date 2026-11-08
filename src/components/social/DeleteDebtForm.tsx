import {useRef} from 'react';
import {View,Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useDatosSociales} from '../../social/SocialDataContext';
import {perdonarDeudaPersonal,perdonarDeudaOnline,obtenerVistaSincronizacion} from '../../social/socialService';
import {nombreCompletoPersona,formatearMontoSocial} from '../../social/socialHelpers';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import TarjetaDeuda from '../DebtCard';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function FormularioPerdonarDeuda({parametros,...aspecto}:import('../../social/types').AspectoSocial&{parametros:import('../../social/types').ParametrosSociales}) {
  const social=useDatosSociales(),deuda=social.deudas.find(d=>d.id===parametros.deudaId);
  const pendiente=useRef(deuda?.pendienteNumero||0);
  const estilos=crearEstilosCompartidos(aspecto.tema);
  if(!deuda||deuda.saldada||deuda.tipo!=='me_deben'||deuda.invitacionOnline||deuda.estadoOnline==='rechazada')return <RegistroNoDisponible {...aspecto}/>;
  const online=!!deuda.acuerdoOnlineId;
  const sinConexion=online&&!deuda.id.startsWith('demo-social:')&&['offline','revocado','sesion','local'].includes(obtenerVistaSincronizacion().estado);
  return <>
    <TarjetaDeuda deuda={deuda} nombrePersona={nombreCompletoPersona(social.obtenerPersona(deuda.personaId))} soloLectura {...aspecto}/>
    <View style={[aspecto.estilosGlobales.tarjeta,estilos.tarjetaCompacta]}>
      <View style={estilos.filaCampos}><Ionicons color={aspecto.tema.foco} name="heart-outline" size={24}/><Text style={aspecto.estilosGlobales.encabezadoSeccion}>Perdonar {formatearMontoSocial(pendiente.current)}</Text></View>
      <Text style={aspecto.estilosGlobales.textoSecundario}>El pendiente quedará en cero. No se creará un ingreso ni un egreso y los pagos anteriores se conservarán.</Text>
      <Text style={aspecto.estilosGlobales.textoSecundario}>{online?'Ambas personas verán el perdón. Los pagos que todavía esperan confirmación quedarán rechazados.':'La deuda permanecerá en tu historial como perdonada. Solo cambia tu registro personal.'} Esta acción no tiene deshacer.</Text>
    </View>
    {sinConexion?<Text style={aspecto.estilosGlobales.textoAyuda}>Necesitás conexión para perdonar una deuda online.</Text>:null}
    <AccionesFormulario texto="Confirmar perdón" deshabilitado={sinConexion} alGuardar={async()=>{if(online)await perdonarDeudaOnline(deuda.acuerdoOnlineId!,pendiente.current);else await perdonarDeudaPersonal(deuda.id,pendiente.current);}} recargarAntesDeCerrar alExito={()=>social.volver()} mensajeExito="Deuda perdonada." confirmacion={{titulo:'¿Perdonar esta deuda?',descripcion:deuda.descripcion+' · '+formatearMontoSocial(pendiente.current)+'. No registra un pago.',textoConfirmar:'Sí, perdonar deuda'}} {...aspecto}/>
  </>;
}
