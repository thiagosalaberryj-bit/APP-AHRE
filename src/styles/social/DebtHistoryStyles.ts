import { StyleSheet } from 'react-native';
import { ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(_tema?: unknown) {
  return StyleSheet.create({
    encabezadoMesDeudas: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      paddingVertical: ESPACIADO.pequeno
    }
  });
}
