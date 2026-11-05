import { StyleSheet } from 'react-native';
import { ESPACIADO } from './globalStyles';

export const estilosFilaFiltros = StyleSheet.create({
  contenedor: { position:'relative', alignSelf:'stretch', flexGrow:0 },
  fila: { flexDirection:'row', alignItems:'center', gap:ESPACIADO.pequeno },
  borde: { position:'absolute', top:0, bottom:0, width:ESPACIADO.extraGrande },
  izquierda: { left:0 },
  derecha: { right:0 },
});
