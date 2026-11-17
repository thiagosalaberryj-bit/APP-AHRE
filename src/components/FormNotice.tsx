import type {ReactNode} from 'react';
import {Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {Tema} from '../styles/colors';
import {crearEstilosGlobales} from '../styles/globalStyles';

/** Ayuda de formulario: icono reconocible y texto legible, sin tarjeta adicional. */
export default function AvisoFormulario({tema,titulo,children}:{tema:Tema;titulo?:string;children:ReactNode}){
 const estilos=crearEstilosGlobales(tema);
 return <View style={estilos.avisoFormulario}>
  <Ionicons accessible={false} name="information-circle-outline" size={20} color={tema.textoSecundario} style={estilos.avisoFormularioIcono}/>
  <Text style={estilos.avisoFormularioTexto}>{titulo?<Text style={estilos.avisoFormularioTitulo}>{titulo+'\n'}</Text>:null}{children}</Text>
 </View>;
}
