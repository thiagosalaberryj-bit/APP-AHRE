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
      height: 38,
      minHeight: 38,
      paddingVertical: 0,
      borderWidth: BORDES.anchos.fino,
      borderColor: tema.borde,
      borderRadius: BORDES.radios.campo / 2,
      paddingHorizontal: ESPACIADO.pequeno,
    },
    simboloTicket: {
      color: tema.textoSecundario,
      fontSize: TIPOGRAFIA.tamanos.etiqueta
    },
    entradaImporteTicket: {
      flex: 1,
      minWidth: 0,
      minHeight: 36,
      color: tema.textoPrincipal,
      textAlign: 'right',
      fontFamily: TIPOGRAFIA.familias.monoespaciada,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      paddingVertical: ESPACIADO.minimo
    }
  });
}
