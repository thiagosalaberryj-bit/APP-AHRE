import type { AspectoSocial } from '../../social/types';
import { useContext, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useDatosSociales } from '../../social/SocialDataContext';
import BotonSocial from './SocialButton';
import ModalConfirmacionSocial from './SocialConfirmationModal';
import ModalMovimientoSocial from './SocialMovementModal';

export default function AccionesFormulario<Resultado>({ texto, peligro = false, deshabilitado = false, confirmacion = undefined,
  alGuardar, preparar = undefined, alExito = undefined, mostrarNota = true, recargarAntesDeCerrar = false, mensajeExito = 'Cambios guardados.', ...aspecto }: import('../../social/types').AccionesFormularioProps<Resultado>) {
  const social = useDatosSociales();
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [confirmando, establecerConfirmando] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [plan, establecerPlan] = useState<import('../../social/types').PlanOperaciones | null>(null);
  const ocupada = useRef(false), montado = useRef(true), solicitud = useRef<{guardar: typeof alGuardar;exito: typeof alExito} | null>(null);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  const guardar = async (financiaciones: import('../../social/types').Financiaciones) => {
    if (ocupada.current || !solicitud.current) return;
    const accion = solicitud.current;
    ocupada.current = true; establecerGuardando(true);
    try {
      const resultado = await accion.guardar(financiaciones);
      if (montado.current) {
        establecerPlan(null);
        mostrarAviso(typeof mensajeExito === 'function' ? mensajeExito(resultado) : mensajeExito, { tipo: 'exito' });
        if (accion.exito) {
          if (recargarAntesDeCerrar) await social.recargar();
          if (montado.current) await accion.exito(resultado);
        }
        else social.volver();
      }
    } catch (error) {
      if (montado.current) mostrarAviso((error instanceof Error ? error.message : "") || 'No se pudo guardar. Intentá nuevamente.', { tipo: 'error' });
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
        if (montado.current) mostrarAviso((error instanceof Error ? error.message : "") || 'Revisá los datos del formulario.', { tipo: 'error' });
        return;
      } finally { ocupada.current = false; if (montado.current) establecerGuardando(false); }
    }
    if (montado.current) await guardar({});
  };
  return <>
    <BotonSocial peligro={peligro} deshabilitado={deshabilitado || guardando || Boolean(plan)} texto={guardando ? 'Guardando…' : texto}
      alPresionar={() => confirmacion ? establecerConfirmando(true) : iniciar()} {...aspecto} />
    {mostrarNota ? <Text style={aspecto.estilosGlobales.textoAyuda}>Guardado local · Disponible sin conexión</Text> : null}
    {confirmando && confirmacion ? <ModalConfirmacionSocial {...confirmacion} peligro={peligro} alCerrar={() => establecerConfirmando(false)} alConfirmar={iniciar} {...aspecto} /> : null}
    {plan ? <ModalMovimientoSocial plan={plan} guardando={guardando} alCerrar={() => { if (!guardando) establecerPlan(null); }} alConfirmar={guardar} {...aspecto} /> : null}
  </>;
}
