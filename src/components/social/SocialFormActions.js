import { useContext, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useDatosSociales } from '../../social/SocialDataContext';
import BotonSocial from './SocialButton';
import ModalConfirmacionSocial from './SocialConfirmationModal';
import ModalMovimientoSocial from './SocialMovementModal';

export default function AccionesFormulario({ texto, peligro = false, deshabilitado = false, confirmacion,
  alGuardar, preparar, alExito, mostrarNota = true, recargarAntesDeCerrar = false, mensajeExito = 'Cambios guardados.', ...aspecto }) {
  const social = useDatosSociales();
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [confirmando, establecerConfirmando] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [plan, establecerPlan] = useState(null);
  const ocupada = useRef(false), montado = useRef(true), solicitud = useRef(null);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  const guardar = async financiaciones => {
    if (ocupada.current) return;
    ocupada.current = true; establecerGuardando(true);
    try {
      const resultado = await solicitud.current.guardar(financiaciones);
      if (montado.current) {
        establecerPlan(null);
        mostrarAviso(typeof mensajeExito === 'function' ? mensajeExito(resultado) : mensajeExito, { tipo: 'exito' });
        if (solicitud.current.exito) {
          if (recargarAntesDeCerrar) await social.recargar();
          if (montado.current) await solicitud.current.exito(resultado);
        }
        else social.volver();
      }
    } catch (error) {
      if (montado.current) mostrarAviso(error.message || 'No se pudo guardar. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      ocupada.current = false;
      if (montado.current) establecerGuardando(false);
    }
  };
  const iniciar = async () => {
    if (ocupada.current || deshabilitado) return;
    establecerConfirmando(false);
    solicitud.current = { guardar: alGuardar, exito: alExito };
    if (preparar) {
      ocupada.current = true; establecerGuardando(true);
      try {
        const siguiente = await preparar();
        if (montado.current && siguiente.operaciones.length) { establecerPlan(siguiente); return; }
      } catch (error) {
        if (montado.current) mostrarAviso(error.message || 'Revisá los datos del formulario.', { tipo: 'error' });
        return;
      } finally { ocupada.current = false; if (montado.current) establecerGuardando(false); }
    }
    if (montado.current) await guardar({});
  };
  return <>
    <BotonSocial peligro={peligro} deshabilitado={deshabilitado || guardando || Boolean(plan)} texto={guardando ? 'Guardando…' : texto}
      alPresionar={() => confirmacion ? establecerConfirmando(true) : iniciar()} {...aspecto} />
    {mostrarNota ? <Text style={aspecto.estilosGlobales.textoAyuda}>Guardado local · Disponible sin conexión</Text> : null}
    {confirmando ? <ModalConfirmacionSocial {...confirmacion} peligro={peligro} alCerrar={() => establecerConfirmando(false)} alConfirmar={iniciar} {...aspecto} /> : null}
    {plan ? <ModalMovimientoSocial plan={plan} guardando={guardando} alCerrar={() => { if (!guardando) establecerPlan(null); }} alConfirmar={guardar} {...aspecto} /> : null}
  </>;
}
