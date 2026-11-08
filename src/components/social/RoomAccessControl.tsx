import Conmutador from '../Toggle';
import {mensajeErrorSocial} from '../../social/socialHelpers';
import {useRef,useState} from 'react';
import {ActivityIndicator,Text,View} from 'react-native';
import type {AspectoSocial,SalaVista} from '../../social/types';
import {publicarSalaOnline,configurarAccesoSala,enlaceGlobalSala} from '../../social/socialService';
import useSalaOnline from '../../social/online/useRoomOnline';
import {useDatosSociales} from '../../social/SocialDataContext';
import Dialogo from './InvitationDialog';
import Campo from './SocialTextField';
import BotonSocial from './SocialButton';
import Compartir from './ShareInvitationModal';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function AccesoSala({sala,...aspecto}:AspectoSocial&{sala:SalaVista}){
  const detalle=useSalaOnline(sala.id,sala.online),social=useDatosSociales(),estilos=crearEstilosCompartidos(aspecto.tema);
  const [abierto,abrir]=useState(false),[configurando,configurar]=useState(false),[clave,cambiarClave]=useState(''),[error,cambiarError]=useState(''),[ocupado,cambiarOcupado]=useState(false),bloqueo=useRef(false);
  const ejecutar=async(opciones:{renovar?:boolean;habilitado?:boolean}={})=>{
    if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);cambiarError('');
    try{if(!sala.online)await publicarSalaOnline(sala.id);await configurarAccesoSala(sala.id,opciones.habilitado!==undefined||opciones.renovar?'':clave,opciones);if(opciones.habilitado===undefined)cambiarClave('');if(opciones.habilitado===undefined)configurar(false);await social.recargar();}
    catch(e){cambiarError(mensajeErrorSocial(e,'No se pudo configurar el acceso.'));}
    finally{bloqueo.current=false;cambiarOcupado(false);}
  };
  if(!sala.administrador||sala.estado==='cerrada')return null;
  return <>
    <BotonSocial secundario texto="Compartir sala" alPresionar={()=>{cambiarError('');abrir(true);}} {...aspecto}/>
    {abierto&&detalle?.acceso&&!configurando?<Compartir {...aspecto} global enlace={sala.demo?'https://demo.ahre.test/invitacion/#sala='+detalle.acceso.codigo:enlaceGlobalSala(detalle.acceso.codigo)} nombre={sala.nombre} alConfigurar={()=>configurar(true)} alCerrar={()=>abrir(false)}/>:abierto?<Dialogo {...aspecto} titulo="Acceso a la sala" descripcion={sala.demo?'Simulación local: no usa el servidor':'Un enlace y QR para toda la sala'} icono="lock-closed-outline" ocupado={ocupado} alCerrar={()=>{abrir(false);configurar(false);}}>
      <Campo secreto etiqueta={detalle?.acceso?'Nueva contraseña (opcional)':'Contraseña de la sala'} valor={clave} alCambiar={cambiarClave} limite={128} {...aspecto}/>
      <Text style={aspecto.estilosGlobales.textoAyuda}>Usá al menos 8 caracteres. Cada persona necesita esta contraseña y tu aprobación para entrar.</Text>
      {ocupado?<View style={estilos.grupoCampo}><ActivityIndicator color={aspecto.tema.foco}/><Text style={aspecto.estilosGlobales.textoAyuda}>Guardando acceso…</Text></View>:null}
      {error?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
      {detalle?.acceso?<View style={estilos.filaCampos}><View style={estilos.textoFlexible}><Text style={aspecto.estilosGlobales.etiqueta}>Permitir ingresos</Text><Text style={aspecto.estilosGlobales.textoAyuda}>{detalle.acceso.habilitado?'Se pueden solicitar nuevos ingresos':'Los nuevos ingresos están pausados'}</Text></View><View pointerEvents={ocupado?'none':'auto'}><Conmutador tema={aspecto.tema} valor={!!detalle.acceso.habilitado} etiquetaAccesibilidad="Permitir ingresos" alCambiar={habilitado=>{if(!ocupado)void ejecutar({habilitado});}}/></View></View>:null}
      <View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial texto="Guardar" deshabilitado={ocupado||(!detalle?.acceso&&clave.length<8)||!!clave&&clave.length<8} alPresionar={()=>{void ejecutar();}} {...aspecto}/></View>
      {detalle?.acceso?<View style={estilos.columnaCampo}><BotonSocial secundario texto="Renovar enlace" deshabilitado={ocupado} alPresionar={()=>{void ejecutar({renovar:true});}} {...aspecto}/></View>:null}</View>
    </Dialogo>:null}
  </>;
}
