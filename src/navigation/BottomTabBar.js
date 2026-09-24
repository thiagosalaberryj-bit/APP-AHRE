import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RUTAS } from '../constants/routes';
import { TEMAS } from '../styles/colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../styles/globalStyles';

export default function BarraPestanasInferior({ state: estado, descriptors: descriptores, navigation: navegacion }) {
  const margenesSeguros = useSafeAreaInsets();
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosBarra(tema);
  const colorActivo = tema.foco;
  const colorInactivo = tema.textoSecundario;

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

            if (!seleccionada && !evento.defaultPrevented) {
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
              accessibilityRole="tab"
              accessibilityState={seleccionada ? { selected: true } : {}}
              accessibilityValue={opciones.tabBarAccessibilityValue}
              onLongPress={alMantenerPresionado}
              onPress={alPresionar}
              testID={opciones.tabBarButtonTestID}
              style={[estilos.elemento, esNuevo && estilos.elementoNuevo]}
            >
              {seleccionada && !esNuevo ? <View style={estilos.indicadorActivo} /> : null}
              {esNuevo ? <View style={estilos.iconoNuevo}>{icono}</View> : icono}
              <Text style={[estilos.etiqueta, { color: colorIcono }, esNuevo && estilos.etiquetaNuevo]}>{etiqueta}</Text>
            </Pressable>
          );
        })}
      </View>
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
      borderWidth: 0,
      elevation: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.16,
      shadowRadius: 3,
    },
    etiqueta: {
      marginTop: 2,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: 11,
      fontWeight: TIPOGRAFIA.pesos.regular,
      textAlign: 'center',
    },
    etiquetaNuevo: {
      position: 'absolute',
      top: 34,
    },
  });
}
