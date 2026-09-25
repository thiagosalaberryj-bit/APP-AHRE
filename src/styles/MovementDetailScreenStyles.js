import { StyleSheet } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosDetalleMovimiento(tema) {
  return StyleSheet.create({
    contenido: {
      flexGrow: 1,
      paddingBottom: ESPACIADO.enorme,
      paddingHorizontal: ESPACIADO.grande,
    },
    encabezado: {
      alignItems: 'center',
      paddingTop: ESPACIADO.grande,
    },
    iconoCategoria: {
      alignItems: 'center',
      backgroundColor: tema.encabezado,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.contenedor,
      borderWidth: BORDES.anchos.normal,
      height: 104,
      justifyContent: 'center',
      width: 104,
    },
    etiquetaDescripcion: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      marginTop: ESPACIADO.medio,
    },
    nombreMovimiento: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      marginTop: ESPACIADO.minimo,
      textAlign: 'center',
    },
    nombreCategoria: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      marginTop: ESPACIADO.minimo,
      textAlign: 'center',
    },
    montoMovimiento: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.monto,
      fontWeight: TIPOGRAFIA.pesos.medio,
      marginTop: ESPACIADO.extraGrande,
      textAlign: 'center',
    },
    tarjetaDatos: {
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.contenedor,
      borderWidth: BORDES.anchos.normal,
      gap: ESPACIADO.medio,
      marginTop: ESPACIADO.grande,
      padding: ESPACIADO.grande,
    },
    dato: {
      minHeight: 48,
    },
    etiquetaDato: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
    },
    valorDato: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      marginTop: ESPACIADO.minimo,
    },
  });
}
