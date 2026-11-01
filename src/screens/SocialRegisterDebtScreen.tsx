import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import FormularioRegistrarDeuda from '../components/social/RegisterDebtForm';
export default function PantallaRegistrarDeuda(propiedades: import('../navigation/types').PropiedadesPantalla) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirRegistro: contexto.datos.abrirRegistro,
    parametros: contexto.datos.parametros
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <FormularioRegistrarDeuda {...contenido} /> : null}</MarcoSocial>;
}
