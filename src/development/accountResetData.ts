import type {Conexion} from '../database/types';
import {aplicarCambios} from '../sync/journal';
import {TABLAS_SYNC, type CambioSync} from '../sync/protocol';

const AUXILIARES = ['incorporaciones_sociales_locales', 'comandos_sociales_locales', 'salas_online_locales', 'datos_sociales_online',
  'integraciones_outbox', 'integraciones_locales', 'avisos_locales', 'programaciones_avisos',
  'sync_outbox', 'sync_batch_authorization', 'sync_profile_backup', 'sync_profile_rejection', 'sync_last_success'] as const;

export async function borrarDatosLocalesReinicio(c: Conexion, usuarioId: string, conservarSincronizacion = false) {
  const cambios: CambioSync[] = [];
  for (const tabla of [...TABLAS_SYNC].reverse()) {
    if (tabla === 'usuarios') continue;
    const sql = ['movimientos', 'recurrencias', 'historial_saldos_deposito'].includes(tabla)
      ? `SELECT t.id FROM ${tabla} t JOIN depositos d ON d.id=t.deposito_id WHERE d.usuario_id=?`
      : `SELECT id FROM ${tabla} WHERE usuario_id=?`;
    for (const fila of await c.getAllAsync<{id: string}>(sql, [usuarioId])) {
      cambios.push({tabla, accion: 'eliminar', datos: {id: fila.id}});
    }
  }
  await c.execAsync('PRAGMA defer_foreign_keys=ON;');
  for (const tabla of AUXILIARES) await c.runAsync(`DELETE FROM ${tabla} WHERE usuario_id=?`, [usuarioId]);
  if (!conservarSincronizacion) {
    await c.runAsync('DELETE FROM sync_state WHERE usuario_id=?', [usuarioId]);
    await c.runAsync('DELETE FROM sync_authorization WHERE usuario_id=?', [usuarioId]);
  }
  await aplicarCambios(c, cambios);
}
