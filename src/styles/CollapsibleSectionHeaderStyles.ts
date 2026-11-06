import { StyleSheet } from 'react-native';
import { ESPACIADO } from './globalStyles';
export default function crearEstilosEncabezado() {
  return StyleSheet.create({
    encabezado: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      paddingVertical: ESPACIADO.pequeno
    },
    textoFlexible: { flex: 1, minWidth: 0, gap: ESPACIADO.minimo }
  });
}
