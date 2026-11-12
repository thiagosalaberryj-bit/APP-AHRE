import assert from 'node:assert/strict';
import test from 'node:test';
import { crearControlEncabezado, type EstadoEncabezado } from '../src/navigation/headerScrollController.ts';

test('solo pliega al bajar con un gesto y vuelve a mostrar el encabezado al llegar arriba', () => {
  let estado: EstadoEncabezado = { desplegado: true, desplazado: false };
  const control = crearControlEncabezado(nuevo => { estado = nuevo; control.terminarTransicion(); }, () => {});
  control.desplazar(300); assert.deepEqual(estado, { desplegado: true, desplazado: true });
  control.iniciarArrastre(300); control.desplazar(320); assert.deepEqual(estado, { desplegado: false, desplazado: true });
  control.desplazar(100); assert.deepEqual(estado, { desplegado: false, desplazado: true });
  control.desplazar(0); assert.deepEqual(estado, { desplegado: true, desplazado: false });
  control.alternar(); assert.deepEqual(estado, { desplegado: true, desplazado: false });
});

test('permite desplegar y plegar abajo sin que la inercia anule la elección manual', () => {
  let estado: EstadoEncabezado = { desplegado: true, desplazado: false };
  const control = crearControlEncabezado(nuevo => { estado = nuevo; control.terminarTransicion(); }, () => {});
  control.iniciarArrastre(0); control.desplazar(200); control.terminarArrastre(); control.iniciarInercia();
  control.alternar(); control.desplazar(230); assert.equal(estado.desplegado, true);
  control.alternar(); assert.equal(estado.desplegado, false);
  control.alternar(); control.terminarMovimiento(); control.iniciarArrastre(230); control.desplazar(260);
  assert.equal(estado.desplegado, false);
});

test('volver al inicio muestra el encabezado, oculta las flechas y descarta la inercia anterior', () => {
  let estado: EstadoEncabezado = { desplegado: true, desplazado: false }, subidas = 0;
  const control = crearControlEncabezado(nuevo => { estado = nuevo; control.terminarTransicion(); }, () => { subidas++; });
  control.iniciarArrastre(0); control.desplazar(500); control.terminarArrastre();
  control.volverArriba(); assert.equal(subidas, 1); assert.deepEqual(estado, { desplegado: true, desplazado: false });
  control.iniciarInercia(); control.desplazar(400); control.desplazar(200);
  assert.deepEqual(estado, { desplegado: true, desplazado: false });
  control.desplazar(0); control.iniciarArrastre(0); control.desplazar(250); assert.equal(estado.desplegado, false);
});

test('rebotes y contenido corto no pliegan el encabezado ni hacen parpadear flechas', () => {
  const cambios: EstadoEncabezado[] = [];
  const control = crearControlEncabezado(estado => { cambios.push(estado); control.terminarTransicion(); }, () => {});
  control.iniciarArrastre(0); control.desplazar(300, 400, 600); control.desplazar(-40, 400, 600);
  assert.deepEqual(cambios, []);
  control.desplazar(144, 2000, 600); assert.deepEqual(cambios, []);
  control.desplazar(150, 2000, 600); assert.deepEqual(cambios.at(-1), { desplegado: false, desplazado: true });
  const cantidad = cambios.length; control.desplazar(140, 2000, 600); control.desplazar(145, 2000, 600);
  assert.equal(cambios.length, cantidad);
});

test('bajar despacio con deltas menores a dos puntos pliega una sola vez',()=>{
 const cambios:EstadoEncabezado[]=[];const control=crearControlEncabezado(estado=>cambios.push(estado),()=>{});
 control.iniciarArrastre(0);for(let y=0;y<=160;y+=0.5)control.desplazar(y,2000,600);
 assert.deepEqual(cambios,[{desplegado:false,desplazado:true}]);
});

test('los eventos de altura y offsets al plegar no vuelven a expandir el encabezado',()=>{
 const cambios:EstadoEncabezado[]=[];const control=crearControlEncabezado(estado=>cambios.push(estado),()=>{});
 control.iniciarArrastre(0);control.desplazar(145,800,600);
 for(const [y,alto]of [[90,620],[30,650],[0,676],[2,676],[0,676]])control.desplazar(y,800,alto);
 control.terminarTransicion();for(const y of [0,0.5,1,2,3,4,6,8,10,12])control.desplazar(y,800,676);
 assert.deepEqual(cambios,[{desplegado:false,desplazado:true}]);
 control.terminarMovimiento();control.iniciarArrastre(12);control.desplazar(0,800,676);
 assert.deepEqual(cambios.at(-1),{desplegado:true,desplazado:false});
});
