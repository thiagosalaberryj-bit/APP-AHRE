import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {Tema} from '../styles/colors';
import {crearEstilosGlobales} from '../styles/globalStyles';
import crearEstilosEncabezado from '../styles/CollapsibleSectionHeaderStyles';

interface PropiedadesEncabezadoPlegable {
  tema:Tema;
  titulo:string;
  resumen?:string;
  expandido:boolean;
  alAlternar:()=>void;
}

export default function EncabezadoSeccionPlegable({tema,titulo,resumen,expandido,alAlternar}:PropiedadesEncabezadoPlegable){
  const estilos=crearEstilosEncabezado();
  const globales=crearEstilosGlobales(tema);
  return <Pressable accessibilityRole="button" accessibilityLabel={titulo} accessibilityState={{expanded:expandido}} onPress={alAlternar} style={estilos.encabezado}>
    <View style={estilos.textoFlexible}>
      <Text style={globales.encabezadoSeccion}>{titulo}</Text>
      {resumen?<Text style={globales.textoSecundario}>{resumen}</Text>:null}
    </View>
    <Ionicons color={tema.foco} name={expandido?'chevron-up':'chevron-down'} size={22}/>
  </Pressable>;
}
