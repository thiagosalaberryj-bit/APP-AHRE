import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema) {
  return StyleSheet.create({
    lineaDetalleGasto: {
      gap: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.pequeno,
      borderBottomWidth: BORDES.anchos.fino,
      borderBottomColor: tema.borde
    }
  });
}
