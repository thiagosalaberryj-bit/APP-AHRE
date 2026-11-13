import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { SourceTextModule, createContext } from 'node:vm';
import { compilarFuente } from './helpers/typescript.ts';
import { ajustesPredeterminados } from '../src/notifications/types.ts';
import type { DatosRecordatorios } from '../src/notifications/reminderPlanner.ts';
const contexto = createContext({ Date, Intl, Map, Set });
const calendario = new SourceTextModule(compilarFuente(await readFile(new URL('../src/recurrences/recurrenceCalendar.ts', import.meta.url), 'utf8'), 'recurrenceCalendar.ts'), { context: contexto });
await calendario.link(() => { throw new Error('Import inesperado'); }); await calendario.evaluate();
const planificador = new SourceTextModule(compilarFuente(await readFile(new URL('../src/notifications/reminderPlanner.ts', import.meta.url), 'utf8'), 'reminderPlanner.ts'), { context: contexto });
await planificador.link(nombre => { assert.equal(nombre, '../recurrences/recurrenceCalendar'); return calendario; }); await planificador.evaluate();
const { planificarRecordatorios } = planificador.namespace as unknown as typeof import('../src/notifications/reminderPlanner.ts');
const datos = (): DatosRecordatorios => ({ registros: [], deudas: [], recurrencias: [], mercadoPago: null, salas: [] });
test('programa fechas concretas sin ejecutar JavaScript al momento del aviso y omite el registro del día ya realizado', () => {
  const d = datos(); d.registros = ['2026-11-09T15:00:00Z']; const avisos = planificarRecordatorios(d, ajustesPredeterminados(), new Date('2026-11-09T16:00:00Z'));
  assert.ok(!avisos.some(a => a.tipo === 'registro' && a.fecha.startsWith('2026-11-09')));
  assert.ok(avisos.some(a => a.tipo === 'registro' && a.fecha === '2026-11-10T23:00:00.000Z'));
  assert.ok(avisos.every(a => Date.parse(a.fecha) > Date.parse('2026-11-09T16:00:00Z')));
});
test('Mercado Pago recuerda una vez al día y deja de programar al resolver o desactivar el tipo', () => {
  const d = datos(), ajustes = ajustesPredeterminados(); d.mercadoPago = { pendientes: 8, depositoId: 'deposito' };
  let avisos = planificarRecordatorios(d, ajustes, new Date('2026-11-09T16:00:00Z'));
  assert.equal(avisos.filter(a => a.tipo === 'mercado_pago').length, 60);
  assert.equal(new Set(avisos.filter(a => a.tipo === 'mercado_pago').map(a => a.fecha)).size, 60);
  d.mercadoPago.pendientes = 0; assert.equal(planificarRecordatorios(d, ajustes).filter(a => a.tipo === 'mercado_pago').length, 0);
  d.mercadoPago.pendientes = 8; ajustes.tipos.mercado_pago.activo = false; avisos = planificarRecordatorios(d, ajustes); assert.equal(avisos.filter(a => a.tipo === 'mercado_pago').length, 0);
});
test('respeta una zona distinta del teléfono y el cambio de horario de verano', () => {
  const ajustes = ajustesPredeterminados(); ajustes.zona = 'America/New_York'; ajustes.tipos.registro.hora = '09:00';
  const avisos = planificarRecordatorios(datos(), ajustes, new Date('2026-03-07T00:00:00Z'));
  assert.ok(avisos.some(a => a.tipo === 'registro' && a.fecha === '2026-03-07T14:00:00.000Z'));
  assert.ok(avisos.some(a => a.tipo === 'registro' && a.fecha === '2026-03-08T13:00:00.000Z'));
});
test('las deudas generan recordatorios de saldo sin vencimientos; el cierre mensual no inventa cifras',()=>{
 const d=datos();d.deudas=[{id:'deuda',tipo:'debo'},{id:'cobro',tipo:'me_deben'}];
 const avisos=planificarRecordatorios(d,ajustesPredeterminados(),new Date('2026-11-09T16:00:00Z'));
 const deudas=avisos.filter(a=>a.tipo==='debo'||a.tipo==='me_deben');assert.equal(deudas.length,118);
 assert.equal(deudas[0].fecha,'2026-11-10T12:00:00.000Z');
 assert.ok(deudas.every(a=>!/vence|vencimiento|vencida/i.test(a.titulo+' '+a.mensaje)));
 assert.ok(avisos.some(a=>a.tipo==='mensual'&&a.fecha==='2026-12-01T13:00:00.000Z'&&!a.mensaje.includes('$')));
});

test('sin deudas pendientes no programa avisos de deudas',()=>{
 const avisos=planificarRecordatorios(datos(),ajustesPredeterminados(),new Date('2026-11-09T16:00:00Z'));assert.ok(!avisos.some(a=>a.tipo==='debo'||a.tipo==='me_deben'));
});
