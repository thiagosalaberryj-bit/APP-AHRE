import * as SecureStore from 'expo-secure-store';
import { ejecutarConConexion, ejecutarLecturaConConexion } from '../database/connectionQueue';
import { generarIdentificador } from '../database/identifiers';
import { obtenerSesionActual, cerrarSesion } from '../authentication/sessionService';
import { ErrorRemoto, obtenerSesionRemota, solicitarRemoto } from '../sync/remote';
import { aplicarCambios } from '../sync/journal';
import { TABLAS_SYNC, type CambioSync } from '../sync/protocol';
import { operacionFinancieraEnCurso } from '../social/financialOperation';
import { cancelarAviso, notificacionesNativas } from '../notifications/nativeAdapter';
import { pausarParaReinicio } from './testResetState';

const CLAVE_RECUPERACION = 'ahre.pruebas.reinicio';
const AUXILIARES = ['incorporaciones_sociales_locales', 'comandos_sociales_locales', 'salas_online_locales', 'datos_sociales_online',
  'integraciones_outbox', 'integraciones_locales', 'avisos_locales', 'programaciones_avisos',
  'sync_outbox', 'sync_batch_authorization', 'sync_profile_backup', 'sync_profile_rejection', 'sync_state', 'sync_last_success', 'sync_authorization'] as const;
export interface VistaReinicio {
  huella: string; cantidades: Record<string, number>; salasActualizadas: number;
  cuentas: { id: string; correo: string }[];
}
interface ReciboReinicio { usuarioId: string; token: string; operacion: string; confirmado: boolean; }

export async function consultarReinicio(): Promise<VistaReinicio> {
  const { usuario } = await obtenerSesionActual();
  const remota = usuario && await obtenerSesionRemota(usuario.id);
  if (!remota) throw new Error('Iniciá sesión con conexión. El reinicio requiere confirmar también el servidor.');
  return solicitarRemoto('/testing/reset/preview', undefined, remota.token, 30000);
}

async function limpiarLocal(usuarioId: string) {
  const avisos = await ejecutarLecturaConConexion(c => c.getAllAsync<{ nativo: string | null }>('SELECT nativo FROM programaciones_avisos WHERE usuario_id=?', [usuarioId]));
  for (const aviso of avisos) if (aviso.nativo) await cancelarAviso(aviso.nativo);
  const notificaciones = await notificacionesNativas();
  if (notificaciones?.getPresentedNotificationsAsync) {
    for (const aviso of await notificaciones.getPresentedNotificationsAsync()) if (aviso.request.content.data?.usuarioId === usuarioId) await notificaciones.dismissNotificationAsync(aviso.request.identifier);
  }
  await ejecutarConConexion(async c => {
    const cambios: CambioSync[] = [];
    for (const tabla of [...TABLAS_SYNC].reverse()) {
      if (tabla === 'usuarios') continue;
      const sql = ['movimientos', 'recurrencias', 'historial_saldos_deposito'].includes(tabla)
        ? `SELECT t.id FROM ${tabla} t JOIN depositos d ON d.id=t.deposito_id WHERE d.usuario_id=?`
        : `SELECT id FROM ${tabla} WHERE usuario_id=?`;
      for (const fila of await c.getAllAsync<{ id: string }>(sql, [usuarioId])) cambios.push({ tabla, accion: 'eliminar', datos: { id: fila.id } });
    }
    await c.execAsync('PRAGMA defer_foreign_keys=ON;');
    for (const tabla of AUXILIARES) await c.runAsync(`DELETE FROM ${tabla} WHERE usuario_id=?`, [usuarioId]);
    await aplicarCambios(c, cambios);
    // La cuenta y su verificador de contraseña permanecen; el siguiente login
    // recupera una instantánea vacía y vuelve a crear preferencias por defecto.
  });
  await SecureStore.deleteItemAsync(`ahre.saldos_ocultos.${usuarioId}`);
  await SecureStore.deleteItemAsync('ahre.invitacion.pendiente');
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
  if (operacionFinancieraEnCurso()) throw new Error('Esperá a que termine el guardado o la eliminación.');
  const continuar = await pausarParaReinicio();
  let liberar=true;
  try {
    const { usuario } = await obtenerSesionActual();
    const remota = usuario && await obtenerSesionRemota(usuario.id);
    if (!usuario || !remota) throw new Error('Iniciá sesión con conexión antes de reiniciar.');
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
