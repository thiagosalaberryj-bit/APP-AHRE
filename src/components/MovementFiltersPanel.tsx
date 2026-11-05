import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Tema } from '../styles/colors';
import { crearEstilosMovimientos } from '../styles/MovementsScreenStyles';

export function SeccionFiltro({
  titulo,
  resumen,
  abierta,
  alAlternar,
  colorAcento,
  estilos,
  children,
}: {titulo:string;resumen:string;abierta:boolean;alAlternar:()=>void;colorAcento:string;estilos:ReturnType<typeof crearEstilosMovimientos>;children:import('react').ReactNode}) {
  return (
    <View style={estilos.seccionFiltro}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        onPress={alAlternar}
        style={estilos.encabezadoSeccionFiltro}
      >
        <View style={estilos.detalleEncabezadoSeccionFiltro}>
          <View style={[estilos.acentoSeccionFiltro, { backgroundColor: colorAcento }]} />
          <View style={estilos.textosEncabezadoSeccionFiltro}>
            <Text numberOfLines={1} style={estilos.tituloSeccionFiltro}>{titulo}</Text>
            {!abierta ? <Text numberOfLines={1} style={estilos.resumenSeccionFiltro}>{resumen}</Text> : null}
          </View>
        </View>
        <Ionicons color={colorAcento} name={abierta ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>
      {abierta ? <View style={estilos.contenidoSeccionFiltro}>{children}</View> : null}
    </View>
  );
}

export default function PanelFiltrosMovimientos({ tema, filtrosVisibles, alCerrar, limpiarFiltros, cantidadFiltros, children }: {
  tema:Tema; filtrosVisibles:boolean; alCerrar:()=>void; limpiarFiltros:()=>void; cantidadFiltros:number; children:ReactNode;
}) {
  const { height:altoVentana, width:anchoVentana } = useWindowDimensions();
  const estilos = crearEstilosMovimientos(tema, anchoVentana);
  const opacidadOverlay = useRef(new Animated.Value(0)).current;
  const desplazamientoPanel = useRef(new Animated.Value(0)).current;
  const cerrarFiltros = useCallback(() => {
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
      if (finished) alCerrar();
    });
  }, [altoVentana, desplazamientoPanel, opacidadOverlay, alCerrar]);

  const responderManija = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_evento, gesto) => gesto.dy > 6 && Math.abs(gesto.dy) > Math.abs(gesto.dx),
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_evento, gesto) => {
      if (gesto.dy > 0) desplazamientoPanel.setValue(gesto.dy);
    },
    onPanResponderRelease: (_evento, gesto) => {
      if (gesto.dy > 90 || gesto.vy > 0.8) {
        cerrarFiltros();
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
  }), [cerrarFiltros, desplazamientoPanel]);

  useEffect(() => {
    if (!filtrosVisibles) return undefined;
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
  }, [altoVentana, desplazamientoPanel, filtrosVisibles, opacidadOverlay]);

  return (
        <Modal
          animationType="none"
          onRequestClose={cerrarFiltros}
          transparent
          visible={filtrosVisibles}
        >
          <View style={estilos.fondoFiltros}>
            <Animated.View pointerEvents="none" style={[estilos.overlayFiltros, { opacity: opacidadOverlay }]} />
            <Pressable
              accessibilityLabel="Cerrar filtros"
              onPress={cerrarFiltros}
              style={estilos.fondoTactilFiltros}
            />
            <Animated.View
              style={[
                estilos.panelFiltros,
                { transform: [{ translateY: desplazamientoPanel }] },
              ]}
            >
              <View style={estilos.encabezadoPanelFiltros}>
                <View style={estilos.zonaManijaFiltros} {...responderManija.panHandlers}>
                  <View style={estilos.manijaFiltros} />
                </View>
                <View style={estilos.encabezadoPanelContenido}>
                  <Text style={estilos.tituloModal}>Filtros</Text>
                  <Pressable
                    accessibilityLabel="Cerrar filtros"
                    accessibilityRole="button"
                    onPress={cerrarFiltros}
                    style={estilos.botonCerrarModal}
                  >
                    <Ionicons color={tema.textoPrincipal} name="close" size={24} />
                  </Pressable>
                </View>
              </View>
              <ScrollView
                contentContainerStyle={estilos.contenidoFiltrosScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={estilos.scrollFiltros}
              >
                {children}
              </ScrollView>
              {cantidadFiltros > 0 ? (
                <View style={estilos.piePanelFiltros}>
                  <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}>
                    <Text style={estilos.textoBotonLimpiar}>Limpiar filtros</Text>
                  </Pressable>
                </View>
              ) : null}
            </Animated.View>
          </View>
        </Modal>
  );
}
