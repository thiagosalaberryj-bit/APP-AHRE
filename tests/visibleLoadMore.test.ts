import assert from 'node:assert/strict';
import test from 'node:test';
import { crearCargaVisible, type CandidatoCarga } from '../src/movements/visibleLoadMore.ts';

test('carga visible exige gesto hacia abajo, intersección real y candidato habilitado', () => {
  let cargas = 0, posicion = 700, permitido = true;
  const control = crearCargaVisible(recibir => recibir(0,100,360,500), () => permitido ? [{ clave: 'mes:pagina', medir: recibir => recibir(0,posicion,360,48), cargar: () => { cargas++; permitido = false; } }] : []);
  control.desplazar(20); assert.equal(cargas, 0);
  control.iniciar(20); control.desplazar(30); assert.equal(cargas, 0);
  posicion = 580; control.desplazar(30); control.desplazar(25); assert.equal(cargas, 0);
  control.desplazar(35); assert.equal(cargas, 1);
  control.desplazar(40); assert.equal(cargas, 1);
  permitido = true; control.terminar(); control.desplazar(45); assert.equal(cargas, 1);
  posicion = 30; control.iniciar(45); control.desplazar(50); assert.equal(cargas, 1);
});

test('una medición antigua no carga después de plegar, cambiar página o detener el gesto', () => {
  let cargas = 0;
  const medidas: (() => void)[] = [];
  let candidatos: CandidatoCarga[] = [{ clave: 'primera', medir: recibir => { medidas.push(() => recibir(0,550,360,48)); }, cargar: () => { cargas++; } }];
  const control = crearCargaVisible(recibir => recibir(0,0,360,600), () => candidatos);
  control.iniciar(0); control.desplazar(10); candidatos = []; medidas.shift()!(); assert.equal(cargas, 0);
  candidatos = [{ clave: 'segunda', medir: recibir => { medidas.push(() => recibir(0,550,360,48)); }, cargar: () => { cargas++; } }];
  control.desplazar(20); control.terminar(); medidas.shift()!(); assert.equal(cargas, 0);
  control.iniciar(20); control.desplazar(30); control.desplazar(25);
  medidas.shift()!(); assert.equal(cargas, 0);
  control.desplazar(40); control.desplazar(50);
  assert.equal(medidas.length, 1); medidas.shift()!(); assert.equal(cargas, 1);
});

test('la inercia solo permite cargar cuando procede de un arrastre reciente', prueba => {
  prueba.mock.timers.enable({ apis: ['Date'], now: 1000 });
  let cargas = 0;
  const control = crearCargaVisible(recibir => recibir(0,0,360,600), () => [{ clave: 'mes', medir: recibir => recibir(0,550,360,48), cargar: () => { cargas++; } }]);
  control.iniciarInercia(); control.desplazar(10); assert.equal(cargas, 0);
  control.iniciar(10); control.terminarArrastre(); control.iniciarInercia(); control.desplazar(20); assert.equal(cargas, 1);
  control.terminar(); prueba.mock.timers.tick(300); control.iniciarInercia(); control.desplazar(30); assert.equal(cargas, 1);
});
