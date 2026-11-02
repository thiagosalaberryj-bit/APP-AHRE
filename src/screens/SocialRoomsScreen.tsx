import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import ListaSalas from '../components/social/RoomList';
export default function PantallaSalasSociales(propiedades: import('../navigation/types').PropiedadesPantalla) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirSala: contexto.datos.abrirSala,
    abrirRegistro: contexto.datos.abrirRegistro
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <ListaSalas {...contenido} /> : null}</MarcoSocial>;
}
