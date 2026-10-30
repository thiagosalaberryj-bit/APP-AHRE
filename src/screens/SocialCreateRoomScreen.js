import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import FormularioCrearSala from '../components/social/CreateRoomForm';
export default function PantallaCrearSala(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirRegistro: contexto.datos.abrirRegistro
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <FormularioCrearSala {...contenido} /> : null}</MarcoSocial>;
}
