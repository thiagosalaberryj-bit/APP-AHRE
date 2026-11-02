import {StyleSheet} from 'react-native';
import type {Tema} from './colors';
import {ESPACIADO,TIPOGRAFIA,BORDES} from './globalStyles';
export const crearEstilosSincronizacion=(tema:Tema)=>StyleSheet.create({
  estado:{gap:ESPACIADO.pequeno,marginBottom:ESPACIADO.grande},
  titulo:{fontSize:TIPOGRAFIA.tamanos.encabezado,fontWeight:TIPOGRAFIA.pesos.negrita,color:tema.textoPrincipal},
  texto:{fontSize:TIPOGRAFIA.tamanos.secundario,color:tema.textoSecundario},
  boton:{padding:ESPACIADO.medio,borderRadius:BORDES.radios.boton,backgroundColor:tema.botonPrincipal,alignItems:'center'},
  textoBoton:{color:tema.botonPrincipalTexto,fontWeight:TIPOGRAFIA.pesos.seminegrita},
  separador:{height:ESPACIADO.medio},
});
