import { useCallback, useContext, useEffect, useRef, useState } from 'react';
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

import { RUTAS } from './src/constants/routes';
import { APARIENCIA_PREDETERMINADA } from './src/constants/profile';
import { ContextoApariencia, ProveedorApariencia } from './src/contexts/AppearanceContext';
import { ProveedorAvisos } from './src/contexts/ToastContext';
import { inicializarBaseDatos } from './src/database';
import { ErrorBaseDatos } from './src/database/errors';
import NavegadorAplicacion from './src/navigation/AppNavigator';
import { cargarAparienciaSesionGuardada } from './src/profile/profileService';
import { TEMAS } from './src/styles/colors';

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
  const { tema, establecerApariencia } = useContext(ContextoApariencia);
  const [estadoInicio, establecerEstadoInicio] = useState('preparando');
  const [mensajeErrorInicio, establecerMensajeErrorInicio] = useState(null);
  const [intentoInicio, establecerIntentoInicio] = useState(0);
  const pantallaCargaOculta = useRef(false);
  const ocultarPantallaCarga = useCallback(() => {
    if (pantallaCargaOculta.current) return;
    pantallaCargaOculta.current = true;
    PantallaCarga.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    InterfazSistema.setBackgroundColorAsync(tema.fondo);
    if (Platform.OS === 'android') {
      BarraNavegacion.setStyle(tema.nombre === 'oscuro' ? 'light' : 'dark');
    }
  }, [tema]);

  useEffect(() => {
    let componenteActivo = true;

    async function prepararInicio() {
      establecerEstadoInicio('preparando');
      establecerMensajeErrorInicio(null);

      try {
        await inicializarBaseDatos();

        let aparienciaInicial = APARIENCIA_PREDETERMINADA;
        try {
          aparienciaInicial = await cargarAparienciaSesionGuardada();
        } catch (_errorAlCargarApariencia) {
          // La apariencia no debe bloquear el inicio si no se puede recuperar.
        }

        if (!componenteActivo) return;

        establecerApariencia(aparienciaInicial);
        const temaInicial = TEMAS[aparienciaInicial] || tema;
        try {
          await InterfazSistema.setBackgroundColorAsync(temaInicial.fondo);
          if (Platform.OS === 'android') {
            await BarraNavegacion.setStyle(temaInicial.nombre === 'oscuro' ? 'light' : 'dark');
          }
        } catch (_errorAlAplicarApariencia) {
          // La interfaz usa el tema guardado aunque el sistema no permita actualizar las barras.
        }

        if (componenteActivo) {
          establecerEstadoInicio('lista');
        }
      } catch (error) {
        if (componenteActivo) {
          establecerMensajeErrorInicio(
            error instanceof ErrorBaseDatos
              ? error.message
              : 'No se pudo preparar el inicio de AHRE. Intentá nuevamente.',
          );
          establecerEstadoInicio('error');
        }
      }
    }

    prepararInicio();

    return () => {
      componenteActivo = false;
    };
  }, [establecerApariencia, intentoInicio]);

  return (
    <SafeAreaProvider>
      <ProveedorAvisos>
        <StatusBar
          style="light"
          backgroundColor={tema.encabezado}
        />
        {estadoInicio === 'preparando' ? (
          <View style={[estilosInicializacion.contenedor, { backgroundColor: tema.fondo }]}>
            {intentoInicio > 0 ? (
              <>
                <ActivityIndicator size="large" color={tema.foco} />
                <Text
                  style={[estilosInicializacion.textoError, { color: tema.textoPrincipal }]}
                >
                  Preparando el inicio…
                </Text>
              </>
            ) : null}
          </View>
        ) : (
          <View onLayout={ocultarPantallaCarga} style={{ flex: 1 }}>
            {estadoInicio === 'lista' ? (
              <NavegadorAplicacion rutaInicial={RUTAS.INICIO} />
            ) : (
              <View style={[estilosInicializacion.contenedor, { backgroundColor: tema.fondo }]}>
                <Text
                  accessibilityRole="alert"
                  style={[estilosInicializacion.textoError, { color: tema.textoPrincipal }]}
                >
                  {mensajeErrorInicio || 'No se pudo preparar el inicio de AHRE. Intentá nuevamente.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => establecerIntentoInicio((intento) => intento + 1)}
                  style={[estilosInicializacion.botonReintentar, { backgroundColor: tema.botonPrincipal }]}
                >
                  <Text style={[estilosInicializacion.textoBoton, { color: tema.botonPrincipalTexto }]}>
                    Reintentar
                  </Text>
                </Pressable>
              </View>
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
