import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, useWindowDimensions } from 'react-native';

export default function usarPanelInferior(visible: boolean, alCerrar: () => void) {
  const { height: altoVentana } = useWindowDimensions();
  const cerrando = useRef(false);
  const opacidadOverlay = useRef(new Animated.Value(0)).current;
  const desplazamientoPanel = useRef(new Animated.Value(0)).current;
  const confirmarCierre = useCallback((alFinalizar: () => void) => {
    if (cerrando.current) return;
    cerrando.current = true;
    Animated.parallel([
      Animated.timing(opacidadOverlay, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(desplazamientoPanel, {
        toValue: altoVentana,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) alFinalizar();
      else cerrando.current = false;
    });
  }, [altoVentana, desplazamientoPanel, opacidadOverlay]);

  const cerrarPanel = useCallback(() => confirmarCierre(alCerrar), [confirmarCierre, alCerrar]);

  const responderManija = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_evento, gesto) => gesto.dy > 6 && Math.abs(gesto.dy) > Math.abs(gesto.dx),
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_evento, gesto) => {
      if (gesto.dy > 0) desplazamientoPanel.setValue(gesto.dy);
    },
    onPanResponderRelease: (_evento, gesto) => {
      if (gesto.dy > 90 || gesto.vy > 0.8) {
        cerrarPanel();
        return;
      }
      Animated.spring(desplazamientoPanel, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(desplazamientoPanel, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
      }).start();
    },
  }), [cerrarPanel, desplazamientoPanel]);

  useEffect(() => {
    if (!visible) return undefined;
    cerrando.current = false;
    opacidadOverlay.setValue(0);
    desplazamientoPanel.setValue(altoVentana);
    Animated.parallel([
      Animated.timing(opacidadOverlay, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true,
      }),
      Animated.spring(desplazamientoPanel, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 210,
      }),
    ]).start();
    return undefined;
  }, [altoVentana, desplazamientoPanel, visible, opacidadOverlay]);

  return { opacidadOverlay, desplazamientoPanel, responderManija, cerrarPanel, confirmarCierre };
}
