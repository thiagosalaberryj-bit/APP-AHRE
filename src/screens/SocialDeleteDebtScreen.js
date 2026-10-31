import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import FormularioEliminarDeuda from '../components/social/DeleteDebtForm';
export default function PantallaEliminarDeuda(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    parametros: contexto.datos.parametros
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <FormularioEliminarDeuda {...contenido} /> : null}</MarcoSocial>;
}
