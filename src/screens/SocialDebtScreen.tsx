import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import DetalleDeuda from '../components/social/DebtDetails';
export default function PantallaDeudaSocial(propiedades: import('../navigation/types').PropiedadesPantalla) {
  const contexto = usePantallaSocial(propiedades);
  const contenido = {
    ...contexto.aspecto,
    abrirSala: contexto.datos.abrirSala,
    abrirPersona: contexto.datos.abrirPersona,
    abrirRegistro: contexto.datos.abrirRegistro,
    deudaId: contexto.datos.deudaId
  };
  return <MarcoSocial contexto={contexto}>{!contexto.cargando && !contexto.noDisponible ? <DetalleDeuda {...contenido} /> : null}</MarcoSocial>;
}
