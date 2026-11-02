import { createContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { TEMAS } from '../styles/colors';
import type { Apariencia, Tema } from '../styles/colors';
import type { Dispatch, PropsWithChildren, SetStateAction } from 'react';

type DatosApariencia = {
  apariencia: Apariencia;
  establecerApariencia: Dispatch<SetStateAction<Apariencia>>;
  tema: Tema;
};

// App monta siempre este proveedor antes de los consumidores.
export const ContextoApariencia = createContext<DatosApariencia>(null!);

export function ProveedorApariencia({ children }: PropsWithChildren) {
  const aparienciaSistema = useColorScheme() === 'dark' ? 'oscuro' : 'claro';
  const [apariencia, establecerApariencia] = useState<Apariencia>('sistema');
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
