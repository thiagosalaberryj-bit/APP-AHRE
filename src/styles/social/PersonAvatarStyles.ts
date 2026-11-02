import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    avatar: {
      alignItems: 'center',
      backgroundColor: tema.contenedorVerde,
      borderRadius: BORDES.radios.circular,
      height: 44,
      justifyContent: 'center',
      width: 44
    }
  });
}
