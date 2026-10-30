import { DEUDAS_SIMULADAS } from '../../social/socialMockData';
import EstadoVacio from './SocialEmptyState';
import { obtenerPersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { View, Text } from 'react-native';
import TarjetaDeuda from './DebtCard';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function DetalleDeuda(propiedades) {
  const {
    deudaId,
    abrirPersona,
    abrirSala,
    abrirRegistro,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales
  } = aspecto;
  const deuda = DEUDAS_SIMULADAS.find(elemento => elemento.id === deudaId);
  if (!deuda) return <EstadoVacio icono="alert-circle-outline" titulo="Deuda no disponible" descripcion="Volvé al historial para elegir otra deuda." {...aspecto} />;
  const persona = obtenerPersona(deuda.personaId);
  return <>
      <View style={estilos.grupo}>
        <Text style={estilosGlobales.subtitulo}>{nombreCompletoPersona(persona)}</Text>
        <Text style={estilosGlobales.textoSecundario}>Apodo: {persona.apodo} · Fecha: {deuda.fecha.split('-').reverse().join('/')}</Text>
      </View>
      <TarjetaDeuda deuda={deuda} abrirSala={abrirSala} abrirRegistro={abrirRegistro} {...aspecto} />
      <BotonSocial texto="Ver persona" simple alPresionar={() => abrirPersona(persona.id)} {...aspecto} />
    </>;
}
