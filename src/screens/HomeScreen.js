import { useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as AutenticacionLocal from 'expo-local-authentication';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import { ErrorAutenticacion } from '../authentication/errors';
import { obtenerSesionActual } from '../authentication/sessionService';
import { RUTAS } from '../constants/routes';
import { ErrorBaseDatos } from '../database/errors';
import { COLORES_MARCA } from '../styles/colors';
import { ESPACIADO } from '../styles/globalStyles';
import {
  crearEstilosInicio,
  TAMANO_CONTROL_DESLIZADOR,
} from '../styles/HomeScreenStyles';

const UMBRAL_INICIO = 0.82;
const DURACION_MINIMA_CARGA_MS = 1500;
const ETAPAS_CARGA = [
  'Acceso confirmado',
  'Preparando tu inicio…',
  'Abriendo AHRE…',
];

export default function PantallaInicio({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const contextoAvisos = useContext(ContextoAvisos);
  const mostrarAviso = contextoAvisos?.mostrarAviso;
  const { width: anchoVentana, height: altoVentana } = useWindowDimensions();
  const anchoDeslizador = Math.max(0, anchoVentana - ESPACIADO.pantalla * 2);
  const recorridoDeslizador = Math.max(
    1,
    anchoDeslizador - TAMANO_CONTROL_DESLIZADOR - ESPACIADO.pequeno * 2,
  );
  const tamanoMarca = Math.min(anchoVentana * 0.5, altoVentana * 0.24, 240);
  const tamanoLetras = Math.min(anchoVentana * 0.38, altoVentana * 0.16, 150);
  const anchoLogoCarga = Math.min(anchoVentana * 0.78, 420);
  const altoLogoCarga = Math.min(altoVentana * 0.55, 520);
  const estilos = crearEstilosInicio(
    tema,
    tamanoMarca,
    tamanoLetras,
    anchoDeslizador,
    anchoLogoCarga,
    altoLogoCarga,
  );

  const progreso = useRef(new Animated.Value(0)).current;
  const progresoCargaAnimado = useRef(new Animated.Value(0)).current;
  const progresoActual = useRef(0);
  const inicioArrastre = useRef(0);
  const [iniciando, establecerInicio] = useState(false);
  const [cargando, establecerCarga] = useState(false);
  const [progresoCarga, establecerProgresoCarga] = useState(0);
  const [anchoBarraCarga, establecerAnchoBarraCarga] = useState(0);
  const porcentajeCarga = Math.round(progresoCarga * 100);
  const etapaCarga = progresoCarga < 1 / 3 ? 0 : progresoCarga < 2 / 3 ? 1 : 2;
  const anchoRellenoCarga = progresoCargaAnimado.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0, anchoBarraCarga || anchoDeslizador)],
    extrapolate: 'clamp',
  });

  const reiniciarDeslizador = useCallback((mensaje = null, tipo = 'error') => {
    establecerCarga(false);
    establecerInicio(false);
    progreso.stopAnimation();
    progresoActual.current = 0;
    inicioArrastre.current = 0;
    Animated.spring(progreso, {
      toValue: 0,
      bounciness: 5,
      useNativeDriver: false,
    }).start();
    if (mensaje) mostrarAviso?.(mensaje, { tipo });
  }, [mostrarAviso, progreso]);

  const procesarInicio = useCallback(async () => {
    if (!navegacion) return;

    try {
      const { usuario } = await obtenerSesionActual();
      if (!usuario) {
        navegacion.replace(RUTAS.INICIO_SESION);
        return;
      }

      const [hayHardware, hayHuellaConfigurada] = await Promise.all([
        AutenticacionLocal.hasHardwareAsync(),
        AutenticacionLocal.isEnrolledAsync(),
      ]);

      if (!hayHardware || !hayHuellaConfigurada) {
        mostrarAviso?.(
          'No hay una huella configurada en este dispositivo. Iniciá sesión con tu contraseña.',
          { tipo: 'informacion' },
        );
        navegacion.replace(RUTAS.INICIO_SESION);
        return;
      }

      const resultado = await AutenticacionLocal.authenticateAsync({
        promptMessage: 'Usá tu huella para continuar',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
      });

      if (!resultado.success) {
        if (['not_available', 'not_enrolled', 'passcode_not_set', 'user_fallback', 'lockout'].includes(resultado.error)) {
          mostrarAviso?.(
            'No se pudo validar la huella. Iniciá sesión con tu contraseña.',
            { tipo: 'informacion' },
          );
          navegacion.replace(RUTAS.INICIO_SESION);
          return;
        }

        const fueCancelada = ['user_cancel', 'app_cancel', 'system_cancel'].includes(resultado.error);
        reiniciarDeslizador(
          fueCancelada
            ? 'No se verificó la huella. Deslizá para intentarlo de nuevo.'
            : 'No se pudo validar la huella. Deslizá para intentarlo de nuevo.',
          fueCancelada ? 'informacion' : 'error',
        );
        return;
      }

      establecerProgresoCarga(0);
      establecerCarga(true);
    } catch (error) {
      const mensaje =
        error instanceof ErrorAutenticacion || error instanceof ErrorBaseDatos
          ? error.message
          : 'No se pudo comprobar la sesión local. Intentá nuevamente.';
      reiniciarDeslizador(mensaje, 'error');
    }
  }, [mostrarAviso, navegacion, reiniciarDeslizador]);

  useEffect(() => {
    if (!cargando) {
      establecerProgresoCarga(0);
      progresoCargaAnimado.setValue(0);
      return undefined;
    }

    const inicioCarga = Date.now();
    let temporizadorFinal = null;
    const animacion = Animated.timing(progresoCargaAnimado, {
      toValue: 1,
      duration: DURACION_MINIMA_CARGA_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animacion.start();
    const temporizador = setInterval(() => {
      const siguienteProgreso = Math.min(
        1,
        (Date.now() - inicioCarga) / DURACION_MINIMA_CARGA_MS,
      );
      establecerProgresoCarga(siguienteProgreso);

      if (siguienteProgreso >= 1) {
        clearInterval(temporizador);
        temporizadorFinal = setTimeout(() => navegacion.replace(RUTAS.PRINCIPAL), 150);
      }
    }, 30);

    return () => {
      clearInterval(temporizador);
      if (temporizadorFinal) clearTimeout(temporizadorFinal);
      animacion.stop();
    };
  }, [cargando, navegacion, progresoCargaAnimado]);

  const gestorDeGestos = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !iniciando,
        onMoveShouldSetPanResponder: (_eventoNativo, movimiento) =>
          !iniciando && Math.abs(movimiento.dx) > 3,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          progreso.stopAnimation((valor) => {
            progresoActual.current = valor;
            inicioArrastre.current = valor;
          });
        },
        onPanResponderMove: (_eventoNativo, movimiento) => {
          const siguiente = Math.max(
            0,
            Math.min(1, inicioArrastre.current + movimiento.dx / recorridoDeslizador),
          );
          progresoActual.current = siguiente;
          progreso.setValue(siguiente);
        },
        onPanResponderRelease: () => {
          if (progresoActual.current >= UMBRAL_INICIO) {
            establecerInicio(true);
            Animated.timing(progreso, {
              toValue: 1,
              duration: 450,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }).start(({ finished: finalizada }) => {
              if (finalizada) procesarInicio();
            });
            return;
          }

          Animated.spring(progreso, {
            toValue: 0,
            bounciness: 5,
            useNativeDriver: false,
          }).start(({ finished: finalizada }) => {
            if (finalizada) progresoActual.current = 0;
          });
        },
        onPanResponderTerminate: () => {
          progresoActual.current = 0;
          Animated.spring(progreso, { toValue: 0, useNativeDriver: false }).start();
        },
      }),
    [iniciando, procesarInicio, progreso, recorridoDeslizador],
  );

  const desplazamientoControl = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, recorridoDeslizador],
  });
  const anchoCola = desplazamientoControl;
  const anchoRelleno = TAMANO_CONTROL_DESLIZADOR + ESPACIADO.pequeno * 2;
  const colorFondo = tema.fondo;

  return (
    <View style={[estilos.pantalla, { backgroundColor: colorFondo }]}>
      <StatusBar
        style={tema.nombre === 'oscuro' ? 'light' : 'dark'}
        backgroundColor={colorFondo}
        translucent={false}
      />

      <SafeAreaView edges={['top', 'bottom']} style={estilos.areaSegura}>
        {cargando ? (
          <View style={estilos.pantallaCarga}>
            <View style={estilos.contenidoCarga}>
              <Image
                accessibilityLabel="Logo de AHRE"
                resizeMode="contain"
                source={require('../../assets/ahre-logo.png')}
                style={estilos.marcaCarga}
              />
            </View>
            <View style={estilos.filaEstadoCarga}>
              <Text style={estilos.textoEstadoCarga}>
                {ETAPAS_CARGA[etapaCarga]}
              </Text>
              <Text style={estilos.textoPorcentajeCarga}>
                {porcentajeCarga}%
              </Text>
            </View>
            <View
              onLayout={(evento) =>
                establecerAnchoBarraCarga(evento.nativeEvent.layout.width)
              }
              accessibilityLabel="Progreso de carga"
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: porcentajeCarga,
                text: `${porcentajeCarga}%`,
              }}
              style={estilos.fondoBarraProgreso}
            >
              <Animated.View
                style={[
                  estilos.rellenoBarraProgreso,
                  { width: anchoRellenoCarga },
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={estilos.contenido}>
            <Image
              accessibilityLabel="Logo de AHRE"
              resizeMode="contain"
              source={require('../../assets/ahre-mark.png')}
              style={estilos.marca}
            />

            <View style={estilos.areaNombre}>
              <View accessible accessibilityLabel="AHRE" style={estilos.nombre}>
                <Text style={estilos.letras}>AH</Text>
                <Text style={estilos.letras}>RE</Text>
              </View>
            </View>

            <View style={estilos.deslizador}>
              <Animated.View style={[estilos.colaRellenoDeslizador, { width: anchoCola }]} />
              <Animated.View
                style={[
                  estilos.rellenoDeslizador,
                  {
                    width: anchoRelleno,
                    transform: [{ translateX: desplazamientoControl }],
                  },
                ]}
              />
              <Text
                pointerEvents="none"
                style={[estilos.textoDeslizador, iniciando && estilos.textoIniciando]}
              >
                {iniciando ? 'Verificando sesión…' : 'Desliza para iniciar'}
              </Text>
              <Animated.View
                {...gestorDeGestos.panHandlers}
                accessible
                accessibilityHint="Desliza hacia la derecha para continuar con AHRE"
                accessibilityLabel="Deslizar para iniciar AHRE"
                accessibilityRole="adjustable"
                accessibilityState={{ disabled: iniciando }}
                style={[
                  estilos.controlDeslizador,
                  { transform: [{ translateX: desplazamientoControl }] },
                  iniciando && estilos.controlDeslizadorIniciando,
                ]}
              >
                <Ionicons
                  color={iniciando ? COLORES_MARCA.verdeClaro : COLORES_MARCA.verdeOscuro}
                  name="chevron-forward"
                  size={27}
                  style={estilos.flecha}
                />
              </Animated.View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
