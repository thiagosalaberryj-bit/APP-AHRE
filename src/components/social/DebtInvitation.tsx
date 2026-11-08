import {useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial,DeudaVista} from '../../social/types';
import type {DeudaOnline} from '../../social/online/types';
import {useDatosSociales} from '../../social/SocialDataContext';
import {leerDatosOnline,observarSocialOnline,observarSincronizacion,obtenerVistaSincronizacion,enviarAccionSocial,sincronizarSocialOnline} from '../../social/socialService';
import BotonSocial from './SocialButton';
import OpcionesSeleccion from './SocialChoiceGroup';
import crearEstilosInvitacion from '../../styles/social/DebtInvitationStyles';

export default function InvitacionDeuda({deuda,...aspecto}:AspectoSocial&{deuda:DeudaVista}){
  const social=useDatosSociales(),estilos=crearEstilosInvitacion(aspecto.tema);
  const [invitacion,cambiarInvitacion]=useState<DeudaOnline|null>(null),[asociacion,cambiarAsociacion]=useState(''),[cargando,cambiarCargando]=useState(true),[error,cambiarError]=useState(''),[decision,cambiarDecision]=useState('');
  const [conexion,cambiarConexion]=useState(obtenerVistaSincronizacion);
  const montado=useRef(true),bloqueo=useRef(false);
  useEffect(()=>{montado.current=true;return()=>{montado.current=false;};},[]);
  useEffect(()=>observarSincronizacion(cambiarConexion),[]);
  useEffect(()=>{
    let activo=true,version=0;
    const cargar=async()=>{const actual=++version;try{
      const deudas=await leerDatosOnline<DeudaOnline[]>(social.usuarioId,'deudas',[]);
      if(activo&&actual===version){cambiarInvitacion(deudas.find(d=>d.id===deuda.acuerdoOnlineId)||null);cambiarCargando(false);}
    }catch{if(activo&&actual===version){cambiarError('No se pudo cargar la invitación.');cambiarCargando(false);}}};
    void cargar();const dejar=observarSocialOnline(()=>{void cargar();});return()=>{activo=false;dejar();};
  },[social.usuarioId,deuda.acuerdoOnlineId]);
  const sinConexion=!deuda.id.startsWith('demo-social:')&&['offline','revocado','sesion','local'].includes(conexion.estado);
  const compatibles=social.deudas.filter(d=>!d.salaId&&!d.acuerdoOnlineId&&!d.saldada&&d.tipo===deuda.tipo&&Math.round(d.pendienteNumero*100)===Math.round(deuda.montoNumero*100));
  const responder=async(valor:'aceptada'|'rechazada')=>{
    if(bloqueo.current||!invitacion?.puedeDecidir)return;
    bloqueo.current=true;cambiarDecision(valor);cambiarError('');
    try{
      await enviarAccionSocial('propuesta:'+invitacion.id,'/deudas/'+invitacion.id+'/decidir',{decision:valor,...(valor==='aceptada'&&asociacion?{deudaLocalId:asociacion,confirmarVinculo:true}:{})});
      await sincronizarSocialOnline();await social.recargar();
    }catch(fallo){if(montado.current)cambiarError(fallo instanceof Error?fallo.message:'No se pudo responder la invitación.');}
    finally{bloqueo.current=false;if(montado.current)cambiarDecision('');}
  };
  const rechazada=deuda.estadoOnline==='rechazada';
  return <View style={[estilos.tarjeta,rechazada&&estilos.resuelta]}>
    <View style={estilos.cabecera}>
      <View style={estilos.icono}><Ionicons name={rechazada?'mail-open-outline':'mail-outline'} size={22} color={aspecto.tema.foco}/></View>
      <View style={estilos.titulos}><Text accessibilityRole="header" style={aspecto.estilosGlobales.encabezadoSeccion}>{rechazada?'Invitación rechazada':'Invitación de deuda'}</Text><Text style={aspecto.estilosGlobales.textoSecundario}>{rechazada?'Tus registros personales se conservan.':invitacion?.puedeDecidir?'Revisá la propuesta antes de aceptarla.':'Esperando la aceptación de la otra persona.'}</Text></View>
    </View>
    {cargando||decision?<View style={estilos.progreso}><ActivityIndicator color={aspecto.tema.foco}/><Text accessibilityLiveRegion="polite" style={aspecto.estilosGlobales.textoSecundario}>{decision==='aceptada'?'Aceptando invitación…':decision==='rechazada'?'Rechazando invitación…':'Cargando invitación…'}</Text></View>:null}
    {error?<Text accessibilityRole="alert" style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
    {invitacion?.puedeDecidir&&!rechazada?<>
      <Text style={aspecto.estilosGlobales.textoSecundario}>Al aceptar, esta deuda quedará vinculada online. No se registra ningún pago.</Text>
      {compatibles.length?<View style={estilos.grupo}><Text style={aspecto.estilosGlobales.etiqueta}>¿Ya tenías anotada esta deuda?</Text><Text style={aspecto.estilosGlobales.textoSecundario}>Podés vincular tu registro para evitar duplicarla. Es opcional.</Text><OpcionesSeleccion opciones={compatibles.map(d=>({id:d.id,nombre:(social.obtenerPersona(d.personaId)?.nombre||'Persona')+' · '+d.descripcion+' · '+d.pendiente}))} elegida={asociacion} alElegir={id=>cambiarAsociacion(actual=>actual===id?'':id)} {...aspecto}/></View>:null}
      {sinConexion?<Text style={aspecto.estilosGlobales.textoAyuda}>Necesitás conexión para responder esta invitación.</Text>:null}
      <View style={estilos.acciones}><View style={estilos.accion}><BotonSocial texto="Aceptar" deshabilitado={!!decision||sinConexion} alPresionar={()=>{void responder('aceptada');}} {...aspecto}/></View><View style={estilos.accion}><BotonSocial texto="Rechazar" secundario deshabilitado={!!decision||sinConexion} alPresionar={()=>{void responder('rechazada');}} {...aspecto}/></View></View>
    </>:null}
  </View>;
}
