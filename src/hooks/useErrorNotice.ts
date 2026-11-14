import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ContextoAvisos } from '../contexts/ToastContext';
export function useErrorNotificado(inicial: string): [string, (valor: string) => void];
export function useErrorNotificado(inicial: null): [string | null, (valor: string | null) => void];
export function useErrorNotificado(inicial: string | null): unknown {
  const [error, establecerError] = useState<string | null>(inicial);
  const ultimo = useRef<string | null>(null);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const cambiarError = useCallback((valor: string | null) => {
    establecerError(valor);
    if (valor && valor !== ultimo.current) mostrarAviso(valor, { tipo: 'error' });
    ultimo.current = valor || null;
  }, [mostrarAviso]);
  return [error, cambiarError];
}

export function useAvisoError(mensaje: string | null | undefined) {
  const { mostrarAviso } = useContext(ContextoAvisos);
  const anterior = useRef<string | null>(null);
  useEffect(() => {
    if (mensaje && mensaje !== anterior.current) mostrarAviso(mensaje, { tipo: 'error' });
    anterior.current = mensaje || null;
  }, [mensaje, mostrarAviso]);
}
