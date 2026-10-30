import { PERSONA_ACTUAL, PERSONAS_SIMULADAS } from './socialMockData';
export function obtenerPersona(id) {
  return id === 'vos' ? PERSONA_ACTUAL : PERSONAS_SIMULADAS.find(persona => persona.id === id);
}
export function normalizarNombrePersona(nombre) {
  return nombre.trim().replace(/\s+/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}
export function nombreCompletoPersona(persona) {
  return [persona.nombre, persona.apellido].filter(Boolean).join(' ');
}
