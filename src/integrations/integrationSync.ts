import { obtenerSesionActual } from '../authentication/sessionService';
import { obtenerSesionRemota, solicitarRemoto } from '../sync/remote';
import { ejecutarLecturaConConexion } from '../database/connectionQueue';
import { ejecutarTransaccion } from '../database/transactions';
import { avisarIntegraciones, guardarDato, leerDato } from './integrationStore';
import { ESTADO_MP_INICIAL, solicitarConsultaMp } from '../mercadoPago/mercadoPagoService';
import type { EstadoMp, OperacionMp } from '../mercadoPago/types';
import type { AjustesAvisos, Aviso } from '../notifications/types';

let enCurso: Promise<void> | null = null;
export function sincronizarIntegraciones(soloCancelaciones = false, pedirAutomatica = true): Promise<void> {
  if (enCurso) return enCurso;
  enCurso = ejecutarSincronizacion(soloCancelaciones, pedirAutomatica).finally(() => { enCurso = null; });
  return enCurso;
}
async function ejecutarSincronizacion(soloCancelaciones: boolean, pedirAutomatica: boolean) {
    const { usuario } = await obtenerSesionActual(); if (!usuario) return;
    const remota = await obtenerSesionRemota(usuario.id); if (!remota) return;
    const vigente = async () => (await obtenerSesionActual()).usuario?.id === usuario.id;
    const pendientes = await ejecutarLecturaConConexion(c => c.getAllAsync<{ id: string; ruta: string; datos: string; prioridad: number }>('SELECT * FROM integraciones_outbox WHERE usuario_id=? ORDER BY prioridad,secuencia', [usuario.id]));
    for (const fila of pendientes) {
      if (!await vigente()) return;
      if (soloCancelaciones && fila.prioridad !== 0) continue;
      if (fila.ruta === '/mercado-pago/decisiones') {
        const financiero = await ejecutarLecturaConConexion(c => c.getFirstAsync('SELECT secuencia FROM sync_outbox WHERE usuario_id=? LIMIT 1', [usuario.id]));
        if (financiero) break;
      }
      await solicitarRemoto(fila.ruta, JSON.parse(fila.datos), remota.token);
      if (!await vigente()) return;
      await ejecutarTransaccion(c => c.runAsync('DELETE FROM integraciones_outbox WHERE usuario_id=? AND id=?', [usuario.id, fila.id]));
    }
    if (soloCancelaciones) return;
    let estado = await solicitarRemoto<EstadoMp>('/mercado-pago', undefined, remota.token);
    if (estado.identificacionDisponible) {
      await solicitarRemoto('/mercado-pago/identificar', {}, remota.token);
      estado = await solicitarRemoto<EstadoMp>('/mercado-pago', undefined, remota.token);
    }
    if (estado.vinculacion && pedirAutomatica && !estado.automatica?.usadaHoy) {
      await solicitarConsultaMp('automatica', usuario.id);
      estado = await solicitarRemoto<EstadoMp>('/mercado-pago', undefined, remota.token);
    }
    if (!await vigente()) return;
    const operaciones: OperacionMp[] = [];
    if (estado.vinculacion) {
      let desde: string | null = '';
      do {
        const pagina: { operaciones: OperacionMp[]; siguiente: string | null } = await solicitarRemoto('/mercado-pago/operaciones?desde=' + encodeURIComponent(desde || ''), undefined, remota.token);
        if (!Array.isArray(pagina.operaciones) || pagina.siguiente === desde) throw new Error('La página de Mercado Pago no es válida.');
        operaciones.push(...pagina.operaciones); desde = pagina.siguiente;
      } while (desde);
    }
    if (!await vigente()) return;
    await ejecutarTransaccion(async c => {
      if (await c.getFirstAsync("SELECT id FROM integraciones_outbox WHERE usuario_id=? AND ruta='/mercado-pago/desvincular'", [usuario.id])) return;
      await guardarDato(c, usuario.id, 'mp:estado', estado);
      const previas = await leerDato<OperacionMp[]>(usuario.id, 'mp:operaciones', [], c);
      const decisiones = await c.getAllAsync<{ datos: string }>("SELECT datos FROM integraciones_outbox WHERE usuario_id=? AND ruta='/mercado-pago/decisiones'", [usuario.id]);
      const protegidas = new Set(decisiones.map(f => (JSON.parse(f.datos) as { pagoId: string }).pagoId));
      await guardarDato(c, usuario.id, 'mp:operaciones', operaciones.map(op => protegidas.has(op.id) ? previas.find(f => f.id === op.id) || op : op));
    });
    // Recuperar todas las páginas permite reflejar resoluciones sobre avisos antiguos.
    let antes: string | null = '';
    do {
      const pagina: { avisos: Aviso[]; siguiente: string | null } = await solicitarRemoto('/notificaciones?antes=' + encodeURIComponent(antes || ''), undefined, remota.token);
      if (!await vigente()) return;
      await ejecutarTransaccion(async c => {
        for (const aviso of pagina.avisos) {
          const vistaLocal = await leerDato<string | null>(usuario.id, 'avisos:visto:' + aviso.id, null, c);
          if (vistaLocal && vistaLocal >= aviso.fecha) aviso.vista = true;
          if (aviso.tipo === 'mercado_pago' && await c.getFirstAsync("SELECT id FROM integraciones_outbox WHERE usuario_id=? AND ruta='/mercado-pago/decisiones' LIMIT 1", [usuario.id])) {
            const locales = await leerDato<OperacionMp[]>(usuario.id, 'mp:operaciones', [], c);
            aviso.pendientes = locales.filter(f => f.decision === 'pendiente' || f.revisionPendiente).length;
            aviso.resuelta = aviso.pendientes === 0;
            aviso.mensaje = `${locales.length} obtenidos · ${aviso.pendientes} pendientes`;
          }
          await c.runAsync('INSERT INTO avisos_locales(usuario_id,id,datos,fecha,vista,resuelta,remota) VALUES(?,?,?,?,?,?,1) ON CONFLICT(usuario_id,id) DO UPDATE SET datos=excluded.datos,fecha=excluded.fecha,vista=CASE WHEN avisos_locales.fecha>=excluded.fecha THEN MAX(avisos_locales.vista,excluded.vista) ELSE excluded.vista END,resuelta=excluded.resuelta', [usuario.id, aviso.id, JSON.stringify(aviso), aviso.fecha, aviso.vista ? 1 : 0, aviso.resuelta ? 1 : 0]);
        }
      });
      if (pagina.siguiente === antes) throw new Error('Historial de avisos inválido.'); antes = pagina.siguiente;
    } while (antes);
    if (!await vigente()) return;
    const ajustes = await solicitarRemoto<AjustesAvisos>('/notificaciones/preferencias', undefined, remota.token);
    await ejecutarTransaccion(async c => {
      if (!await c.getFirstAsync("SELECT id FROM integraciones_outbox WHERE usuario_id=? AND ruta='/notificaciones/preferencias'", [usuario.id])) await guardarDato(c, usuario.id, 'avisos:ajustes', ajustes);
    });
    avisarIntegraciones();
}
