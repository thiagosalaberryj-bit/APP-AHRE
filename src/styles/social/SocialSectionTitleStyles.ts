import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { ESPACIADO, TIPOGRAFIA } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    tituloSeccionPanel: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ESPACIADO.minimo
    },
    flechaSeccionPanel: {
      flexDirection: 'row',
      gap: ESPACIADO.minimo,
      minHeight: 44,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center'
    },
    textoVerTodas: {
      color: tema.foco,
      fontSize: TIPOGRAFIA.tamanos.secundario,
      fontWeight: TIPOGRAFIA.pesos.negrita
    }
  });
}
