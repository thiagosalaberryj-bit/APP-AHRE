import { useCallback, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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

import { ROUTES } from '../constants/routes';
import { COLORES_MARCA, TEMAS } from '../styles/colors';
import { ESPACIADO } from '../styles/globalStyles';
import {
  crearEstilosInicio,
  TAMANO_CONTROL_SLIDER,
} from '../styles/InicioScreen';

const UMBRAL_INICIO = 0.82;

export default function InicioScreen({ navigation }) {
  const tema = TEMAS.claro;
  const { width, height } = useWindowDimensions();
  const anchoSlider = Math.max(0, width - ESPACIADO.pantalla * 2);
  const recorridoSlider = Math.max(
    1,
    anchoSlider - TAMANO_CONTROL_SLIDER - ESPACIADO.pequeno * 2,
  );
  const tamanoMarca = Math.min(width * 0.5, height * 0.24, 240);
  const tamanoLetras = Math.min(width * 0.38, height * 0.16, 150);
  const estilos = crearEstilosInicio(
    tema,
    tamanoMarca,
    tamanoLetras,
    anchoSlider,
  );

  const progreso = useRef(new Animated.Value(0)).current;
  const progresoActual = useRef(0);
  const inicioArrastre = useRef(0);
  const [iniciando, setIniciando] = useState(false);

  const irALogin = useCallback(() => {
    navigation.replace(ROUTES.LOGIN);
  }, [navigation]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !iniciando,
        onMoveShouldSetPanResponder: (_, movimiento) => !iniciando && Math.abs(movimiento.dx) > 3,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          progreso.stopAnimation((valor) => {
            progresoActual.current = valor;
            inicioArrastre.current = valor;
          });
        },
        onPanResponderMove: (_, movimiento) => {
          const siguiente = Math.max(
            0,
            Math.min(1, inicioArrastre.current + movimiento.dx / recorridoSlider),
          );
          progresoActual.current = siguiente;
          progreso.setValue(siguiente);
        },
        onPanResponderRelease: () => {
          if (progresoActual.current >= UMBRAL_INICIO) {
            setIniciando(true);
            Animated.timing(progreso, {
              toValue: 1,
              duration: 450,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }).start(({ finished }) => {
              if (finished) irALogin();
            });
            return;
          }

          Animated.spring(progreso, {
            toValue: 0,
            bounciness: 5,
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) progresoActual.current = 0;
          });
        },
        onPanResponderTerminate: () => {
          progresoActual.current = 0;
          Animated.spring(progreso, { toValue: 0, useNativeDriver: false }).start();
        },
      }),
    [iniciando, irALogin, progreso, recorridoSlider],
  );

  const desplazamientoControl = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, recorridoSlider],
  });
  const anchoCola = desplazamientoControl;
  const anchoRelleno = TAMANO_CONTROL_SLIDER + ESPACIADO.pequeno * 2;
  const colorFondo = tema.fondo;

  return (
    <View style={[estilos.pantalla, { backgroundColor: colorFondo }]}>
      <StatusBar
        style={tema.nombre === 'oscuro' ? 'light' : 'dark'}
        backgroundColor={colorFondo}
        translucent={false}
      />

      <SafeAreaView edges={['top', 'bottom']} style={estilos.areaSegura}>
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

          <View style={estilos.slider}>
            <Animated.View style={[estilos.colaRellenoSlider, { width: anchoCola }]} />
            <Animated.View
              style={[
                estilos.rellenoSlider,
                {
                  width: anchoRelleno,
                  transform: [{ translateX: desplazamientoControl }],
                },
              ]}
            />
            <Text pointerEvents="none" style={[estilos.textoSlider, iniciando && estilos.textoIniciando]}>
              {iniciando ? 'Iniciando AHRE…' : 'Desliza para iniciar'}
            </Text>
            <Animated.View
              {...panResponder.panHandlers}
              accessible
              accessibilityHint="Desliza hacia la derecha para abrir Login"
              accessibilityLabel="Deslizar para iniciar AHRE"
              accessibilityRole="adjustable"
              style={[
                estilos.controlSlider,
                { transform: [{ translateX: desplazamientoControl }] },
                iniciando && estilos.controlIniciando,
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
