import assert from 'node:assert/strict';

export function presente<T>(valor: T | null | undefined): T {
  assert.ok(valor !== null && valor !== undefined, 'El escenario debe contener el registro esperado.');
  return valor;
}
