import {useContext,useRef,useState} from 'react';
import {Pressable} from 'react-native';
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
  const [menu,abrirMenu]=useState(false),[confirmacion,confirmar]=useState(false),[ocupado,cambiarOcupado]=useState(false),bloqueo=useRef(false);
  const [cuenta,abrirCuenta]=useState(false);
  const social=useDatosSociales(),{mostrarAviso}=useContext(ContextoAvisos),estilos=crearEstilosDetalleSocial(aspecto.tema);
  const cambiarActividad=async()=>{
    if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);
    try{
      const actualizada=await cambiarActividadPersona(persona.id,!persona.activa);await social.recargar();confirmar(false);
      mostrarAviso(persona.activa?'Persona eliminada. Su historial se conserva.':'Persona reactivada.',{tipo:'exito'});
      if(actualizada&&!actualizada.activa)social.irAgenda();
    }catch(error){mostrarAviso(error instanceof Error?error.message:'No se pudo actualizar la persona.',{tipo:'error'});}
    finally{bloqueo.current=false;cambiarOcupado(false);}
  };
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Opciones de persona" accessibilityState={{expanded:menu}} disabled={ocupado} onPress={()=>abrirMenu(true)} style={estilos.editar}><Ionicons name="ellipsis-horizontal" size={22} color={aspecto.tema.textoSecundario}/></Pressable>
    {menu?<MenuOpcionesSocial tema={aspecto.tema} titulo="Opciones de persona" descripcion={persona.nombre} alCerrar={()=>abrirMenu(false)} opciones={[
      {id:'editar',texto:'Editar persona',descripcion:'Cambiar nombre, apellido y apodo.',icono:'create-outline',alElegir:()=>{abrirMenu(false);alEditar();}},
      {id:'cuenta',texto:vinculo?.estado==='confirmado'?'Ver cuenta vinculada':vinculo&&['solicitado','pendiente'].includes(vinculo.estado)?'Gestionar vínculo':'Vincular cuenta',descripcion:vinculo?.estado==='confirmado'?'Consultar la cuenta asociada a esta ficha.':vinculo&&['solicitado','pendiente'].includes(vinculo.estado)?'Consultar o resolver la solicitud de vínculo.':'Vincular por correo y esperar la aceptación de la otra cuenta.',icono:'link-outline',deshabilitada:!persona.activa&&!(vinculo&&['confirmado','solicitado','pendiente'].includes(vinculo.estado)),alElegir:()=>{abrirMenu(false);abrirCuenta(true);}},
      {id:'actividad',texto:persona.activa?'Eliminar persona':'Reactivar persona',descripcion:persona.activa?'Desactivar su ficha y conservar el historial.':'Volver a utilizar esta ficha.',icono:persona.activa?'trash-outline':'refresh-outline',peligro:persona.activa,alElegir:()=>{abrirMenu(false);if(persona.activa)confirmar(true);else void cambiarActividad();}},
    ]}/>:null}
    {cuenta?<ModalVinculoCuenta persona={persona} vinculo={vinculo} sinConexion={sinConexion} alCerrar={()=>abrirCuenta(false)} {...aspecto}/>:null}
    {confirmacion?<ModalConfirmacionSocial titulo="¿Eliminar esta persona?" descripcion="Se desactivará su ficha. Sus salas, pagos y deudas se conservarán." textoConfirmar={ocupado?'Eliminando…':'Sí, eliminar persona'} peligro alCerrar={()=>{if(!bloqueo.current)confirmar(false);}} alConfirmar={()=>{void cambiarActividad();}} {...aspecto}/>:null}
  </>;
}
