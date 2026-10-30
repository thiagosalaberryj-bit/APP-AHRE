import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema) {
  return StyleSheet.create({
    pestana: {
      alignItems: 'center',
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.circular,
      borderWidth: BORDES.anchos.fino,
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      minHeight: 48,
      paddingHorizontal: ESPACIADO.grande,
      paddingVertical: ESPACIADO.pequeno,
      flexShrink: 1
    }
  });
}
