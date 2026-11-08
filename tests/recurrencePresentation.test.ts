import assert from 'node:assert/strict';
import test from 'node:test';
import {tiempoHastaRecurrencia} from '../src/recurrences/recurrencePresentation.ts';
const ahora=Date.parse('2026-11-06T12:00:00Z');
test('una programación pausada no anuncia un próximo cobro',()=>assert.equal(tiempoHastaRecurrencia('2026-11-07T12:00:00Z',false,ahora),'Pausado'));
test('una ocurrencia vencida espera registro en lugar de mostrar tiempo negativo',()=>assert.equal(tiempoHastaRecurrencia('2026-11-06T10:00:00Z',true,ahora),'Pendiente de registro'));
test('el tiempo restante se expresa sin zona técnica ni segundos',()=>{
  assert.equal(tiempoHastaRecurrencia('2026-11-06T12:00:20Z',true,ahora),'En menos de un minuto');
  assert.equal(tiempoHastaRecurrencia('2026-11-06T12:45:00Z',true,ahora),'En 45 min');
  assert.equal(tiempoHastaRecurrencia('2026-11-06T14:30:00Z',true,ahora),'En 2 h 30 min');
  assert.equal(tiempoHastaRecurrencia('2026-11-08T13:00:00Z',true,ahora),'En 2 días y 1 h');
});
test('una fecha inválida se informa sin romper la lista',()=>assert.equal(tiempoHastaRecurrencia('no es fecha',true,ahora),'Revisá la próxima fecha'));
