import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_ICONO_DEPOSITO } from '../../styles/colors';
import crearEstilosPanel from '../../styles/social/SocialPanelStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function TarjetaResumenSala(propiedades: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({sala:import('../../social/types').SalaVista;alAbrir:()=>void;compacta?:boolean})) {
  const {
    sala,
    alAbrir,
    compacta = false,
    tema,
    estilos,
    estilosGlobales
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPanel(propiedades.tema)
    }
  };
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${sala.nombre}`} accessibilityValue={{
    text: `${sala.participantes.length + 1} personas, creada el ${sala.creadaEl.split('-').reverse().join('/')}, gastado ${sala.totalGastado}`
  }} accessibilityHint="Abre los gastos, balances y personas de esta sala." onPress={alAbrir} style={({
    pressed: presionado
  }) => [estilosGlobales.tarjeta, estilos.deudaHistorial, compacta && estilos.tarjetaPanel, presionado && estilos.deudaHistorialPresionada]}>
      <View style={estilos.filaCampos}>
        <View style={[estilos.iconoHistorialDeuda, compacta && estilos.iconoTarjetaPanel, {
        backgroundColor: sala.color
      }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={sala.icono as import('../../constants/movimientos').NombreIcono} size={20} /></View>
        <View style={estilos.textoFlexible}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.encabezadoSeccion, compacta && estilos.tituloTarjetaPanel]}>{sala.nombre}</Text>
          <View style={estilos.filaCampos}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.textoSecundario, compacta && estilos.metadatosPanel, estilos.textoFlexible]}>{sala.participantes.length + 1} personas</Text>
            <Text style={[estilosGlobales.textoSecundario, compacta && estilos.metadatosPanel, estilos.fechaResumenDeuda]}>{sala.creadaEl.split('-').reverse().join('/')}</Text>
          </View>
        </View>
        <View style={[estilos.franjaImporteHistorial, compacta && estilos.franjaImportePanel]}>
          <View style={estilos.filaCampos}><Text style={[estilos.estadoHistorialDeuda, estilos.textoFlexible, {
            color: tema.textoSecundario
          }]}>Gastado</Text><Ionicons color={tema.textoSecundario} name="chevron-forward" size={16} /></View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.encabezadoSeccion, compacta && estilos.tituloTarjetaPanel]}>{sala.totalGastado}</Text>
        </View>
      </View>
    </Pressable>;
}
