import { StyleSheet } from 'react-native';

import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosOcr(tema) {
  return StyleSheet.create({
    contenido: {
      flex: 1,
      gap: ESPACIADO.formulario,
      padding: ESPACIADO.pantalla,
      paddingBottom: ESPACIADO.enorme,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    visor: {
      flex: 1,
      minHeight: 480,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#101010',
      borderRadius: BORDES.radios.tarjeta,
      padding: ESPACIADO.extraGrande,
      overflow: 'hidden',
    },
    guia: {
      position: 'absolute',
      width: '62%',
      height: '80%',
    },
    esquinaGuia: {
      position: 'absolute',
      width: 64,
      height: 64,
      borderColor: tema.botonPrincipal,
    },
    textoVisor: {
      color: '#FFFFFF',
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      textAlign: 'center',
      marginTop: ESPACIADO.grande,
    },
    instrucciones: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      textAlign: 'center',
    },
    accionesEscaner: {
      gap: ESPACIADO.medio,
    },
    filaBotones: {
      flexDirection: 'row',
      gap: ESPACIADO.medio,
    },
    botonMitad: {
      flex: 1,
      justifyContent: 'center',
    },
    botonGaleria: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.pequeno,
      marginTop: ESPACIADO.pequeno,
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.boton,
      borderWidth: BORDES.anchos.fino,
      paddingHorizontal: ESPACIADO.grande,
    },
    textoBotonGaleria: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    tarjetaEstado: {
      alignItems: 'center',
      gap: ESPACIADO.formulario,
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.tarjeta,
      borderWidth: BORDES.anchos.fino,
      padding: ESPACIADO.extraGrande,
    },
    tituloEstado: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.negrita,
      textAlign: 'center',
    },
    textoEstado: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      textAlign: 'center',
    },
    avisoIncompleto: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      backgroundColor: tema.errorFondo,
      borderColor: tema.foco,
      borderRadius: BORDES.radios.campo,
      borderWidth: BORDES.anchos.fino,
      padding: ESPACIADO.medio,
    },
    textoAviso: {
      flex: 1,
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
    accionSutil: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textoAccionSutil: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      textDecorationLine: 'underline',
    },
  });
}
