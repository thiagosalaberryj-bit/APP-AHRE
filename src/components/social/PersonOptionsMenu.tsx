import {operacionFinancieraEnCurso} from '../../social/financialOperation';
import {useAccionConfirmada} from '../../hooks/useConfirmedAction';
import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import {useContext,useRef,useState} from 'react';
import {Modal,Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {VinculoOnline} from '../../social/online/types';
import ModalVinculoCuenta from './PersonAccountLink';
import type {AspectoSocial,PersonaVista} from '../../social/types';
import {ContextoAvisos} from '../../contexts/ToastContext';
import {useDatosSociales} from '../../social/SocialDataContext';
import {cambiarActividadPersona} from '../../social/socialService';
import {crearEstilosDetalleSocial} from '../../styles/social/SocialDetailStyles';
import MenuOpcionesSocial from './SocialOptionsMenu';
import ModalConfirmacionSocial from './SocialConfirmationModal';

export default function OpcionesPersona({persona,alEditar,vinculo,sinConexion,...aspecto}:AspectoSocial&{persona:PersonaVista;alEditar:()=>void;vinculo?:VinculoOnline;sinConexion:boolean}){
 const respuesta=useAccionConfirmada();
  const [menu,abrirMenu]=useState(false),[confirmacion,confirmar]=useState(false),[ocupado,cambiarOcupado]=useState(false),bloqueo=useRef(false);
  const [cuenta,abrirCuenta]=useState(false);
  const social=useDatosSociales(),{mostrarAviso}=useContext(ContextoAvisos),estilos=crearEstilosDetalleSocial(aspecto.tema);
  const cerrar=()=>{if(bloqueo.current||operacionFinancieraEnCurso())return;abrirMenu(false);abrirCuenta(false);confirmar(false);};
  const cambiarActividad=async()=>{
    if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);
    try{
      await respuesta.ejecutar(async()=>{const actualizada=await cambiarActividadPersona(persona.id,!persona.activa);await social.recargar();return actualizada;},actualizada=>{confirmar(false);
      mostrarAviso(persona.activa?'Persona archivada. Su historial se conserva.':'Persona desarchivada.',{tipo:'exito'});
      if(actualizada&&!actualizada.activa)social.irAgenda();});
    }catch(error){mostrarAviso(error instanceof Error?error.message:'No se pudo actualizar la persona.',{tipo:'error'});}
    finally{bloqueo.current=false;cambiarOcupado(false);}
  };
  return <>
    <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Opciones de persona" accessibilityState={{expanded:menu}} disabled={ocupado} onPress={conRespuestaVisual(()=>abrirMenu(true))} style={estilos.editar}><Ionicons name="ellipsis-horizontal" size={22} color={aspecto.tema.textoSecundario}/></Pressable>
    {menu||cuenta||confirmacion?<Modal statusBarTranslucent navigationBarTranslucent transparent animationType="fade" visible onRequestClose={cerrar}>
    {cuenta?<ModalVinculoCuenta sinVentana persona={persona} vinculo={vinculo} sinConexion={sinConexion} alCerrar={cerrar} {...aspecto}/>:confirmacion?<ModalConfirmacionSocial sinVentana titulo={persona.activa?'¿Archivar esta persona?':'Desarchivar persona'} descripcion={persona.activa?'Solo se ocultará de la agenda principal. Sus vínculos, solicitudes, salas, pagos y deudas seguirán funcionando.':'Volverá a aparecer en la agenda principal. Su historial se conserva.'} cargando={ocupado} completado={respuesta.completado} textoConfirmar={persona.activa?'Sí, archivar persona':'Desarchivar persona'} peligro alCerrar={cerrar} alConfirmar={cambiarActividad} {...aspecto}/>:<MenuOpcionesSocial sinVentana tema={aspecto.tema} titulo="Opciones de persona" descripcion={persona.nombre} alCerrar={cerrar} opciones={[
      {id:'editar',texto:'Editar persona',descripcion:'Cambiar nombre, apellido y apodo.',icono:'create-outline',alElegir:()=>{abrirMenu(false);alEditar();}},
      {id:'cuenta',texto:vinculo?.estado==='confirmado'?'Ver cuenta vinculada':vinculo&&['solicitado','pendiente'].includes(vinculo.estado)?'Gestionar vínculo':'Vincular cuenta',descripcion:vinculo?.estado==='confirmado'?'Consultar la cuenta asociada a esta ficha.':vinculo&&['solicitado','pendiente'].includes(vinculo.estado)?'Consultar o resolver la solicitud de vínculo.':'Vincular por correo y esperar la aceptación de la otra cuenta.',icono:'link-outline',alElegir:()=>{abrirMenu(false);abrirCuenta(true);}},
      {id:'actividad',texto:persona.activa?'Archivar persona':'Desarchivar persona',descripcion:persona.activa?'Ocultar de la agenda principal; conserva vínculos, deudas y avisos.':'Mostrar nuevamente en la agenda principal.',icono:persona.activa?'archive-outline':'refresh-outline',peligro:persona.activa,alElegir:()=>{abrirMenu(false);confirmar(true);if(!persona.activa)return cambiarActividad();}},
    ]}/> }
    </Modal>:null}
  </>;
}
