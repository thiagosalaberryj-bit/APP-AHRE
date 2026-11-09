import assert from 'node:assert/strict';
import test from 'node:test';
import { crearControlEncabezado, type EstadoEncabezado } from '../src/navigation/headerScrollController.ts';

test('solo pliega al bajar con un gesto y vuelve a mostrar el encabezado al llegar arriba', () => {
  let estado: EstadoEncabezado = { desplegado: true, desplazado: false };
  const control = crearControlEncabezado(nuevo => { estado = nuevo; }, () => {});
  control.desplazar(300); assert.deepEqual(estado, { desplegado: true, desplazado: true });
  control.iniciarArrastre(300); control.desplazar(320); assert.deepEqual(estado, { desplegado: false, desplazado: true });
  control.desplazar(100); assert.deepEqual(estado, { desplegado: false, desplazado: true });
  control.desplazar(0); assert.deepEqual(estado, { desplegado: true, desplazado: false });
  control.alternar(); assert.deepEqual(estado, { desplegado: true, desplazado: false });
});

test('permite desplegar y plegar abajo sin que la inercia anule la elección manual', () => {
  let estado: EstadoEncabezado = { desplegado: true, desplazado: false };
  const control = crearControlEncabezado(nuevo => { estado = nuevo; }, () => {});
  control.iniciarArrastre(0); control.desplazar(200); control.terminarArrastre(); control.iniciarInercia();
  control.alternar(); control.desplazar(230); assert.equal(estado.desplegado, true);
  control.alternar(); assert.equal(estado.desplegado, false);
  control.alternar(); control.terminarMovimiento(); control.iniciarArrastre(230); control.desplazar(260);
  assert.equal(estado.desplegado, false);
});

test('volver al inicio muestra el encabezado, oculta las flechas y descarta la inercia anterior', () => {
  let estado: EstadoEncabezado = { desplegado: true, desplazado: false }, subidas = 0;
  const control = crearControlEncabezado(nuevo => { estado = nuevo; }, () => { subidas++; });
  control.iniciarArrastre(0); control.desplazar(500); control.terminarArrastre();
  control.volverArriba(); assert.equal(subidas, 1); assert.deepEqual(estado, { desplegado: true, desplazado: false });
  control.iniciarInercia(); control.desplazar(400); control.desplazar(200);
  assert.deepEqual(estado, { desplegado: true, desplazado: false });
  control.desplazar(0); control.iniciarArrastre(0); control.desplazar(250); assert.equal(estado.desplegado, false);
});

test('rebotes y contenido corto no pliegan el encabezado ni hacen parpadear flechas', () => {
  const cambios: EstadoEncabezado[] = [];
  const control = crearControlEncabezado(estado => cambios.push(estado), () => {});
  control.iniciarArrastre(0); control.desplazar(300, 400, 600); control.desplazar(-40, 400, 600);
  assert.deepEqual(cambios, []);
  control.desplazar(144, 2000, 600); assert.deepEqual(cambios, []);
  control.desplazar(150, 2000, 600); assert.deepEqual(cambios.at(-1), { desplegado: false, desplazado: true });
  const cantidad = cambios.length; control.desplazar(140, 2000, 600); control.desplazar(145, 2000, 600);
  assert.equal(cambios.length, cantidad);
});
