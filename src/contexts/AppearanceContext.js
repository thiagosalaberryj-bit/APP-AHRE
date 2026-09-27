import { createContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { TEMAS } from '../styles/colors';

export const ContextoApariencia = createContext(null);

export function ProveedorApariencia({ children }) {
  const aparienciaSistema = useColorScheme() === 'dark' ? 'oscuro' : 'claro';
  const [apariencia, establecerApariencia] = useState('sistema');
  const aparienciaActiva = apariencia === 'sistema' ? aparienciaSistema : apariencia;
  const valor = useMemo(() => ({
    apariencia,
    establecerApariencia,
    tema: TEMAS[aparienciaActiva],
  }), [apariencia, aparienciaActiva]);

  return (
    <ContextoApariencia.Provider value={valor}>
      {children}
    </ContextoApariencia.Provider>
  );
}
