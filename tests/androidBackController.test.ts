import assert from 'node:assert/strict';
import test from 'node:test';
import { crearControlRegresoAndroid } from '../src/navigation/androidBackController.ts';

test('Android conserva bloqueos y salida sin historial y absorbe repeticiones entre pantallas', () => {
  let tiempo = 0, regresos = 0;
  const control = crearControlRegresoAndroid(() => tiempo);
  const evento = { enfocada: true, bloqueada: false, puedeVolver: true, volver: () => { regresos++; control.registrarRegreso(); } };
  assert.equal(control.manejar({ ...evento, enfocada: false }), false);
  assert.equal(control.manejar({ ...evento, puedeVolver: false }), false);
  assert.equal(control.manejar({ ...evento, bloqueada: true }), true);
  assert.equal(regresos, 0);
  assert.equal(control.manejar(evento), true);
  assert.equal(regresos, 1);
  assert.equal(control.manejar(evento), true);
  assert.equal(control.manejar({ ...evento, puedeVolver: false }), true);
  assert.equal(regresos, 1);
  tiempo = 400;
  assert.equal(control.manejar({ ...evento, puedeVolver: false }), false);
  control.registrarRegreso(); // Flecha de AHRE seguida de Atrás nativo.
  assert.equal(control.manejar(evento), true);
  assert.equal(regresos, 1);
  tiempo = 800;
  assert.equal(control.manejar(evento), true);
  assert.equal(regresos, 2);
});
