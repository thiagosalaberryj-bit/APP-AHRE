import { StyleSheet } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosEncabezadoCompacto(tema) {
  return StyleSheet.create({
    contenedor: {
      backgroundColor: tema.encabezado,
      borderBottomLeftRadius: BORDES.radios.contenedor,
      borderBottomRightRadius: BORDES.radios.contenedor,
      height: 134,
      justifyContent: 'space-between',
      paddingBottom: ESPACIADO.grande,
      paddingHorizontal: ESPACIADO.extraGrande,
      paddingTop: ESPACIADO.extraGrande,
    },
    botonVolver: {
      alignItems: 'center',
      backgroundColor: tema.contenedorVerde,
      borderRadius: 9,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    filaTitulo: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    titulo: {
      color: tema.encabezadoTexto,
      flexShrink: 1,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.subtitulo,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
  });
}
