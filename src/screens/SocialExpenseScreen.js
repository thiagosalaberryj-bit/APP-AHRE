import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import DetalleGasto from '../components/social/ExpenseDetails';
export default function PantallaGastoSocial(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirRegistro: contexto.datos.abrirRegistro,
    gasto: contexto.datos.gasto,
    sala: contexto.datos.sala
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <DetalleGasto {...contenido} /> : null}</MarcoSocial>;
}
