import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Linking, Platform } from 'react-native';
import { NOMBRES_AVISO, TIPOS_AVISO, type Aviso } from './types';
export { consultarAlarmasExactas, abrirAjustesAlarmasExactas } from './exactAlarmAdapter';
let modulo: Promise<typeof import('expo-notifications') | null> | null = null;
export async function notificacionesNativas() {
  if (Platform.OS === 'web') return null;
  return modulo ??= import('expo-notifications').then(n => {
    n.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) }); return n;
  }).catch(() => null);
}
export async function prepararCanales() { const n = await notificacionesNativas(); if (n && Platform.OS === 'android') for (const tipo of TIPOS_AVISO) await n.setNotificationChannelAsync(tipo, { name: NOMBRES_AVISO[tipo], importance: n.AndroidImportance.DEFAULT, lockscreenVisibility: n.AndroidNotificationVisibility.PRIVATE }); }
export async function consultarPermisoAvisos() { const n = await notificacionesNativas(); if (!n) return 'No disponible'; const p = await n.getPermissionsAsync(); return p.granted ? 'Permitidas' : p.canAskAgain ? 'Sin permiso' : 'Desactivadas en Ajustes'; }
export async function consultarCanalesAvisos(): Promise<Record<string, boolean>> { const n = await notificacionesNativas(); if (!n || Platform.OS !== 'android') return {}; return Object.fromEntries((await n.getNotificationChannelsAsync()).map(c => [c.id, c.importance !== n.AndroidImportance.NONE])); }
export async function solicitarPermisoAvisos() { await prepararCanales(); const n = await notificacionesNativas(); if (n) await n.requestPermissionsAsync(); return consultarPermisoAvisos(); }
export async function activarAvisosTelefono(){
 const permiso=await consultarPermisoAvisos();
 if(permiso==='Sin permiso'){
  if(Platform.OS==='android'&&Number(Platform.Version)<33){await Linking.openSettings();return permiso;}
  return solicitarPermisoAvisos();
 }
 if(permiso==='Desactivadas en Ajustes')await Linking.openSettings();
 return permiso;
}
export async function obtenerTokenPush() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  const n = await notificacionesNativas(); if (!n || !(await n.getPermissionsAsync()).granted) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined; if (!projectId) return null;
  return (await n.getExpoPushTokenAsync({ projectId })).data;
}
export async function programarAviso(aviso: Aviso, usuarioId: string, detalles: boolean) {
  const n = await notificacionesNativas(); if (!n || !(await n.getPermissionsAsync()).granted) return null;
  return n.scheduleNotificationAsync({ identifier: usuarioId + ':' + aviso.id, content: { title: detalles ? aviso.titulo : 'AHRE', body: detalles ? aviso.mensaje : 'Tenés un recordatorio para revisar en AHRE.', sound: 'default', data: { aplicacion: 'ahre', usuarioId, avisoId: aviso.id, destino: aviso.destino } }, trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: new Date(aviso.fecha), channelId: aviso.tipo } });
}
export async function cancelarAviso(id: string) { const n = await notificacionesNativas(); if (n) await n.cancelScheduledNotificationAsync(id); }
