import {useFinalizacionAccion} from '../../hooks/useActionCompletion';
import { useContext, useEffect, useRef, useState } from 'react';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useDatosSociales } from '../../social/SocialDataContext';
import BotonSocial from './SocialButton';
import ModalConfirmacionSocial from './SocialConfirmationModal';
import ModalMovimientoSocial from './SocialMovementModal';
import {iniciarOperacionFinanciera} from '../../social/financialOperation';

export default function AccionesFormulario<Resultado>({ texto, peligro = false, deshabilitado = false, confirmacion = undefined,
  alGuardar, preparar = undefined, alExito = undefined, recargarAntesDeCerrar = false, mensajeExito = 'Cambios guardados.', ...aspecto }: import('../../social/types').AccionesFormularioProps<Resultado>) {
 const finalizacion=useFinalizacionAccion();

  const social = useDatosSociales();
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [confirmando, establecerConfirmando] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [plan, establecerPlan] = useState<import('../../social/types').PlanOperaciones | null>(null);
  const ocupada = useRef(false), montado = useRef(true), solicitud = useRef<{guardar: typeof alGuardar;exito: typeof alExito} | null>(null);
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  const guardar = async (financiaciones: import('../../social/types').Financiaciones) => {
    if (ocupada.current || !solicitud.current) return;
    const liberar=iniciarOperacionFinanciera();if(!liberar)return;
    const accion = solicitud.current;
    ocupada.current = true; finalizacion.iniciar();establecerGuardando(true);
    try {
      const resultado = await accion.guardar(financiaciones);
      if (montado.current) {
        if(recargarAntesDeCerrar)await social.recargar();
        if(!await finalizacion.confirmar())return;
        establecerConfirmando(false);
        establecerPlan(null);
        mostrarAviso(typeof mensajeExito === 'function' ? mensajeExito(resultado) : mensajeExito, { tipo: 'exito' });
        if (accion.exito) {

          liberar();if (montado.current) await accion.exito(resultado);
        }
        else {liberar();social.volver();}
      }
    } catch (error) {
      if (montado.current) mostrarAviso((error instanceof Error ? error.message : "") || 'No se pudo guardar. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      ocupada.current = false;
      liberar();
      if (montado.current) establecerGuardando(false);
    }
  };
  const iniciar = async () => {
    if (ocupada.current || deshabilitado) return;
    solicitud.current = { guardar: alGuardar, exito: alExito };
    if (preparar) {
      const liberarPreparacion=iniciarOperacionFinanciera();if(!liberarPreparacion)return;
      ocupada.current = true; finalizacion.iniciar();establecerGuardando(true);
      try {
        const siguiente = await preparar();
        if (montado.current && siguiente.operaciones.length) { establecerConfirmando(false); establecerPlan(siguiente); return; }
      } catch (error) {
        if (montado.current) mostrarAviso((error instanceof Error ? error.message : "") || 'Revisá los datos del formulario.', { tipo: 'error' });
        return;
      } finally { liberarPreparacion();ocupada.current = false; if (montado.current) establecerGuardando(false); }
    }
    if (montado.current) await guardar({});
  };
  return <>
    <BotonSocial completado={finalizacion.completado} cargando={guardando} peligro={peligro} deshabilitado={deshabilitado || guardando || Boolean(plan)} texto={texto}
      alPresionar={() => confirmacion ? establecerConfirmando(true) : iniciar()} {...aspecto} />    {confirmando && confirmacion ? <ModalConfirmacionSocial cargando={guardando} completado={finalizacion.completado} {...confirmacion} peligro={peligro} alCerrar={() => {if(!ocupada.current)establecerConfirmando(false);}} alConfirmar={iniciar} {...aspecto} /> : null}
    {plan ? <ModalMovimientoSocial completado={finalizacion.completado} plan={plan} guardando={guardando} alCerrar={() => { if (!guardando) establecerPlan(null); }} alConfirmar={guardar} {...aspecto} /> : null}
  </>;
}
