import {StyleSheet} from 'react-native';
import {ESPACIADO} from '../globalStyles';

export default function crearEstilosCampo(){
  return StyleSheet.create({
    campoMultilinea:{alignItems:'flex-start',paddingVertical:ESPACIADO.pequeno},
    entradaMultilinea:{minHeight:80,paddingVertical:0},
  });
}
