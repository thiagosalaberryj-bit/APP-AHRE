import { obtenerSesionActual } from '../authentication/sessionService';
import { ejecutarLecturaConConexion } from '../database/connectionQueue';
import { ejecutarTransaccion } from '../database/transactions';
import type { Recurrencia } from '../database/types';
import { avisarIntegraciones, leerDato } from '../integrations/integrationStore';
import { ESTADO_MP_INICIAL } from '../mercadoPago/mercadoPagoService';
import type { OperacionMp } from '../mercadoPago/types';
import { cargarAjustesAvisos } from './notificationService';
import { avisoLocalResuelto, planificarRecordatorios, type DatosRecordatorios } from './reminderPlanner';
import { cancelarAviso, notificacionesNativas, programarAviso } from './nativeAdapter';
import type { Aviso } from './types';
import type { DeudaOnline, OperacionPersonal } from '../social/online/types';
import { leerSalasOnline } from '../social/online/onlineStore';
import { pendientesSala } from '../social/roomPending';

export async function reconciliarRecordatorios() {
  const { usuario } = await obtenerSesionActual(); if (!usuario) { const n = await notificacionesNativas(); if (n) await n.cancelAllScheduledNotificationsAsync(); return; }
  const ajustes = await cargarAjustesAvisos();
  const contexto = await ejecutarLecturaConConexion(async c => {
    const registros = await c.getAllAsync<{ fecha: string }>('SELECT m.fecha_creacion AS fecha FROM movimientos m JOIN depositos d ON d.id=m.deposito_id WHERE d.usuario_id=? AND m.reversion_de_id IS NULL AND m.fecha_creacion>?', [usuario.id, new Date(Date.now() - 2 * 86400000).toISOString()]);
    const deudas = await c.getAllAsync<{ id: string; tipo: 'debo' | 'me_deben' }>("SELECT d.id,CASE WHEN propia.id=d.deudor_id THEN 'debo' ELSE 'me_deben' END AS tipo FROM deudas d JOIN personas propia ON propia.usuario_id=d.usuario_id AND propia.es_usuario_actual=1 WHERE d.usuario_id=? AND d.estado IN('pendiente','parcial')", [usuario.id]);
    const recurrencias = await c.getAllAsync<Recurrencia>('SELECT r.* FROM recurrencias r JOIN depositos d ON d.id=r.deposito_id WHERE d.usuario_id=? AND d.activo=1 AND r.activa=1', [usuario.id]);
    const estado = await leerDato(usuario.id, 'mp:estado', ESTADO_MP_INICIAL, c), operaciones = await leerDato<OperacionMp[]>(usuario.id, 'mp:operaciones', [], c);
    const datosSociales = await c.getFirstAsync<{ datos: string }>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='operaciones'", [usuario.id]);
    const personales = datosSociales ? JSON.parse(datosSociales.datos) as OperacionPersonal[] : [];
    const incorporadas = new Set((await c.getAllAsync<{ clave: string }>('SELECT clave FROM incorporaciones_sociales_locales WHERE usuario_id=?', [usuario.id])).map(f => f.clave));
    const salas = new Map<string, number>(); for (const p of personales) if (p.salaId && !p.incorporada && !incorporadas.has(p.clave)) salas.set(p.salaId, (salas.get(p.salaId) || 0) + 1);
    for(const detalle of await leerSalasOnline(usuario.id,c)){
      const pendientes=pendientesSala(detalle,personales,incorporadas).length;
      if(pendientes)salas.set(detalle.sala.id,pendientes);else salas.delete(detalle.sala.id);
    }
    const cacheDeudas = await c.getFirstAsync<{ datos: string }>("SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave='deudas'", [usuario.id]);
    const acuerdos = cacheDeudas ? JSON.parse(cacheDeudas.datos) as DeudaOnline[] : [];
    const deudasCompletas:DatosRecordatorios['deudas'] = deudas.filter(d => !acuerdos.some(a => a.estado === 'aceptada' && (a.origenLocalId === d.id || a.id === d.id)));
    for (const a of acuerdos) if (a.estado === 'aceptada' && a.pendiente > 0) deudasCompletas.push({ id: a.id, tipo: a.esDeudor ? 'debo' : 'me_deben',origenLocalId:a.origenLocalId??undefined });
    const activo = await c.getFirstAsync<{ notificaciones_activas: number }>('SELECT notificaciones_activas FROM preferencias WHERE usuario_id=?', [usuario.id]);
    return { activa: !!activo?.notificaciones_activas, datos: { registros: registros.map(f => f.fecha), deudas: deudasCompletas, recurrencias, mercadoPago: estado.vinculacion ? { pendientes: operaciones.filter(f => f.decision === 'pendiente' || f.revisionPendiente).length, depositoId: estado.vinculacion.deposito_id } : null, salas: [...salas].map(([id, pendientes]) => ({ id, pendientes })) } satisfies DatosRecordatorios };
  });
  const anteriores = await ejecutarLecturaConConexion(c => c.getAllAsync<{ clave: string; fecha: string; datos: string; nativo: string | null }>('SELECT * FROM programaciones_avisos WHERE usuario_id=?', [usuario.id]));
  let historialCambiado = false;
  // El historial registra el recordatorio generado; no afirma que Android lo haya mostrado.
  await ejecutarTransaccion(async c => {
    for (const fila of anteriores.filter(f => Date.parse(f.fecha) <= Date.now())) {
      const aviso = JSON.parse(fila.datos) as Aviso;
      const resultado = await c.runAsync('INSERT OR IGNORE INTO avisos_locales(usuario_id,id,datos,fecha,vista,resuelta) VALUES(?,?,?,?,0,?)', [usuario.id, aviso.id, fila.datos, fila.fecha, aviso.resuelta ? 1 : 0]);
      if (resultado.changes) historialCambiado = true;
    }
    const antiguos = await c.getAllAsync<{ id: string; datos: string }>('SELECT id,datos FROM avisos_locales WHERE usuario_id=? AND remota=0 AND resuelta=0', [usuario.id]);
    for (const fila of antiguos) {
      const aviso = JSON.parse(fila.datos) as Aviso;
      const resuelta = avisoLocalResuelto(aviso,contexto.datos);
      if (resuelta) { await c.runAsync('UPDATE avisos_locales SET resuelta=1 WHERE usuario_id=? AND id=?', [usuario.id, fila.id]); historialCambiado = true; }
    }
  });
  const siguientes = contexto.activa ? planificarRecordatorios(contexto.datos, ajustes).map(aviso => ({ ...aviso, detalles: ajustes.mostrarDetalles })) : [];
  const mapa = new Map(siguientes.map(f => [f.clave, f]));
  for (const fila of anteriores) {
    const nueva = mapa.get(fila.clave);
    if (!nueva || JSON.stringify(nueva) !== fila.datos) {
      if (fila.nativo) await cancelarAviso(fila.nativo);
      await ejecutarTransaccion(c => c.runAsync('DELETE FROM programaciones_avisos WHERE usuario_id=? AND clave=?', [usuario.id, fila.clave]));
    }
  }
  const n = await notificacionesNativas(), permitida = n ? (await n.getPermissionsAsync()).granted : false;
  if (n) for (const programada of await n.getAllScheduledNotificationsAsync()) {
    if (programada.content.data?.aplicacion === 'ahre' && programada.content.data.usuarioId !== usuario.id) await cancelarAviso(programada.identifier);
  }
  for (const aviso of siguientes) {
    if ((await obtenerSesionActual()).usuario?.id !== usuario.id) return;
    const anterior = anteriores.find(f => f.clave === aviso.clave && f.datos === JSON.stringify(aviso));
    if (anterior?.nativo && permitida) continue;
    if (anterior?.nativo) await cancelarAviso(anterior.nativo);
    const nativo = permitida ? await programarAviso(aviso, usuario.id, ajustes.mostrarDetalles) : null;
    await ejecutarTransaccion(c => c.runAsync('INSERT INTO programaciones_avisos(usuario_id,clave,fecha,datos,nativo) VALUES(?,?,?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET fecha=excluded.fecha,datos=excluded.datos,nativo=excluded.nativo', [usuario.id, aviso.clave, aviso.fecha, JSON.stringify(aviso), nativo]));
  }
  if (historialCambiado) avisarIntegraciones();
}
