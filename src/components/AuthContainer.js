import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';

export default function ContenedorAutenticacion({ tema, titulo, descripcion, children: contenido }) {
  const estilos = crearEstilos(tema);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilos.pantalla}>
      <StatusBar style={tema.nombre === 'oscuro' ? 'light' : 'dark'} backgroundColor={tema.fondo} />
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
            <View style={estilos.marca}>
              <Image
                accessibilityLabel="Símbolo de AHRE"
                resizeMode="contain"
                source={require('../../assets/ahre-mark.png')}
                style={estilos.logo}
              />
              <View>
                <Text style={estilos.nombreMarca}>AHRE</Text>
                <Text style={estilos.eslogan}>Finanzas en orden</Text>
              </View>
            </View>

            <View style={estilos.encabezado}>
              <Text style={estilos.sobreTitulo}>TU ESPACIO FINANCIERO</Text>
              <Text style={estilos.titulo}>{titulo}</Text>
              <Text style={estilos.descripcion}>{descripcion}</Text>
            </View>

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
    marca: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
    },
    logo: {
      width: 44,
      height: 44,
    },
    nombreMarca: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: 18,
      fontWeight: TIPOGRAFIA.pesos.negrita,
      letterSpacing: 2,
    },
    eslogan: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
    },
    encabezado: {
      marginTop: ESPACIADO.enorme,
      marginBottom: ESPACIADO.extraGrande,
      gap: ESPACIADO.pequeno,
    },
    sobreTitulo: {
      color: tema.foco,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      fontWeight: TIPOGRAFIA.pesos.negrita,
      letterSpacing: 1.2,
    },
    titulo: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.titulo + 4,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    descripcion: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      lineHeight: 23,
    },
  };
}
