import { createContext, useContext } from 'react';

export const ContextoDatosSociales = createContext(null);

export function useDatosSociales() {
  const datos = useContext(ContextoDatosSociales);
  if (!datos) throw new Error('Social requiere su contexto de datos.');
  return datos;
}
