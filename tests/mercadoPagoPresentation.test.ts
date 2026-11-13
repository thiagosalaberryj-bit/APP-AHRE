import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { URL } from 'node:url';
import { compilarFuente } from './helpers/typescript.ts';
import { agruparMovimientosMp, alternarSeleccionMp } from '../src/mercadoPago/mercadoPagoPresentation.ts';
import type { OperacionMp } from '../src/mercadoPago/types.ts';

const pago = (id: string, fecha: string, revisionPendiente = false) => ({ id, fecha, revisionPendiente }) as OperacionMp;
test('Mercado Pago agrupa por día y ordena por fecha y hora antes de aplicar el límite', () => {
  const a = pago('1', '2026-11-08T16:00:00'), b = pago('9', '2026-11-10T09:00:00'), c = pago('2', '2026-11-10T17:00:00');
  const filas = [a, b, c], grupos = agruparMovimientosMp(filas, 2);
  assert.equal(grupos.length, 1); assert.deepEqual(grupos[0].operaciones.map(op => op.id), ['2', '9']);
  assert.deepEqual(filas.map(op => op.id), ['1', '9', '2']); assert.equal(agruparMovimientosMp(filas, 30).length, 2);
});
test('el mismo control selecciona y deselecciona el filtro, excluye revisiones y limita a 500', () => {
  const filas = [pago('1', ''), pago('2', ''), pago('3', '', true)];
  assert.deepEqual(alternarSeleccionMp(filas, []), ['1', '2']);
  assert.deepEqual(alternarSeleccionMp(filas, ['1']), ['1', '2']);
  assert.deepEqual(alternarSeleccionMp(filas, ['1', '2']), []);
  assert.equal(alternarSeleccionMp(Array.from({ length: 700 }, (_, i) => pago(String(i), '')), []).length, 500);
});

class SocketPrueba {
  onopen: (() => void) | null = null;
  onmessage: ((evento: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  cerrado = false; enviados: string[] = [];
  send(mensaje: string) { this.enviados.push(mensaje); }
  close() { if (this.cerrado) return; this.cerrado = true; this.onclose?.(); }
  recibir(datos: object) { this.onmessage?.({ data: JSON.stringify(datos) }); }
}
const vaciar = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
async function escenarioSocket() {
  const tiempos = new Map<number, () => void>(), intervalos = new Map<number, () => void>(); let secuencia = 0;
  const contexto = createContext({
    setTimeout: (f: () => void) => { tiempos.set(++secuencia, f); return secuencia; }, clearTimeout: (id: number) => tiempos.delete(id),
    setInterval: (f: () => void) => { intervalos.set(++secuencia, f); return secuencia; }, clearInterval: (id: number) => intervalos.delete(id),
  });
  const archivo = new URL('../src/mercadoPago/mercadoPagoRealtime.ts', import.meta.url);
  const modulo = new SourceTextModule(compilarFuente(await readFile(archivo, 'utf8'), archivo.pathname), { context: contexto });
  await modulo.link(async nombre => new SyntheticModule(nombre.includes('sessionService') ? ['obtenerSesionActual'] : ['obtenerSesionRemota', 'solicitarRemoto', 'URL_SERVIDOR'], function () {
    if (nombre.includes('sessionService')) this.setExport('obtenerSesionActual', async () => ({}));
    else { this.setExport('obtenerSesionRemota', async () => null); this.setExport('solicitarRemoto', async () => ({})); this.setExport('URL_SERVIDOR', 'https://example.test/api/v1'); }
  }, { context: contexto }));
  await modulo.evaluate();
  const { seguirConsultaMp } = modulo.namespace as unknown as typeof import('../src/mercadoPago/mercadoPagoRealtime');
  const sockets: SocketPrueba[] = [], protocolos: string[][] = [];
  const dependencias = { obtenerAcceso: async () => ({ url: 'wss://example.test', ticket: 'temporal', canal: 'mp:propio' }), crearSocket: (_url: string, p: string[]) => { protocolos.push(p); const socket = new SocketPrueba(); sockets.push(socket); return socket as unknown as WebSocket; } };
  return { seguirConsultaMp, dependencias, sockets, protocolos, tiempos, intervalos };
}
test('el WebSocket filtra eventos ajenos y cierra conexión y temporizadores al completar la búsqueda', async () => {
  const e = await escenarioSocket(); let llamadas = 0;
  e.seguirConsultaMp('trabajo', 'v1', async () => { llamadas++; return false; }, () => {}, e.dependencias);
  await vaciar(); const socket = e.sockets[0]; socket.onopen?.();
  assert.equal(e.protocolos[0].join('|'), 'ahre.social.v1|ticket.temporal');
  socket.recibir({ tipo: 'mercado_pago', canal: 'mp:ajeno', trabajoId: 'trabajo', version: 'v1' });
  socket.recibir({ tipo: 'mercado_pago', canal: 'mp:propio', trabajoId: 'otro', version: 'v1' });
  socket.recibir({ tipo: 'mercado_pago', canal: 'mp:propio', trabajoId: 'trabajo', version: 'anterior' });
  await vaciar(); assert.equal(llamadas, 0);
  socket.recibir({ tipo: 'mercado_pago', canal: 'mp:propio', trabajoId: 'trabajo', version: 'v1' });
  await vaciar(); assert.equal(llamadas, 1); assert.equal(socket.cerrado, true); assert.equal(e.tiempos.size, 0); assert.equal(e.intervalos.size, 0);
});
test('salir o pasar a segundo plano cancela reconexiones y no abre un socket después de obtener un ticket tardío', async () => {
  const e = await escenarioSocket(); let entregar!: (valor: { url: string; ticket: string; canal: string }) => void;
  const detener = e.seguirConsultaMp('trabajo', 'v1', async () => true, () => {}, { ...e.dependencias, obtenerAcceso: () => new Promise(resolve => { entregar = resolve; }) });
  detener(); entregar({ url: 'wss://example.test', ticket: 'tardio', canal: 'mp:propio' }); await vaciar();
  assert.equal(e.sockets.length, 0); assert.equal(e.tiempos.size, 0); assert.equal(e.intervalos.size, 0);
});
test('eventos durante una descarga se agrupan y el último estado termina la suscripción', async () => {
  const e = await escenarioSocket(); let llamadas = 0, liberar!: (activa: boolean) => void;
  e.seguirConsultaMp('trabajo', 'v1', () => { llamadas++; return llamadas === 1 ? new Promise(resolve => { liberar = resolve; }) : Promise.resolve(false); }, () => {}, e.dependencias);
  await vaciar(); const socket = e.sockets[0]; socket.onopen?.();
  const evento = { tipo: 'mercado_pago', canal: 'mp:propio', trabajoId: 'trabajo', version: 'v1' };
  socket.recibir(evento); socket.recibir(evento); socket.recibir(evento); await vaciar(); assert.equal(llamadas, 1);
  liberar(true); await vaciar(); assert.equal(llamadas, 2); assert.equal(socket.cerrado, true); assert.equal(e.intervalos.size, 0);
});
