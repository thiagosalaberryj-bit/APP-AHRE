import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    campoImporteTicket: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.minimo,
      width: 100,
      borderBottomWidth: BORDES.anchos.fino,
      borderBottomColor: tema.borde
    },
    simboloTicket: {
      color: tema.textoSecundario,
      fontSize: TIPOGRAFIA.tamanos.etiqueta
    },
    entradaImporteTicket: {
      flex: 1,
      minWidth: 0,
      minHeight: 48,
      color: tema.textoPrincipal,
      textAlign: 'right',
      fontFamily: TIPOGRAFIA.familias.monoespaciada,
      fontSize: TIPOGRAFIA.tamanos.cuerpo,
      paddingVertical: ESPACIADO.pequeno
    }
  });
}
