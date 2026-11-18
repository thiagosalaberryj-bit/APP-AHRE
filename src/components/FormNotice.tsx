import type {ReactNode} from 'react';
import {useState} from 'react';
import {Modal,Pressable,ScrollView,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {Tema} from '../styles/colors';
import {crearEstilosGlobales,RETROALIMENTACION_PULSACION} from '../styles/globalStyles';

/** Ayuda bajo demanda, sin desplazar ni reemplazar el formulario que se consulta. */
export default function AvisoFormulario({tema,titulo='Información del formulario',children}:{tema:Tema;titulo?:string;children:ReactNode}){
 const estilos=crearEstilosGlobales(tema),[abierto,cambiarAbierto]=useState(false);
 const color=tema.nombre==='oscuro'?tema.botonPrincipal:tema.botonPrincipalTexto;
 const cerrar=()=>cambiarAbierto(false);
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel={titulo} accessibilityHint="Abre la explicación completa" accessibilityState={{expanded:abierto}} android_ripple={RETROALIMENTACION_PULSACION} onPress={()=>cambiarAbierto(true)} style={({pressed})=>[estilos.avisoFormulario,pressed&&estilos.botonPresionado]}>
   <Ionicons accessible={false} name="information-circle-outline" size={21} color={color}/>
   <Text style={[estilos.avisoFormularioTitulo,{color}]}>{titulo}</Text>
   <Ionicons accessible={false} name="chevron-forward" size={18} color={tema.textoSecundario}/>
  </Pressable>
  {abierto?<Modal transparent animationType="fade" visible onRequestClose={cerrar}>
   <View style={estilos.avisoFormularioFondo}>
    <Pressable accessibilityRole="button" accessibilityLabel="Cerrar información tocando fuera" onPress={cerrar} style={estilos.avisoFormularioCierre}/>
    <View collapsable={false} accessibilityViewIsModal style={estilos.avisoFormularioModal}>
     <View style={estilos.avisoFormularioCabecera}>
      <Ionicons accessible={false} name="information-circle-outline" size={24} color={color}/>
      <Text accessibilityRole="header" style={[estilos.avisoFormularioTitulo,{color}]}>{titulo}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar información" android_ripple={RETROALIMENTACION_PULSACION} onPress={cerrar} style={estilos.avisoFormularioBotonCerrar}><Ionicons accessible={false} name="close" size={24} color={tema.textoSecundario}/></Pressable>
     </View>
     <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={estilos.avisoFormularioDetalle}>
      <Text style={estilos.avisoFormularioTexto}>{children}</Text>
     </ScrollView>
    </View>
   </View>
  </Modal>:null}
 </>;
}
