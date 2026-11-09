import {mensajeErrorSocial} from '../../social/socialHelpers';
import {useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {useDatosSociales} from '../../social/SocialDataContext';
import useVinculosOnline from '../../social/online/useAccountLinks';
import {responderVinculoOnline} from '../../social/socialService';
import type {AspectoSocial} from '../../social/types';
import BotonSocial from './SocialButton';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';

export default function SolicitudesVinculo(aspecto:AspectoSocial){
  const social=useDatosSociales(),{vinculos,sinConexion}=useVinculosOnline(social.usuarioId);
  const solicitudes=vinculos.filter(v=>v.direccion==='recibida'&&v.estado==='solicitado');
  const [ocupado,cambiarOcupado]=useState(false),[error,cambiarError]=useState(''),bloqueo=useRef(false),estilos=crearEstilosSocialOnline(aspecto.tema);
  if(!solicitudes.length)return null;
  const responder=async(id:string,decision:'aceptado'|'rechazado')=>{
    if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);cambiarError('');
    try{await responderVinculoOnline(id,decision);}catch(fallo){cambiarError(mensajeErrorSocial(fallo,'No se pudo responder.'));}
    finally{bloqueo.current=false;cambiarOcupado(false);}
  };
  return <View style={estilos.grupo}>
    <Text accessibilityRole="header" style={aspecto.estilosGlobales.encabezadoSeccion}>Solicitudes de vínculo</Text>
    {solicitudes.map(solicitud=><View key={solicitud.id} style={estilos.personaSolicitudes}>
      <Text style={aspecto.estilosGlobales.etiqueta}>{solicitud.nombre} quiere vincular tu cuenta con su agenda.</Text>
      <Text style={aspecto.estilosGlobales.textoAyuda}>Aceptar no comparte ni acepta deudas anteriores.</Text>
      <View style={estilos.fila}>{(['aceptado','rechazado'] as const).map(decision=><BotonSocial texto={decision==='aceptado'?'Aceptar vínculo':'Rechazar vínculo'} key={decision} deshabilitado={ocupado||sinConexion} alPresionar={()=>responder(solicitud.id,decision)} {...aspecto}/>)}</View>
    </View>)}
    {sinConexion?<Text style={aspecto.estilosGlobales.textoAyuda}>Necesitás conexión para responder las solicitudes.</Text>:null}
    {error?<Text accessibilityRole="alert" style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
  </View>;
}
