import { StyleSheet } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosEstadisticas(tema) {
  return StyleSheet.create({
    botonAnio: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.minimo,
      paddingLeft: ESPACIADO.pequeno,
    },
    textoAnio: {
      color: tema.encabezadoTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    contenidoDesplazable: {
      paddingBottom: ESPACIADO.pequeno,
      flexGrow: 1,
    },
    desplazamiento: {
      flex: 1,
    },
    contenedorGrafico: {
      alignItems: 'center',
      height: 360,
      justifyContent: 'center',
      position: 'relative',
    },
    deslizadorGraficos: {
      height: '100%',
      width: '100%',
    },
    paginaGrafico: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    fondoGraficoTocable: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    contenedorBarras: {
      alignItems: 'flex-end',
      bottom: 101,
      flexDirection: 'row',
      height: 212,
      justifyContent: 'space-between',
      position: 'absolute',
    },
    columnaBarra: {
      alignItems: 'center',
      flex: 1,
      height: '100%',
      justifyContent: 'flex-end',
    },
    barraAnual: {
      borderRadius: BORDES.radios.boton,
      flexDirection: 'column',
      overflow: 'hidden',
    },
    segmentoBarra: {
      width: '100%',
    },
    etiquetasMeses: {
      bottom: 78,
      flexDirection: 'row',
      height: 15,
      position: 'absolute',
    },
    etiquetaMes: {
      flex: 1,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: 9,
      textAlign: 'center',
    },
    importeSeleccionado: {
      alignItems: 'center',
      borderRadius: 6,
      justifyContent: 'center',
      left: 10,
      minHeight: 32,
      paddingHorizontal: ESPACIADO.medio,
      position: 'absolute',
      top: 36,
      zIndex: 1,
    },
    textoImporteSeleccionado: {
      color: '#FFFFFF',
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.medio,
    },
    listaMovimientos: {
      paddingLeft: 44,
      paddingRight: 54,
      paddingTop: 30,
    },
    filaMovimiento: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
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
    nombreMovimiento: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
    detalleMovimiento: {
      flex: 1,
      justifyContent: 'center',
    },
    subtituloMovimiento: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      marginTop: ESPACIADO.minimo,
    },
    montoMovimiento: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      textAlign: 'right',
    },
    indicadoresGrafico: {
      alignItems: 'center',
      bottom: 5,
      flexDirection: 'row',
      gap: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
    },
    indicadoresGraficoAnual: {
      bottom: 38,
    },
    zonaIndicador: {
      alignItems: 'center',
      height: 24,
      justifyContent: 'center',
      width: 16,
    },
    puntoIndicador: {
      backgroundColor: '#4B4B4B',
      borderRadius: BORDES.radios.circular,
      height: 10,
      width: 10,
    },
    puntoIndicadorActivo: {
      backgroundColor: tema.foco,
    },
    fondoMenuAnio: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 10,
    },
    menuAnio: {
      alignItems: 'stretch',
      backgroundColor: '#000000',
      borderRadius: 24,
      elevation: 12,
      height: 208,
      justifyContent: 'space-between',
      paddingHorizontal: ESPACIADO.medio,
      paddingVertical: 18,
      position: 'absolute',
      right: 22,
      top: 120,
      width: 86,
      zIndex: 11,
    },
    opcionAnio: {
      alignItems: 'center',
      height: 43,
      justifyContent: 'center',
    },
    textoOpcionAnio: {
      color: '#FFFFFF',
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
  });
}
