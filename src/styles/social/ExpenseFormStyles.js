import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema) {
  return StyleSheet.create({
    itemTicketSeleccionable: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      paddingVertical: ESPACIADO.pequeno,
      borderBottomWidth: BORDES.anchos.fino,
      borderBottomColor: tema.borde
    },
    accionTicket: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      minHeight: 48,
      backgroundColor: tema.superficie,
      borderColor: tema.borde,
      borderWidth: BORDES.anchos.fino,
      borderRadius: BORDES.radios.campo,
      padding: ESPACIADO.medio
    },
    encabezadoTicket: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.pequeno,
      paddingBottom: ESPACIADO.pequeno
    },
    importeTicket: {
      color: tema.textoPrincipal,
      fontFamily: TIPOGRAFIA.familias.monoespaciada,
      fontSize: TIPOGRAFIA.tamanos.cuerpo
    }
  });
}
