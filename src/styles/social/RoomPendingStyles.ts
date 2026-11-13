import { StyleSheet } from 'react-native';
import type { Tema } from '../colors';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';

export default function crearEstilos(tema: Tema) {
  return StyleSheet.create({
    indicador: { alignSelf: 'center', alignItems:'center',justifyContent:'center',minWidth:24,minHeight:24, backgroundColor: tema.botonPrincipal, borderRadius: BORDES.radios.campo / 2, paddingHorizontal: ESPACIADO.minimo, paddingVertical: ESPACIADO.minimo / 2 },
    texto: { textAlign:'center',textAlignVertical:'center',includeFontPadding:false,color: tema.botonPrincipalTexto, fontSize: TIPOGRAFIA.tamanos.auxiliar, fontWeight: TIPOGRAFIA.pesos.seminegrita },
    marca: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: ESPACIADO.minimo, marginTop: ESPACIADO.minimo },
    aclaracion: { color: tema.foco, fontSize: TIPOGRAFIA.tamanos.auxiliar, fontWeight: TIPOGRAFIA.pesos.medio },
  });
}
