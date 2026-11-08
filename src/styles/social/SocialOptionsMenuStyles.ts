import {StyleSheet} from 'react-native';
import type {Tema} from '../colors';
import {BORDES,ESPACIADO,TIPOGRAFIA} from '../globalStyles';

export default function crearEstilosMenuSocial(tema:Tema){
  return StyleSheet.create({
    fondo:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.48)',padding:ESPACIADO.pantalla},
    cierre:{position:'absolute',top:0,bottom:0,left:0,right:0},
    tarjeta:{width:'100%',maxWidth:480,maxHeight:'100%',backgroundColor:tema.superficie,borderWidth:BORDES.anchos.fino,borderColor:tema.borde,borderRadius:BORDES.radios.boton,padding:ESPACIADO.grande,gap:ESPACIADO.medio},
    cabecera:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.pequeno},
    detalle:{flex:1,minWidth:0,gap:ESPACIADO.minimo},
    titulo:{color:tema.textoPrincipal,fontFamily:TIPOGRAFIA.familias.principal,fontSize:TIPOGRAFIA.tamanos.encabezado,fontWeight:TIPOGRAFIA.pesos.seminegrita},
    descripcion:{color:tema.textoSecundario,fontFamily:TIPOGRAFIA.familias.principal,fontSize:TIPOGRAFIA.tamanos.secundario,lineHeight:20},
    cerrar:{width:44,height:44,alignItems:'center',justifyContent:'center'},
    opcion:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.medio,minHeight:64,paddingVertical:ESPACIADO.pequeno},
    icono:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:BORDES.radios.campo/2,backgroundColor:tema.fondo},
    peligro:{backgroundColor:tema.errorFondo},
    tituloOpcion:{color:tema.textoPrincipal,fontFamily:TIPOGRAFIA.familias.principal,fontSize:TIPOGRAFIA.tamanos.secundario,fontWeight:TIPOGRAFIA.pesos.seminegrita},
    textoPeligro:{color:tema.error},
    separador:{height:BORDES.anchos.fino,backgroundColor:tema.borde,marginLeft:40+ESPACIADO.medio},
    deshabilitada:{opacity:0.45},
    presionada:{opacity:0.66},
  });
}
