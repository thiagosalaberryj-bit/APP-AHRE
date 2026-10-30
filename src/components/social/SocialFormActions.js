import { useState } from 'react';
import { Text } from 'react-native';
import BotonSocial from './SocialButton';
import ModalConfirmacionSocial from './SocialConfirmationModal';

export default function AccionesFormulario({ texto, peligro = false, deshabilitado = false, confirmacion, ...aspecto }) {
  const [aviso, establecerAviso] = useState(false);
  const [confirmando, establecerConfirmando] = useState(false);
  const confirmar = () => { establecerConfirmando(false); establecerAviso(true); };
  return <>
    <BotonSocial peligro={peligro} deshabilitado={deshabilitado} texto={texto} alPresionar={() => { establecerAviso(false); if (confirmacion) establecerConfirmando(true); else confirmar(); }} {...aspecto} />
    {aviso ? <Text accessibilityRole="alert" style={aspecto.estilosGlobales.textoAyuda}>Vista de ejemplo: no se guardaron cambios. El registro local se implementará en otra etapa.</Text> : null}
    <Text style={aspecto.estilosGlobales.textoAyuda}>Datos simulados · Sin guardado real</Text>
    {confirmando ? <ModalConfirmacionSocial {...confirmacion} peligro={peligro} alCerrar={() => establecerConfirmando(false)} alConfirmar={confirmar} {...aspecto} /> : null}
  </>;
}
