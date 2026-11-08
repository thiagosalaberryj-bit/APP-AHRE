import {mensajeErrorSocial} from '../../social/socialHelpers';
import {useRef,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {solicitarVinculoOnline,cancelarVinculoOnline,enviarAccionSocial,sincronizarSocialOnline} from '../../social/socialService';
import type {VinculoOnline} from '../../social/online/types';
import DialogoInvitacion from './InvitationDialog';
import type {AspectoSocial,PersonaVista} from '../../social/types';
import BotonSocial from './SocialButton';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';

export default function ModalVinculoCuenta({persona,vinculo,sinConexion,alCerrar,...aspecto}:AspectoSocial&{persona:PersonaVista;vinculo?:VinculoOnline;sinConexion:boolean;alCerrar:()=>void}){
  const [correo,cambiarCorreo]=useState(''),[error,cambiarError]=useState(''),[ocupado,cambiarOcupado]=useState(false);
  const bloqueo=useRef(false),estilos=crearEstilosSocialOnline(aspecto.tema);
  const ejecutar=async(accion:()=>Promise<unknown>)=>{
    if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);cambiarError('');
    try{await accion();alCerrar();}
    catch(fallo){cambiarError(mensajeErrorSocial(fallo,'No se pudo actualizar el vínculo.'));}
    finally{bloqueo.current=false;cambiarOcupado(false);}
  };
  return <DialogoInvitacion {...aspecto} titulo={vinculo?.estado==='confirmado'?'Cuenta vinculada':'Vínculo de cuenta'} descripcion={persona.nombre} icono="link-outline" etiquetaCerrar="Cerrar vínculo de cuenta" ocupado={ocupado} alCerrar={alCerrar}>
    {vinculo?.estado==='confirmado'?<View style={estilos.fila}><Ionicons name="link-outline" size={20} color={aspecto.tema.foco}/><Text style={aspecto.estilosGlobales.texto}>Cuenta vinculada: {vinculo.nombre}</Text></View>
    :vinculo?.estado==='solicitado'?<>
      <Text style={aspecto.estilosGlobales.textoSecundario}>Solicitud enviada a {vinculo.nombre}. Espera su aceptación en Personas.</Text>
      <BotonSocial texto="Cancelar solicitud de vínculo" deshabilitado={ocupado||sinConexion} alPresionar={()=>ejecutar(()=>cancelarVinculoOnline(vinculo.id))} {...aspecto}/>
    </>:vinculo?.estado==='pendiente'&&vinculo.cuenta_id?<>
      <Text style={aspecto.estilosGlobales.textoSecundario}>{vinculo.nombre} aceptó una invitación. Confirmá si es la cuenta de esta persona.</Text>
      {['confirmado','rechazado'].map(decision=><BotonSocial texto={decision==='confirmado'?'Confirmar vínculo':'Rechazar vínculo'} key={decision} deshabilitado={ocupado||sinConexion} alPresionar={()=>ejecutar(async()=>{await enviarAccionSocial('vinculo:'+vinculo.id,'/vinculos/'+vinculo.id+'/decidir',{decision});await sincronizarSocialOnline();})} {...aspecto}/>)}
    </>:<>
        <TextInput accessibilityLabel="Correo de la cuenta a vincular" value={correo} onChangeText={cambiarCorreo} placeholder="Correo de su cuenta AHRE" placeholderTextColor={aspecto.tema.textoSecundario} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!ocupado} style={estilos.entrada}/>
        <Text style={aspecto.estilosGlobales.textoAyuda}>La otra persona debe aceptar. Sus deudas anteriores siguen siendo privadas.</Text>
        <BotonSocial texto="Enviar solicitud de vínculo" deshabilitado={!persona.activa||ocupado||sinConexion||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())} alPresionar={()=>ejecutar(()=>solicitarVinculoOnline(persona.id,correo))} {...aspecto}/>
    </>}
    {sinConexion?<Text style={aspecto.estilosGlobales.textoAyuda}>Iniciá sesión con conexión para vincular una cuenta.</Text>:null}
    {error?<Text accessibilityRole="alert" style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
  </DialogoInvitacion>;
}
