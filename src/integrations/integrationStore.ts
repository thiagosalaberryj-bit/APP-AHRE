import type { Conexion } from '../database/types';
import { ejecutarLecturaConConexion } from '../database/connectionQueue';
import { ejecutarTransaccion } from '../database/transactions';
import { generarIdentificador } from '../database/identifiers';

const oyentes = new Set<() => void>();
export function observarIntegraciones(oyente: () => void) { oyentes.add(oyente); return () => { oyentes.delete(oyente); }; }
export function avisarIntegraciones() { for (const oyente of oyentes) oyente(); }
export async function leerDato<T>(usuarioId: string, clave: string, defecto: T, conexion?: Conexion): Promise<T> {
  const leer = async (c: Conexion) => { const fila = await c.getFirstAsync<{ datos: string }>('SELECT datos FROM integraciones_locales WHERE usuario_id=? AND clave=?', [usuarioId, clave]); return fila ? JSON.parse(fila.datos) as T : defecto; };
  return conexion ? leer(conexion) : ejecutarLecturaConConexion(leer);
}
export function guardarDato(c: Conexion, usuarioId: string, clave: string, datos: unknown) {
  return c.runAsync('INSERT INTO integraciones_locales(usuario_id,clave,datos) VALUES(?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos', [usuarioId, clave, JSON.stringify(datos)]);
}
export async function guardarDatoLocal(usuarioId: string, clave: string, datos: unknown) { await ejecutarTransaccion(c => guardarDato(c, usuarioId, clave, datos)); avisarIntegraciones(); }
export async function encolarIntegracion(c: Conexion, usuarioId: string, ruta: string, datos: Record<string, unknown>, prioridad = 1) {
  const id = generarIdentificador();
  await c.runAsync('INSERT INTO integraciones_outbox(id,usuario_id,ruta,datos,prioridad) VALUES(?,?,?,?,?)', [id, usuarioId, ruta, JSON.stringify({ ...datos, idOperacion: id }), prioridad]);
  return id;
}
