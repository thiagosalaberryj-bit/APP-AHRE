import {StyleSheet} from 'react-native';
import type {Tema} from './colors';
import {ESPACIADO,BORDES,TIPOGRAFIA} from './globalStyles';
export const crearEstilosRecurrencias=(tema:Tema)=>StyleSheet.create({
  encabezado:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.medio,minHeight:48},
  textoFlexible:{flex:1,minWidth:0,gap:ESPACIADO.minimo},
  acciones:{flexDirection:'row',flexWrap:'wrap',gap:ESPACIADO.pequeno},
  textoAccion:{color:tema.foco,fontSize:TIPOGRAFIA.tamanos.secundario,fontWeight:TIPOGRAFIA.pesos.seminegrita},
  grupo:{gap:ESPACIADO.medio},
  hero:{backgroundColor:tema.fondo,padding:ESPACIADO.medio,borderRadius:BORDES.radios.campo,gap:ESPACIADO.pequeno},
  iconoModal:{width:44,height:44,borderRadius:BORDES.radios.campo,alignItems:'center',justifyContent:'center',backgroundColor:tema.superficie},
  importeModal:{color:tema.textoPrincipal,fontSize:TIPOGRAFIA.tamanos.monto,fontWeight:TIPOGRAFIA.pesos.negrita},
  historial:{gap:ESPACIADO.pequeno,borderTopWidth:BORDES.anchos.fino,borderTopColor:tema.borde,paddingTop:ESPACIADO.medio},
  accion:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:ESPACIADO.pequeno,backgroundColor:tema.superficie,padding:ESPACIADO.medio,minHeight:46,borderWidth:BORDES.anchos.fino,borderColor:tema.borde,borderRadius:BORDES.radios.boton},
});
