import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import PanelSocial from '../components/social/SocialPanel';
export default function PantallaSocial(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirSala: contexto.datos.abrirSala,
    abrirRegistro: contexto.datos.abrirRegistro,
    alVerSalas: contexto.datos.alVerSalas,
    alVerPersonas: contexto.datos.alVerPersonas,
    alVerAgenda: contexto.datos.alVerAgenda
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <PanelSocial {...contenido} /> : null}</MarcoSocial>;
}
