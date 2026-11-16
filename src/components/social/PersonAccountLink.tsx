import {useAccionConfirmada} from '../../hooks/useConfirmedAction';
import {crearEstilosGlobales} from '../../styles/globalStyles';
import { useContext } from 'react';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useErrorNotificado } from '../../hooks/useErrorNotice';
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

export default function ModalVinculoCuenta({persona,vinculo,sinConexion,alCerrar,sinVentana=false,...aspecto}:AspectoSocial&{persona:PersonaVista;vinculo?:VinculoOnline;sinVentana?:boolean;sinConexion:boolean;alCerrar:()=>void}){
 const respuesta=useAccionConfirmada();
 const [focoEntrada,cambiarFocoEntrada]=useState<string|null>(null);
 const estilosEntrada=crearEstilosGlobales(aspecto.tema);

  const { mostrarAviso } = useContext(ContextoAvisos);
  const [correo,cambiarCorreo]=useState(''),[, cambiarError]=useErrorNotificado(''),[ocupado,cambiarOcupado]=useState(false);
  const bloqueo=useRef(false),estilos=crearEstilosSocialOnline(aspecto.tema);
  const ejecutar=async(accion:()=>Promise<unknown>,mensaje='Vínculo actualizado.',clave='guardar')=>{
    if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);cambiarError('');
    try{await respuesta.ejecutar(accion,()=>{mostrarAviso(mensaje,{tipo:'exito'});alCerrar();},clave);}
    catch(fallo){cambiarError(mensajeErrorSocial(fallo,'No se pudo actualizar el vínculo.'));}
    finally{bloqueo.current=false;cambiarOcupado(false);}
  };
  return <DialogoInvitacion sinVentana={sinVentana} {...aspecto} titulo={vinculo?.estado==='confirmado'?'Cuenta vinculada':'Vínculo de cuenta'} descripcion={persona.nombre} icono="link-outline" etiquetaCerrar="Cerrar vínculo de cuenta" ocupado={ocupado} alCerrar={alCerrar}>
    {vinculo?.estado==='confirmado'?<View style={estilos.fila}><Ionicons name="link-outline" size={20} color={aspecto.tema.foco}/><Text style={aspecto.estilosGlobales.texto}>Cuenta vinculada: {[vinculo.nombre,vinculo.apellido].filter(Boolean).join(' ')}{'\n'}{vinculo.correo_electronico||'Correo no disponible. Actualizá la sincronización.'}</Text></View>
    :vinculo?.estado==='solicitado'?<>
      <Text style={aspecto.estilosGlobales.textoSecundario}>Solicitud enviada a {vinculo.nombre}. Espera su aceptación en Personas.</Text>
      <BotonSocial cargando={respuesta.ocupado} completado={respuesta.completado} texto="Cancelar solicitud de vínculo" deshabilitado={ocupado||sinConexion} alPresionar={()=>ejecutar(()=>cancelarVinculoOnline(vinculo.id))} {...aspecto}/>
    </>:vinculo?.estado==='pendiente'&&vinculo.cuenta_id?<>
      <Text style={aspecto.estilosGlobales.textoSecundario}>{vinculo.nombre} aceptó una invitación. Confirmá si es la cuenta de esta persona.</Text>
      {['confirmado','rechazado'].map(decision=><BotonSocial cargando={respuesta.accionActiva===decision} completado={respuesta.completado&&respuesta.accionActiva===decision} texto={decision==='confirmado'?'Confirmar vínculo':'Rechazar vínculo'} key={decision} deshabilitado={ocupado||sinConexion} alPresionar={()=>ejecutar(async()=>{await enviarAccionSocial('vinculo:'+vinculo.id,'/vinculos/'+vinculo.id+'/decidir',{decision});await sincronizarSocialOnline();},undefined,decision)} {...aspecto}/>)}
    </>:<>
        <TextInput onFocus={()=>cambiarFocoEntrada("0")} onBlur={()=>cambiarFocoEntrada(null)} accessibilityLabel="Correo de la cuenta a vincular" value={correo} onChangeText={cambiarCorreo} placeholder="Correo de su cuenta AHRE" placeholderTextColor={aspecto.tema.textoSecundario} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!ocupado} style={[estilos.entrada,estilosEntrada.campo,focoEntrada==="0"&&estilosEntrada.campoEnfocado]}/>
        <Text style={aspecto.estilosGlobales.textoAyuda}>La otra persona debe aceptar. Sus deudas anteriores siguen siendo privadas.</Text>
        <BotonSocial cargando={respuesta.ocupado} completado={respuesta.completado} texto="Enviar solicitud de vínculo" deshabilitado={ocupado||sinConexion||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())} alPresionar={()=>ejecutar(()=>solicitarVinculoOnline(persona.id,correo),'Solicitud de vínculo enviada. La otra persona debe aceptarla.')} {...aspecto}/>
    </>}
    {sinConexion?<Text style={aspecto.estilosGlobales.textoAyuda}>Iniciá sesión con conexión para vincular una cuenta.</Text>:null}

  </DialogoInvitacion>;
}
