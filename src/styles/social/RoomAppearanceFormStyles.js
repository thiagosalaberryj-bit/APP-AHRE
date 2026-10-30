import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema) {
  return StyleSheet.create({
    coloresSala: {
      flexDirection: 'row',
      gap: ESPACIADO.minimo
    },
    opcionColorSala: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center'
    },
    muestraColorSala: {
      width: 36,
      height: 36,
      borderRadius: BORDES.radios.circular,
      alignItems: 'center',
      justifyContent: 'center'
    },
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
