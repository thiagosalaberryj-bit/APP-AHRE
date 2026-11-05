import type { Tema } from './colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA, MARGEN_LATERAL_PANTALLA } from './globalStyles';

export function crearEstilosDetalleCategoria(tema: Tema) {
  const textoSecundario = { color: tema.textoSecundario, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.auxiliar, lineHeight: 18 };
  const tarjeta = { backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo, padding: ESPACIADO.grande };
  return StyleSheet.create({
    cuerpo: { flex: 1 },
    contenidoCategoria: { paddingHorizontal: MARGEN_LATERAL_PANTALLA, paddingTop: ESPACIADO.medio, paddingBottom: ESPACIADO.enorme, gap: ESPACIADO.medio },
    selectorPeriodo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, minHeight: 38, paddingHorizontal: ESPACIADO.medio, backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo / 2, flexShrink: 1 },
    selectorPeriodoActivo: { borderColor: tema.foco },
    textoSelectorPeriodo: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, flexShrink: 1 },
    resumenCategoria: { ...tarjeta, gap: ESPACIADO.medio },
    encabezadoCategoria: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.medio },
    iconoCategoria: { width: 52, height: 52, borderRadius: BORDES.radios.campo, alignItems: 'center', justifyContent: 'center' },
    datosCategoria: { flex: 1, minWidth: 0, gap: ESPACIADO.minimo },
    nombreCategoria: { color: tema.textoPrincipal, fontFamily: TIPOGRAFIA.familias.principal, fontSize: TIPOGRAFIA.tamanos.subtitulo, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    textoSecundario,
    filaTotal: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.medio, paddingVertical: ESPACIADO.medio, borderTopWidth: BORDES.anchos.fino, borderTopColor: tema.borde },
    datosTotal: { flexShrink: 1, gap: ESPACIADO.minimo },
    etiquetaTotal: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.secundario, fontWeight: TIPOGRAFIA.pesos.medio },
    montoCategoria: { flex: 1, minWidth: 0, textAlign: 'right', fontSize: TIPOGRAFIA.tamanos.titulo, fontWeight: TIPOGRAFIA.pesos.negrita, fontVariant: ['tabular-nums'] },
    datosResumen: { flexDirection: 'row', gap: ESPACIADO.medio, borderTopWidth: BORDES.anchos.fino, borderTopColor: tema.borde, paddingTop: ESPACIADO.medio },
    datoResumen: { flex: 1, minWidth: 0, gap: ESPACIADO.minimo },
    datoPromedio: { flex: 2, alignItems: 'flex-end', borderLeftWidth: BORDES.anchos.fino, borderLeftColor: tema.borde, paddingLeft: ESPACIADO.medio },
    valorResumen: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.seminegrita, alignSelf: 'stretch' },
    valorPromedio: { textAlign: 'right' },
    avisoFiltro: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno, paddingHorizontal: ESPACIADO.minimo },
    textoAviso: { ...textoSecundario, flex: 1 },
    evolucionCategoria: { ...tarjeta, gap: ESPACIADO.medio },
    encabezadoSeccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.pequeno },
    tituloSeccion: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.encabezado, fontWeight: TIPOGRAFIA.pesos.seminegrita, flexShrink: 1 },
    graficoEvolucion: { flexDirection: 'row', gap: 2 },
    columnaMes: { flex: 1, minWidth: 0, gap: ESPACIADO.minimo, alignItems: 'stretch' },
    pistaMes: { height: 112, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 2, paddingVertical: ESPACIADO.minimo, borderRadius: BORDES.radios.boton, overflow: 'hidden' },
    pistaMesActiva: { backgroundColor: tema.fondo },
    barraMes: { width: '100%', maxWidth: 18, borderRadius: BORDES.radios.campo / 2 },
    etiquetaMes: { ...textoSecundario, fontSize: 10, textAlign: 'center' },
    etiquetaMesActiva: { color: tema.foco, fontWeight: TIPOGRAFIA.pesos.negrita },
    listaMovimientos: { gap: ESPACIADO.pequeno, paddingTop: ESPACIADO.minimo },
    estadoDetalle: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.pequeno },
    textoEstado: { ...textoSecundario, flexShrink: 1, textAlign: 'center' },
    vacio: { ...tarjeta, alignItems: 'center', gap: ESPACIADO.pequeno, paddingVertical: ESPACIADO.extraGrande },
    tituloVacio: { color: tema.textoPrincipal, fontSize: TIPOGRAFIA.tamanos.cuerpo, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    capaSelector: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100 },
    menuPeriodo: { position: 'absolute', backgroundColor: tema.superficie, borderColor: tema.borde, borderWidth: BORDES.anchos.fino, borderRadius: BORDES.radios.campo, overflow: 'hidden', elevation: 8, shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
    opcionPeriodo: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACIADO.pequeno, paddingHorizontal: ESPACIADO.medio, paddingVertical: ESPACIADO.minimo },
    opcionPeriodoActiva: { backgroundColor: tema.fondo },
  });
}
