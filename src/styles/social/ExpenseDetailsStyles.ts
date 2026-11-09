import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    controlPago:{width:20,height:20,alignItems:'center',justifyContent:'center'},
    iconoCategoria:{width:40,height:40,borderRadius:BORDES.radios.campo/2,alignItems:'center',justifyContent:'center'},
    lineaDetalleGasto: {
      gap: ESPACIADO.minimo,
      paddingVertical: ESPACIADO.pequeno,
      borderBottomWidth: BORDES.anchos.fino,
      borderBottomColor: tema.borde
    }
  });
}
