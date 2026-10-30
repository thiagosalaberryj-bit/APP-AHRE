import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import DetalleSala from '../components/social/RoomDetails';
export default function PantallaSalaSocial(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirRegistro: contexto.datos.abrirRegistro,
    sala: contexto.datos.sala,
    alAbrirGasto: contexto.datos.alAbrirGasto
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <DetalleSala {...contenido} /> : null}</MarcoSocial>;
}
