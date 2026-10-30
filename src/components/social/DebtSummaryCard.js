import { obtenerPersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/DebtSummaryCardStyles';
export default function TarjetaResumenDeuda(propiedades) {
  const {
    deuda,
    alAbrir,
    soloLectura = false,
    tema,
    estilos,
    estilosGlobales
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const persona = obtenerPersona(deuda.personaId);
  const colorEstado = deuda.saldada ? tema.exito : deuda.tipo === 'debo' ? tema.error : tema.foco;
  const Contenedor = soloLectura ? View : Pressable;
  return <Contenedor accessibilityRole={soloLectura ? undefined : 'button'} accessibilityLabel={`${deuda.descripcion}. ${nombreCompletoPersona(persona)}. ${deuda.saldada ? 'Saldada' : 'Pendiente'}. ${deuda.saldada ? deuda.monto : deuda.pendiente}`} accessibilityHint={soloLectura ? undefined : "Abre toda la información de esta deuda."} onPress={soloLectura ? undefined : alAbrir} style={soloLectura ? [estilosGlobales.tarjeta, estilos.deudaHistorial] : ({
    pressed: presionado
  }) => [estilosGlobales.tarjeta, estilos.deudaHistorial, presionado && estilos.deudaHistorialPresionada]}>
    <View style={estilos.filaCampos}>
      <View style={[estilos.iconoHistorialDeuda, {
        backgroundColor: `${colorEstado}18`
      }]}>
        <Ionicons color={colorEstado} name={deuda.saldada ? 'checkmark-circle-outline' : 'swap-horizontal-outline'} size={20} />
      </View>
      <View style={estilos.contenidoResumenDeuda}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{deuda.descripcion}</Text>
        <View style={estilos.filaCampos}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.texto, estilos.textoFlexible]}>{nombreCompletoPersona(persona)}</Text>
          <Text numberOfLines={1} style={[estilosGlobales.textoSecundario, estilos.fechaResumenDeuda]}>{deuda.fecha.split('-').reverse().join('/')}</Text>
        </View>
      </View>
      <View style={estilos.franjaImporteHistorial}>
        <View style={estilos.filaCampos}>
          <Text numberOfLines={1} style={[estilos.estadoHistorialDeuda, estilos.textoFlexible, {
            color: colorEstado
          }]}>{deuda.saldada ? 'Saldada' : deuda.tipo === 'debo' ? 'Le debés' : 'Te debe'}</Text>
          {!soloLectura ? <Ionicons color={tema.textoSecundario} name="chevron-forward" size={16} /> : null}
        </View>
        <Text style={estilosGlobales.encabezadoSeccion}>{deuda.saldada ? deuda.monto : deuda.pendiente}</Text>
      </View>
    </View>
  </Contenedor>;
}
