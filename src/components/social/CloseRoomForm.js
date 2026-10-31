import { useDatosSociales } from '../../social/SocialDataContext';
import { cerrarSala } from '../../social/socialService';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import ResumenImporteSocial from './SocialAmountSummary';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import { COLOR_ICONO_DEPOSITO } from '../../styles/colors';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/CloseRoomFormStyles';
export default function FormularioCerrarSala({
  sala,
  ...aspecto
}) {
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
  if (!sala || sala.estado === 'cerrada') return <RegistroNoDisponible {...aspecto} />;
  const partes = sala.gastos.flatMap(gasto => gasto.partes);
  const pagadas = partes.filter(parte => parte.tipo === 'saldado');
  const pendientes = sala.gastos.flatMap(gasto => gasto.partes.filter(parte => parte.tipo !== 'saldado' && !parte.cancelada).map(parte => ({
    gasto,
    parte
  })));
  return <>
    <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
      <View style={estilos.filaCampos}>
        <View style={[estilos.iconoSala, {
          backgroundColor: sala.color
        }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={sala.icono} size={24} /></View>
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
      <Text style={estilosGlobales.textoSecundario}>{pendientes.length ? 'Las partes pendientes que te involucren se registrarán como deudas. Los pendientes entre otras personas quedarán solo en la sala.' : 'No quedarán pagos pendientes de esta sala.'}</Text>
      <Text style={estilosGlobales.textoSecundario}>Se aplicarán los movimientos nuevos a los depósitos asociados. Los movimientos que ya existían se vincularán sin duplicarlos.</Text>
    </View>
    <AccionesFormulario texto="Confirmar cierre" alGuardar={() => cerrarSala(sala.id)} {...aspecto} />
  </>;
}
