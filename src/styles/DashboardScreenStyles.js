import { StyleSheet } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosDashboard(tema) {
  return StyleSheet.create({
    contenidoDesplazable: {
      paddingBottom: ESPACIADO.extraGrande,
    },
    contenidoDashboard: {
      gap: ESPACIADO.grande,
      marginTop: -ESPACIADO.pequeno,
      paddingHorizontal: ESPACIADO.medio,
      position: 'relative',
      zIndex: 1,
    },
    contenedorTarjetaBalance: {
      marginTop: -(ESPACIADO.enorme + ESPACIADO.pequeno),
      position: 'relative',
    },
    encabezadoBalance: {
      alignItems: 'center',
      borderBottomColor: tema.borde,
      borderBottomWidth: BORDES.anchos.fino,
      height: ESPACIADO.enorme + ESPACIADO.pequeno,
      justifyContent: 'center',
    },
    contenidoBalance: {
      gap: ESPACIADO.grande,
      padding: ESPACIADO.grande,
    },
    textoPestanaBalance: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.medio,
    },
    tarjetaBalance: {
      backgroundColor: tema.superficie,
      borderRadius: BORDES.radios.contenedor,
      overflow: 'hidden',
      padding: 0,
    },
    filaBalance: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    filaSaldo: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      minWidth: 0,
    },
    botonAccesoMovimientos: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    botonVisibilidad: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    montoBalance: {
      fontSize: 28,
    },
    accionesRapidas: {
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
    },
    accionRapida: {
      alignItems: 'center',
      backgroundColor: tema.botonPrincipal,
      borderRadius: BORDES.radios.boton,
      flex: 1,
      gap: ESPACIADO.minimo,
      justifyContent: 'center',
      minHeight: 78,
      paddingHorizontal: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.pequeno,
    },
    accionRapidaPresionada: {
      opacity: 0.78,
      transform: [{ scale: 0.98 }],
    },
    textoAccionRapida: {
      color: tema.encabezado,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      textAlign: 'center',
    },
    seccion: {
      gap: ESPACIADO.pequeno,
    },
    encabezadoSeccion: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      minHeight: 44,
      gap: ESPACIADO.minimo,
    },
    accionSeccion: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.minimo,
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: ESPACIADO.minimo,
    },
    textoAgregarDeposito: {
      color: tema.foco,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    textoVerTodos: {
      color: tema.foco,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    accionSeccionPresionada: {
      opacity: 0.62,
    },
    listaDepositos: {
      gap: ESPACIADO.minimo,
    },
    filaDeposito: {
      alignItems: 'center',
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.tarjeta,
      borderWidth: BORDES.anchos.fino,
      flexDirection: 'row',
      gap: ESPACIADO.minimo,
      minHeight: 64,
      paddingHorizontal: ESPACIADO.pequeno,
      paddingVertical: ESPACIADO.pequeno,
    },
    iconoDeposito: {
      alignItems: 'center',
      borderRadius: BORDES.radios.boton,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    detalleElemento: {
      flex: 1,
      gap: ESPACIADO.minimo,
      minWidth: 0,
    },
    nombreElemento: {
      fontWeight: TIPOGRAFIA.pesos.medio,
    },
    descripcionDeposito: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: 10,
      fontWeight: TIPOGRAFIA.pesos.regular,
    },
    saldoDeposito: {
      flexShrink: 0,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    finalDeposito: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.minimo,
    },
    listaMovimientos: {
      gap: ESPACIADO.minimo,
    },
    filaMovimiento: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      minHeight: 56,
      paddingVertical: ESPACIADO.pequeno,
    },
    iconoMovimiento: {
      alignItems: 'center',
      borderRadius: BORDES.radios.circular,
      height: 34,
      justifyContent: 'center',
      width: 34,
    },
    montoMovimiento: {
      flexShrink: 0,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      textAlign: 'right',
    },
    elementoPresionado: {
      opacity: 0.82,
    },
    estadoCarga: {
      gap: ESPACIADO.grande,
      padding: ESPACIADO.grande,
    },
    lineaCarga: {
      backgroundColor: tema.fondoDeshabilitado,
      borderRadius: BORDES.radios.circular,
      height: 14,
      width: '68%',
    },
    estadoVacio: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 88,
      padding: ESPACIADO.grande,
    },
    textoEstado: {
      textAlign: 'center',
    },
  });
}
