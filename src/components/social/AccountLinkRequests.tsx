import {useContext,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {ContextoAvisos} from '../../contexts/ToastContext';
import {useDatosSociales} from '../../social/SocialDataContext';
import useVinculosOnline from '../../social/online/useAccountLinks';
import {guardarPersona,responderVinculoOnline} from '../../social/socialService';
import type {AspectoSocial} from '../../social/types';
import type {VinculoOnline} from '../../social/online/types';
import BotonSocial from './SocialButton';
import CampoFormulario from './SocialTextField';
import SelectorSegmentado from '../SegmentedSelector';
import ListaPersonas from './PersonSelectionList';
import DialogoInvitacion from './InvitationDialog';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';

export default function SolicitudesVinculo(aspecto:AspectoSocial){
 const {mostrarAviso}=useContext(ContextoAvisos),social=useDatosSociales();
 const {vinculos,sinConexion}=useVinculosOnline(social.usuarioId),estilos=crearEstilosSocialOnline(aspecto.tema);
 const solicitudes=vinculos.filter(v=>v.direccion==='recibida'&&v.estado==='solicitado');
 const [seleccion,cambiarSeleccion]=useState<VinculoOnline|null>(null),[personaId,cambiarPersonaId]=useState('');
 const [modo,cambiarModo]=useState('nueva');
 const [nombre,cambiarNombre]=useState(''),[apellido,cambiarApellido]=useState(''),[apodo,cambiarApodo]=useState('');
 const [errores,cambiarErrores]=useState<Record<string,string>>({}),[ocupado,cambiarOcupado]=useState(false),bloqueo=useRef(false);
 const abrir=(solicitud:VinculoOnline)=>{cambiarSeleccion(solicitud);cambiarPersonaId('');cambiarModo('nueva');cambiarNombre(solicitud.nombre||'');cambiarApellido(solicitud.apellido||'');cambiarApodo('');cambiarErrores({});};
 const responder=async(id:string,decision:'aceptado'|'rechazado')=>{
  if(bloqueo.current)return;
  const campos:Record<string,string>={};
  if(decision==='aceptado'&&modo==='agenda'&&!personaId)campos.persona='Seleccioná una persona.';
  if(decision==='aceptado'&&modo==='nueva'&&!personaId){if(!nombre.trim())campos.nombre='Completá el nombre.';if(!apellido.trim())campos.apellido='Completá el apellido.';if(!apodo.trim()||apodo.trim().length>20)campos.apodo='Completá un apodo de hasta 20 caracteres.';}
  cambiarErrores(campos);if(Object.keys(campos).length)return;
  bloqueo.current=true;cambiarOcupado(true);
  try{
   let elegida=personaId;
   if(decision==='aceptado'&&!elegida){const nueva=await guardarPersona({nombre,apellido,apodo});if(!nueva)throw new Error('No se pudo registrar la persona.');elegida=nueva.id;cambiarPersonaId(elegida);await social.recargar();}
   await responderVinculoOnline(id,decision,elegida||undefined);await social.recargar();cambiarSeleccion(null);
   mostrarAviso(decision==='aceptado'?'Persona registrada y vínculo aceptado en ambas cuentas.':'Vínculo rechazado.',{tipo:'exito'});
  }catch(error){mostrarAviso(error instanceof Error?error.message:'No se pudo responder.',{tipo:'error'});}
  finally{bloqueo.current=false;cambiarOcupado(false);}
 };
 if(!solicitudes.length&&!seleccion)return null;
 return <View style={estilos.grupo}>
  <Text accessibilityRole="header" style={aspecto.estilosGlobales.encabezadoSeccion}>Solicitudes de vínculo</Text>
  {solicitudes.map(solicitud=><View key={solicitud.id} style={[estilos.personaSolicitudes,estilos.filaSolicitud]}>
   <View style={estilos.flexible}><Text style={aspecto.estilosGlobales.etiqueta}>{[solicitud.nombre,solicitud.apellido].filter(Boolean).join(' ')}</Text><Text style={aspecto.estilosGlobales.textoAyuda}>{solicitud.correo_electronico||'Solicitud de vínculo'}</Text></View>
   <Pressable accessibilityRole="button" accessibilityLabel={'Aceptar vínculo de '+solicitud.nombre} style={estilos.accionSolicitud} disabled={ocupado||sinConexion} onPress={()=>abrir(solicitud)}><Ionicons name="checkmark" size={23} color={aspecto.tema.exito}/></Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={'Rechazar vínculo de '+solicitud.nombre} style={estilos.accionSolicitud} disabled={ocupado||sinConexion} onPress={()=>{void responder(solicitud.id,'rechazado');}}><Ionicons name="close" size={23} color={aspecto.tema.error}/></Pressable>
  </View>)}
  {seleccion?<DialogoInvitacion {...aspecto} titulo="Registrar vínculo" descripcion="Elegí una persona de tu agenda o registrala con su apodo para aceptar." icono="person-add-outline" ocupado={ocupado} alCerrar={()=>cambiarSeleccion(null)}>
   <SelectorSegmentado tema={aspecto.tema} opciones={[{id:'nueva',nombre:'Nueva persona'},{id:'agenda',nombre:'Seleccionar persona'}]} valor={modo} etiqueta="Registrar vínculo" alSeleccionar={valor=>{if(!bloqueo.current){cambiarModo(valor);cambiarPersonaId('');cambiarErrores({});}}}/>
   {modo==='agenda'?<ListaPersonas personas={social.personas.filter(p=>p.activa)} elegida={personaId} alElegir={cambiarPersonaId} ocupado={ocupado} {...aspecto}/>:null}
   {errores.persona?<Text style={aspecto.estilosGlobales.textoError}>{errores.persona}</Text>:null}
   {modo==='nueva'?<><CampoFormulario etiqueta="Nombre" valor={nombre} alCambiar={v=>{if(!bloqueo.current)cambiarNombre(v);}} limite={80} error={errores.nombre} {...aspecto}/><CampoFormulario etiqueta="Apellido" valor={apellido} alCambiar={v=>{if(!bloqueo.current)cambiarApellido(v);}} limite={80} error={errores.apellido} {...aspecto}/><CampoFormulario etiqueta="Apodo" valor={apodo} alCambiar={v=>{if(!bloqueo.current)cambiarApodo(v);}} limite={20} error={errores.apodo} {...aspecto}/><Text style={aspecto.estilosGlobales.textoAyuda}>Podés repetir nombre y apellido usando un apodo distinto.</Text></>:null}
   <BotonSocial texto="Registrar y aceptar vínculo" deshabilitado={ocupado||sinConexion} alPresionar={()=>{void responder(seleccion.id,'aceptado');}} {...aspecto}/>
  </DialogoInvitacion>:null}
 </View>;
}
