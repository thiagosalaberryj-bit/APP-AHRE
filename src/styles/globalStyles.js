import { StyleSheet } from 'react-native';

import { TEMAS } from './colors';

export const ESPACIADO = Object.freeze({
  minimo: 4,
  pequeno: 8,
  medio: 12,
  grande: 16,
  extraGrande: 24,
  enorme: 32,
  pantalla: 24,
  seccion: 24,
  formulario: 16,
});

export const BORDES = Object.freeze({
  radios: Object.freeze({
    input: 10,
    boton: 12,
    tarjeta: 16,
    contenedor: 20,
    circular: 999,
  }),
  anchos: Object.freeze({ fino: 1, normal: 2 }),
});

export const TIPOGRAFIA = Object.freeze({
  familias: Object.freeze({ principal: 'sans-serif', monoespaciada: 'monospace' }),
  tamanos: Object.freeze({
    titulo: 28,
    subtitulo: 22,
    encabezado: 18,
    cuerpo: 16,
    secundario: 14,
    auxiliar: 12,
    monto: 24,
    boton: 16,
    etiqueta: 14,
  }),
  pesos: Object.freeze({ regular: '400', medio: '500', seminegrita: '600', negrita: '700' }),
});

/**
 * Estilos reutilizables de la aplicación. Los estilos de cada pantalla deben
 * componerse a partir de esta base y de estilos locales de layout cuando sea
 * necesario.
 */
export function crearEstilosGlobales(theme = TEMAS.claro) {
  return StyleSheet.create({
    areaSegura: {
      flex: 1,
      backgroundColor: theme.encabezado,
    },
    pantalla: {
      flex: 1,
      backgroundColor: theme.fondo,
    },
    contenido: {
      padding: ESPACIADO.pantalla,
    },
    encabezado: {
      backgroundColor: theme.encabezado,
      padding: ESPACIADO.pantalla,
      borderBottomLeftRadius: BORDES.radios.contenedor,
      borderBottomRightRadius: BORDES.radios.contenedor,
    },
    encabezadoTitulo: {
      color: theme.encabezadoTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.titulo,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    encabezadoTexto: {
      color: theme.botonPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
    tarjeta: {
      backgroundColor: theme.superficie,
      borderColor: theme.borde,
      borderRadius: BORDES.radios.tarjeta,
      borderWidth: BORDES.anchos.fino,
      padding: ESPACIADO.grande,
    },
    titulo: {
      color: theme.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.titulo,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    subtitulo: {
      color: theme.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.subtitulo,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    encabezadoSeccion: {
      color: theme.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    texto: {
      color: theme.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
    },
    textoSecundario: {
      color: theme.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
    etiqueta: {
      color: theme.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.etiqueta,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    monto: {
      color: theme.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.monto,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    botonPrincipal: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.botonPrincipal,
      borderRadius: BORDES.radios.boton,
      paddingHorizontal: ESPACIADO.grande,
      paddingVertical: ESPACIADO.medio,
    },
    textoBotonPrincipal: {
      color: theme.botonPrincipalTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    botonSecundario: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.botonSecundario,
      borderRadius: BORDES.radios.boton,
      paddingHorizontal: ESPACIADO.grande,
      paddingVertical: ESPACIADO.medio,
    },
    textoBotonSecundario: {
      color: theme.botonSecundarioTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    botonTexto: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ESPACIADO.medio,
      paddingVertical: ESPACIADO.pequeno,
    },
    textoBotonTexto: {
      color: theme.foco,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    botonDeshabilitado: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.fondoDeshabilitado,
      borderRadius: BORDES.radios.boton,
      paddingHorizontal: ESPACIADO.grande,
      paddingVertical: ESPACIADO.medio,
    },
    textoDeshabilitado: {
      color: theme.deshabilitado,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    input: {
      minHeight: 52,
      backgroundColor: theme.superficie,
      borderColor: theme.bordeFuerte,
      borderRadius: BORDES.radios.input,
      borderWidth: BORDES.anchos.normal,
      color: theme.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      paddingHorizontal: ESPACIADO.grande,
    },
    inputEnfocado: {
      borderColor: theme.foco,
    },
    inputError: {
      borderColor: '#C62828',
    },
    inputDeshabilitado: {
      backgroundColor: theme.fondoDeshabilitado,
      borderColor: theme.borde,
      color: theme.deshabilitado,
    },
    textoAyuda: {
      color: theme.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
    },
    textoError: {
      color: '#C62828',
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
    },
    separador: {
      backgroundColor: theme.borde,
      height: BORDES.anchos.fino,
    },
    iconoDetalle: {
      alignItems: 'center',
      backgroundColor: theme.encabezado,
      borderRadius: BORDES.radios.circular,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    textoIconoDetalle: {
      color: theme.botonPrincipal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    navegacion: {
      minHeight: 76,
      alignItems: 'stretch',
      backgroundColor: theme.superficie,
      borderColor: theme.borde,
      borderTopWidth: BORDES.anchos.fino,
      flexDirection: 'row',
      paddingHorizontal: ESPACIADO.pequeno,
    },
    navegacionItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 64,
      padding: ESPACIADO.pequeno,
    },
    navegacionActiva: {
      borderTopColor: theme.foco,
      borderTopWidth: BORDES.anchos.normal,
    },
  });
}
