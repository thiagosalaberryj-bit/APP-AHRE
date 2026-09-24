import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';

export default function ContenedorAutenticacion({ tema, titulo, descripcion, children: contenido }) {
  const estilos = crearEstilos(tema);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilos.pantalla}>
      <StatusBar
        backgroundColor={tema.fondo}
        style={tema.nombre === 'oscuro' ? 'light' : 'dark'}
        translucent={false}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.ajustadorTeclado}
      >
        <ScrollView
          contentContainerStyle={estilos.contenidoDesplazable}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
        >
          <View style={estilos.contenido}>
            <Text style={estilos.titulo}>{titulo}</Text>
            <Text style={estilos.descripcion}>{descripcion}</Text>

            {contenido}

            <View style={estilos.derechosAutor}>
              <Text style={estilos.textoDerechosAutor}>
                © {new Date().getFullYear()} AHRE. Todos los derechos reservados.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function crearEstilos(tema) {
  return {
    pantalla: {
      flex: 1,
      backgroundColor: tema.fondo,
    },
    ajustadorTeclado: {
      flex: 1,
    },
    contenidoDesplazable: {
      flexGrow: 1,
      paddingHorizontal: ESPACIADO.pantalla,
      paddingBottom: ESPACIADO.grande,
    },
    contenido: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      paddingTop: ESPACIADO.grande,
    },
    derechosAutor: {
      alignItems: 'center',
      marginTop: 'auto',
      paddingTop: ESPACIADO.extraGrande,
      paddingBottom: ESPACIADO.pequeno,
    },
    textoDerechosAutor: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      textAlign: 'center',
    },
    descripcion: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      lineHeight: 23,
      marginBottom: ESPACIADO.extraGrande,
    },
    titulo: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.titulo,
      fontWeight: TIPOGRAFIA.pesos.negrita,
      marginBottom: ESPACIADO.pequeno,
    },
  };
}
