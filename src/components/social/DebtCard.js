import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/DebtCardStyles';
export default function TarjetaDeuda(propiedades) {
  const {
    deuda,
    abrirSala,
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
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  return <View style={[estilosGlobales.tarjeta, estilos.tarjetaCompacta]}>
      <View style={estilos.filaTitulo}>
        <View style={estilos.textoFlexible}>
          <Text style={estilosGlobales.encabezadoSeccion}>{deuda.descripcion}</Text>
          <Text style={estilosGlobales.textoSecundario}>{deuda.origen}</Text>
        </View>
        <Text style={estilosGlobales.monto}>{deuda.saldada ? '$ 0' : deuda.pendiente}</Text>
      </View>
      <Text style={estilosGlobales.textoSecundario}>{deuda.saldada ? 'Saldado' : deuda.tipo === 'debo' ? 'Le debés' : 'Te debe'} · Original: {deuda.monto}</Text>
      {!deuda.saldada ? <Text style={estilosGlobales.textoSecundario}>{deuda.estado}</Text> : null}
      <View style={estilos.accionesDeuda}>
        {!deuda.saldada ? <Pressable accessibilityRole="button" accessibilityLabel={deuda.tipo === 'debo' ? 'Registrar mi pago' : 'Registrar pago recibido'} onPress={() => abrirRegistro('pago', {
        deudaId: deuda.id
      })} style={[estilos.botonPagoDeuda, estilosGlobales.botonPrincipal]}>
            <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={22} /><Text style={[estilosGlobales.textoBotonPrincipal, estilos.textoBotonDeuda]}>Registrar pago</Text>
          </Pressable> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Eliminar deuda" onPress={() => abrirRegistro('eliminarDeuda', {
        deudaId: deuda.id
      })} style={estilos.botonEliminarDeuda}>
          <Ionicons color={tema.error} name="trash-outline" size={22} /><Text style={estilos.textoEliminarDeuda}>Eliminar deuda</Text>
        </Pressable>
      </View>
      {deuda.salaId ? <BotonSocial texto="Ver sala de origen" simple alPresionar={() => abrirSala(deuda.salaId)} {...aspecto} /> : null}
    </View>;
}
