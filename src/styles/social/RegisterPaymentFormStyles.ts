import {StyleSheet} from 'react-native';
import type {Tema} from '../colors';
import {BORDES,ESPACIADO,TIPOGRAFIA} from '../globalStyles';

export default function crearEstilosRegistroPago(tema:Tema){
  return StyleSheet.create({
    grupoEstado:{gap:ESPACIADO.pequeno,padding:ESPACIADO.pequeno,backgroundColor:tema.superficie,borderWidth:BORDES.anchos.fino,borderColor:tema.borde,borderRadius:BORDES.radios.campo},
    estado:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.minimo},
    textoEstado:{color:tema.textoPrincipal,fontSize:TIPOGRAFIA.tamanos.auxiliar,fontWeight:TIPOGRAFIA.pesos.seminegrita},
    cargando:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.pequeno},
  });
}
