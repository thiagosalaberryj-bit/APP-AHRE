import { StyleSheet } from 'react-native';
import { ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios() {
  return StyleSheet.create({
    encabezadoTicket: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      paddingBottom: ESPACIADO.pequeno
    },
  });
}
