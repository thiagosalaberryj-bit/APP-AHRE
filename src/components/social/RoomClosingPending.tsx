import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial} from '../../social/types';
import type {RespuestaSala} from '../../social/online/types';
import crearEstilos from '../../styles/social/CloseRoomFormStyles';
import {gastoDePendiente} from '../../social/roomClosing';
export default function PendientesCierre({pendientes,personaPropiaId,gastos=[],alAbrirGasto,...aspecto}:AspectoSocial&{pendientes:NonNullable<RespuestaSala['pendientesCierre']>;personaPropiaId?:string;gastos?:{id:string}[];alAbrirGasto?:(id:string)=>void}){
 const estilos=crearEstilos(aspecto.tema),grupos=new Map<string,{nombre:string;tareas:typeof pendientes}>();
 for(const p of pendientes){const grupo=grupos.get(p.personaId)||{nombre:p.nombre,tareas:[]};grupo.tareas.push(p);grupos.set(p.personaId,grupo);}
 if(!grupos.size)return null;
 return <View style={estilos.listaPendientes}><View style={estilos.encabezadoPendientes}><Ionicons name="time-outline" size={22} color={aspecto.tema.foco}/><Text accessibilityRole="header" style={aspecto.estilosGlobales.etiqueta}>Pendientes para cerrar</Text></View><Text style={aspecto.estilosGlobales.textoAyuda}>Cada cuenta debe registrar sus gastos y pagos. Falta lo siguiente:</Text>
 {[...grupos].map(([id,g],indice)=><View key={id} style={[estilos.pendienteCierre,indice>0&&estilos.separadorPersona]}><Text style={aspecto.estilosGlobales.etiqueta}>{g.nombre}</Text>{g.tareas.map((p,i)=>{
  const gastoId=p.personaId===personaPropiaId?gastoDePendiente(p.clave,gastos):undefined;
  return gastoId&&alAbrirGasto?<Pressable android_ripple={RETROALIMENTACION_PULSACION} key={i} accessibilityRole="button" accessibilityLabel={'Registrar '+p.descripcion} accessibilityHint="Abre el gasto para completar tu registro." onPress={conRespuestaVisual(()=>alAbrirGasto(gastoId))} style={estilos.accesoPendiente}><Text style={[aspecto.estilosGlobales.textoSecundario,estilos.textoPendiente]}>{p.descripcion}</Text><Ionicons name="chevron-forward" size={20} color={aspecto.tema.foco}/></Pressable>:<Text key={i} style={aspecto.estilosGlobales.textoSecundario}>{'• '+p.descripcion}</Text>;
 })}</View>)}</View>;
}
