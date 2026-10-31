import { StyleSheet } from 'react-native';
import { ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios() {
  return StyleSheet.create({
    selectorCompacto: {
      minHeight: 48,
      paddingHorizontal: ESPACIADO.pequeno,
      paddingVertical: ESPACIADO.pequeno,
      gap: ESPACIADO.minimo
    }
  });
}
