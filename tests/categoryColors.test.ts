import assert from 'node:assert/strict';
import test from 'node:test';
import { FAMILIAS_CATEGORIAS, obtenerColorCategoria, obtenerFamiliaCategoria, ordenarCategoriasPorColor } from '../src/styles/categoryColors.ts';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../src/constants/movimientos.ts';

test('todos los catálogos están cubiertos explícitamente sin recurrir al color de reserva', () => {
  const ids = FAMILIAS_CATEGORIAS.flatMap(familia => familia.categorias);
  for (const categoria of [...CATEGORIAS_EGRESO, ...CATEGORIAS_INGRESO]) assert.ok(ids.includes(categoria.id), categoria.id);
});

test('cada categoría tiene una sola familia y un tono válido en ambos temas', () => {
  const ids = FAMILIAS_CATEGORIAS.flatMap(familia => familia.categorias.map(id => familia.tipo + ':' + id));
  assert.equal(new Set(ids).size, ids.length);
  for (const familia of FAMILIAS_CATEGORIAS) {
    assert.equal(familia.claro.length, familia.categorias.length);
    assert.equal(familia.oscuro.length, familia.categorias.length);
    for (const id of familia.categorias) {
      assert.equal(obtenerFamiliaCategoria(id, familia.tipo).id, familia.id);
      for (const nombre of ['claro', 'oscuro']) assert.match(obtenerColorCategoria(id, { nombre }, familia.tipo), /^#[0-9a-f]{6}$/i);
    }
  }
});

test('filtrar o reordenar categorías no modifica sus colores', () => {
  const originales = ['alimentacion', 'compras', 'salud', 'regalos'];
  const tema = { nombre: 'claro' };
  const colores = new Map(originales.map(id => [id, obtenerColorCategoria(id, tema)]));
  for (const id of originales.toReversed().slice(1)) assert.equal(obtenerColorCategoria(id, tema), colores.get(id));
  assert.equal(obtenerFamiliaCategoria('alimentacion').id, obtenerFamiliaCategoria('compras').id);
  assert.notEqual(obtenerColorCategoria('alimentacion', tema), obtenerColorCategoria('compras', tema));
  assert.notEqual(obtenerFamiliaCategoria('salud').id, obtenerFamiliaCategoria('compras').id);
});

test('categorías desconocidas conservan un color neutro estable', () => {
  assert.equal(obtenerFamiliaCategoria('historica').id, 'otros');
  assert.match(obtenerColorCategoria('historica', { nombre: 'oscuro' }), /^#[0-9a-f]{6}$/i);
});

test('cada grupo principal mantiene tres tonos de intenso a claro en ambos temas', () => {
  for (const familia of FAMILIAS_CATEGORIAS.filter(familia => !['otros', 'regalos'].includes(familia.id))) {
    assert.equal(familia.categorias.length, 3);
    const originales = familia.categorias.toReversed().map(id => ({ id }));
    for (const nombre of ['claro', 'oscuro']) {
      assert.deepEqual(ordenarCategoriasPorColor(originales, { nombre }, familia.tipo).map(categoria => categoria.id), familia.categorias);
    }
    assert.deepEqual(originales.map(categoria => categoria.id), familia.categorias.toReversed());
  }
});

test('Regalos distingue ayudas de ingreso y gastos de egreso sin cambiar el catálogo', () => {
  assert.equal(obtenerFamiliaCategoria('regalos', 'ingreso').id, 'ayudas');
  assert.equal(obtenerFamiliaCategoria('regalos', 'egreso').id, 'regalos');
  assert.equal(CATEGORIAS_INGRESO.length, 10);
  assert.equal(CATEGORIAS_EGRESO.length, 17);
});
