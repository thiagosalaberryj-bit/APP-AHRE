import { useCallback, useEffect, useRef, useState } from 'react';
import { consultarPaginaMovimientosDeposito } from './depositService';
import type { FiltrosHistorial } from '../types/forms';
import type { MovimientoHistorial } from '../database/types';

export function useMovimientosDeposito(depositoId: string | undefined, habilitado: boolean, revision: number, filtros: FiltrosHistorial, invalido: boolean) {
  const [movimientos, establecerMovimientos] = useState<MovimientoHistorial[]>([]);
  const [cargando, establecerCargando] = useState(false);
  const [cargandoMas, establecerCargandoMas] = useState(false);
  const [hayMas, establecerHayMas] = useState(false);
  const [error, establecerError] = useState<string | null>(null);
  const [intento, establecerIntento] = useState(0);
  const secuencia = useRef(0);
  const bloqueo = useRef(false);

  useEffect(() => {
    const actual = ++secuencia.current;
    bloqueo.current = false;
    establecerMovimientos([]);
    establecerHayMas(false);
    establecerCargandoMas(false);
    establecerError(null);
    if (!habilitado || !depositoId || invalido) { establecerCargando(false); return; }
    establecerCargando(true);
    consultarPaginaMovimientosDeposito(depositoId, filtros).then(filas => {
      if (actual !== secuencia.current) return;
      establecerMovimientos(filas);
      establecerHayMas(filas.length === 50);
    }).catch(() => {
      if (actual === secuencia.current) establecerError('No se pudieron cargar los movimientos. Intentá nuevamente.');
    }).finally(() => {
      if (actual === secuencia.current) establecerCargando(false);
    });
    return () => { secuencia.current++; };
  }, [depositoId, habilitado, revision, filtros, invalido, intento]);

  const cargarMas = useCallback(async () => {
    const ultimo = movimientos[movimientos.length - 1];
    if (!habilitado || !depositoId || invalido || cargando || !hayMas || bloqueo.current || !ultimo) return;
    const actual = secuencia.current;
    bloqueo.current = true;
    establecerCargandoMas(true);
    establecerError(null);
    try {
      const filas = await consultarPaginaMovimientosDeposito(depositoId, filtros, { fecha_hora: ultimo.fecha_hora, id: ultimo.id });
      if (actual !== secuencia.current) return;
      establecerMovimientos(anteriores => {
        const ids = new Set(anteriores.map(fila => fila.id));
        return [...anteriores, ...filas.filter(fila => !ids.has(fila.id))];
      });
      establecerHayMas(filas.length === 50);
    } catch {
      if (actual === secuencia.current) establecerError('No se pudieron cargar más movimientos. Intentá nuevamente.');
    } finally {
      if (actual === secuencia.current) { bloqueo.current = false; establecerCargandoMas(false); }
    }
  }, [depositoId, habilitado, invalido, cargando, hayMas, movimientos, filtros]);

  return { movimientos, cargando, cargandoMas, hayMas, error, cargarMas, reintentar: () => establecerIntento(valor => valor + 1) };
}
