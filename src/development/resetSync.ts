import { ejecutarConConexion, ejecutarLecturaConConexion } from '../database/connectionQueue';
import { generarIdentificador } from '../database/identifiers';
import { aplicarCambios } from '../sync/journal';
import { solicitarRemoto, type SesionRemota } from '../sync/remote';
import type { CambioSync, VersionSync } from '../sync/protocol';
import { cancelarAviso } from '../notifications/nativeAdapter';

type LoteReinicio = VersionSync['lote'] & { reinicioPruebas?: boolean; recursosEliminados?: string[]; actualizacionSocial?: boolean; ajustesSaldo?: Record<string,number> };
export function contieneRecurso(valor: unknown, recursos: Set<string>, campo = ''): boolean {
  if (typeof valor === 'string') {
    try { const datos: unknown = JSON.parse(valor); if (datos && typeof datos === 'object') return contieneRecurso(datos, recursos); } catch { /* Texto simple. */ }
    if (campo === 'clave' || campo === 'canal' || campo === 'autor') return [...recursos].some(id => valor === id || valor.endsWith(':' + id) || valor.includes(':' + id + ':'));
    if (campo === 'ruta') return valor.split('/').some(parte => recursos.has(decodeURIComponent(parte)));
    return /^(id|.*_id|.*Id|id[A-Z].*)$/.test(campo) && recursos.has(valor);
  }
  if (Array.isArray(valor)) return valor.some(v => contieneRecurso(v, recursos, campo));
  return !!valor && typeof valor === 'object' && Object.entries(valor).some(([clave, dato]) => contieneRecurso(dato, recursos, clave));
}
// Consumir bajas y cierres antes de subir el outbox conserva los acuerdos
// eliminados y suma el impacto del cierre a los saldos locales aún pendientes.
export async function recuperarReinicios(usuarioId: string, remota: SesionRemota, validar: (v: unknown) => { lotes: VersionSync[]; mas: boolean }) {
  let revision = await ejecutarLecturaConConexion(async c => Number((await c.getFirstAsync<{ revision: number }>('SELECT revision FROM sync_state WHERE usuario_id=?', [usuarioId]))?.revision || 0));
  const inicial = revision, versiones: VersionSync[] = [];
  let mas = true;
  while (mas) {
    const pagina = validar(await solicitarRemoto(`/sync?desde=${revision}`, undefined, remota.token));
    for (const version of pagina.lotes) {
      if (version.revision !== revision + 1) throw new Error('Secuencia remota incompleta.');
      versiones.push(version); revision = version.revision;
    }
    mas = pagina.mas;
    if (mas && !pagina.lotes.length) throw new Error('Paginación remota inválida.');
  }
  const reinicios = versiones.filter(v => (v.lote as LoteReinicio).reinicioPruebas === true);
  const sociales = versiones.filter(v => (v.lote as LoteReinicio).actualizacionSocial === true);
  if (!reinicios.length && !sociales.length) return false;
  const ajustes = new Map<string,number>();
  for (const version of sociales) for (const [id,importe] of Object.entries((version.lote as LoteReinicio).ajustesSaldo || {})) ajustes.set(id, Math.round(((ajustes.get(id)||0)+importe)*100)/100);
  const recursos = new Set(reinicios.flatMap(v => (v.lote as LoteReinicio).recursosEliminados || []));
  const eliminados = new Set(reinicios.flatMap(v => v.lote.cambios.filter(c => c.accion === 'eliminar').map(c => c.tabla + ':' + c.datos.id)));
  const confirmados = new Set(versiones.map(v => v.lote.id));
  const avisosNativos: string[] = [];
  await ejecutarConConexion(async c => {
    const actual = Number((await c.getFirstAsync<{ revision: number }>('SELECT revision FROM sync_state WHERE usuario_id=?', [usuarioId]))?.revision || 0);
    if (actual !== inicial) throw new Error('La revisión cambió al recuperar el reinicio.');
    const pendientes = await c.getAllAsync<{ secuencia: number; lote: string; cambio: string }>('SELECT secuencia,lote,cambio FROM sync_outbox WHERE usuario_id=? ORDER BY secuencia', [usuarioId]);
    const conservados: CambioSync[] = [];
    const lotes = new Map<string, typeof pendientes>();
    for (const fila of pendientes) lotes.set(fila.lote, [...(lotes.get(fila.lote) || []), fila]);
    for (const [lote, filas] of lotes) {
      const restantes = confirmados.has(lote) ? [] : filas.filter(f => { const cambio = JSON.parse(f.cambio) as CambioSync; return !eliminados.has(cambio.tabla + ':' + cambio.datos.id) && !contieneRecurso(cambio.datos, recursos); });
      let reajustado = false;
      for (const fila of restantes) {
        const cambio = JSON.parse(fila.cambio) as CambioSync;
        const ajuste = ajustes.get(String(cambio.tabla === 'depositos' ? cambio.datos.id : cambio.datos.deposito_id));
        if (!ajuste || cambio.accion !== 'guardar') continue;
        const campos = cambio.tabla === 'depositos' ? ['saldo_actual'] : cambio.tabla === 'historial_saldos_deposito' ? ['saldo_anterior','saldo_informado'] : [];
        for (const campo of campos) cambio.datos[campo] = Math.round((Number(cambio.datos[campo])+ajuste)*100)/100;
        if (campos.length) { fila.cambio = JSON.stringify(cambio); reajustado = true; }
      }
      conservados.push(...restantes.map(f => JSON.parse(f.cambio) as CambioSync));
      if (restantes.length === filas.length && !reajustado) continue;
      const nuevo = generarIdentificador();
      for (const fila of filas) {
        if (restantes.includes(fila)) await c.runAsync('UPDATE sync_outbox SET lote=?,cambio=? WHERE secuencia=?', [nuevo, fila.cambio, fila.secuencia]);
        else await c.runAsync('DELETE FROM sync_outbox WHERE secuencia=?', [fila.secuencia]);
      }
      await c.runAsync('DELETE FROM sync_batch_authorization WHERE usuario_id=? AND lote=?', [usuarioId, lote]);
      await c.runAsync('DELETE FROM sync_profile_backup WHERE usuario_id=? AND lote=?', [usuarioId, lote]);
      await c.runAsync('DELETE FROM sync_profile_rejection WHERE usuario_id=? AND lote=?', [usuarioId, lote]);
      if (restantes.length) await c.runAsync('INSERT INTO sync_batch_authorization(lote,usuario_id,generacion) VALUES(?,?,?)', [nuevo, usuarioId, remota.generacion]);
    }
    await c.execAsync('PRAGMA defer_foreign_keys=ON;');
    await aplicarCambios(c, [...versiones.flatMap(v => v.lote.cambios), ...conservados]);
    // Invalidar únicamente comandos/cachés/avisos que mencionen lo eliminado.
    for (const tabla of ['datos_sociales_online', 'salas_online_locales', 'comandos_sociales_locales', 'avisos_locales', 'incorporaciones_sociales_locales', 'integraciones_outbox', 'integraciones_locales', 'programaciones_avisos']) {
      const filas = await c.getAllAsync<Record<string, string>>(`SELECT * FROM ${tabla} WHERE usuario_id=?`, [usuarioId]);
      const clave = ['datos_sociales_online', 'incorporaciones_sociales_locales', 'integraciones_locales', 'programaciones_avisos'].includes(tabla) ? 'clave' : tabla === 'salas_online_locales' ? 'sala_id' : 'id';
      for (const fila of filas) if (contieneRecurso(fila, recursos)) {
        if (tabla === 'programaciones_avisos' && fila.nativo) avisosNativos.push(fila.nativo);
        await c.runAsync(`DELETE FROM ${tabla} WHERE usuario_id=? AND ${clave}=?`, [usuarioId, fila[clave]!]);
      }
    }
    // Los listados derivados se vuelven a descargar sin tocar las finanzas.
    await c.runAsync("DELETE FROM datos_sociales_online WHERE usuario_id=? AND clave IN ('deudas','vinculos','operaciones')", [usuarioId]);
    await c.runAsync('UPDATE sync_state SET revision=? WHERE usuario_id=?', [revision, usuarioId]);
  });
  for (const aviso of avisosNativos) await cancelarAviso(aviso);
  return true;
}
