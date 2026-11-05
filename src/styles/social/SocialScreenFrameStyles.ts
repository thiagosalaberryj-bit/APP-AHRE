import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { ESPACIADO, MARGEN_LATERAL_PANTALLA } from '../globalStyles';
export default function crearEstilosMarco(_tema: Tema, margenInferior = 0) {
  return StyleSheet.create({
    expandir: {
      flex: 1
    },
    contenidoPanel: {
      paddingHorizontal: MARGEN_LATERAL_PANTALLA,
      gap: ESPACIADO.minimo
    },
    contenido: {
      alignSelf: 'center',
      gap: ESPACIADO.seccion,
      padding: ESPACIADO.pantalla,
      paddingHorizontal: MARGEN_LATERAL_PANTALLA,
      paddingBottom: ESPACIADO.enorme + margenInferior,
      width: '100%'
    },
    contenidoFormulario: {
      gap: ESPACIADO.formulario
    },
    contenidoGasto: {
      paddingHorizontal: MARGEN_LATERAL_PANTALLA,
      gap: ESPACIADO.medio
    }
  });
}
