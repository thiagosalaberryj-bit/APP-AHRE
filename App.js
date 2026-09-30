import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as BarraNavegacion from 'expo-navigation-bar';
import * as PantallaCarga from 'expo-splash-screen';
import * as InterfazSistema from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ContextoApariencia, ProveedorApariencia } from './src/contexts/AppearanceContext';
import { ProveedorAvisos } from './src/contexts/ToastContext';
import { inicializarBaseDatos } from './src/database';
import NavegadorAplicacion from './src/navigation/AppNavigator';

PantallaCarga.preventAutoHideAsync().catch(() => {});

const estilosInicializacion = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  textoError: {
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  botonReintentar: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: '600',
  },
});

function ContenidoAplicacion() {
  const { tema } = useContext(ContextoApariencia);
  const [estadoBaseDatos, establecerEstadoBaseDatos] = useState('preparando');
  const [errorBaseDatos, establecerErrorBaseDatos] = useState(null);
  const [intentoInicializacion, establecerIntentoInicializacion] = useState(0);

  useEffect(() => {
    InterfazSistema.setBackgroundColorAsync(tema.fondo);
    if (Platform.OS === 'android') {
      BarraNavegacion.setStyle(tema.nombre === 'oscuro' ? 'light' : 'dark');
    }
  }, [tema]);

  useEffect(() => {
    let componenteActivo = true;

    async function prepararBaseDatos() {
      establecerEstadoBaseDatos('preparando');
      establecerErrorBaseDatos(null);

      try {
        await inicializarBaseDatos();
        if (componenteActivo) {
          establecerEstadoBaseDatos('lista');
        }
      } catch (error) {
        if (componenteActivo) {
          establecerErrorBaseDatos(error);
          establecerEstadoBaseDatos('error');
        }
      } finally {
        if (componenteActivo) {
          await PantallaCarga.hideAsync().catch(() => {});
        }
      }
    }

    prepararBaseDatos();

    return () => {
      componenteActivo = false;
    };
  }, [intentoInicializacion]);

  return (
    <SafeAreaProvider>
      <ProveedorAvisos>
        <StatusBar
          style="light"
          backgroundColor={tema.encabezado}
        />
        {estadoBaseDatos === 'lista' ? (
          <NavegadorAplicacion />
        ) : (
          <View style={[estilosInicializacion.contenedor, { backgroundColor: tema.fondo }]}>
            {estadoBaseDatos === 'preparando' ? (
              <ActivityIndicator size="large" color={tema.foco} />
            ) : (
              <>
                <Text style={[estilosInicializacion.textoError, { color: tema.textoPrincipal }]}>
                  {errorBaseDatos?.message || 'No se pudo preparar la base de datos local. Intentá nuevamente.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => establecerIntentoInicializacion((intento) => intento + 1)}
                  style={[estilosInicializacion.botonReintentar, { backgroundColor: tema.botonPrincipal }]}
                >
                  <Text style={[estilosInicializacion.textoBoton, { color: tema.botonPrincipalTexto }]}>
                    Reintentar
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </ProveedorAvisos>
    </SafeAreaProvider>
  );
}

export default function Aplicacion() {
  return (
    <ProveedorApariencia>
      <ContenidoAplicacion />
    </ProveedorApariencia>
  );
}
