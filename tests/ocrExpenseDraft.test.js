import assert from 'node:assert/strict';
import test from 'node:test';

import { prepararEgresoReconocido } from '../src/ocr/ocrExpenseDraft.js';
import { validarDatosMovimiento, convertirMontoMovimiento, combinarFechaYHora } from '../src/utils/movementValidation.js';

test('prepara un egreso corregible con monto local y fecha local sin cambiar el día por UTC', () => {
  const datos = prepararEgresoReconocido({ monto: 3840.5, fecha: '15/10/2026', hora: '11:56', descripcion: 'ALMACEN\nPan 3840,50' });
  assert.equal(datos.monto, '3840,50');
  assert.equal(convertirMontoMovimiento(datos.monto), 3840.5);
  assert.equal(datos.fecha.getFullYear(), 2026);
  assert.equal(datos.fecha.getMonth(), 9);
  assert.equal(datos.fecha.getDate(), 15);
  assert.equal(datos.hora, '11:56');
  assert.equal(datos.recurrente, false);
  assert.equal(datos.deposito_id, null);
  assert.equal(datos.categoria, null);
  assert.ok(validarDatosMovimiento(datos, 'egreso').deposito_id);
  assert.ok(validarDatosMovimiento(datos, 'egreso').categoria);
  assert.deepEqual(validarDatosMovimiento({ ...datos, deposito_id: 'deposito', categoria: 'alimentacion' }, 'egreso'), {});
  assert.ok(combinarFechaYHora(datos.fecha, datos.hora));
});

test('un resultado incompleto mantiene el monto vacío para obligar a corregirlo', () => {
  const ahora = new Date(2026, 9, 16, 9, 4);
  const datos = prepararEgresoReconocido({ monto: null, fecha: null, descripcion: '' }, ahora);
  assert.equal(datos.monto, '');
  assert.equal(datos.hora, '09:04');
  assert.equal(datos.fecha.getTime(), ahora.getTime());
  assert.ok(validarDatosMovimiento(datos, 'egreso').monto);
  assert.ok(validarDatosMovimiento(datos, 'egreso').descripcion);
});

test('no trunca silenciosamente una descripción extensa y reutiliza el límite de egresos', () => {
  const descripcion = 'Producto '.repeat(70);
  const datos = prepararEgresoReconocido({ monto: 10, fecha: null, descripcion });
  assert.equal(datos.descripcion, descripcion);
  assert.ok(validarDatosMovimiento(datos, 'egreso').descripcion);
});
