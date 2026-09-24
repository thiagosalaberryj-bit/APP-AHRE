import { StyleSheet } from 'react-native';

import { ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosAutenticacion(tema) {
  return StyleSheet.create({
    formulario: {
      gap: ESPACIADO.grande,
    },
    campoGrupo: {
      gap: ESPACIADO.pequeno,
    },
    campo: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      borderColor: tema.borde,
      borderWidth: 1,
      paddingHorizontal: ESPACIADO.grande,
    },
    iconoCampo: {
      marginRight: ESPACIADO.minimo,
    },
    campoTexto: {
      flex: 1,
      minWidth: 0,
      minHeight: 52,
      paddingVertical: ESPACIADO.pequeno,
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
    },
    campoTextoDeshabilitado: {
      color: tema.deshabilitado,
    },
    accionContrasena: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    opcionesContrasena: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      marginTop: -ESPACIADO.pequeno,
    },
    recordarme: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      paddingVertical: ESPACIADO.minimo,
    },
    conmutadorRecordarme: {
      width: 56,
      height: 32,
      justifyContent: 'center',
      padding: 4,
      borderRadius: 999,
    },
    controlConmutadorRecordarme: {
      width: 24,
      height: 24,
      borderRadius: 999,
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 2,
    },
    textoRecordarme: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
    accionRecuperar: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: ESPACIADO.pequeno,
    },
    textoRecuperar: {
      color: tema.foco,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    avisoLegal: {
      width: '100%',
      alignItems: 'center',
      marginTop: -ESPACIADO.pequeno,
    },
    textoAvisoLegal: {
      width: '100%',
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center',
    },
    enlaceLegal: {
      color: tema.foco,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
      textDecorationLine: 'underline',
    },
    errorCampo: {
      marginTop: -ESPACIADO.minimo,
    },
    mensajeError: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ESPACIADO.pequeno,
      padding: ESPACIADO.medio,
      backgroundColor: tema.errorFondo,
      borderColor: tema.error,
      borderRadius: 12,
      borderWidth: 1,
    },
    textoMensajeError: {
      flex: 1,
      color: tema.error,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      lineHeight: 20,
    },
    botonPrincipal: {
      minHeight: 56,
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      marginTop: ESPACIADO.pequeno,
      backgroundColor: tema.nombre === 'claro' ? tema.encabezado : tema.botonPrincipal,
    },
    botonPresionado: {
      opacity: 0.82,
      transform: [{ scale: 0.99 }],
    },
    textoBoton: {
      color: tema.nombre === 'claro' ? tema.botonPrincipal : tema.botonPrincipalTexto,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    textoProcesando: {
      color: tema.textoSecundario,
    },
    colorIndicador: tema.textoSecundario,
    pie: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: ESPACIADO.grande,
    },
    textoPie: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
    accionPie: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: ESPACIADO.pequeno,
    },
    textoAccionPie: {
      color: tema.foco,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
  });
}
