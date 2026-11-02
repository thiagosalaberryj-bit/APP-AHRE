import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import DetalleGasto from '../components/social/ExpenseDetails';
export default function PantallaGastoSocial(propiedades: import('../navigation/types').PropiedadesPantalla) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirRegistro: contexto.datos.abrirRegistro,
    gasto: contexto.datos.gasto,
    sala: contexto.datos.sala
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <DetalleGasto {...contenido} gasto={contenido.gasto!} sala={contenido.sala!} /> : null}</MarcoSocial>;
}
