import AvisoFormulario from '../FormNotice';
import {useAccionConfirmada} from '../../hooks/useConfirmedAction';
import { useContext } from 'react';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useErrorNotificado } from '../../hooks/useErrorNotice';
import Conmutador from '../Toggle';
import {mensajeErrorSocial} from '../../social/socialHelpers';
import {useRef,useState} from 'react';
import { Modal, Text, View } from 'react-native';
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
 const respuesta=useAccionConfirmada();
  const { mostrarAviso } = useContext(ContextoAvisos);
  const detalle=useSalaOnline(sala.id,sala.online),social=useDatosSociales(),estilos=crearEstilosCompartidos(aspecto.tema);
  const [errorClave,cambiarErrorClave]=useState('');
  const [abierto,abrir]=useState(false),[configurando,configurar]=useState(false),[clave,cambiarClave]=useState(''),[, cambiarError]=useErrorNotificado(''),[ocupado,cambiarOcupado]=useState(false),bloqueo=useRef(false);
  const ejecutar=async(opciones:{renovar?:boolean;habilitado?:boolean}={})=>{
    if(bloqueo.current)return;const invalida=opciones.habilitado===undefined&&!opciones.renovar&&(!detalle?.acceso||clave.length>0)&&clave.length<8;cambiarErrorClave(invalida?'La contraseña requiere al menos 8 caracteres.':'');if(invalida)return;bloqueo.current=true;cambiarOcupado(true);cambiarError('');
    try{
      const guardarAcceso=async()=>{if(!sala.online)await publicarSalaOnline(sala.id);await configurarAccesoSala(sala.id,opciones.habilitado!==undefined||opciones.renovar?'':clave,opciones);await social.recargar();};
      const alExito=()=>{if(opciones.habilitado===undefined){cambiarClave('');configurar(false);}mostrarAviso(opciones.renovar?'Enlace de la sala renovado.':opciones.habilitado===true?'Ingresos a la sala habilitados.':opciones.habilitado===false?'Ingresos a la sala pausados.':'Acceso a la sala guardado.',{tipo:'exito'});};
      if(opciones.habilitado!==undefined){await guardarAcceso();alExito();}
      else await respuesta.ejecutar(guardarAcceso,alExito,opciones.renovar?'renovar':'guardar');
    }
    catch(e){cambiarError(mensajeErrorSocial(e,'No se pudo configurar el acceso.'));}
    finally{bloqueo.current=false;cambiarOcupado(false);}
  };
  if(!sala.administrador||sala.estado==='cerrada')return null;
  return <>
    <BotonSocial secundario texto="Compartir sala" alPresionar={()=>{cambiarError('');abrir(true);}} {...aspecto}/>
    {abierto?<Modal statusBarTranslucent navigationBarTranslucent transparent animationType="fade" visible onRequestClose={()=>{if(!bloqueo.current)abrir(false);}}>
    {detalle?.acceso&&!configurando?<Compartir sinVentana {...aspecto} global enlace={sala.demo?'https://demo.ahre.test/invitacion/#sala='+detalle.acceso.codigo:enlaceGlobalSala(detalle.acceso.codigo)} nombre={sala.nombre} alConfigurar={()=>configurar(true)} alCerrar={()=>abrir(false)}/>:<Dialogo sinVentana {...aspecto} titulo="Acceso a la sala" descripcion={sala.demo?'Simulación local: no usa el servidor':'Un enlace y QR para toda la sala'} icono="lock-closed-outline" ocupado={ocupado} alCerrar={()=>{abrir(false);configurar(false);}}>
      <Campo secreto etiqueta={detalle?.acceso?'Nueva contraseña (opcional)':'Contraseña de la sala'} valor={clave} error={errorClave} alCambiar={cambiarClave} limite={128} {...aspecto}/>
      <AvisoFormulario tema={aspecto.tema}>Usá al menos 8 caracteres. Cada persona necesita esta contraseña y tu aprobación para entrar.</AvisoFormulario>

      {detalle?.acceso?<View style={estilos.filaCampos}><View style={estilos.textoFlexible}><Text style={aspecto.estilosGlobales.etiqueta}>Permitir ingresos</Text><AvisoFormulario tema={aspecto.tema}>{detalle.acceso.habilitado?'Se pueden solicitar nuevos ingresos':'Los nuevos ingresos están pausados'}</AvisoFormulario></View><View collapsable={false} pointerEvents={ocupado?'none':'auto'}><Conmutador tema={aspecto.tema} valor={!!detalle.acceso.habilitado} etiquetaAccesibilidad="Permitir ingresos" alCambiar={habilitado=>{if(!ocupado)void ejecutar({habilitado});}}/></View></View>:null}
      <View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial cargando={respuesta.accionActiva==='guardar'} completado={respuesta.completado&&respuesta.accionActiva==='guardar'} texto="Guardar" deshabilitado={ocupado} alPresionar={()=>ejecutar()} {...aspecto}/></View>
      {detalle?.acceso?<View style={estilos.columnaCampo}><BotonSocial cargando={respuesta.accionActiva==='renovar'} completado={respuesta.completado&&respuesta.accionActiva==='renovar'} secundario texto="Renovar enlace" deshabilitado={ocupado} alPresionar={()=>ejecutar({renovar:true})} {...aspecto}/></View>:null}</View>
    </Dialogo>}
    </Modal>:null}
  </>;
}
