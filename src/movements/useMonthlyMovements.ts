import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, type ScrollView, type View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import type { FiltrosHistorial, MesHistorial, MovimientoVisible } from '../types/forms';
import { crearCargaVisible } from './visibleLoadMore';
import { esperarDibujo } from '../utils/renderFrame';

type Cursor = { fecha_hora: string; id: string } | null;
export interface PaginaMes { movimientos: MovimientoVisible[]; cargando: boolean; preparando: boolean; hayMas: boolean; error: string | null; }
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
  const [mostrarSubir, establecerMostrarSubir] = useState(false);
  const secuencia = useRef(0), paginasActuales = useRef(paginas), abiertosActuales = useRef(abiertos);
  const mesesActuales = useRef(meses), habilitadoActual = useRef(habilitado && !invalido);
  habilitadoActual.current = habilitado && !invalido;
  const referenciaScroll = useRef<ScrollView | null>(null);
  const botones = useRef(new Map<string, View>());
  const encabezados = useRef(new Map<string, View>());
  const solicitudesMes = useRef(new Map<string, number>());
  const posicionScroll = useRef(0), subirVisible = useRef(false), reducirMovimiento = useRef(true);
  const revisionAncla = useRef(0);
  const ancla = useRef<{ mes: string; y: number } | null>(null);
  const cargaVisible = useRef<ReturnType<typeof crearCargaVisible> | null>(null);
  useEffect(() => {
    let vigente = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(valor => { if (vigente) reducirMovimiento.current = valor; }).catch(() => {});
    const escucha = AccessibilityInfo.addEventListener('reduceMotionChanged', valor => { reducirMovimiento.current = valor; });
    return () => { vigente = false; escucha.remove(); };
  }, []);
  const actualizarPagina = (mes: string, pagina: PaginaMes) => {
    paginasActuales.current = { ...paginasActuales.current, [mes]: pagina };
    establecerPaginas(paginasActuales.current);
  };
  const siguienteSolicitud = (mes: string) => {
    const solicitud = (solicitudesMes.current.get(mes) || 0) + 1;
    solicitudesMes.current.set(mes, solicitud); return solicitud;
  };
  const cargarMes = useCallback(async (mes: string) => {
    const previa = paginasActuales.current[mes];
    if (!habilitadoActual.current || !abiertosActuales.current[mes] || previa?.cargando || (previa && !previa.hayMas && !previa.error)) return;
    const actual = secuencia.current, anteriores = previa?.movimientos || [];
    const solicitud = siguienteSolicitud(mes);
    const vigente = () => actual === secuencia.current && solicitudesMes.current.get(mes) === solicitud && abiertosActuales.current[mes];
    actualizarPagina(mes, { movimientos: anteriores, cargando: true, preparando: anteriores.length === 0, hayMas: previa?.hayMas ?? true, error: null });
    try {
      if (!anteriores.length) await esperarDibujo();
      if (!vigente()) return;
      const ultima = anteriores.at(-1);
      const filas = await consultarPagina(filtrosDelMes(filtros, mes), ultima ? { fecha_hora: ultima.fecha_hora, id: ultima.id } : null);
      if (!vigente()) return;
      const ids = new Set(anteriores.map(fila => fila.id));
      const movimientos = [...anteriores, ...filas.filter(fila => !ids.has(fila.id))];
      const cantidad = mesesActuales.current.find(fila => fila.mes === mes)?.cantidad || 0;
      actualizarPagina(mes, { movimientos, cargando: false, preparando: false, hayMas: filas.length === 50 && movimientos.length < cantidad, error: null });
    } catch {
      if (vigente()) actualizarPagina(mes, { movimientos: anteriores, cargando: false, preparando: false, hayMas: previa?.hayMas ?? true,
        error: 'No se pudieron cargar los movimientos. Intentá nuevamente.' });
    }
  }, [consultarPagina, filtros]);

  useEffect(() => {
    const actual = ++secuencia.current;
    cargaVisible.current?.terminar();
    revisionAncla.current++; ancla.current = null;
    solicitudesMes.current.clear();
    subirVisible.current = false; establecerMostrarSubir(false);
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

  const aplicarAlternancia = (mes: string) => {
    cargaVisible.current?.terminar();
    const solicitud = siguienteSolicitud(mes), actual = secuencia.current;
    const abierto = !abiertosActuales.current[mes];
    abiertosActuales.current = { ...abiertosActuales.current, [mes]: abierto }; establecerAbiertos(abiertosActuales.current);
    const previa = paginasActuales.current[mes];
    if (!abierto) {
      const movimientos = previa?.movimientos.slice(0, 50) || [];
      if (movimientos.length) {
        const cantidad = mesesActuales.current.find(fila => fila.mes === mes)?.cantidad || 0;
        actualizarPagina(mes, { movimientos, cargando: false, preparando: false, hayMas: movimientos.length < cantidad, error: null });
      } else {
        const restantes = { ...paginasActuales.current }; delete restantes[mes];
        paginasActuales.current = restantes; establecerPaginas(restantes);
      }
    } else if (previa?.movimientos.length) {
      actualizarPagina(mes, { ...previa, cargando: true, preparando: true });
      void esperarDibujo().then(() => {
        if (secuencia.current === actual && solicitudesMes.current.get(mes) === solicitud && abiertosActuales.current[mes]) {
          actualizarPagina(mes, { ...previa, cargando: false, preparando: false });
        }
      });
    } else void cargarMes(mes);
  };
  const alternarMes = (mes: string) => {
    cargaVisible.current?.terminar();
    const revision = ++revisionAncla.current, actual = secuencia.current;
    const encabezado = encabezados.current.get(mes), vista = referenciaScroll.current?.getNativeScrollRef();
    if (!encabezado || !vista) { aplicarAlternancia(mes); return; }
    // Conserva el encabezado tocado como referencia al cambiar la altura del mes.
    vista.measureInWindow((_x, arriba) => encabezado.measureInWindow((_ex, y) => {
      if (revision !== revisionAncla.current || actual !== secuencia.current) return;
      ancla.current = { mes, y: Math.max(0, Math.min(posicionScroll.current, posicionScroll.current + y - arriba)) };
      referenciaScroll.current?.scrollTo({ y: posicionScroll.current, animated: false });
      aplicarAlternancia(mes);
    }));
  };
  const cancelarAncla = () => { revisionAncla.current++; ancla.current = null; };
  const volverArriba = () => {
    cancelarAncla(); cargaVisible.current?.terminar();
    referenciaScroll.current?.scrollTo({ y: 0, animated: !reducirMovimiento.current });
    subirVisible.current = false; establecerMostrarSubir(false);
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
  return { meses, abiertos, paginas, cargando, error, alternarMes, cargarMes, mostrarSubir: habilitado && mostrarSubir, volverArriba,
    reintentar: () => establecerIntento(valor => valor + 1), referenciaScroll,
    referenciaBoton: (mes: string, nodo: View | null) => { if (nodo) botones.current.set(mes, nodo); else botones.current.delete(mes); },
    referenciaEncabezado: (mes: string, nodo: View | null) => { if (nodo) encabezados.current.set(mes, nodo); else encabezados.current.delete(mes); },
    eventosScroll: {
      onScroll: (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = Math.max(0, evento.nativeEvent.contentOffset.y);
        posicionScroll.current = y;
        const visible = y > (evento.nativeEvent.layoutMeasurement?.height || 600);
        if (visible !== subirVisible.current) { subirVisible.current = visible; establecerMostrarSubir(visible); }
        cargaVisible.current?.desplazar(y);
      },
      onScrollBeginDrag: (evento: NativeSyntheticEvent<NativeScrollEvent>) => { cancelarAncla(); cargaVisible.current?.iniciar(evento.nativeEvent.contentOffset.y); },
      onScrollEndDrag: () => cargaVisible.current?.terminarArrastre(),
      onMomentumScrollBegin: () => cargaVisible.current?.iniciarInercia(),
      onMomentumScrollEnd: () => cargaVisible.current?.terminar(), scrollEventThrottle: 16,
      onContentSizeChange: () => {
        const pendiente = ancla.current;
        if (!pendiente) return;
        referenciaScroll.current?.scrollTo({ y: pendiente.y, animated: false });
        if (!abiertosActuales.current[pendiente.mes] || !paginasActuales.current[pendiente.mes]?.preparando) ancla.current = null;
      },
    },
  };
}
