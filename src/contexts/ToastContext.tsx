import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NotificacionTexto from '../components/ToastNotification';
import type { PropsWithChildren } from 'react';

export type TipoAviso = 'error' | 'exito' | 'informacion';
export type OpcionesAviso = { duracion?: number; tipo?: TipoAviso };
type Aviso = { id: number; mensaje: string; tipo: TipoAviso; duracion: number };
type DatosAvisos = { mostrarAviso: (mensaje: string, opciones?: OpcionesAviso) => void };
export const ContextoAvisos = createContext<DatosAvisos>(null!);

const DURACION_PREDETERMINADA = 4500;
const DURACION_MINIMA = 1500;
const DURACION_MAXIMA = 10000;
const TIPOS_AVISO = new Set(['error', 'exito', 'informacion']);

export function ProveedorAvisos({ children: contenido }: PropsWithChildren) {
  const margenesSeguros = useSafeAreaInsets();
  const [aviso, establecerAviso] = useState<Aviso | null>(null);
  const siguienteId = useRef(0);

  const mostrarAviso = useCallback((mensaje: string, opciones: OpcionesAviso = {}) => {
    if (typeof mensaje !== 'string' || !mensaje.trim()) return;

    const duracionSolicitada = Number(opciones.duracion);
    const duracion = Number.isFinite(duracionSolicitada)
      ? Math.min(DURACION_MAXIMA, Math.max(DURACION_MINIMA, duracionSolicitada))
      : DURACION_PREDETERMINADA;
    const tipo = opciones.tipo && TIPOS_AVISO.has(opciones.tipo) ? opciones.tipo : 'informacion';

    siguienteId.current += 1;
    establecerAviso({
      id: siguienteId.current,
      mensaje: mensaje.trim(),
      tipo,
      duracion,
    });
  }, []);

  const cerrarAviso = useCallback((id: number) => {
    establecerAviso((avisoActual) => (avisoActual?.id === id ? null : avisoActual));
  }, []);

  const valor = useMemo(() => ({ mostrarAviso }), [mostrarAviso]);

  return (
    <ContextoAvisos.Provider value={valor}>
      <View style={estilos.contenedor}>
        {contenido}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {aviso ? (
            <NotificacionTexto
              key={aviso.id}
              duracion={aviso.duracion}
              mensaje={aviso.mensaje}
              onDismiss={() => cerrarAviso(aviso.id)}
              tipo={aviso.tipo}
              margenSuperior={Math.max(margenesSeguros.top, 12) + 8}
            />
          ) : null}
        </View>
      </View>
    </ContextoAvisos.Provider>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
});
