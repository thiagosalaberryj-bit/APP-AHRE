import { Modal, Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function ModalConfirmacionSocial({ titulo, descripcion, textoConfirmar, peligro = false, alCerrar, alConfirmar, ...aspecto }) {
  const { tema, estilosGlobales } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  return <Modal transparent animationType="fade" visible onRequestClose={alCerrar}>
    <View style={estilos.fondoModal}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver sin confirmar" onPress={alCerrar} style={estilos.cierreFondo} />
      <View accessibilityViewIsModal style={estilos.tarjetaModal}>
        <View style={estilos.filaModal}>
          <Text accessibilityRole="header" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>{titulo}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar confirmación" onPress={alCerrar} style={estilos.botonCerrar}><Ionicons color={tema.textoSecundario} name="close" size={24} /></Pressable>
        </View>
        <Text style={estilosGlobales.texto}>{descripcion}</Text>
        <BotonSocial texto={textoConfirmar} peligro={peligro} alPresionar={alConfirmar} {...aspecto} />
      </View>
    </View>
  </Modal>;
}
