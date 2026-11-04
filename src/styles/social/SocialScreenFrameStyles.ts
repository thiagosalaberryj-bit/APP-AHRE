import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { ESPACIADO } from '../globalStyles';
export default function crearEstilosMarco(_tema: Tema, margenInferior = 0) {
  return StyleSheet.create({
    expandir: {
      flex: 1
    },
    contenidoPanel: {
      paddingHorizontal: ESPACIADO.grande,
      gap: ESPACIADO.minimo
    },
    contenido: {
      alignSelf: 'center',
      gap: ESPACIADO.seccion,
      maxWidth: 560,
      padding: ESPACIADO.pantalla,
      paddingBottom: ESPACIADO.enorme + margenInferior,
      width: '100%'
    },
    contenidoFormulario: {
      maxWidth: 480,
      gap: ESPACIADO.formulario
    },
    contenidoGasto: {
      paddingHorizontal: ESPACIADO.grande,
      gap: ESPACIADO.medio
    }
  });
}
