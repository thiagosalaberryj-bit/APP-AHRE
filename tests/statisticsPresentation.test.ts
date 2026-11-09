import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { cargar } = crearCargadorComponentes(raiz);
const presentacion = cargar<typeof import('../src/statistics/statisticsPresentation.ts')>('src/statistics/statisticsPresentation.ts');
const { TEMAS } = cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');

test('períodos locales conservan inicio inclusivo y fin exclusivo en años y meses limítrofes', () => {
  const p = presentacion, dia = new Date(2024, 1, 29, 18, 45), semana = new Date(2025, 0, 1, 12);
  const rangoDia = p.obtenerRangoPeriodo('dia', dia, semana, 0, 2025);
  assert.equal(rangoDia.inicio.getTime(), new Date(2024, 1, 29).getTime());
  assert.equal(rangoDia.fin.getTime(), new Date(2024, 2, 1).getTime());
  const rangoSemana = p.obtenerRangoPeriodo('semana', dia, semana, 0, 2025);
  assert.equal(rangoSemana.inicio.getTime(), new Date(2024, 11, 30).getTime());
  assert.equal(rangoSemana.fin.getTime(), new Date(2025, 0, 6).getTime());
  const mes = p.obtenerRangoPeriodo('mes', dia, semana, 11, 2024);
  assert.equal(mes.fin.getTime(), new Date(2025, 0, 1).getTime());
  const anio = p.obtenerRangoPeriodo('anio', dia, semana, 11, 2024);
  assert.equal(anio.inicio.getTime(), new Date(2024, 0, 1).getTime());
  assert.equal(anio.fin.getTime(), new Date(2025, 0, 1).getTime());
  assert.equal(dia.getHours(), 18); assert.equal(semana.getHours(), 12);
  assert.equal(p.formatearRangoSemana(semana), '30 de diciembre 2024–5 de enero 2025');
  assert.equal(p.formatearSemanaSelector(semana), '30 dic 2024–5 ene 2025');
});

for (const tema of ['claro', 'oscuro'] as const) test(`series conservan selección de categorías, centavos, porcentajes y períodos vacíos (${tema})`, () => {
  const p = presentacion, categorias = p.obtenerCategorias('egreso', TEMAS[tema]).slice(0, 2);
  const [primera, segunda] = categorias;
  const filas = [
    { categoria: primera.id, total: 0.1, cantidad: 1 },
    { categoria: segunda.id, total: 0.2, cantidad: 1 },
    { categoria: 'oculta', total: 500, cantidad: 3 },
  ];
  const copia = structuredClone(filas);
  const visible = p.calcularResumenVisible(filas, categorias.map(c => c.id));
  assert.equal(visible.totalResumen, 0.3); assert.equal(visible.hayDatosResumen, true);
  const resumen = p.crearDatosResumen(categorias, filas, visible.totalResumen);
  assert.deepEqual(resumen.map(c => c.id), categorias.map(c => c.id));
  assert.ok(Math.abs(resumen.reduce((suma, c) => suma + c.participacion, 0) - 100) < 0.000001);
  assert.ok(p.crearDatosResumen(categorias, filas, 0).every(c => c.participacion === 0));
  assert.equal(p.calcularResumenVisible(filas, []).hayDatosResumen, false);
  assert.equal(p.calcularResumenVisible([{ categoria: primera.id, total: 0, cantidad: 2 }], [primera.id]).hayMovimientosResumen, true);
  const datos = [{ periodo: '2024-02', categoria: primera.id, total: 10.25 }, { periodo: '2024-02', categoria: 'oculta', total: 999 }];
  const columnas = p.crearDatosColumnas(categorias, 'anio', datos, new Date(2024, 1, 1), 2024);
  assert.equal(columnas.length, 12); assert.equal(columnas[1].totalGeneral, 10.25);
  assert.equal(columnas[1].segmentos[1].monto, 0); assert.equal(columnas[0].totalGeneral, 0);
  const semana = p.crearDatosColumnas(categorias, 'semana', [{ periodo: '2025-01-01', categoria: primera.id, total: 15 }], new Date(2025, 0, 1), 2025);
  assert.equal(semana.length, 7); assert.equal(semana[2].totalGeneral, 15);
  assert.equal(semana[0].totalGeneral, 0);
  const detalle = p.obtenerDetalleColumna(columnas, 1);
  assert.equal(detalle.totalBarraSeleccionada, 10.25); assert.equal(detalle.filasDetalleColumna.length, 1);
  assert.equal(p.obtenerDetalleColumna(columnas, 999).indiceColumnaVisible, 11);
  const vacio = p.obtenerDetalleColumna([], 0);
  assert.equal(vacio.barraSeleccionada, undefined); assert.equal(vacio.totalBarraSeleccionada, 0);
  assert.equal(vacio.hayDatosColumnasVisibles, false);
  assert.deepEqual(filas, copia);
});
