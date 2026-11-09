import BotonSocial from './SocialButton';
import {useMemo,useRef,useState} from 'react';
import {Pressable,Share,Text,TextInput,useWindowDimensions,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import Svg,{Path,Rect} from 'react-native-svg';
import {setStringAsync} from 'expo-clipboard';
import type {AspectoSocial} from '../../social/types';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';
import DialogoInvitacion from './InvitationDialog';
// El núcleo no necesita canvas, DOM ni servicios externos.
const {create}=require('qrcode/lib/core/qrcode') as Pick<typeof import('qrcode'),'create'>;

export default function CompartirInvitacion({enlace,nombre,alCerrar,global:esGlobal=false,alConfigurar,...aspecto}:AspectoSocial&{enlace:string;nombre:string;alCerrar:()=>void;global?:boolean;alConfigurar?:()=>void}){
  const estilos=crearEstilosSocialOnline(aspecto.tema),{width}=useWindowDimensions();
  const [error,cambiarError]=useState(''),[compartiendo,cambiarCompartiendo]=useState(false),enCurso=useRef(false);
  const [copiado,cambiarCopiado]=useState(false),[copiando,cambiarCopiando]=useState(false);
  const copiar=async()=>{
    if(enCurso.current)return;enCurso.current=true;cambiarCopiando(true);cambiarError('');cambiarCopiado(false);
    try{const resultado=await setStringAsync(enlace);if(!resultado)throw new Error('copia_no_disponible');cambiarCopiado(true);}
    catch{cambiarError('No se pudo copiar el enlace. Reintentá o compartilo por una app.');}
    finally{enCurso.current=false;cambiarCopiando(false);}
  };
  const compartir=async()=>{
    if(enCurso.current)return;enCurso.current=true;cambiarCompartiendo(true);cambiarError('');
    try{await Share.share({title:'Invitación a AHRE',message:(esGlobal?'Te invito a la sala '+nombre+'. Pedime la contraseña para solicitar acceso. ': 'Te invito a mi sala de AHRE como '+nombre+'. ')+enlace});}
    catch{cambiarError('No se pudo abrir el menú para compartir. Podés copiar el enlace.');}
    finally{enCurso.current=false;cambiarCompartiendo(false);}
  };
  const qr=useMemo(()=>{const matriz=create(enlace,{errorCorrectionLevel:'M'}).modules;let trazado='';for(let y=0;y<matriz.size;y++)for(let x=0;x<matriz.size;x++)if(matriz.get(y,x))trazado+='M'+(x+4)+' '+(y+4)+'h1v1h-1z';return {trazado,tamano:matriz.size+8};},[enlace]);
  const lado=Math.max(120,Math.min(190,width-112));
  return <DialogoInvitacion {...aspecto} titulo={esGlobal?'Compartir '+nombre:'Invitar a '+nombre} descripcion={esGlobal?'Un mismo enlace y QR para todas las personas':'Un enlace personal para esta sala'} icono="person-add-outline" alCerrar={alCerrar} ocupado={compartiendo||copiando} pie={<Pressable accessibilityRole="button" disabled={compartiendo||copiando} onPress={()=>{void compartir();}} style={[estilos.principal,(compartiendo||copiando)&&estilos.deshabilitado]}><Ionicons name="share-social-outline" size={21} color={aspecto.tema.botonPrincipalTexto}/><Text style={estilos.textoPrincipal}>{compartiendo?'Abriendo…':'Compartir por una app'}</Text></Pressable>}>
    <View style={estilos.grupo}>
      <Text style={aspecto.estilosGlobales.etiqueta}>Enlace de invitación</Text>
      <View style={estilos.enlaceCampo}><Ionicons name="link-outline" size={21} color={aspecto.tema.foco}/><TextInput accessibilityLabel="Enlace personal para compartir" value={enlace} editable={false} multiline={false} numberOfLines={1} style={estilos.enlaceTexto}/><Pressable accessibilityRole="button" accessibilityLabel="Copiar enlace de invitación" accessibilityHint="Copia el enlace completo al portapapeles." disabled={copiando||compartiendo} onPress={()=>{void copiar();}} style={[estilos.accionCopiar,(copiando||compartiendo)&&estilos.deshabilitado]}><Ionicons name={copiado?'checkmark-outline':'copy-outline'} size={21} color={aspecto.tema.foco}/></Pressable></View>
      {copiado?<Text accessibilityLiveRegion="polite" style={aspecto.estilosGlobales.textoAyuda}>Enlace copiado</Text>:null}
    </View>
    <View style={estilos.qrCentrado}>
      <View style={estilos.qr} accessible accessibilityLabel={'QR de invitación para '+nombre}><Svg width={lado} height={lado} viewBox={'0 0 '+qr.tamano+' '+qr.tamano}><Rect width={qr.tamano} height={qr.tamano} fill="#FFFFFF"/><Path d={qr.trazado} fill="#000000"/></Svg></View>
      <Text style={aspecto.estilosGlobales.textoAyuda}>También puede escanear este QR</Text>
    </View>
    <View style={estilos.ayudaFila}><Ionicons name="globe-outline" size={18} color={aspecto.tema.textoSecundario}/><Text style={estilos.ayudaTexto}>El enlace abre la web sin instalar AHRE. Desde ahí puede entrar como invitado o abrir la app.</Text></View>
    <View style={estilos.ayudaFila}><Ionicons name="time-outline" size={18} color={aspecto.tema.textoSecundario}/><Text style={estilos.ayudaTexto}>{esGlobal?'El enlace se conserva hasta que lo renueves. Cada ingreso requiere contraseña y aprobación.':'Válido por 7 días y para una persona. Generar otro enlace reemplaza el anterior.'}</Text></View>
    {alConfigurar?<BotonSocial secundario texto="Opciones de acceso" alPresionar={alConfigurar} {...aspecto}/>:null}
    {error?<Text accessibilityRole="alert" style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
  </DialogoInvitacion>;
}
