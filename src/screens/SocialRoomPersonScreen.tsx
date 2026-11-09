import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import PersonasOnline from '../components/social/OnlineRoomPanel';
import EstadoVacio from '../components/social/SocialEmptyState';
export default function PantallaPersonaSala(propiedades:import('../navigation/types').PropiedadesPantalla){
  const contexto=usePantallaSocial(propiedades),{sala,parametros,abrirRegistro}=contexto.datos;
  return <MarcoSocial contexto={contexto}>{!contexto.cargando&&!contexto.noDisponible?(sala?.online&&parametros.personaId?<PersonasOnline key={sala.id+':'+parametros.personaId} sala={sala} personaId={parametros.personaId} alCrearPersona={()=>abrirRegistro('persona')} {...contexto.aspecto}/>:<EstadoVacio titulo="Integrante no disponible" descripcion="Volvé a la sala para elegir una persona." icono="person-outline" {...contexto.aspecto}/>):null}</MarcoSocial>;
}
