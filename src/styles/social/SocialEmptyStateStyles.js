import { StyleSheet } from 'react-native';
import { ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios() {
  return StyleSheet.create({
    estadoVacio: {
      alignItems: 'center',
      gap: ESPACIADO.medio,
      paddingVertical: ESPACIADO.enorme
    }
  });
}
