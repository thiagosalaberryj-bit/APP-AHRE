import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORES_NOTIFICACIONES } from '../styles/colors';
import { crearEstilosNotificacion } from '../styles/toastNotificationStyles';

const ICONOS_AVISO = Object.freeze({
  error: 'alert-circle',
  exito: 'checkmark-circle',
  informacion: 'information-circle',
});
const DISTANCIA_DESLIZAMIENTO = 64;

export default function NotificacionTexto({
  duracion,
  mensaje,
  onDismiss: alCerrar,
  tipo,
  margenSuperior,
}) {
  const { width: anchoVentana } = useWindowDimensions();
  const estilos = useMemo(() => crearEstilosNotificacion(), []);
  const desplazamientoX = useRef(new Animated.Value(0)).current;
  const desplazamientoY = useRef(new Animated.Value(-24)).current;
  const opacidad = useRef(new Animated.Value(0)).current;
  const progreso = useRef(new Animated.Value(1)).current;
  const cerrarAviso = useRef(alCerrar);
  const posicionInicio = useRef(null);
  const toqueActivo = useRef(false);
  const tiempoCumplido = useRef(false);
  const cierreEnCurso = useRef(false);
  const animacionProgreso = useRef(null);
  cerrarAviso.current = alCerrar;

  const cerrarConAnimacion = useCallback((desplazamiento = 0) => {
    if (cierreEnCurso.current) return;
    cierreEnCurso.current = true;
    animacionProgreso.current?.stop();

    const distanciaSalida = desplazamiento === 0
      ? 0
      : (desplazamiento > 0 ? anchoVentana : -anchoVentana);
    const movimientoVertical = desplazamiento === 0 ? -18 : 0;

    Animated.parallel([
      Animated.timing(desplazamientoX, {
        toValue: distanciaSalida,
        duration: 190,
        useNativeDriver: false,
      }),
      Animated.timing(desplazamientoY, {
        toValue: movimientoVertical,
        duration: 190,
        useNativeDriver: false,
      }),
      Animated.timing(opacidad, {
        toValue: 0,
        duration: 170,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) cerrarAviso.current?.();
    });
  }, [anchoVentana, desplazamientoX, desplazamientoY, opacidad]);

  const cerrarConAnimacionRef = useRef(cerrarConAnimacion);
  cerrarConAnimacionRef.current = cerrarConAnimacion;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(desplazamientoY, {
        toValue: 0,
        duration: 240,
        useNativeDriver: false,
      }),
      Animated.timing(opacidad, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start();

    const temporizador = setTimeout(() => {
      if (toqueActivo.current) tiempoCumplido.current = true;
      else cerrarConAnimacionRef.current?.();
    }, duracion);
    animacionProgreso.current = Animated.timing(progreso, {
      toValue: 0,
      duration: duracion,
      useNativeDriver: false,
    });
    animacionProgreso.current.start();

    return () => {
      clearTimeout(temporizador);
      animacionProgreso.current?.stop();
    };
  }, [desplazamientoY, duracion, opacidad, progreso]);

  const reponerPosicion = useCallback(() => {
    Animated.parallel([
      Animated.spring(desplazamientoX, {
        toValue: 0,
        stiffness: 220,
        damping: 22,
        useNativeDriver: false,
      }),
      Animated.spring(opacidad, {
        toValue: 1,
        stiffness: 220,
        damping: 22,
        useNativeDriver: false,
      }),
    ]).start();
  }, [desplazamientoX, opacidad]);

  const gestorDeslizamiento = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_evento, movimiento) => (
        !cierreEnCurso.current &&
        Math.abs(movimiento.dx) > 10 &&
        Math.abs(movimiento.dx) > Math.abs(movimiento.dy)
      ),
      onPanResponderGrant: () => {
        toqueActivo.current = true;
      },
      onPanResponderMove: (_evento, movimiento) => {
        desplazamientoX.setValue(movimiento.dx);
        opacidad.setValue(Math.max(0.35, 1 - Math.abs(movimiento.dx) / anchoVentana));
      },
      onPanResponderRelease: (_evento, movimiento) => {
        toqueActivo.current = false;
        const seDeslizo = Math.abs(movimiento.dx) > DISTANCIA_DESLIZAMIENTO ||
          Math.abs(movimiento.vx) > 0.75;

        if (seDeslizo || tiempoCumplido.current) {
          cerrarConAnimacion(movimiento.dx || Math.sign(movimiento.vx) * DISTANCIA_DESLIZAMIENTO);
        } else {
          reponerPosicion();
        }
      },
      onPanResponderTerminate: () => {
        toqueActivo.current = false;
        if (tiempoCumplido.current) cerrarConAnimacion();
        else reponerPosicion();
      },
    }),
    [anchoVentana, cerrarConAnimacion, desplazamientoX, opacidad, reponerPosicion],
  );

  const terminarToque = (evento) => {
    if (posicionInicio.current === null) return;

    const diferencia = evento.nativeEvent.pageX - posicionInicio.current;
    posicionInicio.current = null;
    toqueActivo.current = false;
    if (Math.abs(diferencia) > DISTANCIA_DESLIZAMIENTO || tiempoCumplido.current) {
      cerrarConAnimacion(diferencia);
    }
  };

  const cancelarToque = () => {
    posicionInicio.current = null;
    toqueActivo.current = false;
    if (tiempoCumplido.current) cerrarConAnimacion();
  };

  const anchoProgreso = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const colorIcono = COLORES_NOTIFICACIONES.iconos[tipo];

  return (
    <Animated.View
      accessibilityRole="alert"
      onTouchCancel={cancelarToque}
      onTouchEnd={terminarToque}
      onTouchStart={(evento) => {
        posicionInicio.current = evento.nativeEvent.pageX;
        toqueActivo.current = true;
      }}
      style={[
        estilos.contenedor,
        {
          top: margenSuperior,
          opacity: opacidad,
          transform: [{ translateX: desplazamientoX }, { translateY: desplazamientoY }],
        },
      ]}
      {...gestorDeslizamiento.panHandlers}
    >
      <View style={estilos.contenido}>
        <Ionicons color={colorIcono} name={ICONOS_AVISO[tipo]} size={22} />
        <Text accessibilityLiveRegion="polite" style={estilos.mensaje}>
          {mensaje}
        </Text>
        <Pressable
          accessibilityLabel="Cerrar notificación"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => cerrarConAnimacion()}
          style={estilos.botonCerrar}
        >
          <Ionicons color={COLORES_NOTIFICACIONES.botonCerrar} name="close" size={21} />
        </Pressable>
      </View>
      <View style={estilos.fondoBarra}>
        <Animated.View style={[estilos.barraTiempo, { width: anchoProgreso }]} />
      </View>
    </Animated.View>
  );
}
