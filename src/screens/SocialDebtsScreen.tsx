import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import HistorialDeudas from '../components/social/DebtHistory';
export default function PantallaDeudasSociales(propiedades: import('../navigation/types').PropiedadesPantalla) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirRegistro: contexto.datos.abrirRegistro
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <HistorialDeudas {...contenido} /> : null}</MarcoSocial>;
}
