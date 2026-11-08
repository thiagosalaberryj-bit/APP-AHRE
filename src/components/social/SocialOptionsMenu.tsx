import {Modal,Pressable,ScrollView,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import type {Tema} from '../../styles/colors';
import type {NombreIcono} from '../../constants/movimientos';
import {ESPACIADO} from '../../styles/globalStyles';
import crearEstilosMenuSocial from '../../styles/social/SocialOptionsMenuStyles';

export interface OpcionMenuSocial {
  id:string;texto:string;descripcion:string;icono:NombreIcono;peligro?:boolean;deshabilitada?:boolean;alElegir:()=>void;
}

export default function MenuOpcionesSocial({tema,titulo,descripcion,opciones,alCerrar}: {
  tema:Tema;titulo:string;descripcion:string;opciones:OpcionMenuSocial[];alCerrar:()=>void;
}){
  const estilos=crearEstilosMenuSocial(tema),bordes=useSafeAreaInsets();
  return <Modal transparent animationType="fade" visible onRequestClose={alCerrar}>
    <View style={[estilos.fondo,{paddingTop:Math.max(bordes.top,ESPACIADO.pantalla),paddingBottom:Math.max(bordes.bottom,ESPACIADO.pantalla)}]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones tocando fuera" onPress={alCerrar} style={estilos.cierre}/>
      <View accessibilityViewIsModal style={estilos.tarjeta}>
        <View style={estilos.cabecera}>
          <View style={estilos.detalle}><Text accessibilityRole="header" style={estilos.titulo}>{titulo}</Text><Text style={estilos.descripcion}>{descripcion}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar opciones" onPress={alCerrar} style={estilos.cerrar}><Ionicons name="close" size={22} color={tema.textoSecundario}/></Pressable>
        </View>
        <ScrollView>
          {opciones.map((opcion,indice)=><View key={opcion.id}>
            {indice>0?<View style={estilos.separador}/>:null}
            <Pressable accessibilityRole="button" accessibilityLabel={opcion.texto} accessibilityHint={opcion.descripcion} accessibilityState={{disabled:!!opcion.deshabilitada}} disabled={opcion.deshabilitada} onPress={opcion.alElegir} style={({pressed})=>[estilos.opcion,pressed&&estilos.presionada,opcion.deshabilitada&&estilos.deshabilitada]}>
              <View style={[estilos.icono,opcion.peligro&&estilos.peligro]}><Ionicons name={opcion.icono} size={21} color={opcion.peligro?tema.error:tema.foco}/></View>
              <View style={estilos.detalle}><Text style={[estilos.tituloOpcion,opcion.peligro&&estilos.textoPeligro]}>{opcion.texto}</Text><Text style={estilos.descripcion}>{opcion.descripcion}</Text></View>
              <Ionicons name="chevron-forward" size={20} color={tema.textoSecundario}/>
            </Pressable>
          </View>)}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
