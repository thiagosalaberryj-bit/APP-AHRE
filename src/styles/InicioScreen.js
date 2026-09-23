import { StyleSheet } from 'react-native';

import { COLORES_MARCA } from './colors';
import { ESPACIADO, TIPOGRAFIA } from './globalStyles';

export const TAMANO_CONTROL_SLIDER = 52;

export function crearEstilosInicio(tema, tamanoMarca, tamanoLetras, anchoSlider) {
  const altoSlider = TAMANO_CONTROL_SLIDER + ESPACIADO.pequeno * 2;
  const colorLetras = tema.nombre === 'oscuro' ? '#FFFFFF' : COLORES_MARCA.verdeOscuro;

  return StyleSheet.create({
    pantalla: {
      flex: 1,
      overflow: 'hidden',
    },
    areaSegura: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    contenido: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: ESPACIADO.extraGrande,
    },
    marca: {
      width: tamanoMarca,
      height: tamanoMarca,
      marginTop: ESPACIADO.grande,
      flexShrink: 0,
    },
    areaNombre: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    nombre: {
      alignItems: 'center',
      justifyContent: 'center',
      transform: [
        {
          translateY:
            (altoSlider + ESPACIADO.extraGrande - tamanoMarca - ESPACIADO.grande) / 2,
        },
      ],
    },
    letras: {
      color: colorLetras,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: tamanoLetras,
      fontWeight: '900',
      letterSpacing: tamanoLetras * 0.2,
      lineHeight: tamanoLetras * 1.12,
      textAlign: 'center',
      textShadowColor: COLORES_MARCA.verdeMedio,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 5,
    },
    slider: {
      width: anchoSlider,
      height: altoSlider,
      flexShrink: 0,
      justifyContent: 'center',
      marginBottom: ESPACIADO.extraGrande,
      backgroundColor: COLORES_MARCA.verdeOscuro,
      borderColor: COLORES_MARCA.verdeMedio,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
    colaRellenoSlider: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: COLORES_MARCA.verdeMedio,
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
    },
    rellenoSlider: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      backgroundColor: COLORES_MARCA.verdeMedio,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
    },
    textoSlider: {
      position: 'absolute',
      left: ESPACIADO.pequeno,
      right: ESPACIADO.pequeno,
      color: '#FFFFFF',
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario + 1,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      textAlign: 'center',
    },
    textoIniciando: {
      color: '#FFFFFF',
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    controlSlider: {
      position: 'absolute',
      left: ESPACIADO.pequeno,
      top: ESPACIADO.pequeno,
      width: TAMANO_CONTROL_SLIDER,
      height: TAMANO_CONTROL_SLIDER,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORES_MARCA.verdeClaro,
      borderRadius: 15,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 3,
      elevation: 3,
    },
    controlIniciando: {
      backgroundColor: COLORES_MARCA.verdeOscuro,
    },
    flecha: {
      width: 30,
      height: 30,
      lineHeight: 30,
      textAlign: 'center',
      textAlignVertical: 'center',
    },
  });
}
