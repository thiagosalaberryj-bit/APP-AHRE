import { ErrorBaseDatos } from '../database/errors';
import * as Crypto from 'expo-crypto';
import { obtenerSesionActual } from '../authentication/sessionService';
import { ErrorRemoto, obtenerSesionRemota, solicitarRemoto } from '../sync/remote';
import { sincronizarCuenta, obtenerVistaSincronizacion } from '../sync/syncService';
import { ejecutarTransaccion } from '../database/transactions';
import { ejecutarLecturaConConexion } from '../database/connectionQueue';
import type { Conexion } from '../database/types';
import { movimientosRepositorio, depositosRepositorio } from '../database/repositories';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { generarIdentificador } from '../database/identifiers';
import { avisarIntegraciones, encolarIntegracion, guardarDato, leerDato } from '../integrations/integrationStore';
import type { BorradorMp, ConsultaMp, EstadoMp, OperacionMp } from './types';

class ErrorMercadoPago extends ErrorBaseDatos { constructor(mensaje: string) { super('integridad'); this.message = mensaje; this.name = 'ErrorMercadoPago'; } }

export const ESTADO_MP_INICIAL: EstadoMp = { vinculacion: null, trabajo: null, configurada: false, manualesRestantes: 2 };
export function resolverBorradorMp(op: OperacionMp, borrador?: BorradorMp): BorradorMp {
  return { tipo: op.tipo, categoria: op.tipo && borrador?.tipo === op.tipo ? borrador.categoria : op.categoria, descripcion: borrador?.descripcion ?? op.descripcion };
}
export async function usuarioIntegraciones() { const { usuario } = await obtenerSesionActual(); if (!usuario) throw new ErrorMercadoPago('Iniciá sesión para continuar.'); return usuario; }
export async function cargarMercadoPago() {
  const usuario = await usuarioIntegraciones();
  return { estado: await leerDato(usuario.id, 'mp:estado', ESTADO_MP_INICIAL), operaciones: await leerDato<OperacionMp[]>(usuario.id, 'mp:operaciones', []) };
}
export async function consultarResumenMp() {
  const { estado, operaciones } = await cargarMercadoPago();
  if (!estado.vinculacion) return null;
  return { depositoId: estado.vinculacion.deposito_id, obtenidos: operaciones.length, pendientes: operaciones.filter(op => op.decision === 'pendiente' || op.revisionPendiente).length };
}
export async function consultarHistorialMp() {
  const usuario = await usuarioIntegraciones(), remota = await obtenerSesionRemota(usuario.id);
  if (remota) {
    try {
    const { consultas } = await solicitarRemoto<{ consultas: ConsultaMp[] }>('/mercado-pago/consultas', undefined, remota.token);
    if ((await obtenerSesionActual()).usuario?.id !== usuario.id) return [];
    await ejecutarTransaccion(c => guardarDato(c, usuario.id, 'mp:consultas', consultas));
    return consultas;
    } catch (error) { if (!(error instanceof ErrorRemoto) || error.estado !== 0) throw error; }
  }
  if ((await obtenerSesionActual()).usuario?.id !== usuario.id) return [];
  return leerDato<ConsultaMp[]>(usuario.id, 'mp:consultas', []);
}
export async function iniciarVinculacion(depositoId: string, meses: number, renovar = false) {
  const usuario = await usuarioIntegraciones(), remota = await obtenerSesionRemota(usuario.id);
  if (!remota) throw new ErrorMercadoPago('Iniciá sesión con conexión antes de vincular Mercado Pago.');
  await sincronizarCuenta(usuario.id);
  if (obtenerVistaSincronizacion().estado !== 'online') throw new ErrorMercadoPago('Sincronizá tus datos antes de vincular Mercado Pago.');
  const cancelacion = await ejecutarLecturaConConexion(c => c.getFirstAsync('SELECT id FROM integraciones_outbox WHERE usuario_id=? AND prioridad=0', [usuario.id]));
  if (cancelacion) throw new ErrorMercadoPago('Esperá a que se confirme la desvinculación anterior.');
  return solicitarRemoto<{ url: string }>('/mercado-pago/oauth/iniciar', { depositoId, meses, renovar }, remota.token);
}
export async function solicitarConsultaMp(clase: 'automatica' | 'manual', usuarioId?: string) {
  const usuario = await usuarioIntegraciones(); if (usuarioId && usuarioId !== usuario.id) return;
  const remota = await obtenerSesionRemota(usuario.id); if (!remota) return;
  return solicitarRemoto<{ estado: string }>('/mercado-pago/consultas', { clase, idOperacion: generarIdentificador() }, remota.token);
}
export async function desvincularEnConexion(c: Conexion, usuarioId: string, depositoId?: string) {
  const estado = await leerDato(usuarioId, 'mp:estado', ESTADO_MP_INICIAL, c);
  if (depositoId && estado.vinculacion?.deposito_id !== depositoId) return;
  const version = estado.vinculacion?.version;
  await encolarIntegracion(c, usuarioId, '/mercado-pago/desvincular', { ...(version ? { version } : {}) }, 0);
  await guardarDato(c, usuarioId, 'mp:estado', { ...estado, vinculacion: null });
  await guardarDato(c, usuarioId, 'mp:operaciones', []);
  await c.runAsync("DELETE FROM integraciones_outbox WHERE usuario_id=? AND ruta='/mercado-pago/decisiones'", [usuarioId]);
  await c.runAsync("UPDATE avisos_locales SET resuelta=1 WHERE usuario_id=? AND json_extract(datos,'$.tipo')='mercado_pago'", [usuarioId]);
}
export async function desvincularMercadoPago() { const usuario = await usuarioIntegraciones(); await ejecutarTransaccion(c => desvincularEnConexion(c, usuario.id)); avisarIntegraciones(); }
export async function guardarBorradorMp(id: string, borrador: BorradorMp) { const usuario = await usuarioIntegraciones(); await ejecutarTransaccion(c => guardarDato(c, usuario.id, 'mp:borrador:' + id, borrador)); }
export async function cargarBorradoresMp() {
  const usuario = await usuarioIntegraciones();
  return ejecutarLecturaConConexion(async c => Object.fromEntries((await c.getAllAsync<{ clave: string; datos: string }>("SELECT clave,datos FROM integraciones_locales WHERE usuario_id=? AND clave LIKE 'mp:borrador:%'", [usuario.id])).map(f => [f.clave.slice(12), JSON.parse(f.datos) as BorradorMp])));
}
export async function decidirMovimientosMp(ids: string[], decision: 'registrado' | 'ignorado' | 'recuperado' | 'revisado', borradores: Record<string, BorradorMp> = {}, existente?: string) {
  if (!ids.length || ids.length > 500) throw new ErrorMercadoPago('Seleccioná entre uno y 500 movimientos.');
  const usuario = await usuarioIntegraciones();
  const resultado = await ejecutarTransaccion(async c => {
    const estado = await leerDato(usuario.id, 'mp:estado', ESTADO_MP_INICIAL, c), v = estado.vinculacion;
    if (!v) throw new ErrorMercadoPago('La vinculación ya no está disponible.');
    const deposito = await depositosRepositorio.consultarPorId(v.deposito_id, c);
    if (!deposito?.activo || deposito.usuario_id !== usuario.id) throw new ErrorMercadoPago('El depósito ya no está disponible.');
    const operaciones = await leerDato<OperacionMp[]>(usuario.id, 'mp:operaciones', [], c);
    for (const id of new Set(ids)) {
      const op = operaciones.find(f => f.id === id); if (!op) throw new ErrorMercadoPago('Actualizá la lista de movimientos.');
      if (decision === 'registrado' && op.decision === 'registrado') continue;
      if (['ignorado', 'recuperado'].includes(decision) && op.decision === 'registrado') throw new ErrorMercadoPago('Ese pago ya tiene un movimiento registrado.');
      let movimientoId = op.movimientoId;
      if (decision === 'registrado') {
        const borrador = resolverBorradorMp(op, borradores[id] || await leerDato<BorradorMp>(usuario.id, 'mp:borrador:' + id, { tipo: op.tipo, categoria: op.categoria }, c));
        if (!op.registrable || op.moneda !== 'ARS') throw new ErrorMercadoPago('Solo se pueden registrar pagos aprobados en pesos.');
        if (!borrador.tipo) throw new ErrorMercadoPago('Mercado Pago todavía no permitió identificar el sentido de este pago.');
        const descripcion=(borrador.descripcion??op.descripcion).trim();
        if(!descripcion||descripcion.length>500)throw new ErrorMercadoPago('La descripción debe tener entre 1 y 500 caracteres.');
        const categorias = borrador.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
        if (!categorias.some(f => f.id === borrador.categoria)) throw new ErrorMercadoPago('Elegí una categoría compatible.');
        movimientoId = existente || 'mp:' + await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, usuario.id + ':' + v.cuenta_id + ':' + id);
        const anterior = await movimientosRepositorio.consultarPorId(movimientoId, c);
        if (anterior) {
          if (anterior.deposito_id !== v.deposito_id || anterior.tipo !== borrador.tipo || Math.round(anterior.monto * 100) !== Math.round(op.monto * 100) || anterior.anulado || anterior.fecha_eliminacion || anterior.reversion_de_id || anterior.transferencia_id) throw new ErrorMercadoPago('El movimiento elegido no es compatible.');
          if (operaciones.some(f => f.id !== id && f.movimientoId === movimientoId)) throw new ErrorMercadoPago('Ese movimiento ya está asociado a otro pago.');
        } else {
          if (existente) throw new ErrorMercadoPago('Ese movimiento ya no está disponible.');
          await movimientosRepositorio.crear({ id: movimientoId, deposito_id: v.deposito_id, categoria: borrador.categoria, tipo: borrador.tipo, monto: op.monto, descripcion, fecha_hora: op.fecha, recurrencia_id: null, transferencia_id: null, reversion_de_id: null, anulado: 0 }, c);
        }
      }
      await encolarIntegracion(c, usuario.id, '/mercado-pago/decisiones', { version: v.version, pagoId: id, decision, movimientoId, huella: op.huella });
      op.decision = decision === 'recuperado' ? 'pendiente' : decision === 'revisado' ? 'registrado' : decision;
      op.movimientoId = movimientoId; op.revisionPendiente = false;
    }
    await guardarDato(c, usuario.id, 'mp:operaciones', operaciones);
    const pendientes = operaciones.filter(f => f.decision === 'pendiente' || f.revisionPendiente).length;
    const avisos = await c.getAllAsync<{ id: string; datos: string }>("SELECT id,datos FROM avisos_locales WHERE usuario_id=? AND json_extract(datos,'$.tipo')='mercado_pago'", [usuario.id]);
    for (const aviso of avisos) await c.runAsync('UPDATE avisos_locales SET datos=?,resuelta=? WHERE usuario_id=? AND id=?', [JSON.stringify({ ...JSON.parse(aviso.datos), pendientes, mensaje: `${operaciones.length} obtenidos · ${pendientes} pendientes` }), pendientes ? 0 : 1, usuario.id, aviso.id]);
    return pendientes;
  }); avisarIntegraciones(); return resultado;
}
export async function consultarCompatiblesMp(op: OperacionMp) {
  const usuario = await usuarioIntegraciones(), estado = await leerDato(usuario.id, 'mp:estado', ESTADO_MP_INICIAL);
  if (!estado.vinculacion) return [];
  return ejecutarLecturaConConexion(c => c.getAllAsync<{ id: string; descripcion: string; fecha_hora: string }>("SELECT id,descripcion,fecha_hora FROM movimientos WHERE deposito_id=? AND ROUND(monto*100)=? AND tipo IN('ingreso','egreso') AND (? IS NULL OR tipo=?) AND anulado=0 AND fecha_eliminacion IS NULL AND reversion_de_id IS NULL AND transferencia_id IS NULL ORDER BY fecha_hora DESC LIMIT 50", [estado.vinculacion!.deposito_id, Math.round(op.monto * 100), op.tipo, op.tipo]));
}
