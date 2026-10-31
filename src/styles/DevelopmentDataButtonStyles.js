import { StyleSheet } from 'react-native';
import { ESPACIADO } from './globalStyles';

export default function crearEstilosDatosPrueba() {
  return StyleSheet.create({
    contenedor: { width: '100%', gap: ESPACIADO.minimo, marginBottom: ESPACIADO.medio },
    boton: { flexDirection: 'row', gap: ESPACIADO.pequeno },
    texto: { textAlign: 'center', flexShrink: 1 },
  });
}
