import { StyleSheet } from 'react-native';
import { ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(_tema?: unknown) {
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
