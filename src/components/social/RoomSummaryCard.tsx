import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_ICONO_DEPOSITO } from '../../styles/colors';
import crearEstilosPanel from '../../styles/social/SocialPanelStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function TarjetaResumenSala(propiedades: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & ({sala:import('../../social/types').SalaVista;alAbrir:()=>void})) {
  const {
    sala,
    alAbrir,
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
    text: `${sala.participantes.length + 1} personas, creada el ${sala.creadaEl.split('-').reverse().join('/')}, gastado ${sala.totalGastado}, ${sala.estado === 'cerrada' ? 'cerrada' : 'abierta'}, ${sala.movimientosPorRegistrar} movimientos por registrar`
  }} accessibilityHint="Abre los gastos, balances y personas de esta sala." onPress={alAbrir} style={({
    pressed: presionado
  }) => [estilosGlobales.tarjeta, estilos.deudaHistorial, estilos.tarjetaPanel, presionado && estilos.deudaHistorialPresionada]}>
      <View style={estilos.filaCampos}>
        <View style={[estilos.iconoHistorialDeuda, estilos.iconoTarjetaPanel, {
        backgroundColor: sala.color
      }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={sala.icono as import('../../constants/movimientos').NombreIcono} size={20} /></View>
        <View style={estilos.textoFlexible}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.encabezadoSeccion, estilos.tituloTarjetaPanel]}>{sala.nombre}</Text>
          <View style={estilos.filaCampos}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.textoSecundario, estilos.metadatosPanel, estilos.textoFlexible]}>{sala.participantes.length + 1} personas</Text>
            <Text style={[estilosGlobales.textoSecundario, estilos.metadatosPanel, estilos.fechaResumenDeuda]}>{sala.creadaEl.split('-').reverse().join('/')}</Text>
          </View>
        </View>
        <View style={[estilos.franjaImporteHistorial, estilos.franjaImportePanel]}>
          <View style={estilos.filaCampos}><Text style={[estilos.estadoHistorialDeuda, estilos.textoFlexible, {
            color: tema.textoSecundario
          }]}>Gastado</Text><Ionicons color={tema.textoSecundario} name="chevron-forward" size={16} /></View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.encabezadoSeccion, estilos.tituloTarjetaPanel]}>{sala.totalGastado}</Text>
        </View>
      </View>
      {sala.estado==='cerrada'?<Text style={estilosGlobales.textoSecundario}>Cerrada</Text>:null}
      {sala.movimientosPorRegistrar>0?<View style={estilos.filaCampos}><Ionicons name="wallet-outline" size={18} color={tema.foco}/><Text style={[estilosGlobales.etiqueta,estilos.textoFlexible]}>{sala.movimientosPorRegistrar} {sala.movimientosPorRegistrar===1?'movimiento por registrar':'movimientos por registrar'}</Text></View>:null}
    </Pressable>;
}
