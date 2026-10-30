import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import FormularioCerrarSala from '../components/social/CloseRoomForm';
export default function PantallaCerrarSala(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    sala: contexto.datos.sala
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <FormularioCerrarSala {...contenido} /> : null}</MarcoSocial>;
}
