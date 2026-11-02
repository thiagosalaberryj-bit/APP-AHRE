import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    iconoConfirmacionEliminar: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDES.radios.campo,
      backgroundColor: tema.errorFondo
    },
    resumenPersonaEliminar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.medio,
      padding: ESPACIADO.medio,
      borderWidth: BORDES.anchos.fino,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.campo,
      backgroundColor: tema.fondo
    },
    avisoPersonaEliminar: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: ESPACIADO.pequeno,
      padding: ESPACIADO.medio,
      borderRadius: BORDES.radios.campo,
      backgroundColor: tema.errorFondo
    },
    cancelarQuitarPersona: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDES.radios.boton,
      borderWidth: BORDES.anchos.fino,
      borderColor: tema.borde,
      padding: ESPACIADO.pequeno
    },
    confirmarQuitarPersona: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDES.radios.boton,
      backgroundColor: tema.error,
      padding: ESPACIADO.pequeno
    },
    agenda: {
      backgroundColor: tema.superficie,
      borderRadius: BORDES.radios.tarjeta,
      padding: ESPACIADO.grande
    }
  });
}
