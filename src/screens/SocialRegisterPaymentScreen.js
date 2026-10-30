import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import FormularioRegistrarPago from '../components/social/RegisterPaymentForm';
export default function PantallaRegistrarPago(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    parametros: contexto.datos.parametros
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <FormularioRegistrarPago {...contenido} /> : null}</MarcoSocial>;
}
