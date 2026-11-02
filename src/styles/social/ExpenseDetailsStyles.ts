import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    lineaDetalleGasto: {
      gap: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.pequeno,
      borderBottomWidth: BORDES.anchos.fino,
      borderBottomColor: tema.borde
    }
  });
}
