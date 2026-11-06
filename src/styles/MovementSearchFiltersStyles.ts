import { StyleSheet } from 'react-native';
import type { Tema } from './colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosBusquedaFiltros(tema:Tema) {
  return StyleSheet.create({
    lineaActivos: { flexDirection:'row', alignItems:'center', gap:ESPACIADO.pequeno, minHeight:38 },
    criterioActivo: { maxWidth:280 },
    textoCriterio: { flexShrink:1 },
    listaActivos: { flex:1, minWidth:0 },
    limpiar: { minHeight:38, paddingHorizontal:ESPACIADO.pequeno, justifyContent:'center' },
    textoLimpiar: { color:tema.foco, fontSize:TIPOGRAFIA.tamanos.secundario, fontWeight:TIPOGRAFIA.pesos.medio },
    sinFiltros: { color:tema.textoSecundario, fontSize:TIPOGRAFIA.tamanos.auxiliar },
    deshabilitado: { opacity:0.45 },
    contenedor: { gap: ESPACIADO.medio },
    buscador: { flexDirection:'row', alignItems:'center', gap:ESPACIADO.pequeno, minHeight:52, borderColor:tema.borde, borderWidth:BORDES.anchos.fino, paddingRight:ESPACIADO.pequeno },
    entrada: { flex:1,minWidth:0,color:tema.textoPrincipal,fontSize:TIPOGRAFIA.tamanos.cuerpo,paddingVertical:ESPACIADO.pequeno },
    accion: { width:44,height:44,alignItems:'center',justifyContent:'center' },
    fila: { flexDirection:'row',alignItems:'center',gap:ESPACIADO.pequeno },
    filtro: { minHeight:38,flexDirection:'row',alignItems:'center',gap:ESPACIADO.minimo,paddingHorizontal:ESPACIADO.medio,borderWidth:BORDES.anchos.fino,borderColor:tema.borde,borderRadius:BORDES.radios.campo / 2,backgroundColor:tema.superficie },
    filtroActivo: { backgroundColor:tema.encabezado },
    textoFiltro: { color:tema.textoPrincipal,fontFamily:TIPOGRAFIA.familias.principal,fontSize:TIPOGRAFIA.tamanos.secundario,fontWeight:TIPOGRAFIA.pesos.medio,lineHeight:20 },
    textoActivo: { color:tema.encabezadoTexto },
  });
}
