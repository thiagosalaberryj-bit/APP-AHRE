import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema) {
  return StyleSheet.create({
    resumenGastosSala: {
      flexDirection: 'row',
      alignItems: 'stretch',
      flexWrap: 'nowrap',
      gap: ESPACIADO.medio,
      paddingTop: ESPACIADO.medio,
      borderTopWidth: BORDES.anchos.fino,
      borderTopColor: tema.borde
    },
    seccionSala: {
      flex: 1,
      minWidth: 0,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.minimo,
      paddingHorizontal: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.pequeno,
      borderRadius: BORDES.radios.boton,
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderWidth: BORDES.anchos.fino
    },
    nombreSeccionSala: {
      textAlign: 'center',
      textAlignVertical: 'center'
    }
  });
}
