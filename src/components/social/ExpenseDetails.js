import { useDatosSociales } from '../../social/SocialDataContext';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/ExpenseDetailsStyles';
export default function DetalleGasto(propiedades) {
  const {
    obtenerPersona
  } = useDatosSociales();
  const {
    gasto,
    sala,
    abrirRegistro,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales,
    tema
  } = aspecto;
  return <>
      <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
        <View style={estilos.filaCampos}>
          <View style={estilos.avatarAgenda}><Ionicons color={tema.foco} name="receipt-outline" size={22} /></View>
          <View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{gasto.descripcion}</Text><Text style={estilosGlobales.textoSecundario}>{gasto.fecha}</Text></View>
          {sala.estado === 'abierta' ? <Pressable accessibilityRole="button" accessibilityLabel="Editar gasto" onPress={() => abrirRegistro('gasto', {
          salaId: sala.id,
          gastoId: gasto.id
        })} style={estilos.editarPersona}><Ionicons color={tema.foco} name="create-outline" size={24} /></Pressable> : <Text style={estilosGlobales.textoSecundario}>Solo lectura</Text>}
        </View>
        <View style={estilos.resumenImportesPersona}>
          <View style={estilos.importePersona}><Text style={estilosGlobales.textoSecundario}>Importe</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.titulo}>{gasto.monto}</Text></View>
          <View style={estilos.importePersona}><Text style={estilosGlobales.textoSecundario}>Pagó</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{nombreCompletoPersona(obtenerPersona(gasto.pagadorId))}</Text></View>
        </View>
        <Text style={estilosGlobales.etiqueta}>{gasto.distribucion}</Text>
        {gasto.depositosAsociados ? <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>Depósitos asociados: {gasto.depositosAsociados}</Text> : null}
        {sala.estado === 'abierta' ? <Text style={estilosGlobales.textoAyuda}>Reparto provisional · Los movimientos se aplican al cerrar</Text> : null}
      </View>
      <View style={estilos.ticket}>
        <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Partes y pagos</Text>
        {gasto.partes.map(parte => <View key={parte.personaId} style={estilos.lineaDetalleGasto}>
          <View style={estilos.filaCampos}>
            <Ionicons color={parte.tipo === 'saldado' ? tema.exito : tema.error} name={parte.tipo === 'saldado' ? 'checkmark-circle-outline' : 'time-outline'} size={20} />
            <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.texto, estilos.textoFlexible]}>{nombreCompletoPersona(obtenerPersona(parte.personaId))}</Text>
            <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.etiqueta}>{parte.monto}</Text>
          </View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{parte.resumen}</Text>
        </View>)}
      </View>
    </>;
}
