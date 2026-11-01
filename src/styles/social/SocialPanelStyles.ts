import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    accionesPanel: {
      flexDirection: 'row',
      gap: ESPACIADO.pequeno,
      borderTopWidth: BORDES.anchos.fino,
      borderTopColor: tema.borde,
      paddingTop: ESPACIADO.grande
    },
    detalleAccionPanel: {
      color: tema.botonPrincipalTexto,
      fontSize: TIPOGRAFIA.tamanos.auxiliar,
      textAlign: 'center'
    },
    montoResumen: {
      fontSize: TIPOGRAFIA.tamanos.titulo
    },
    vacioDeudasPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.medio,
      padding: ESPACIADO.grande,
      backgroundColor: tema.superficie,
      borderRadius: BORDES.radios.tarjeta
    },
  });
}
