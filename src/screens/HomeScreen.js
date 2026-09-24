import { useCallback, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUTAS } from '../constants/routes';
import { COLORES_MARCA, TEMAS } from '../styles/colors';
import { ESPACIADO } from '../styles/globalStyles';
import {
  crearEstilosInicio,
  TAMANO_CONTROL_DESLIZADOR,
} from '../styles/HomeScreenStyles';

const UMBRAL_INICIO = 0.82;

export default function PantallaInicio({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const { width: anchoVentana, height: altoVentana } = useWindowDimensions();
  const anchoDeslizador = Math.max(0, anchoVentana - ESPACIADO.pantalla * 2);
  const recorridoDeslizador = Math.max(
    1,
    anchoDeslizador - TAMANO_CONTROL_DESLIZADOR - ESPACIADO.pequeno * 2,
  );
  const tamanoMarca = Math.min(anchoVentana * 0.5, altoVentana * 0.24, 240);
  const tamanoLetras = Math.min(anchoVentana * 0.38, altoVentana * 0.16, 150);
  const estilos = crearEstilosInicio(
    tema,
    tamanoMarca,
    tamanoLetras,
    anchoDeslizador,
  );

  const progreso = useRef(new Animated.Value(0)).current;
  const progresoActual = useRef(0);
  const inicioArrastre = useRef(0);
  const [iniciando, establecerInicio] = useState(false);

  const irAInicioSesion = useCallback(() => {
    navegacion.replace(RUTAS.INICIO_SESION);
  }, [navegacion]);

  const gestorDeGestos = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !iniciando,
        onMoveShouldSetPanResponder: (_eventoNativo, movimiento) => !iniciando && Math.abs(movimiento.dx) > 3,
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
              if (finalizada) irAInicioSesion();
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
    [iniciando, irAInicioSesion, progreso, recorridoDeslizador],
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
      <SafeAreaView edges={['top', 'bottom']} style={estilos.areaSegura}>
        <StatusBar
          backgroundColor={tema.fondo}
          style={tema.nombre === 'oscuro' ? 'light' : 'dark'}
          translucent={false}
        />
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
            <Text pointerEvents="none" style={[estilos.textoDeslizador, iniciando && estilos.textoIniciando]}>
              {iniciando ? 'Iniciando AHRE…' : 'Desliza para iniciar'}
            </Text>
            <Animated.View
              {...gestorDeGestos.panHandlers}
              accessible
              accessibilityHint="Desliza hacia la derecha para abrir Login"
              accessibilityLabel="Deslizar para iniciar AHRE"
              accessibilityRole="adjustable"
              style={[
                estilos.controlDeslizador,
                { transform: [{ translateX: desplazamientoControl }] },
                iniciando && estilos.controlDeslizadorIniciando,
              ]}
            >
              <Ionicons
                color={
                  iniciando
                    ? COLORES_MARCA.verdeClaro
                    : COLORES_MARCA.verdeOscuro
                }
                name="chevron-forward"
                size={27}
                style={estilos.flecha}
              />
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
