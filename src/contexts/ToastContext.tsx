import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NotificacionTexto from '../components/ToastNotification';
import type { PropsWithChildren } from 'react';

export type TipoAviso = 'error' | 'exito' | 'informacion';
export type OpcionesAviso = { duracion?: number; tipo?: TipoAviso };
type Aviso = { id: number; mensaje: string; tipo: TipoAviso; duracion: number };
type Presentador = (aviso: Aviso) => void;
type DatosAvisos = {
  mostrarAviso: (mensaje: string, opciones?: OpcionesAviso) => void;
  registrarPresentador: (presentar: Presentador, profundidad: number) => () => void;
};
const ContextoProfundidadAvisos = createContext(0);
export const ContextoAvisos = createContext<DatosAvisos>(null!);

const DURACION_PREDETERMINADA = 4500;
const DURACION_MINIMA = 1500;
const DURACION_MAXIMA = 10000;
const TIPOS_AVISO = new Set(['error', 'exito', 'informacion']);

export function ProveedorAvisos({ children: contenido }: PropsWithChildren) {
  const margenesSeguros = useSafeAreaInsets();
  const [aviso, establecerAviso] = useState<Aviso | null>(null);
  const siguienteId = useRef(0);
  const presentadores = useRef<{ presentar: Presentador; profundidad: number }[]>([]);
  const registrarPresentador = useCallback((presentar: Presentador, profundidad: number) => {
    const registro = { presentar, profundidad };
    presentadores.current.push(registro);
    return () => {
      presentadores.current = presentadores.current.filter(valor => valor !== registro);
    };
  }, []);

  const mostrarAviso = useCallback((mensaje: string, opciones: OpcionesAviso = {}) => {
    if (typeof mensaje !== 'string' || !mensaje.trim()) return;

    const duracionSolicitada = Number(opciones.duracion);
    const duracion = Number.isFinite(duracionSolicitada)
      ? Math.min(DURACION_MAXIMA, Math.max(DURACION_MINIMA, duracionSolicitada))
      : DURACION_PREDETERMINADA;
    const tipo = opciones.tipo && TIPOS_AVISO.has(opciones.tipo) ? opciones.tipo : 'informacion';

    siguienteId.current += 1;
    const nuevo: Aviso = {
      id: siguienteId.current,
      mensaje: mensaje.trim(),
      tipo,
      duracion,
    };
    const destino = [...presentadores.current].sort((a, b) => a.profundidad - b.profundidad).at(-1);
    if (destino) { establecerAviso(null); destino.presentar(nuevo); } else establecerAviso(nuevo);
  }, []);

  const cerrarAviso = useCallback((id: number) => {
    establecerAviso((avisoActual) => (avisoActual?.id === id ? null : avisoActual));
  }, []);

  const valor = useMemo(() => ({ mostrarAviso, registrarPresentador }), [mostrarAviso, registrarPresentador]);

  return (
    <ContextoAvisos.Provider value={valor}>
      <View collapsable={false} style={estilos.contenedor}>
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

// Debe montarse dentro de la ventana nativa: un toast de la pantalla queda detrás.
export function AvisosEnModal({ children, visible = true }: PropsWithChildren<{ visible?: boolean }>) {
  const { registrarPresentador } = useContext(ContextoAvisos);
  const profundidad = useContext(ContextoProfundidadAvisos) + 1;
  const margenes = useSafeAreaInsets();
  const [aviso, establecerAviso] = useState<Aviso | null>(null);
  const actual = useRef<Aviso | null>(null);
  const presentar = useCallback((valor: Aviso) => { actual.current = valor; establecerAviso(valor); }, []);
  useEffect(() => {
    if (!visible) { actual.current = null; establecerAviso(null); return; }
    return registrarPresentador(presentar, profundidad);
  }, [visible, registrarPresentador, profundidad, presentar]);
  return <ContextoProfundidadAvisos.Provider value={profundidad}>
    <View style={estilos.contenedor}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {visible && aviso ? <NotificacionTexto key={aviso.id} mensaje={aviso.mensaje} tipo={aviso.tipo} duracion={aviso.duracion}
          margenSuperior={Math.max(margenes.top, 12) + 8} onDismiss={() => { if (actual.current?.id === aviso.id) { actual.current = null; establecerAviso(null); } }}/> : null}
      </View>
    </View>
  </ContextoProfundidadAvisos.Provider>;
}
