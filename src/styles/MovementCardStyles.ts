import {StyleSheet} from 'react-native';
import type {Tema} from './colors';
import {BORDES,ESPACIADO,TIPOGRAFIA} from './globalStyles';

export const crearEstilosTarjetaMovimiento=(tema:Tema)=>StyleSheet.create({
  tarjeta:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.medio,padding:ESPACIADO.medio,backgroundColor:tema.superficie,borderColor:tema.borde,borderWidth:BORDES.anchos.fino,borderRadius:BORDES.radios.boton},
  presionada:{opacity:0.85},
  icono:{padding:ESPACIADO.pequeno,borderRadius:BORDES.radios.campo,alignItems:'center',justifyContent:'center'},
  contenido:{flex:1,minWidth:0,gap:ESPACIADO.minimo},
  filaTitulo:{flexDirection:'row',alignItems:'baseline',gap:ESPACIADO.pequeno},
  titulo:{flex:1,minWidth:0,color:tema.textoPrincipal,fontSize:TIPOGRAFIA.tamanos.secundario,fontWeight:TIPOGRAFIA.pesos.seminegrita},
  importe:{maxWidth:'50%',flexShrink:1,textAlign:'right',color:tema.textoPrincipal,fontSize:TIPOGRAFIA.tamanos.secundario,fontWeight:TIPOGRAFIA.pesos.negrita},
  metadatos:{color:tema.textoSecundario,fontSize:TIPOGRAFIA.tamanos.auxiliar},
  tipo:{color:tema.textoSecundario,fontSize:TIPOGRAFIA.tamanos.auxiliar,fontWeight:TIPOGRAFIA.pesos.medio},
});
