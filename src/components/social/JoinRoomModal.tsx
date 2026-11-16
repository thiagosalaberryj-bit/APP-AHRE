import { useContext,useEffect } from 'react';
import {obtenerSesionActual} from '../../authentication/sessionService';
import {leerDatosOnline,observarSocialOnline} from '../../social/socialService';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useErrorNotificado } from '../../hooks/useErrorNotice';
import {mensajeErrorSocial} from '../../social/socialHelpers';
import Campo from './SocialTextField';
import BotonSocial from './SocialButton';
import {solicitarIngresoSala,obtenerSalaOnline,sincronizarSocialOnline} from '../../social/socialService';
import {useRef,useState} from 'react';
import {ActivityIndicator,Keyboard,Pressable,Text,TextInput,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useDatosSociales} from '../../social/SocialDataContext';
import {aceptarInvitacionOnline} from '../../social/socialService';
import {URL_SERVIDOR} from '../../sync/remote';
import {leerEnlaceInvitacion} from '../../social/online/invitationLink';
import type {AspectoSocial} from '../../social/types';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';
import DialogoInvitacion from './InvitationDialog';
import SelectorSegmentado from '../SegmentedSelector';

export default function UnirseSala({alUnirse,alCerrar,enlaceInicial='',...aspecto}:AspectoSocial&{alUnirse:(salaId:string)=>void;alCerrar:()=>void;enlaceInicial?:string}){
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [metodo,cambiarMetodo]=useState('enlace'),[enlace,cambiarEnlace]=useState(enlaceInicial),[, cambiarError]=useErrorNotificado('');
  const [identidad,cambiarIdentidad]=useState('Tu cuenta de AHRE'),[contrasena,cambiarContrasena]=useState(''),[solicitudId,cambiarSolicitudId]=useState(''),[estadoIngreso,cambiarEstadoIngreso]=useState(''),[errorContrasena,cambiarErrorContrasena]=useState('');
  const social=useDatosSociales(),demo=social.salas.some(s=>s.demo);
  useEffect(()=>{let vigente=true;void obtenerSesionActual().then(({usuario})=>{if(vigente&&usuario)cambiarIdentidad([usuario.nombre,usuario.apellido].filter(Boolean).join(' '));}).catch(()=>{});return()=>{vigente=false;};},[]);
  useEffect(()=>{if(!solicitudId)return;let vigente=true;const cargar=()=>{void leerDatosOnline<{id:string;estado:string;salaId:string}[]>(social.usuarioId,'ingresos',[]).then(ingresos=>{const ingreso=ingresos.find(i=>i.id===solicitudId);if(!vigente||!ingreso)return;cambiarEstadoIngreso(ingreso.estado);if(ingreso.estado==='aceptada'){alCerrar();alUnirse(ingreso.salaId);mostrarAviso('Aceptaron tu ingreso a la sala.',{tipo:'exito'});}}).catch(()=>{});};cargar();const dejar=observarSocialOnline(cargar);return()=>{vigente=false;dejar();};},[social.usuarioId,solicitudId]);
  const leer=(texto:string)=>leerEnlaceInvitacion(texto,URL_SERVIDOR)||(demo?leerEnlaceInvitacion(texto,'https://demo.ahre.test'):null);
  const esGlobal=!!leer(enlace)?.global;
  const ocupado=useRef(false),[cargando,cambiarCargando]=useState(false),estilos=crearEstilosSocialOnline(aspecto.tema);
  const cerrar=()=>{if(ocupado.current)return;Keyboard.dismiss();alCerrar();cambiarMetodo('enlace');};
  const aceptar=async(texto:string)=>{
    if(ocupado.current)return;
    cambiarMetodo('enlace');cambiarEnlace(texto);cambiarError('');Keyboard.dismiss();
    const datos=leer(texto);
    if(!datos){cambiarError('Este enlace o QR no es una invitación válida de AHRE.');return;}
    if(datos.global&&!contrasena){cambiarErrorContrasena('Ingresá la contraseña de la sala.');if(metodo==='qr')mostrarAviso('QR reconocido. Ingresá la contraseña de la sala.',{tipo:'informacion'});return;}
    ocupado.current=true;cambiarCargando(true);
    try{const resultado=datos.global?await solicitarIngresoSala(datos.token,'',contrasena):await aceptarInvitacionOnline(datos.token,datos.canje);if('estado' in resultado&&resultado.estado!=='aceptada'){cambiarEstadoIngreso(String(resultado.estado));cambiarSolicitudId('id' in resultado&&typeof resultado.id==='string'?resultado.id:'');mostrarAviso('Solicitud enviada. El administrador debe aprobarla.',{tipo:'exito'});return;}await social.recargar();alCerrar();cambiarEnlace('');alUnirse(resultado.salaId);mostrarAviso('Ya ingresaste a la sala.',{tipo:'exito'});}
    catch(fallo){const mensaje=mensajeErrorSocial(fallo,'No se pudo aceptar la invitación.');if(/contraseña/i.test(mensaje))cambiarErrorContrasena(mensaje);else cambiarError(mensaje);}
    finally{ocupado.current=false;cambiarCargando(false);}
  };
  const Escaner=metodo==='qr'?require('./InvitationScanner').default:null;
  return <>
    <DialogoInvitacion {...aspecto} titulo="Unirme a una sala" descripcion="Ingresá con el enlace o QR de la sala" icono="people-outline" alCerrar={cerrar} ocupado={cargando} pie={metodo==='enlace'?<Pressable accessibilityRole="button" disabled={cargando||!enlace.trim()||estadoIngreso==='pendiente'} onPress={()=>{void aceptar(enlace);}} style={[estilos.principal,(cargando||!enlace.trim()||estadoIngreso==='pendiente')&&estilos.deshabilitado]}>{cargando?<ActivityIndicator color={aspecto.tema.botonPrincipalTexto}/>:<Ionicons name="enter-outline" size={20} color={aspecto.tema.botonPrincipalTexto}/>}<Text style={estilos.textoPrincipal}>{cargando?'Enviando…':estadoIngreso==='pendiente'?'Solicitud enviada':esGlobal?'Entrar a la sala':'Aceptar invitación'}</Text></Pressable>:null}>
      <View pointerEvents={cargando?'none':'auto'}><SelectorSegmentado tema={aspecto.tema} opciones={[{id:'enlace',nombre:'Pegar enlace'},{id:'qr',nombre:'Escanear QR'}]} valor={metodo} alSeleccionar={valor=>{Keyboard.dismiss();cambiarError('');cambiarMetodo(valor);}} etiqueta="Forma de unirme"/></View>
      {metodo==='enlace'?<View style={estilos.grupo}>
        <Text style={aspecto.estilosGlobales.etiqueta}>Enlace de invitación</Text>
        <View style={estilos.enlaceCampo}><Ionicons name="link-outline" size={21} color={aspecto.tema.foco}/><TextInput accessibilityLabel="Enlace de invitación" placeholder="Pegá el enlace que recibiste" placeholderTextColor={aspecto.tema.textoSecundario} autoCapitalize="none" autoCorrect={false} value={enlace} onChangeText={valor=>{cambiarEnlace(valor);cambiarError('');}} style={estilos.enlaceTexto} editable={!cargando}/>{enlace?<Pressable accessibilityRole="button" accessibilityLabel="Limpiar enlace" disabled={cargando} onPress={()=>cambiarEnlace('')} style={estilos.cerrar}><Ionicons name="close-circle-outline" size={20} color={aspecto.tema.textoSecundario}/></Pressable>:null}</View>
      </View>:Escaner?<Escaner {...aspecto} alLeer={(texto:string)=>{void aceptar(texto);}}/>:null}
      {esGlobal?<><Text style={aspecto.estilosGlobales.textoSecundario}>Entrás como {identidad}</Text><Campo secreto etiqueta="Contraseña de la sala" error={errorContrasena} valor={contrasena} alCambiar={valor=>{cambiarContrasena(valor);cambiarErrorContrasena('');}} {...aspecto}/></>:null}
      {estadoIngreso==='pendiente'||estadoIngreso==='rechazada'?<View style={estilos.ayudaFila}><Ionicons name={estadoIngreso==='pendiente'?'time-outline':'close-circle-outline'} size={22} color={aspecto.tema.foco}/><Text style={estilos.ayudaTexto}>{estadoIngreso==='pendiente'?'Esperando aprobación del administrador. Te avisaremos cuando responda.':'El administrador rechazó tu ingreso. Podés enviar una nueva solicitud.'}</Text></View>:null}
      {demo?<BotonSocial secundario texto="Usar sala demo como participante" deshabilitado={cargando} alPresionar={()=>{void (async()=>{try{await sincronizarSocialOnline();const sala=social.salas.find(s=>s.demo&&s.online&&!s.administrador&&s.estado==='abierta');if(!sala)throw Error('No hay una sala demo abierta como participante.');const detalle=await obtenerSalaOnline(sala.id);if(!detalle.acceso)throw Error('No se pudo preparar el enlace demo.');cambiarEnlace('https://demo.ahre.test/invitacion/#sala='+detalle.acceso.codigo);cambiarContrasena('ahre1234');cambiarMetodo('enlace');cambiarError('');}catch(e){cambiarError(mensajeErrorSocial(e,'No se pudo preparar la demo.'));}})();}} {...aspecto}/>:null}

      <View style={estilos.ayudaFila}><Ionicons name="information-circle-outline" size={18} color={aspecto.tema.textoSecundario}/><Text style={estilos.ayudaTexto}>{metodo==='enlace'?'Pedile tu enlace al administrador de la sala y pegalo acá.':'Apuntá al QR que te muestre el administrador. Entrarás con tu cuenta de AHRE.'}</Text></View>

    </DialogoInvitacion>
  </>;
}
