import { obtenerSesionActual } from '../authentication/sessionService';
import { ejecutarLecturaConConexion } from '../database/connectionQueue';
import { ejecutarTransaccion } from '../database/transactions';
import { avisarIntegraciones, encolarIntegracion, guardarDato, leerDato } from '../integrations/integrationStore';
import { ajustesPredeterminados, validarAjustes, type AjustesAvisos, type Aviso } from './types';

export async function cargarAjustesAvisos() { const { usuario } = await obtenerSesionActual(); return usuario ? leerDato(usuario.id, 'avisos:ajustes', ajustesPredeterminados()) : ajustesPredeterminados(); }
export async function guardarAjustesAvisos(datos: AjustesAvisos) {
  validarAjustes(datos); const { usuario } = await obtenerSesionActual(); if (!usuario) throw new Error('Iniciá sesión.');
  await ejecutarTransaccion(async c => {
    await guardarDato(c, usuario.id, 'avisos:ajustes', datos);
    await c.runAsync("DELETE FROM integraciones_outbox WHERE usuario_id=? AND ruta='/notificaciones/preferencias'", [usuario.id]);
    await encolarIntegracion(c, usuario.id, '/notificaciones/preferencias', { ...datos });
  }); avisarIntegraciones();
}
export async function consultarAvisos(filtro: 'todas' | 'pendientes' | 'no_vistas', limite = 30) {
  const { usuario } = await obtenerSesionActual(); if (!usuario) return { avisos: [] as Aviso[], total: 0, noVistas: 0 };
  return ejecutarLecturaConConexion(async c => {
    const condicion = filtro === 'pendientes' ? ' AND resuelta=0' : filtro === 'no_vistas' ? ' AND vista=0' : '';
    const filas = await c.getAllAsync<{ datos: string; vista: number; resuelta: number }>('SELECT datos,vista,resuelta FROM avisos_locales WHERE usuario_id=?' + condicion + ' ORDER BY fecha DESC,id DESC LIMIT ?', [usuario.id, limite]);
    const total = await c.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM avisos_locales WHERE usuario_id=?' + condicion, [usuario.id]);
    const noVistas = await c.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM avisos_locales WHERE usuario_id=? AND vista=0', [usuario.id]);
    return { avisos: filas.map(f => ({ ...JSON.parse(f.datos) as Aviso, vista: !!f.vista, resuelta: !!f.resuelta })), total: Number(total?.n || 0), noVistas: Number(noVistas?.n || 0) };
  });
}
export async function marcarAvisoVisto(id: string) {
  const { usuario } = await obtenerSesionActual(); if (!usuario) return;
  await ejecutarTransaccion(async c => {
    const fila = await c.getFirstAsync<{ remota: number; fecha: string }>('SELECT remota,fecha FROM avisos_locales WHERE usuario_id=? AND id=?', [usuario.id, id]);
    await c.runAsync('UPDATE avisos_locales SET vista=1 WHERE usuario_id=? AND id=?', [usuario.id, id]);
    await guardarDato(c, usuario.id, 'avisos:visto:' + id, fila?.fecha || new Date().toISOString());
    if (fila?.remota || /^[a-f0-9]{64}$/.test(id)) await encolarIntegracion(c, usuario.id, '/notificaciones/vistas', { ids: [id] });
  }); avisarIntegraciones();
}
export async function guardarAvisoLocal(aviso: Aviso) {
  const { usuario } = await obtenerSesionActual(); if (!usuario) return;
  await ejecutarTransaccion(c => c.runAsync('INSERT INTO avisos_locales(usuario_id,id,datos,fecha,vista,resuelta) VALUES(?,?,?,?,?,?) ON CONFLICT(usuario_id,id) DO UPDATE SET datos=excluded.datos,resuelta=excluded.resuelta', [usuario.id, aviso.id, JSON.stringify(aviso), aviso.fecha, aviso.vista ? 1 : 0, aviso.resuelta ? 1 : 0]));
}
