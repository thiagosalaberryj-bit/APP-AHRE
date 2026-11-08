import {StyleSheet} from 'react-native';
import type {Tema} from '../colors';
import {BORDES,ESPACIADO} from '../globalStyles';

export default function crearEstilosInvitacion(tema:Tema){
  return StyleSheet.create({
    tarjeta:{padding:ESPACIADO.medio,gap:ESPACIADO.medio,backgroundColor:tema.superficie,borderWidth:BORDES.anchos.fino,borderColor:tema.foco,borderRadius:BORDES.radios.campo},
    resuelta:{borderColor:tema.borde},
    cabecera:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.medio},
    icono:{width:44,height:44,alignItems:'center',justifyContent:'center',borderRadius:BORDES.radios.campo,backgroundColor:tema.fondo},
    titulos:{flex:1,minWidth:0,gap:ESPACIADO.minimo},
    grupo:{gap:ESPACIADO.pequeno},
    progreso:{flexDirection:'row',alignItems:'center',gap:ESPACIADO.pequeno},
    acciones:{flexDirection:'row',gap:ESPACIADO.pequeno},
    accion:{flex:1,minWidth:0},
  });
}
