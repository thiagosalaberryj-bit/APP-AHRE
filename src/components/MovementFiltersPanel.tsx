import usarPanelInferior from '../utils/useBottomSheet';
import { type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
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
  const { width:anchoVentana } = useWindowDimensions();
  const estilos = crearEstilosMovimientos(tema, anchoVentana);
  const { opacidadOverlay, desplazamientoPanel, responderManija, cerrarPanel: cerrarFiltros } = usarPanelInferior(filtrosVisibles, alCerrar);

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
