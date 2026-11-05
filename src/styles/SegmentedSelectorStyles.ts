import { StyleSheet } from 'react-native';
import type { Tema } from './colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from './globalStyles';

export function crearEstilosSelectorSegmentado(tema:Tema) {
  return StyleSheet.create({
    contenedor: { backgroundColor:tema.superficie, borderColor:tema.borde, borderWidth:BORDES.anchos.fino, borderRadius:BORDES.radios.campo, padding:ESPACIADO.minimo },
    fila: { flexDirection:'row', position:'relative' },
    indicador: { position:'absolute', left:0, top:0, bottom:0, borderRadius:BORDES.radios.campo / 2, backgroundColor:tema.encabezado },
    opcion: { flex:1, minWidth:0, minHeight:44, alignItems:'center', justifyContent:'center', paddingHorizontal:ESPACIADO.minimo },
    texto: { color:tema.textoSecundario, fontSize:TIPOGRAFIA.tamanos.secundario, fontWeight:TIPOGRAFIA.pesos.seminegrita },
    textoActivo: { color:tema.encabezadoTexto },
  });
}
