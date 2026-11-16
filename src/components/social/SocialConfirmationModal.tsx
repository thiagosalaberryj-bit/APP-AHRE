import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import { AvisosEnModal } from '../../contexts/ToastContext';
import { Modal, Pressable, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function ModalConfirmacionSocial({ titulo, descripcion, textoConfirmar, elementos, peligro = false, alCerrar, alConfirmar, cargando=false, completado=false, ...aspecto }: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & (import('../../social/types').ConfirmacionSocial & {elementos?:string[];peligro?:boolean;cargando?:boolean;completado?:boolean;alCerrar:()=>void;alConfirmar:()=>void})) {
  const { tema, estilosGlobales } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  return <Modal transparent animationType="fade" visible onRequestClose={()=>{if(!cargando)alCerrar();}}><AvisosEnModal>
    <View style={estilos.fondoModal}>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver sin confirmar" disabled={cargando} onPress={alCerrar} style={estilos.cierreFondo} />
      <View accessibilityViewIsModal style={estilos.tarjetaModal}>
        <View style={estilos.filaModal}>
          <Text accessibilityRole="header" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>{titulo}</Text>
          <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Cerrar confirmación" disabled={cargando} onPress={conRespuestaVisual(alCerrar)} style={estilos.botonCerrar}><Ionicons color={tema.textoSecundario} name="close" size={24} /></Pressable>
        </View>
        <Text style={estilosGlobales.texto}>{descripcion}</Text>{elementos?.length?<ScrollView style={{maxHeight:240}}>{elementos.map((texto,i)=><Text key={i} style={estilosGlobales.texto}>{"• "+texto}</Text>)}</ScrollView>:null}
        <BotonSocial cargando={cargando} completado={completado} texto={textoConfirmar} peligro={peligro} alPresionar={alConfirmar} {...aspecto} />
      </View>
    </View>
  </AvisosEnModal></Modal>;
}
