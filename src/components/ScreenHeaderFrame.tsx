import { createContext, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import { AccessibilityInfo, Animated, Easing, Keyboard, Pressable, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { crearControlEncabezado, type EstadoEncabezado } from '../navigation/headerScrollController';
import { crearEstilosMarcoEncabezado } from '../styles/ScreenHeaderFrameStyles';
import type { Tema } from '../styles/colors';
import type { EncabezadoProps } from '../types/ui';
import AccionesEncabezadoCompacto from './HeaderCompactActions';

type EventoScroll = NativeSyntheticEvent<NativeScrollEvent>;
interface AccionesEncabezado {
  registrar: (subir: (animado: boolean) => void) => () => void;
  alDesplazar: (evento: EventoScroll) => void;
  alIniciarArrastre: (evento: EventoScroll) => void;
  alTerminarArrastre: () => void;
  alIniciarInercia: () => void;
  alTerminarMovimiento: () => void;
}
export const ContextoEncabezado = createContext<AccionesEncabezado | null>(null);

export default function MarcoEncabezado({ encabezado, tema, children, style, ref, ...propiedades }: ViewProps & {
  encabezado: ReactNode; tema: Tema; ref?: Ref<View>;
}) {
  const [estado, establecerEstado] = useState<EstadoEncabezado>({ desplegado: true, desplazado: false });
  const [reducirMovimiento, establecerReducirMovimiento] = useState(true);
  const [accionesCompactasListas, establecerAccionesCompactasListas] = useState(false);
  const preferenciaMovimiento = useRef(true), subir = useRef<((animado: boolean) => void) | null>(null);
  const progreso = useRef(new Animated.Value(1)).current;
  const alturaBarra = useRef(new Animated.Value(0)).current;
  const control = useRef<ReturnType<typeof crearControlEncabezado> | null>(null);
  if (!control.current) control.current = crearControlEncabezado(establecerEstado, () => {
    Keyboard.dismiss(); subir.current?.(!preferenciaMovimiento.current);
  });
  useEffect(() => {
    let vigente = true;
    const cambiar = (valor: boolean) => { if (vigente) { preferenciaMovimiento.current = valor; establecerReducirMovimiento(valor); } };
    void AccessibilityInfo.isReduceMotionEnabled().then(cambiar).catch(() => {});
    const escucha = AccessibilityInfo.addEventListener('reduceMotionChanged', cambiar);
    return () => { vigente = false; escucha.remove(); };
  }, []);
  useEffect(() => {
    const destino = estado.desplegado ? 1 : 0;
    const barra = estado.desplazado ? 44 : 0;
    let vigente = true, terminadas = 0;
    establecerAccionesCompactasListas(false);
    progreso.stopAnimation(); alturaBarra.stopAnimation();
    const alTerminar = ({ finished }: { finished: boolean }) => {
      if (vigente && finished && ++terminadas === 2) {
        control.current?.terminarTransicion();
        establecerAccionesCompactasListas(!estado.desplegado && estado.desplazado);
      }
    };
    if (reducirMovimiento) {
      progreso.setValue(destino); alturaBarra.setValue(barra); control.current?.terminarTransicion();
      establecerAccionesCompactasListas(!estado.desplegado && estado.desplazado);
    } else {
      const opciones = { duration: 280, easing: Easing.inOut(Easing.cubic), useNativeDriver: false };
      Animated.timing(progreso, { ...opciones, toValue: destino }).start(alTerminar);
      Animated.timing(alturaBarra, { ...opciones, toValue: barra }).start(alTerminar);
    }
    return () => { vigente = false; progreso.stopAnimation(); alturaBarra.stopAnimation(); };
  }, [estado.desplegado, estado.desplazado, reducirMovimiento, progreso, alturaBarra]);
  const registrar = useCallback((accion: (animado: boolean) => void) => {
    subir.current = accion;
    return () => { if (subir.current === accion) subir.current = null; };
  }, []);
  const acciones = useMemo<AccionesEncabezado>(() => ({
    registrar,
    alDesplazar: evento => control.current?.desplazar(evento.nativeEvent.contentOffset.y, evento.nativeEvent.contentSize?.height, evento.nativeEvent.layoutMeasurement?.height),
    alIniciarArrastre: evento => control.current?.iniciarArrastre(evento.nativeEvent.contentOffset.y),
    alTerminarArrastre: () => control.current?.terminarArrastre(),
    alIniciarInercia: () => control.current?.iniciarInercia(),
    alTerminarMovimiento: () => control.current?.terminarMovimiento(),
  }), [registrar]);
  const estilos = crearEstilosMarcoEncabezado(tema);
  const propiedadesEncabezado = isValidElement<EncabezadoProps>(encabezado) ? encabezado.props : {};
  return <ContextoEncabezado.Provider value={acciones}>
    <View {...propiedades} ref={ref} style={[estilos.raiz, style]}>
      <View style={estilos.mascaraEncabezado}>
      <Animated.View pointerEvents={estado.desplegado ? 'auto' : 'none'} accessibilityElementsHidden={!estado.desplegado}
        importantForAccessibility={estado.desplegado ? 'auto' : 'no-hide-descendants'}
        style={[estilos.recorte, estado.desplazado && estilos.unionEncabezado, { height: progreso.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }) }]}>
        <View style={estilos.encabezado}>{encabezado}</View>
      </Animated.View>
      <Animated.View pointerEvents={estado.desplazado ? 'auto' : 'none'} style={[estilos.recorte, estilos.barraCompacta, { height: alturaBarra }]}>
      {estado.desplazado ? <View style={estilos.flechas}>
        <Pressable accessibilityRole="button" accessibilityLabel={estado.desplegado ? 'Plegar encabezado' : 'Desplegar encabezado'}
          accessibilityState={{ expanded: estado.desplegado }} onPress={() => control.current?.alternar()} style={estilos.flecha}>
          <Ionicons name={estado.desplegado ? 'chevron-up' : 'chevron-down'} size={22} color={tema.botonPrincipal}/>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver al inicio de la pantalla"
          onPress={() => control.current?.volverArriba()} style={estilos.flecha}>
          <Ionicons name="arrow-up" size={22} color={tema.botonPrincipal}/>
        </Pressable>
        {!estado.desplegado && accionesCompactasListas ? <AccionesEncabezadoCompacto tema={tema}
          alAbrirNotificaciones={propiedadesEncabezado.alAbrirNotificaciones} alAbrirPerfil={propiedadesEncabezado.alAbrirPerfil}
          mostrarSincronizacion={propiedadesEncabezado.mostrarSincronizacion}/> : null}
      </View> : null}
      </Animated.View>
      </View>
      {children}
    </View>
  </ContextoEncabezado.Provider>;
}
