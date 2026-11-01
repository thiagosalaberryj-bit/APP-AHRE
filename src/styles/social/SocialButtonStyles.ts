import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { COLORES_NEUTROS } from '../colors';

export default function crearEstilosBotonSocial(tema: Tema) {
  return StyleSheet.create({
    botonPeligro: { backgroundColor: tema.error },
    textoPeligro: { color: COLORES_NEUTROS.superficie }
  });
}
