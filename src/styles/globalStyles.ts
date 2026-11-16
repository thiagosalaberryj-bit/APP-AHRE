import type {PressableProps,PressableStateCallbackType} from 'react-native';
import type { Tema } from './colors';
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

export const RETROALIMENTACION_PULSACION = Object.freeze({color:'transparent', foreground:false});
export const ANIMACION_ACCION = Object.freeze({cargaMinima:2000,exitoVisible:2000,transicion:260,punto:240,separacionPuntos:130});
export const MARGEN_LATERAL_PANTALLA = ESPACIADO.medio;

export const BORDES = Object.freeze({
  radios: Object.freeze({
    campo: 10,
    boton: 12,
    tarjeta: 16,
    contenedor: 20,
    circular: 999,
  }),
  anchos: Object.freeze({ fino: 1, normal: 2 }),
});

export const TIPOGRAFIA = Object.freeze({
  familias: Object.freeze({ principal: 'sans-serif' as const, monoespaciada: 'monospace' as const }),
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
  pesos: Object.freeze({ regular: '400' as const, medio: '500' as const, seminegrita: '600' as const, negrita: '700' as const }),
});

/**
 * Estilos reutilizables de la aplicación. Los estilos de cada pantalla deben
 * componerse a partir de esta base y de estilos locales de layout cuando sea
 * necesario.
 */
function construirEstilosGlobales(tema: Tema) {
  return StyleSheet.create({
    areaSegura: {
      flex: 1,
      backgroundColor: tema.encabezado,
    },
    pantalla: {
      flex: 1,
      backgroundColor: tema.fondo,
    },
    contenido: {
      padding: ESPACIADO.pantalla,
      paddingHorizontal: MARGEN_LATERAL_PANTALLA,
    },
    encabezado: {
      backgroundColor: tema.encabezado,
      padding: ESPACIADO.pantalla,
      borderBottomLeftRadius: BORDES.radios.contenedor,
      borderBottomRightRadius: BORDES.radios.contenedor,
    },
    encabezadoTitulo: {
      color: tema.encabezadoTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.titulo,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    encabezadoTexto: {
      color: tema.botonPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
    tarjeta: {
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.tarjeta,
      borderWidth: BORDES.anchos.fino,
      padding: ESPACIADO.grande,
    },
    titulo: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.titulo,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    subtitulo: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.subtitulo,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    encabezadoSeccion: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    texto: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
    },
    textoSecundario: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.secundario,
    },
    encabezadoCampo: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.pequeno,
    },
    etiquetaCampo: { flex: 1, minWidth: 0 },
    contadorCampo: {
      color: tema.textoSecundario, fontSize: TIPOGRAFIA.tamanos.auxiliar, textAlign: 'right', flexShrink: 0,
    },
    etiqueta: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.etiqueta,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    monto: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.monto,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    botonPrincipal: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.botonPrincipal,
      borderRadius: BORDES.radios.boton,
      paddingHorizontal: ESPACIADO.grande,
      paddingVertical: ESPACIADO.medio,
    },
    textoBotonPrincipal: {
      color: tema.botonPrincipalTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    botonSecundario: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.botonSecundario,
      borderRadius: BORDES.radios.boton,
      paddingHorizontal: ESPACIADO.grande,
      paddingVertical: ESPACIADO.medio,
    },
    textoBotonSecundario: {
      color: tema.botonSecundarioTexto,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    botonPeligro: { minHeight:48, alignItems:'center', justifyContent:'center', backgroundColor:tema.botonPeligro, borderRadius:BORDES.radios.boton, paddingHorizontal:ESPACIADO.grande, paddingVertical:ESPACIADO.medio },
    botonContornoPeligro: {minHeight:48,alignItems:'center',justifyContent:'center',borderColor:tema.error,borderWidth:BORDES.anchos.fino,borderRadius:BORDES.radios.boton,paddingHorizontal:ESPACIADO.medio,paddingVertical:ESPACIADO.medio},
    textoBotonPeligro: { color:tema.botonPeligroTexto, fontSize:TIPOGRAFIA.tamanos.boton, fontWeight:TIPOGRAFIA.pesos.seminegrita },
    botonCancelar: { minHeight:48, alignItems:'center', justifyContent:'center', backgroundColor:tema.fondoDeshabilitado, borderRadius:BORDES.radios.boton, paddingHorizontal:ESPACIADO.grande, paddingVertical:ESPACIADO.medio },
    textoBotonCancelar: { color:tema.textoPrincipal, fontSize:TIPOGRAFIA.tamanos.boton, fontWeight:TIPOGRAFIA.pesos.seminegrita },
    botonPresionado: {opacity:0.78},
    accionContenido: {minHeight:24,overflow:'hidden',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:ESPACIADO.pequeno},
    accionPuntos: {flexDirection:'row',alignItems:'center',gap:4,minHeight:20},
    accionPunto: {width:5,height:5,borderRadius:BORDES.radios.circular},
    accionTexto: {fontSize:TIPOGRAFIA.tamanos.boton,fontWeight:TIPOGRAFIA.pesos.seminegrita,textAlign:'center',flexShrink:1},
    botonTexto: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ESPACIADO.medio,
      paddingVertical: ESPACIADO.pequeno,
    },
    textoBotonTexto: {
      color: tema.foco,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    botonDeshabilitado: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tema.fondoDeshabilitado,
      borderRadius: BORDES.radios.boton,
      paddingHorizontal: ESPACIADO.grande,
      paddingVertical: ESPACIADO.medio,
    },
    textoDeshabilitado: {
      color: tema.deshabilitado,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita,
    },
    superficieCampo: {backgroundColor:tema.campoFondo,borderColor:tema.campoBorde,borderWidth:BORDES.anchos.fino},
    campo: {
      minHeight: 52,
      backgroundColor: tema.campoFondo,
      borderColor: tema.campoBorde,
      borderRadius: BORDES.radios.campo,
      borderWidth: BORDES.anchos.fino,
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      paddingHorizontal: ESPACIADO.medio,
    },
    campoEnfocado: {
      borderColor: tema.foco,
      backgroundColor: tema.campoFondoActivo,
    },
    campoCompletado: {
      borderColor: tema.exito,
    },
    campoError: {
      borderColor: tema.error,
    },
    campoDeshabilitado: {
      backgroundColor: tema.fondoDeshabilitado,
      borderColor: tema.borde,
      color: tema.deshabilitado,
    },
    textoAyuda: {
      color: tema.textoSecundario,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
    },
    textoError: {
      color: tema.error,
      fontFamily: TIPOGRAFIA.familias.principal,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
    },
    separador: {
      backgroundColor: tema.borde,
      height: BORDES.anchos.fino,
    },
    iconoDetalle: {
      alignItems: 'center',
      backgroundColor: tema.encabezado,
      borderRadius: BORDES.radios.circular,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    textoIconoDetalle: {
      color: tema.botonPrincipal,
      fontSize: TIPOGRAFIA.tamanos.encabezado,
      fontWeight: TIPOGRAFIA.pesos.negrita,
    },
    navegacion: {
      minHeight: 76,
      alignItems: 'stretch',
      backgroundColor: tema.navegacion,
      borderColor: tema.navegacionBorde,
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
      borderTopColor: tema.foco,
      borderTopWidth: BORDES.anchos.normal,
    },
  });
}

const cacheEstilosGlobales=new WeakMap<Tema,ReturnType<typeof construirEstilosGlobales>>();
export function crearEstilosGlobales(tema:Tema=TEMAS.claro){
 let estilos=cacheEstilosGlobales.get(tema);
 if(!estilos){estilos=construirEstilosGlobales(tema);cacheEstilosGlobales.set(tema,estilos);}
 return estilos;
}

/** Feedback sin dibujar un rectángulo encima del control. */
export function conEstiloDePulsacion(estilo:PressableProps['style']){
 return(estado:PressableStateCallbackType)=>[typeof estilo==='function'?estilo(estado):estilo,estado.pressed&&{opacity:0.78}];
}
