import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RUTAS } from '../constants/routes';
import { COLORES_ESTADO, TEMAS } from '../styles/colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';

const ACCIONES_NUEVO = Object.freeze([
  { etiqueta: 'Escanear OCR', icono: 'scan-outline', ruta: RUTAS.OCR },
  { etiqueta: 'Ingreso', icono: 'arrow-down-circle-outline', ruta: RUTAS.INGRESO },
  { etiqueta: 'Egreso', icono: 'arrow-up-circle-outline', ruta: RUTAS.EGRESO },
]);

export default function BarraPestanasInferior({ state: estado, descriptors: descriptores, navigation: navegacion }) {
  const margenesSeguros = useSafeAreaInsets();
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosBarra(tema);
  const colorActivo = tema.foco;
  const colorInactivo = tema.textoSecundario;
  const [accionesAbiertas, establecerAccionesAbiertas] = useState(false);

  const abrirAccionRapida = (ruta) => {
    establecerAccionesAbiertas(false);
    navegacion.getParent()?.navigate(ruta);
  };

  return (
    <View style={estilos.exterior}>
      <View style={[estilos.contenedor, { paddingBottom: margenesSeguros.bottom }]}>
        {estado.routes.map((ruta, indice) => {
          const configuracionRuta = descriptores[ruta.key];
          const opciones = configuracionRuta.options;
          const seleccionada = estado.index === indice;
          const esNuevo = ruta.name === RUTAS.NUEVO;
          const colorIcono = seleccionada ? colorActivo : colorInactivo;
          const etiqueta = typeof opciones.tabBarLabel === 'string'
            ? opciones.tabBarLabel
            : opciones.title || ruta.name;

          const alPresionar = () => {
            const evento = navegacion.emit({
              type: 'tabPress',
              target: ruta.key,
              canPreventDefault: true,
            });

            if (evento.defaultPrevented) return;

            if (esNuevo) {
              establecerAccionesAbiertas(true);
              return;
            }

            if (!seleccionada) {
              navegacion.navigate(ruta.name, ruta.params);
            }
          };

          const alMantenerPresionado = () => {
            navegacion.emit({ type: 'tabLongPress', target: ruta.key });
          };

          const icono = opciones.tabBarIcon?.({
            focused: seleccionada,
            color: esNuevo ? tema.botonPrincipal : colorIcono,
            size: esNuevo ? 24 : 26,
          });

          return (
            <Pressable
              key={ruta.key}
              accessibilityLabel={opciones.tabBarAccessibilityLabel}
              accessibilityHint={esNuevo ? 'Toca para abrir acciones rápidas' : undefined}
              accessibilityRole="tab"
              accessibilityState={seleccionada ? { selected: true } : {}}
              accessibilityValue={opciones.tabBarAccessibilityValue}
              onLongPress={alMantenerPresionado}
              onPress={alPresionar}
              delayLongPress={450}
              testID={opciones.tabBarButtonTestID}
              style={[estilos.elemento, esNuevo && estilos.elementoNuevo]}
            >
              {seleccionada && !esNuevo ? <View style={estilos.indicadorActivo} /> : null}
              {esNuevo ? <View style={estilos.iconoNuevo}>{icono}</View> : icono}
              <Text
                style={[
                  estilos.etiqueta,
                  { color: colorIcono },
                  seleccionada && estilos.etiquetaSeleccionada,
                  esNuevo && estilos.etiquetaNuevo,
                ]}
              >
                {etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => establecerAccionesAbiertas(false)}
        statusBarTranslucent
        transparent
        visible={accionesAbiertas}
      >
        <View style={estilos.modalAcciones}>
          <Pressable
            accessibilityLabel="Cerrar acciones rápidas"
            accessibilityRole="button"
            onPress={() => establecerAccionesAbiertas(false)}
            style={StyleSheet.absoluteFill}
          />
          <View accessibilityViewIsModal style={estilos.contenidoAcciones}>
            <Text
              style={[
                estilos.textoTituloAcciones,
                { bottom: margenesSeguros.bottom + 238 },
              ]}
            >
              Acciones rápidas
            </Text>
            <View
              style={[
                estilos.grupoAcciones,
                { bottom: margenesSeguros.bottom + 70 },
              ]}
            >
              {ACCIONES_NUEVO.map((accion, indice) => {
                const esOCR = accion.ruta === RUTAS.OCR;
                const esIngreso = accion.ruta === RUTAS.INGRESO;
                const fondo = esOCR
                  ? COLORES_ESTADO.informacion
                  : esIngreso
                    ? tema.contenedorVerde
                    : tema.botonPrincipal;
                const colorIcono = esOCR
                  ? '#FFFFFF'
                  : esIngreso
                    ? tema.botonPrincipal
                    : tema.encabezado;

                return (
                  <Pressable
                    accessibilityLabel={accion.etiqueta}
                    accessibilityRole="button"
                    key={accion.ruta}
                    onPress={() => abrirAccionRapida(accion.ruta)}
                    style={({ pressed }) => [
                      estilos.accionModal,
                      indice === 0 && estilos.accionOCR,
                      indice === 1 && estilos.accionIngreso,
                      indice === 2 && estilos.accionEgreso,
                      pressed && estilos.accionModalPresionada,
                    ]}
                  >
                    <View style={[estilos.botonAccionModal, { backgroundColor: fondo }]}>
                      <Ionicons color={colorIcono} name={accion.icono} size={27} />
                    </View>
                    <Text style={estilos.etiquetaAccionModal}>{accion.etiqueta}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function crearEstilosBarra(tema) {
  return StyleSheet.create({
    exterior: {
      // Deja visible el fondo de la pantalla en las esquinas redondeadas.
      backgroundColor: tema.fondo,
      paddingHorizontal: 0,
    },
    contenedor: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderWidth: 1,
      borderBottomWidth: 0,
      paddingHorizontal: ESPACIADO.pequeno,
      paddingTop: ESPACIADO.minimo,
    },
    elemento: {
      flex: 1,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: ESPACIADO.minimo,
      paddingTop: ESPACIADO.minimo,
    },
    elementoNuevo: {
      paddingTop: ESPACIADO.minimo,
    },
    indicadorActivo: {
      position: 'absolute',
      top: -2,
      width: 42,
      height: 3,
      backgroundColor: tema.foco,
      borderRadius: BORDES.radios.circular,
    },
    iconoNuevo: {
      position: 'absolute',
      top: -23,
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.encabezado,
      borderColor: tema.foco,
      borderRadius: BORDES.radios.circular,
      borderWidth: 2,
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.16,
      shadowRadius: 3,
      zIndex: 1,
    },
    etiqueta: {
      marginTop: 2,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: 11,
      fontWeight: TIPOGRAFIA.pesos.regular,
      textAlign: 'center',
    },
    etiquetaSeleccionada: {
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    etiquetaNuevo: {
      position: 'absolute',
      top: 34,
    },
    modalAcciones: {
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      flex: 1,
    },
    contenidoAcciones: {
      flex: 1,
    },
    textoTituloAcciones: {
      bottom: 0,
      color: tema.encabezadoTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      left: ESPACIADO.grande,
      position: 'absolute',
      right: ESPACIADO.grande,
      textAlign: 'center',
    },
    grupoAcciones: {
      alignSelf: 'center',
      height: 150,
      left: 0,
      position: 'absolute',
      right: 0,
    },
    accionModal: {
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      position: 'absolute',
      width: 92,
    },
    accionOCR: {
      left: '50%',
      marginLeft: -46,
      top: 0,
    },
    accionIngreso: {
      bottom: 0,
      left: '12%',
    },
    accionEgreso: {
      bottom: 0,
      right: '12%',
    },
    accionModalPresionada: {
      opacity: 0.72,
      transform: [{ scale: 0.96 }],
    },
    botonAccionModal: {
      alignItems: 'center',
      borderColor: 'rgba(255, 255, 255, 0.22)',
      borderRadius: BORDES.radios.circular,
      borderWidth: 2,
      height: 62,
      justifyContent: 'center',
      width: 62,
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 4,
    },
    etiquetaAccionModal: {
      color: tema.encabezadoTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      fontWeight: TIPOGRAFIA.pesos.medio,
      textAlign: 'center',
    },
  });
}
