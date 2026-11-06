import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    opcionIconoSala: {
      flexGrow: 1,
      flexBasis: '40%',
      minHeight: 72,
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.pequeno,
      padding: ESPACIADO.pequeno,
      borderWidth: BORDES.anchos.fino,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.boton
    },
    iconoSalaSeleccionado: {
      borderColor: tema.foco,
      backgroundColor: tema.fondo
    }
  });
}
