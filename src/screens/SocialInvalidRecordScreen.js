import usePantallaSocial from '../social/useSocialScreen';
import MarcoSocial from '../components/social/SocialScreenFrame';
import RegistroNoDisponible from '../components/social/SocialRecordUnavailable';
export default function PantallaRegistroInvalido(propiedades) {
  const contexto = usePantallaSocial(propiedades);
  return <MarcoSocial contexto={contexto}><RegistroNoDisponible {...contexto.aspecto} /></MarcoSocial>;
}
