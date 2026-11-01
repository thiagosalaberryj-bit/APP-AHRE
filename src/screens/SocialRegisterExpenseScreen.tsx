import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import FormularioRegistrarGasto from '../components/social/RegisterExpenseForm';
export default function PantallaRegistrarGasto(propiedades: import('../navigation/types').PropiedadesPantalla) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    parametros: contexto.datos.parametros,
    sala: contexto.datos.sala
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <FormularioRegistrarGasto {...contenido} sala={contenido.sala!} /> : null}</MarcoSocial>;
}
