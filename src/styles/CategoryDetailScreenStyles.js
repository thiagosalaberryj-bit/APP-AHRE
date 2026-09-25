import { StyleSheet } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosDetalleCategoria(tema) {
  return StyleSheet.create({
    iconoCategoriaGrande: {
      alignItems: 'center',
      borderColor: tema.borde,
      borderRadius: BORDES.radios.contenedor,
      borderWidth: BORDES.anchos.normal,
      height: 96,
      justifyContent: 'center',
      width: 96,
    },
    contenidoCategoria: {
      paddingBottom: ESPACIADO.grande,
      paddingHorizontal: ESPACIADO.pantalla,
    },
    encabezadoCategoria: {
      alignItems: 'center',
      paddingTop: ESPACIADO.grande,
    },
    nombreCategoriaResumen: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      marginTop: ESPACIADO.medio,
    },
    anioCategoria: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      marginTop: ESPACIADO.minimo,
    },
    contenedorMeses: {
      alignItems: 'center',
      gap: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.medio,
    },
    selectorMeses: {
      marginTop: ESPACIADO.pequeno,
      width: '100%',
    },
    botonMes: {
      alignItems: 'center',
      borderColor: tema.borde,
      borderRadius: BORDES.radios.boton,
      borderWidth: BORDES.anchos.fino,
      height: 40,
      justifyContent: 'center',
      width: 56,
    },
    botonMesActivo: {
      backgroundColor: tema.encabezado,
      borderColor: tema.encabezado,
    },
    etiquetaMes: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      textAlign: 'center',
    },
    etiquetaMesActiva: {
      color: tema.encabezadoTexto,
    },
    resumenCategoria: {
      alignItems: 'center',
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.tarjeta,
      borderWidth: BORDES.anchos.fino,
      marginTop: ESPACIADO.minimo,
      padding: ESPACIADO.medio,
    },
    etiquetaMontoCategoria: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
    },
    montoCategoria: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.monto,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      marginTop: ESPACIADO.minimo,
      textAlign: 'center',
    },
    separadorCategoria: {
      height: BORDES.anchos.normal,
      marginTop: ESPACIADO.grande,
      width: '100%',
    },
    listaMovimientosCategoria: {
      gap: ESPACIADO.medio,
      paddingTop: ESPACIADO.grande,
    },
    grupoDia: {
      gap: ESPACIADO.minimo,
    },
    tituloDia: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      paddingHorizontal: ESPACIADO.minimo,
    },
    movimientosDia: {
      gap: ESPACIADO.minimo,
    },
    filaMovimiento: {
      alignItems: 'center',
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.tarjeta,
      borderWidth: BORDES.anchos.fino,
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      minHeight: 68,
      paddingHorizontal: ESPACIADO.medio,
      paddingVertical: ESPACIADO.minimo,
    },
    iconoMovimiento: {
      alignItems: 'center',
      borderRadius: BORDES.radios.circular,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    detalleFilaMovimiento: {
      flex: 1,
      justifyContent: 'center',
    },
    nombreFilaMovimiento: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    subtituloFilaMovimiento: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      marginTop: ESPACIADO.minimo,
    },
    montoFilaMovimiento: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      textAlign: 'right',
    },
    textoSinMovimientos: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      paddingVertical: ESPACIADO.grande,
      textAlign: 'center',
    },
  });
}
