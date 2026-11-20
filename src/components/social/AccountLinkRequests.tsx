import IdentidadSolicitud from './RequestIdentity';
import {useAccionConfirmada} from '../../hooks/useConfirmedAction';
import AccionesSolicitud from './RequestDecisionActions';
import {useContext,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {ContextoAvisos} from '../../contexts/ToastContext';
import {useDatosSociales} from '../../social/SocialDataContext';
import useVinculosOnline from '../../social/online/useAccountLinks';
import {responderVinculoOnline} from '../../social/socialService';
import type {AspectoSocial} from '../../social/types';
import type {VinculoOnline} from '../../social/online/types';
import BotonSocial from './SocialButton';
import CampoFormulario from './SocialTextField';
import SelectorSegmentado from '../SegmentedSelector';
import ListaPersonas from './PersonSelectionList';
import DialogoInvitacion from './InvitationDialog';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';

export default function SolicitudesVinculo(aspecto:AspectoSocial){
 const respuesta=useAccionConfirmada();
 const {mostrarAviso}=useContext(ContextoAvisos),social=useDatosSociales();
 const {vinculos,sinConexion}=useVinculosOnline(social.usuarioId),estilos=crearEstilosSocialOnline(aspecto.tema);
 const solicitudes=vinculos.filter(v=>v.direccion==='recibida'&&v.estado==='solicitado');
 const [seleccion,cambiarSeleccion]=useState<VinculoOnline|null>(null),[personaId,cambiarPersonaId]=useState('');
 const [modo,cambiarModo]=useState('nueva');
 const [enviando,cambiarEnviando]=useState<{id:string;accion:'aceptar'|'rechazar'}|null>(null);
 const [nombre,cambiarNombre]=useState(''),[apellido,cambiarApellido]=useState(''),[apodo,cambiarApodo]=useState('');
 const [errores,cambiarErrores]=useState<Record<string,string>>({}),[ocupado,cambiarOcupado]=useState(false),bloqueo=useRef(false);
 const abrir=(solicitud:VinculoOnline)=>{cambiarSeleccion(solicitud);cambiarPersonaId('');cambiarModo('nueva');cambiarNombre(solicitud.nombre||'');cambiarApellido(solicitud.apellido||'');cambiarApodo('');cambiarErrores({});};
 const responder=async(id:string,decision:'aceptado'|'rechazado')=>{
  if(bloqueo.current)return;
  const campos:Record<string,string>={};
  if(decision==='aceptado'&&modo==='agenda'&&!personaId)campos.persona='Seleccioná una persona.';
  if(decision==='aceptado'&&modo==='nueva'&&!personaId){if(!nombre.trim())campos.nombre='Completá el nombre.';if(!apellido.trim())campos.apellido='Completá el apellido.';if(!apodo.trim()||apodo.trim().length>20)campos.apodo='Completá un apodo de hasta 20 caracteres.';}
  cambiarErrores(campos);if(Object.keys(campos).length)return;
  bloqueo.current=true;cambiarOcupado(true);cambiarEnviando({id,accion:decision==='aceptado'?'aceptar':'rechazar'});
  try{
   await respuesta.ejecutar(async()=>{await responderVinculoOnline(id,decision,personaId||undefined,decision==='aceptado'&&modo==='nueva'&&!personaId?{nombre,apellido,apodo}:undefined);await social.recargar();},()=>{cambiarSeleccion(null);
   mostrarAviso(decision==='aceptado'?'Persona registrada y vínculo aceptado en ambas cuentas.':'Vínculo rechazado.',{tipo:'exito'});});
  }catch(error){mostrarAviso(error instanceof Error?error.message:'No se pudo responder.',{tipo:'error'});}
  finally{bloqueo.current=false;cambiarOcupado(false);cambiarEnviando(null);}
 };
 if(!solicitudes.length&&!seleccion)return null;
 return <View style={estilos.grupo}>
  <Text accessibilityRole="header" style={aspecto.estilosGlobales.encabezadoSeccion}>Solicitudes de vínculo</Text>
  {solicitudes.map(solicitud=><View key={solicitud.id} style={estilos.personaSolicitudes}>
   <IdentidadSolicitud tema={aspecto.tema} nombre={solicitud.nombre} apellido={solicitud.apellido} detalle={solicitud.correo_electronico||'Solicitud de vínculo'}/>
   <AccionesSolicitud tema={aspecto.tema} etiquetaAceptar={'Aceptar vínculo de '+solicitud.nombre} etiquetaRechazar={'Rechazar vínculo de '+solicitud.nombre} completado={respuesta.completado} deshabilitado={ocupado||sinConexion} procesando={enviando?.id===solicitud.id?enviando.accion:null} alAceptar={()=>abrir(solicitud)} alRechazar={()=>responder(solicitud.id,'rechazado')}/>
  </View>)}
  {seleccion?<DialogoInvitacion {...aspecto} titulo="Registrar vínculo" descripcion="Elegí una persona de tu agenda o registrala con su apodo para aceptar." icono="person-add-outline" ocupado={ocupado} alCerrar={()=>cambiarSeleccion(null)}>
   <SelectorSegmentado tema={aspecto.tema} opciones={[{id:'nueva',nombre:'Nueva persona'},{id:'agenda',nombre:'Seleccionar persona'}]} valor={modo} etiqueta="Registrar vínculo" alSeleccionar={valor=>{if(!bloqueo.current){cambiarModo(valor);cambiarPersonaId('');cambiarErrores({});}}}/>
   {modo==='agenda'?<ListaPersonas personas={social.personas} elegida={personaId} alElegir={cambiarPersonaId} ocupado={ocupado} {...aspecto}/>:null}
   {errores.persona?<Text style={aspecto.estilosGlobales.textoError}>{errores.persona}</Text>:null}
   {modo==='nueva'?<><CampoFormulario etiqueta="Nombre" valor={nombre} alCambiar={v=>{if(!bloqueo.current)cambiarNombre(v);}} limite={80} error={errores.nombre} {...aspecto}/><CampoFormulario etiqueta="Apellido" valor={apellido} alCambiar={v=>{if(!bloqueo.current)cambiarApellido(v);}} limite={80} error={errores.apellido} {...aspecto}/><CampoFormulario etiqueta="Apodo" valor={apodo} alCambiar={v=>{if(!bloqueo.current)cambiarApodo(v);}} limite={20} error={errores.apodo} {...aspecto}/><Text style={aspecto.estilosGlobales.textoAyuda}>Podés repetir nombre y apellido usando un apodo distinto.</Text></>:null}
   <BotonSocial completado={respuesta.completado} cargando={ocupado} texto="Registrar y aceptar vínculo" deshabilitado={ocupado||sinConexion} alPresionar={()=>responder(seleccion.id,'aceptado')} {...aspecto}/>
  </DialogoInvitacion>:null}
 </View>;
}
