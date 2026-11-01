import { createContext, useContext } from 'react';

export const ContextoDatosSociales = createContext<NonNullable<ReturnType<typeof import('./useSocialScreen').default>['social']> | null>(null);

export function useDatosSociales() {
  const datos = useContext(ContextoDatosSociales);
  if (!datos) throw new Error('Social requiere su contexto de datos.');
  return datos;
}
