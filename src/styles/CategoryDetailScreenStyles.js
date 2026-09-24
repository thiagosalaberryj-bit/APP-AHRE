import { StyleSheet } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosDetalleCategoria(tema) {
  return StyleSheet.create({
    contenidoMovimiento: {
      flexGrow: 1,
      paddingBottom: ESPACIADO.enorme,
      paddingHorizontal: ESPACIADO.grande,
    },
    encabezadoMovimiento: {
      alignItems: 'center',
      paddingTop: ESPACIADO.grande,
    },
    iconoCategoriaGrande: {
      alignItems: 'center',
      backgroundColor: tema.encabezado,
      borderRadius: BORDES.radios.contenedor,
      height: 104,
      justifyContent: 'center',
      width: 104,
    },
    nombreMovimientoDetalle: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      marginTop: ESPACIADO.grande,
      textAlign: 'center',
    },
    nombreCategoriaDetalle: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      marginTop: ESPACIADO.minimo,
      textAlign: 'center',
    },
    montoMovimientoDetalle: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.monto,
      fontWeight: TIPOGRAFIA.pesos.medio,
      letterSpacing: 4,
      marginTop: ESPACIADO.extraGrande,
      textAlign: 'center',
    },
    tarjetaDatosMovimiento: {
      backgroundColor: tema.superficie,
      borderColor: tema.encabezado,
      borderRadius: BORDES.radios.contenedor,
      borderWidth: BORDES.anchos.normal,
      justifyContent: 'space-between',
      marginTop: ESPACIADO.enorme,
      minHeight: 264,
      padding: ESPACIADO.grande,
    },
    datoMovimiento: {
      minHeight: 56,
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
    contenidoCategoria: {
      paddingBottom: ESPACIADO.grande,
    },
    encabezadoCategoria: {
      alignItems: 'center',
      paddingTop: ESPACIADO.grande,
    },
    nombreCategoriaResumen: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      marginTop: ESPACIADO.grande,
    },
    anioCategoria: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.medio,
      marginTop: ESPACIADO.extraGrande,
    },
    contenedorMeses: {
      alignItems: 'flex-start',
      gap: ESPACIADO.minimo,
      paddingHorizontal: ESPACIADO.minimo,
      paddingTop: ESPACIADO.grande,
    },
    selectorMeses: {
      width: '100%',
    },
    botonMes: {
      alignItems: 'center',
      height: 72,
      width: 40,
    },
    marcaMes: {
      backgroundColor: tema.textoPrincipal,
      borderRadius: BORDES.radios.circular,
      height: 6,
      width: 23,
    },
    marcaMesActiva: {
      backgroundColor: tema.botonPrincipal,
    },
    etiquetaMes: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: 10,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      height: 42,
      left: -1,
      position: 'absolute',
      textAlign: 'center',
      top: 26,
      transform: [{ rotate: '90deg' }],
      width: 42,
    },
    montoCategoria: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.monto,
      fontWeight: TIPOGRAFIA.pesos.negrita,
      letterSpacing: 4,
      marginBottom: ESPACIADO.grande,
      marginTop: ESPACIADO.minimo,
      textAlign: 'center',
    },
    separadorCategoria: {
      backgroundColor: tema.botonPrincipal,
      height: BORDES.anchos.normal,
      width: '100%',
    },
    listaMovimientosCategoria: {
      paddingHorizontal: ESPACIADO.extraGrande,
      paddingTop: ESPACIADO.enorme,
    },
    filaMovimiento: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      minHeight: 58,
    },
    iconoMovimiento: {
      alignItems: 'center',
      backgroundColor: tema.encabezado,
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
      fontSize: TIPOGRAFIA.tamanos.secundario,
      textAlign: 'right',
    },
  });
}
