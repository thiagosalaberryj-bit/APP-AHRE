import {operacionFinancieraEnCurso} from '../../social/financialOperation';
import type {ReactNode} from 'react';
import {KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial} from '../../social/types';
import type {NombreIcono} from '../../constants/movimientos';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';
import {ESPACIADO} from '../../styles/globalStyles';

export default function DialogoInvitacion({titulo,descripcion,icono,alCerrar,etiquetaCerrar='Cerrar invitación',ocupado=false,pie,children,...aspecto}:AspectoSocial&{
  titulo:string;descripcion:string;icono:NombreIcono;alCerrar:()=>void;etiquetaCerrar?:string;ocupado?:boolean;pie?:ReactNode;children:ReactNode;
}){
  const estilos=crearEstilosSocialOnline(aspecto.tema),bordes=useSafeAreaInsets();
  return <Modal transparent statusBarTranslucent navigationBarTranslucent animationType="fade" visible onRequestClose={()=>!ocupado&&!operacionFinancieraEnCurso()&&alCerrar()}>
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={[estilos.fondo,{paddingTop:Math.max(ESPACIADO.grande,bordes.top),paddingBottom:Math.max(ESPACIADO.grande,bordes.bottom)}]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar tocando fuera del modal" disabled={ocupado} onPress={()=>{if(!ocupado&&!operacionFinancieraEnCurso())alCerrar();}} style={estilos.fondoCerrar}/>
      <View accessibilityViewIsModal style={[estilos.modal,estilos.dialogo]}>
        <View style={estilos.cabeceraInvitacion}>
          <View style={estilos.iconoCabecera}><Ionicons name={icono} size={24} color={aspecto.tema.foco}/></View>
          <View style={estilos.flexible}><Text accessibilityRole="header" style={estilos.tituloInvitacion}>{titulo}</Text><Text style={estilos.descripcionInvitacion}>{descripcion}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={etiquetaCerrar} disabled={ocupado} onPress={()=>{if(!ocupado&&!operacionFinancieraEnCurso())alCerrar();}} style={estilos.cerrar}><Ionicons name="close" size={22} color={aspecto.tema.textoSecundario}/></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={estilos.cuerpoInvitacion} contentContainerStyle={estilos.contenidoInvitacion}>{children}</ScrollView>
        {pie?<View style={estilos.pieInvitacion}>{pie}</View>:null}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
