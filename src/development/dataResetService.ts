import * as SecureStore from 'expo-secure-store';
import { ejecutarConConexion, ejecutarLecturaConConexion } from '../database/connectionQueue';
import { generarIdentificador } from '../database/identifiers';
import { obtenerSesionActual, cerrarSesion } from '../authentication/sessionService';
import { ErrorRemoto, obtenerSesionRemota, solicitarRemoto } from '../sync/remote';
import { operacionFinancieraEnCurso } from '../social/financialOperation';
import { cancelarAviso, notificacionesNativas } from '../notifications/nativeAdapter';
import { pausarParaReinicio } from './testResetState';
import { borrarDatosLocalesReinicio } from './accountResetData';

const CLAVE_RECUPERACION = 'ahre.pruebas.reinicio';
export interface VistaReinicio {
  alcance: 'cuenta_propia'; huella: string; cantidades: Record<string, number>;
  cuentas: { id: string; correo: string }[];
}
interface ReciboReinicio { usuarioId: string; token: string; operacion: string; confirmado: boolean; }

export async function consultarReinicio(): Promise<VistaReinicio> {
  const continuar=await pausarParaReinicio();
  try {
    const { usuario } = await obtenerSesionActual();
    const remota = usuario && await obtenerSesionRemota(usuario.id);
    if (!remota) throw new Error('Iniciá sesión con conexión. El reinicio requiere confirmar también el servidor.');
    const vista = await solicitarRemoto<VistaReinicio>('/testing/reset/preview', undefined, remota.token, 30000);
    if (vista?.alcance !== 'cuenta_propia' || !vista.huella || vista.cuentas?.length !== 1 || vista.cuentas[0]?.id !== usuario?.id) {
      throw new Error('El servidor todavía no permite reiniciar solo tus datos.');
    }
    return vista;
  } finally { continuar(); }
}

async function limpiarLocal(usuarioId: string) {
  const avisos = await ejecutarLecturaConConexion(c => c.getAllAsync<{ nativo: string | null }>('SELECT nativo FROM programaciones_avisos WHERE usuario_id=?', [usuarioId]));
  for (const aviso of avisos) if (aviso.nativo) await cancelarAviso(aviso.nativo);
  const notificaciones = await notificacionesNativas();
  if (notificaciones?.getPresentedNotificationsAsync) {
    for (const aviso of await notificaciones.getPresentedNotificationsAsync()) if (aviso.request.content.data?.usuarioId === usuarioId) await notificaciones.dismissNotificationAsync(aviso.request.identifier);
  }
  await ejecutarConConexion(c => borrarDatosLocalesReinicio(c, usuarioId));
  await SecureStore.deleteItemAsync(`ahre.saldos_ocultos.${usuarioId}`);
  const destino = await SecureStore.getItemAsync('ahre.notificacion.destino');
  if (destino && JSON.parse(destino).usuarioId === usuarioId) await SecureStore.deleteItemAsync('ahre.notificacion.destino');
  await cerrarSesion();
  await SecureStore.deleteItemAsync(CLAVE_RECUPERACION);
}

// Se ejecuta antes de montar navegación/controladores. Solo borra SQLite con
// recibo confirmado; una respuesta ambigua conserva datos y bloquea el inicio.
export async function completarReinicioPendiente() {
  const guardado = await SecureStore.getItemAsync(CLAVE_RECUPERACION);
  if (!guardado) return;
  const recibo = JSON.parse(guardado) as ReciboReinicio;
  if (!recibo.confirmado) {
    const resultado = await solicitarRemoto<{ reiniciado: boolean; usuarioId: string }>('/testing/reset/receipt?operacion=' + encodeURIComponent(recibo.operacion), undefined, recibo.token, 30000);
    if (resultado.usuarioId !== recibo.usuarioId) throw new Error('El recibo de reinicio corresponde a otra cuenta.');
    if (!resultado.reiniciado) { await SecureStore.deleteItemAsync(CLAVE_RECUPERACION); return; }
    recibo.confirmado = true;
    await SecureStore.setItemAsync(CLAVE_RECUPERACION, JSON.stringify(recibo));
  }
  await limpiarLocal(recibo.usuarioId);
}

export async function reiniciarDatos(vista: VistaReinicio, correo: string, contrasena: string, confirmacion: string) {
  if (vista.alcance !== 'cuenta_propia' || !vista.huella) {
    throw new Error('Volvé a consultar la vista previa para reiniciar solo tus datos.');
  }
  if (operacionFinancieraEnCurso()) throw new Error('Esperá a que termine el guardado o la eliminación.');
  const continuar = await pausarParaReinicio();
  let liberar=true;
  try {
    const { usuario } = await obtenerSesionActual();
    const remota = usuario && await obtenerSesionRemota(usuario.id);
    if (!usuario || !remota) throw new Error('Iniciá sesión con conexión antes de reiniciar.');
    if (vista.cuentas.length !== 1 || vista.cuentas[0]?.id !== usuario.id || vista.cuentas[0].correo !== correo) {
      throw new Error('Volvé a consultar la vista previa para la cuenta actual.');
    }
    const recibo: ReciboReinicio = { usuarioId: usuario.id, token: remota.token, operacion: generarIdentificador(), confirmado: false };
    await SecureStore.setItemAsync(CLAVE_RECUPERACION, JSON.stringify(recibo));
    try {
      const respuesta = await solicitarRemoto<{ reiniciado: boolean; usuarioId: string }>('/testing/reset', { huella: vista.huella, correo, contrasena, confirmacion, operacion: recibo.operacion }, remota.token, 30000);
      if (respuesta.reiniciado !== true || respuesta.usuarioId !== usuario.id) throw new Error('El recibo de reinicio no es válido.');
      recibo.confirmado = true;
      await SecureStore.setItemAsync(CLAVE_RECUPERACION, JSON.stringify(recibo));
    } catch (error) {
      // Un rechazo explícito no es un resultado ambiguo. Una confirmación
      // inválida conserva los datos sin dejar recuperación pendiente.
      if (!recibo.confirmado && error instanceof ErrorRemoto && [400, 401, 403, 409].includes(error.estado)) {
        await SecureStore.deleteItemAsync(CLAVE_RECUPERACION);
        throw error;
      }
      // El endpoint de recibos espera el mismo bloqueo transaccional del POST.
      // No interpretar un timeout como un borrado fallido.
      try { await completarReinicioPendiente(); } catch {
        liberar=false;
        throw new Error('No se pudo confirmar el reinicio. Cerrá y abrí AHRE con conexión para recuperar el resultado antes de continuar.');
      }
      if (!recibo.confirmado && await ejecutarLecturaConConexion(c => c.getFirstAsync('SELECT usuario_id FROM sync_authorization WHERE usuario_id=?', [usuario.id]))) throw error;
      return;
    }
    try { await limpiarLocal(usuario.id); } catch { liberar=false;throw new Error('El servidor ya se reinició. Reabrí AHRE para completar la limpieza local.'); }
  } finally { if(liberar)continuar(); }
}
