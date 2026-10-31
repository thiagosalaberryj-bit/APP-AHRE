import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import DetallePersona from '../components/social/PersonDetails';
export default function PantallaPersonaSocial(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirSala: contexto.datos.abrirSala,
    abrirPersona: contexto.datos.abrirPersona,
    abrirRegistro: contexto.datos.abrirRegistro,
    persona: contexto.datos.persona
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <DetallePersona {...contenido} /> : null}</MarcoSocial>;
}
