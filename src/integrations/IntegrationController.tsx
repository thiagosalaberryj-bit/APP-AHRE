import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { obtenerSesionActual } from '../authentication/sessionService';
import { observarCambiosLocales } from '../sync/journal';
import { observarSincronizacion } from '../sync/syncService';
import { observarSocialOnline } from '../social/online/onlineStore';
import { referenciaNavegacion } from '../navigation/invitationNavigation';
import { RUTAS } from '../constants/routes';
import { observarIntegraciones } from './integrationStore';
import { sincronizarIntegraciones } from './integrationSync';
import { reconciliarRecordatorios } from '../notifications/reminderService';
import { notificacionesNativas, obtenerTokenPush, prepararCanales } from '../notifications/nativeAdapter';
import { obtenerSesionRemota, solicitarRemoto } from '../sync/remote';
import { marcarAvisoVisto } from '../notifications/notificationService';
import { esDestinoAviso, navegarAviso } from '../notifications/notificationNavigation';
import type { DestinoAviso } from '../notifications/types';

const CLAVE_DESTINO = 'ahre.notificacion.destino';
export default function ControladorIntegraciones() {
  useEffect(() => {
    let cerrado = false, ocupado = false, recargaPendiente = false, ultimoRemoto = 0, ultimoLocal = 0, tokenRegistrado = '', usuarioAnterior = '';
    let quitarRespuesta: (() => void) | undefined;
    const recordar = async (datos: Record<string, unknown> = {}) => {
      if (typeof datos.usuarioId !== 'string' || typeof datos.avisoId !== 'string' || !esDestinoAviso(datos.destino)) return;
      await SecureStore.setItemAsync(CLAVE_DESTINO, JSON.stringify({ usuarioId: datos.usuarioId, avisoId: datos.avisoId, destino: datos.destino }));
      void ejecutar();
    };
    const ejecutar = async (forzar = false) => {
      if (cerrado || ocupado || AppState.currentState !== 'active') return; ocupado = true;
      try {
        const { usuario } = await obtenerSesionActual();
        if (usuarioAnterior && usuarioAnterior !== usuario?.id) { const n = await notificacionesNativas(); if (n) { await n.cancelAllScheduledNotificationsAsync(); await n.dismissAllNotificationsAsync(); } tokenRegistrado = ''; ultimoRemoto = 0; }
        usuarioAnterior = usuario?.id || '';
        if (!usuario) return;
        const ruta = referenciaNavegacion.getCurrentRoute()?.name;
        if (!ruta || [RUTAS.INICIO, RUTAS.INICIO_SESION, RUTAS.REGISTRO].includes(ruta as never)) return;
        const pendiente = await SecureStore.getItemAsync(CLAVE_DESTINO);
        if (pendiente && referenciaNavegacion.isReady()) {
          const dato = JSON.parse(pendiente) as { usuarioId: string; avisoId: string; destino: DestinoAviso };
          if (dato.usuarioId === usuario.id) { await marcarAvisoVisto(dato.avisoId); await SecureStore.deleteItemAsync(CLAVE_DESTINO); navegarAviso(referenciaNavegacion, dato.destino); }
        }
        if (forzar || Date.now() - ultimoLocal > 60000) { ultimoLocal = Date.now(); await reconciliarRecordatorios(); }
        if (Date.now() - ultimoRemoto > 15000) {
          ultimoRemoto = Date.now();
          try { await sincronizarIntegraciones(true); await sincronizarIntegraciones(); } catch { /* La cola conserva las decisiones y el historial disponible. */ }
          if ((await obtenerSesionActual()).usuario?.id !== usuario.id) return;
          const remota = await obtenerSesionRemota(usuario.id);
          if (remota && !tokenRegistrado) {
            try { const token = await obtenerTokenPush(); if (token) { await solicitarRemoto('/notificaciones/dispositivo', { activo: true, token }, remota.token); tokenRegistrado = token; } } catch { /* Expo Go y equipos sin FCM conservan el historial. */ }
          }
        }
      } finally { ocupado = false; if (recargaPendiente && !cerrado) { recargaPendiente = false; queueMicrotask(() => ejecutarSeguro(true)); } }
    };
    void prepararCanales().catch(() => {});
    void notificacionesNativas().then(async n => {
      if (!n || cerrado) return;
      const escucha = n.addNotificationResponseReceivedListener(r => { void recordar(r.notification.request.content.data); }); quitarRespuesta = () => escucha.remove();
      const ultima = n.getLastNotificationResponse(); if (ultima) { await recordar(ultima.notification.request.content.data); n.clearLastNotificationResponse(); }
    }).catch(() => {});
    const ejecutarSeguro = (forzar = false) => { if (ocupado) { if (forzar) recargaPendiente = true; return; } void ejecutar(forzar).catch(() => {}); };
    const temporizador = setInterval(() => ejecutarSeguro(), 3000);
    const dejarLocal = observarCambiosLocales(() => ejecutarSeguro(true)), dejarSocial = observarSocialOnline(() => ejecutarSeguro(true)), dejarIntegraciones = observarIntegraciones(() => ejecutarSeguro(true));
    const dejarSync = observarSincronizacion(v => { if (v.estado === 'online') ejecutarSeguro(true); });
    const escucha = AppState.addEventListener('change', estado => { if (estado === 'active') { ultimoRemoto = 0; tokenRegistrado = ''; ejecutarSeguro(true); } });
    ejecutarSeguro(true);
    return () => { cerrado = true; clearInterval(temporizador); dejarLocal(); dejarSocial(); dejarIntegraciones(); dejarSync(); escucha.remove(); quitarRespuesta?.(); };
  }, []);
  return null;
}
