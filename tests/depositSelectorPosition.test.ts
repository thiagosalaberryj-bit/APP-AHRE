import assert from 'node:assert/strict';
import test from 'node:test';
import {posicionarSelectorDeposito} from '../src/utils/depositSelectorPosition.ts';

for(const inferior of [0,24,48])for(const multiple of [false,true])test(`depósitos respeta navegación inferior ${inferior}, múltiple ${multiple}`,()=>{
 for(const y of [40,350,700,780]){
  const posicion=posicionarSelectorDeposito({x:18,y,ancho:300,alto:52,anchoCapa:360,altoCapa:800,superior:24,inferior,cantidad:30,multiple});
  assert.ok(posicion.top>=36);assert.ok(posicion.top+posicion.maxHeight<=800-inferior-12);
  assert.ok(posicion.maxHeight>=(multiple?124:48));
  if(y===700)assert.ok(posicion.top<y,'Abre arriba cuando no cabe debajo');
  if(y===40)assert.ok(posicion.top>=y+52,'Mantiene apertura inferior cuando cabe');
 }
});
