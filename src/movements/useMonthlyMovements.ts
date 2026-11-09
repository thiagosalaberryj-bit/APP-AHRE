import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import type { FiltrosHistorial, MesHistorial, MovimientoVisible } from '../types/forms';
import { crearCargaVisible } from './visibleLoadMore';

type Cursor = { fecha_hora: string; id: string } | null;
export interface PaginaMes { movimientos: MovimientoVisible[]; cargando: boolean; hayMas: boolean; error: string | null; }
interface ConsultasMeses {
  habilitado: boolean; revision: number; filtros: FiltrosHistorial; invalido: boolean;
  consultarMeses: (filtros: FiltrosHistorial) => Promise<MesHistorial[]>;
  consultarPagina: (filtros: FiltrosHistorial, cursor: Cursor) => Promise<MovimientoVisible[]>;
}
export function filtrosDelMes(filtros: FiltrosHistorial, mes: string): FiltrosHistorial {
  const [anio, numero] = mes.split('-').map(Number);
  const desde = new Date(anio, numero - 1, 1).toISOString(), hasta = new Date(anio, numero, 1).toISOString();
  return { ...filtros, desde: filtros.desde && filtros.desde > desde ? filtros.desde : desde,
    hasta: filtros.hasta && filtros.hasta < hasta ? filtros.hasta : hasta };
}

export function useMovimientosPorMes({ habilitado, revision, filtros, invalido, consultarMeses, consultarPagina }: ConsultasMeses) {
  const [meses, establecerMeses] = useState<MesHistorial[]>([]);
  const [abiertos, establecerAbiertos] = useState<Record<string, boolean>>({});
  const [paginas, establecerPaginas] = useState<Record<string, PaginaMes>>({});
  const [cargando, establecerCargando] = useState(false);
  const [error, establecerError] = useState<string | null>(null);
  const [intento, establecerIntento] = useState(0);
  const secuencia = useRef(0), paginasActuales = useRef(paginas), abiertosActuales = useRef(abiertos);
  const mesesActuales = useRef(meses), habilitadoActual = useRef(habilitado && !invalido);
  habilitadoActual.current = habilitado && !invalido;
  const referenciaScroll = useRef<ScrollView | null>(null);
  const botones = useRef(new Map<string, View>());
  const cargaVisible = useRef<ReturnType<typeof crearCargaVisible> | null>(null);
  const actualizarPagina = (mes: string, pagina: PaginaMes) => {
    paginasActuales.current = { ...paginasActuales.current, [mes]: pagina };
    establecerPaginas(paginasActuales.current);
  };
  const cargarMes = useCallback(async (mes: string) => {
    const previa = paginasActuales.current[mes];
    if (!habilitadoActual.current || !abiertosActuales.current[mes] || previa?.cargando || (previa && !previa.hayMas && !previa.error)) return;
    const actual = secuencia.current, anteriores = previa?.movimientos || [];
    actualizarPagina(mes, { movimientos: anteriores, cargando: true, hayMas: previa?.hayMas ?? true, error: null });
    try {
      const ultima = anteriores.at(-1);
      const filas = await consultarPagina(filtrosDelMes(filtros, mes), ultima ? { fecha_hora: ultima.fecha_hora, id: ultima.id } : null);
      if (actual !== secuencia.current) return;
      const ids = new Set(anteriores.map(fila => fila.id));
      const movimientos = [...anteriores, ...filas.filter(fila => !ids.has(fila.id))];
      const cantidad = mesesActuales.current.find(fila => fila.mes === mes)?.cantidad || 0;
      actualizarPagina(mes, { movimientos, cargando: false, hayMas: filas.length === 50 && movimientos.length < cantidad, error: null });
    } catch {
      if (actual === secuencia.current) actualizarPagina(mes, { movimientos: anteriores, cargando: false, hayMas: previa?.hayMas ?? true,
        error: 'No se pudieron cargar los movimientos. Intentá nuevamente.' });
    }
  }, [consultarPagina, filtros]);

  useEffect(() => {
    const actual = ++secuencia.current;
    cargaVisible.current?.terminar();
    paginasActuales.current = {}; abiertosActuales.current = {}; mesesActuales.current = [];
    establecerPaginas({}); establecerAbiertos({}); establecerMeses([]); establecerError(null);
    if (!habilitado || invalido) { establecerCargando(false); return; }
    establecerCargando(true);
    consultarMeses(filtros).then(filas => {
      if (actual !== secuencia.current) return;
      mesesActuales.current = filas; establecerMeses(filas);
      const ahora = new Date(), mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
      if (filas.some(fila => fila.mes === mesActual)) {
        abiertosActuales.current = { [mesActual]: true }; establecerAbiertos(abiertosActuales.current);
        void cargarMes(mesActual);
      }
    }).catch(() => { if (actual === secuencia.current) establecerError('No se pudieron cargar los meses. Intentá nuevamente.'); })
      .finally(() => { if (actual === secuencia.current) establecerCargando(false); });
    return () => { secuencia.current++; };
  }, [habilitado, revision, filtros, invalido, consultarMeses, cargarMes, intento]);

  const alternarMes = (mes: string) => {
    const abierto = !abiertosActuales.current[mes];
    abiertosActuales.current = { ...abiertosActuales.current, [mes]: abierto }; establecerAbiertos(abiertosActuales.current);
    if (abierto && !paginasActuales.current[mes]) void cargarMes(mes);
  };
  const cargarActual = useRef(cargarMes); cargarActual.current = cargarMes;
  if (!cargaVisible.current) cargaVisible.current = crearCargaVisible(
    recibir => {
      const vista = referenciaScroll.current?.getNativeScrollRef();
      if (vista) vista.measureInWindow(recibir); else recibir(0, 0, 0, 0);
    },
    () => habilitadoActual.current ? Object.entries(paginasActuales.current).flatMap(([mes, pagina]) => {
      const boton = botones.current.get(mes);
      return boton && abiertosActuales.current[mes] && pagina.hayMas && !pagina.cargando && !pagina.error
        ? [{ clave: `${secuencia.current}:${mes}:${pagina.movimientos.at(-1)?.id}`, medir: recibir => boton.measureInWindow(recibir), cargar: () => { void cargarActual.current(mes); } }] : [];
    }) : [],
  );
  useEffect(() => () => { cargaVisible.current?.terminar(); }, []);
  return { meses, abiertos, paginas, cargando, error, alternarMes, cargarMes,
    reintentar: () => establecerIntento(valor => valor + 1), referenciaScroll,
    referenciaBoton: (mes: string, nodo: View | null) => { if (nodo) botones.current.set(mes, nodo); else botones.current.delete(mes); },
    eventosScroll: {
      onScroll: (evento: NativeSyntheticEvent<NativeScrollEvent>) => cargaVisible.current?.desplazar(evento.nativeEvent.contentOffset.y),
      onScrollBeginDrag: (evento: NativeSyntheticEvent<NativeScrollEvent>) => cargaVisible.current?.iniciar(evento.nativeEvent.contentOffset.y),
      onScrollEndDrag: () => cargaVisible.current?.terminarArrastre(),
      onMomentumScrollBegin: () => cargaVisible.current?.iniciarInercia(),
      onMomentumScrollEnd: () => cargaVisible.current?.terminar(), scrollEventThrottle: 16,
    },
  };
}
