import {pendientesCierreLocales} from '../../social/roomClosing';
import { useDatosSociales } from '../../social/SocialDataContext';
import { obtenerVistaSincronizacion, cerrarSala } from '../../social/socialService';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import ResumenImporteSocial from './SocialAmountSummary';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import { COLOR_ICONO_DEPOSITO } from '../../styles/colors';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/CloseRoomFormStyles';
import useSalaOnline from '../../social/online/useRoomOnline';
export default function FormularioCerrarSala({
  sala,
  ...aspecto
}: import('../../social/types').AspectoSocial & ({sala:import('../../social/types').SalaVista})) {
  const {
    obtenerPersona
  } = useDatosSociales();
  const {
    tema,
    estilosGlobales
  } = aspecto;
  const estilos = {
    ...crearEstilosCompartidos(tema),
    ...crearEstilosPropios(tema)
  };
  const remota = useSalaOnline(sala.id, sala.online);
  const faltantesLocales = pendientesCierreLocales(sala).map(p=>p.descripcion);
  const verificado=!sala.online||Array.isArray(remota?.pendientesCierre);
  const faltantes = sala.online ? (remota?.pendientesCierre || []).map(p => p.nombre + ' · ' + p.descripcion) : faltantesLocales;
  if (!sala || !sala.administrador || sala.estado === 'cerrada') return <RegistroNoDisponible {...aspecto} />;
  const partes = sala.gastos.flatMap(gasto => gasto.partes);
  const pagadas = partes.filter((parte) => parte.tipo === 'saldado');
  const pendientes = sala.gastos.flatMap(gasto => gasto.partes.filter(parte => parte.tipo !== 'saldado' && !parte.cancelada).map(parte => ({
    gasto,
    parte
  })));
  return <>
    {!verificado?<Text style={estilosGlobales.textoAyuda}>Esperá a verificar los registros de todos los integrantes. Actualizá la sala si no se completa.</Text>:null}
    <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
      <View style={estilos.filaCampos}>
        <View style={[estilos.iconoSala, {
          backgroundColor: sala.color
        }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={sala.icono as import('../../constants/movimientos').NombreIcono} size={24} /></View>
        <View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{sala.nombre}</Text><Text style={estilosGlobales.textoSecundario}>{sala.fecha}</Text></View>
      </View>
      <View style={estilos.resumenCierre}>
        <ResumenImporteSocial enFila={false} etiqueta="Total gastado" valor={sala.totalGastado} icono="receipt-outline" {...aspecto} />
        <Text style={estilosGlobales.textoSecundario}>{sala.gastos.length} ítems · {sala.participantes.length + 1} personas</Text>
      </View>
      <View style={estilos.totalesPanel}>
        <ResumenImporteSocial etiqueta="Por cobrar" valor={sala.porCobrar} icono="arrow-up-outline" color={tema.foco} {...aspecto} />
        <ResumenImporteSocial etiqueta="Por pagar" valor={sala.porPagar} icono="arrow-down-outline" color={tema.error} {...aspecto} />
      </View>
      <View style={estilos.filaSimple}>
        <View style={estilos.estadoCierre}><Text style={estilosGlobales.encabezadoSeccion}>{pagadas.length}</Text><Text style={estilosGlobales.textoSecundario}>Partes pagadas</Text></View>
        <View style={estilos.estadoCierre}><Text style={estilosGlobales.encabezadoSeccion}>{pendientes.length}</Text><Text style={estilosGlobales.textoSecundario}>Partes pendientes</Text></View>
      </View>
    </View>
    <View style={estilos.grupoCampo}>
      <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Lo que quedará por pagar</Text>
      {pendientes.length ? <View style={estilos.listaPendientes}>
        {pendientes.map(({
          gasto,
          parte
        }) => <View key={`${gasto.id}-${parte.personaId}`} style={estilos.pendienteCierre}>
          <View style={estilos.filaCampos}><View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.texto}>{nombreCompletoPersona(obtenerPersona(parte.personaId))} → {nombreCompletoPersona(obtenerPersona(gasto.pagadorId))}</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{gasto.descripcion}</Text></View><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.etiqueta}>{parte.pendiente || parte.monto}</Text></View>
        </View>)}
      </View> : <View style={estilos.avisoCierre}><Ionicons color={tema.exito} name="checkmark-circle-outline" size={22} /><Text style={[estilosGlobales.texto, estilos.textoFlexible]}>{sala.gastos.length ? 'Todos pagaron su parte. No se generará ninguna deuda.' : 'La sala no tiene gastos. Pasará al historial sin generar deudas.'}</Text></View>}
    </View>
    <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Al confirmar el cierre</Text>
      <View style={estilos.filaCampos}><Ionicons color={tema.foco} name="lock-closed-outline" size={20} /><Text style={[estilosGlobales.textoSecundario, estilos.textoFlexible]}>La sala quedará en el historial, en solo lectura. No podrás editar sus ítems ni sus personas.</Text></View>
      <Text style={estilosGlobales.textoSecundario}>{pendientes.length ? (sala.online?'Se fijarán las obligaciones de todas las personas de la sala.':'Las partes pendientes que te involucren se registrarán como deudas. Los pendientes entre otras personas quedarán solo en la sala.') : 'No quedarán pagos pendientes de esta sala.'}</Text>
      <Text style={estilosGlobales.textoSecundario}>Todas las cuentas deben asociar sus compras y pagos a un depósito o movimiento antes del cierre. El cierre los confirma en sus cuentas. El administrador puede confirmar pagos de invitados sin exigirles un depósito. Las deudas pendientes con invitados quedan como deudas personales.</Text>
    </View>
    <AccionesFormulario deshabilitado={!verificado||faltantes.length>0||(!sala.demo&&sala.online&&(!remota||['offline','revocado','sesion'].includes(obtenerVistaSincronizacion().estado)||sala.pendientesOnline>0))} texto="Confirmar cierre" alGuardar={() => cerrarSala(sala.id)} {...aspecto} />
  </>;
}
