import { StyleSheet } from 'react-native';
import { ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios() {
  return StyleSheet.create({
    contenidoResumenDeuda: {
      flex: 1,
      minWidth: 0,
      alignSelf: 'stretch',
      paddingVertical: ESPACIADO.pequeno,
      gap: ESPACIADO.minimo
    }
  });
}
