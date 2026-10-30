import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import AgendaPersonas from '../components/social/PeopleAgenda';
export default function PantallaPersonasSociales(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirPersona: contexto.datos.abrirPersona,
    abrirAltaInicial: contexto.datos.abrirAltaInicial
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <AgendaPersonas {...contenido} /> : null}</MarcoSocial>;
}
