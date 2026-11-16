import {StyleSheet} from 'react-native';
import {ESPACIADO} from '../globalStyles';

export default function crearEstilosCampo(){
  return StyleSheet.create({
    ojoContrasena:{minHeight:44,minWidth:44,alignItems:'center',justifyContent:'center'},
    campoMultilinea:{alignItems:'flex-start',paddingVertical:ESPACIADO.pequeno},
    entradaMultilinea:{minHeight:80,paddingVertical:0},
  });
}
