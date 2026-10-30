import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema) {
  return StyleSheet.create({
    accionesDeuda: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ESPACIADO.pequeno
    },
    botonPagoDeuda: {
      flexGrow: 1,
      flexBasis: 140,
      flexDirection: 'row',
      gap: ESPACIADO.pequeno
    },
    botonEliminarDeuda: {
      flexGrow: 1,
      flexBasis: 140,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.pequeno,
      padding: ESPACIADO.medio,
      borderWidth: BORDES.anchos.fino,
      borderColor: tema.error,
      borderRadius: BORDES.radios.boton
    },
    textoEliminarDeuda: {
      flexShrink: 1,
      textAlign: 'center',
      color: tema.error,
      fontSize: TIPOGRAFIA.tamanos.boton,
      fontWeight: TIPOGRAFIA.pesos.seminegrita
    },
    textoBotonDeuda: {
      flexShrink: 1,
      textAlign: 'center'
    }
  });
}
