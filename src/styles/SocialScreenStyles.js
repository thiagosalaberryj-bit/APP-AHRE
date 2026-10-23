import { StyleSheet } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosSocial(tema, margenInferior = 0) {
  return StyleSheet.create({
    contenido: {
      alignSelf: 'center',
      gap: ESPACIADO.seccion,
      maxWidth: 560,
      padding: ESPACIADO.pantalla,
      paddingBottom: ESPACIADO.enorme + margenInferior,
      width: '100%',
    },
    grupo: {
      gap: ESPACIADO.medio,
    },
    filaTitulo: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.medio,
      justifyContent: 'space-between',
    },
    textoFlexible: {
      flex: 1,
      minWidth: 0,
      gap: ESPACIADO.minimo,
    },
    contador: {
      alignItems: 'center',
      backgroundColor: tema.contenedorVerde,
      borderRadius: BORDES.radios.circular,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    textoContador: {
      color: tema.contenedorVerdeTexto,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    tarjetaSala: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.medio,
      minHeight: 96,
    },
    iconoLista: {
      alignItems: 'center',
      backgroundColor: tema.contenedorVerde,
      borderRadius: BORDES.radios.boton,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    estadoVacio: {
      alignItems: 'center',
      gap: ESPACIADO.medio,
      paddingVertical: ESPACIADO.enorme,
    },
    textoCentrado: {
      textAlign: 'center',
    },
    lineaCarga: {
      backgroundColor: tema.borde,
      borderRadius: BORDES.radios.campo,
      height: 20,
    },
    cabeceraSala: {
      alignItems: 'flex-start',
      gap: ESPACIADO.pequeno,
    },
    iconoSalaGrande: {
      alignItems: 'center',
      backgroundColor: tema.contenedorVerde,
      borderRadius: BORDES.radios.tarjeta,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    pestanas: {
      gap: ESPACIADO.pequeno,
      paddingVertical: ESPACIADO.minimo,
    },
    pestana: {
      alignItems: 'center',
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.circular,
      borderWidth: BORDES.anchos.fino,
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      minHeight: 44,
      paddingHorizontal: ESPACIADO.grande,
    },
    pestanaActiva: {
      backgroundColor: tema.botonPrincipal,
      borderColor: tema.botonPrincipal,
    },
    textoPestana: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.etiqueta,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    textoPestanaActiva: {
      color: tema.botonPrincipalTexto,
    },
    filaPersona: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.medio,
      minHeight: 78,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: tema.contenedorVerde,
      borderRadius: BORDES.radios.circular,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    textoAvatar: {
      color: tema.contenedorVerdeTexto,
      fontSize: TIPOGRAFIA.tamanos.etiqueta,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    etiquetaBalance: {
      color: tema.textoSecundario,
      flexShrink: 1,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      textAlign: 'right',
    },
    balanceDebe: { color: tema.error },
    balanceRecibe: { color: tema.exito },
    filaGasto: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ESPACIADO.medio,
      minHeight: 92,
    },
    montoGasto: {
      color: tema.textoPrincipal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    filaBalance: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: ESPACIADO.medio,
      minHeight: 72,
    },
    fondoModal: {
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      flex: 1,
      justifyContent: 'center',
      padding: ESPACIADO.grande,
    },
    cierreFondo: {
      ...StyleSheet.absoluteFillObject,
    },
    tarjetaModal: {
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.tarjeta,
      borderWidth: BORDES.anchos.fino,
      gap: ESPACIADO.formulario,
      maxHeight: '85%',
      maxWidth: 480,
      padding: ESPACIADO.extraGrande,
      width: '100%',
    },
    filaModal: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    botonCerrar: {
      alignItems: 'center',
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    desplazamientoModal: {
      flexGrow: 0,
    },
    grupoCampo: {
      gap: ESPACIADO.pequeno,
    },
    campoInformativo: {
      alignItems: 'center',
      backgroundColor: tema.fondoDeshabilitado,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.campo,
      borderWidth: BORDES.anchos.fino,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 52,
      paddingHorizontal: ESPACIADO.grande,
    },
  });
}
