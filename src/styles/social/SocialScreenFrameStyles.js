import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosMarco(tema, margenInferior = 0) {
  return StyleSheet.create({
    expandir: {
      flex: 1
    },
    contenidoPanel: {
      paddingHorizontal: ESPACIADO.grande,
      gap: ESPACIADO.enorme
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
    },
    lineaCarga: {
      backgroundColor: tema.borde,
      borderRadius: BORDES.radios.campo,
      height: 20
    }
  });
}
