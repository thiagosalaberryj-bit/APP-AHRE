import assert from 'node:assert/strict';
import test from 'node:test';
import { editarEntradaMonto, formatearEntradaMonto } from '../src/utils/moneyInput.ts';

test('agrega miles al escribir sin guardar puntos ni perder la posición al final', () => {
  let anterior = '';
  for (const digito of '1234567') {
    const cambio = editarEntradaMonto(anterior, anterior + digito, { start: anterior.length, end: anterior.length });
    assert.ok(cambio);
    assert.equal(cambio.seleccion.start, cambio.formateado.length);
    anterior = cambio.formateado;
  }
  assert.equal(anterior, '1.234.567');
  assert.equal(editarEntradaMonto(anterior, anterior + ',50', { start: anterior.length, end: anterior.length })?.valor, '1234567,50');
});

test('conserva coma incompleta, cero, centavos y números grandes sin usar precisión de Number', () => {
  assert.equal(formatearEntradaMonto('0'), '0');
  assert.equal(formatearEntradaMonto('12000,'), '12.000,');
  assert.equal(formatearEntradaMonto('12000,00'), '12.000,00');
  assert.equal(formatearEntradaMonto('12345678901234567890,01'), '12.345.678.901.234.567.890,01');
  assert.equal(editarEntradaMonto('', ',', { start: 0, end: 0 })?.valor, '0,');
});

test('pega un monto local con símbolo y espacios sin alterar el valor', () => {
  const cambio = editarEntradaMonto('', '$ 1.234.567,80', { start: 0, end: 0 });
  assert.equal(cambio?.valor, '1234567,80');
  assert.equal(cambio?.formateado, '1.234.567,80');
  assert.equal(editarEntradaMonto('', '12.50', { start: 0, end: 0 }), null);
});

test('admite el punto decimal del teclado sin confundir los puntos de miles', () => {
  assert.equal(editarEntradaMonto('1.000', '1.000.', { start: 5, end: 5 })?.valor, '1000,');
  assert.equal(editarEntradaMonto('12', '12.', { start: 2, end: 2 })?.formateado, '12,');
});

test('inserta y reemplaza dígitos en el medio manteniendo el cursor junto a la edición', () => {
  const insercion = editarEntradaMonto('1.234', '1.9234', { start: 2, end: 2 });
  assert.equal(insercion?.valor, '19234');
  assert.equal(insercion?.formateado, '19.234');
  assert.deepEqual(insercion?.seleccion, { start: 2, end: 2 });
  const reemplazo = editarEntradaMonto('1.234,50', '1.94,50', { start: 2, end: 4 });
  assert.equal(reemplazo?.valor, '194,50');
  assert.deepEqual(reemplazo?.seleccion, { start: 2, end: 2 });
});

test('permite borrar dígitos, separadores automáticos, centavos y todo el campo', () => {
  assert.equal(editarEntradaMonto('1.000', '1.00', { start: 5, end: 5 })?.formateado, '100');
  assert.equal(editarEntradaMonto('1.234', '1234', { start: 2, end: 2 })?.valor, '234');
  assert.equal(editarEntradaMonto('1.234', '1234', { start: 1, end: 1 })?.valor, '134');
  assert.equal(editarEntradaMonto('1.234,50', '1.234,5', { start: 8, end: 8 })?.valor, '1234,5');
  assert.equal(editarEntradaMonto('1.234', '', { start: 0, end: 5 })?.valor, '');
});

test('no transforma texto inválido, negativos o decimales extra en un importe distinto', () => {
  for (const texto of ['-100', 'abc100', '1,2,3', '1,234']) {
    assert.equal(editarEntradaMonto('', texto, { start: 0, end: 0 }), null);
  }
});
