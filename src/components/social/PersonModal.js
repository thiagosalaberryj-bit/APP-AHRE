import { Modal, KeyboardAvoidingView, Platform, Pressable, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormularioPersona from './PersonForm';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function ModalPersona(propiedades) {
  const {
    visible,
    alCerrar,
    abrirPersona,
    personaInicial,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  return <Modal transparent animationType="fade" visible={visible} onRequestClose={alCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.fondoModal}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar formulario de persona" onPress={alCerrar} style={estilos.cierreFondo} />
        <View accessibilityViewIsModal style={estilos.tarjetaModal}>
          <View style={estilos.filaModal}>
            <Text accessibilityRole="header" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>{personaInicial ? 'Editar persona' : 'Agregar persona'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar edición de persona" onPress={alCerrar} style={estilos.botonCerrar}><Ionicons color={tema.textoPrincipal} name="close" size={24} /></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={estilos.desplazamientoModal}>
            {visible ? <FormularioPersona personaInicial={personaInicial} alCerrar={alCerrar} abrirPersona={id => {
            alCerrar();
            abrirPersona(id);
          }} {...aspecto} /> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>;
}
