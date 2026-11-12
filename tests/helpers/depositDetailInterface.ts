import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCargadorComponentes } from './componentInterface.ts';
import type { Movimiento } from '../../src/database/types.ts';

export function interfazDetalleDeposito(movimientosIniciales: Movimiento[], opciones: {
  pantalla?: 'deposito' | 'movimientos';
  esperarDibujo?: () => Promise<void>;
  esperarOpciones?: () => Promise<void>;
  esperarMeses?: () => Promise<void>;
  consultarPagina?: typeof import('../../src/deposits/depositService.ts').consultarPaginaMovimientosDeposito;
} = {}) {
  const casillas: { valor?: unknown; current?: unknown; deps?: readonly unknown[]; limpiar?: () => void }[] = [];
  let indice = 0, efectos: (() => unknown)[] = [], arbol: unknown;
  const recuentos = { consultas: 0, filas: 0, meses: 0 };
  const posicionesScroll: { y: number; animated: boolean }[] = [];
  const textosRenderizados: string[] = [];
  const consultas: { filtros: import('../../src/types/forms.ts').FiltrosHistorial; cursor?: { fecha_hora: string; id: string } | null }[] = [];
  let movimientos = movimientosIniciales;
  const iguales = (a?: readonly unknown[], b?: readonly unknown[]) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const apariencia = {}, avisos = {}, mostrarAviso = () => {};
  let tema: typeof import('../../src/styles/colors.ts').TEMAS[keyof typeof import('../../src/styles/colors.ts').TEMAS];
  const react = {
    memo: (componente: unknown) => componente,
    useState(inicial: unknown) {
      const posicion = indice++;
      if (!(posicion in casillas)) casillas[posicion] = { valor: typeof inicial === 'function' ? inicial() : inicial };
      const casilla = casillas[posicion];
      return [casilla.valor, (valor: unknown) => { casilla.valor = typeof valor === 'function' ? valor(casilla.valor) : valor; }];
    },
    useRef(inicial: unknown) { return casillas[indice++] ||= { current: inicial }; },
    useMemo<T>(calcular: () => T, deps: readonly unknown[]): T {
      const posicion = indice++;
      if (!casillas[posicion] || !iguales(casillas[posicion].deps, deps)) casillas[posicion] = { valor: calcular(), deps };
      return casillas[posicion].valor as T;
    },
    useCallback<T>(callback: T, deps: readonly unknown[]): T { return react.useMemo(() => callback, deps); },
    useEffect(callback: () => unknown, deps: readonly unknown[]) {
      const posicion = indice++;
      if (!casillas[posicion] || !iguales(casillas[posicion].deps, deps)) {
        const anterior = casillas[posicion];
        casillas[posicion] = { deps };
        efectos.push(() => {
          anterior?.limpiar?.();
          const limpiar = callback();
          if (typeof limpiar === 'function') casillas[posicion].limpiar = limpiar as () => void;
        });
      }
    },
    useContext: (contexto: object) => contexto === apariencia ? { tema } : { mostrarAviso },
  };
  let enfocada = true;
  const deposito = { id: 'deposito', usuario_id: 'usuario', nombre: 'Cuenta', tipo: 'banco', saldo_actual: 1000, descripcion: 'Cuenta de prueba' };
  const filtrar = (filtros: import('../../src/types/forms.ts').FiltrosHistorial) => movimientos.filter(m =>
    (!filtros.desde || m.fecha_hora >= filtros.desde) && (!filtros.hasta || m.fecha_hora < filtros.hasta)
    && (!filtros.busqueda || m.descripcion.toLocaleLowerCase('es-AR').includes(filtros.busqueda.toLocaleLowerCase('es-AR')))
    && (filtros.tipo === 'todos' || !filtros.tipo || (filtros.tipo === 'ingreso' ? ['ingreso','transferencia_entrada'].includes(m.tipo) : ['egreso','transferencia_salida'].includes(m.tipo)))
    && (!filtros.categoriaIds || filtros.categoriaIds.includes(m.categoria))
    && (filtros.montoMinimo == null || m.monto >= filtros.montoMinimo) && (filtros.montoMaximo == null || m.monto <= filtros.montoMaximo));
  const consultarMeses = async (_id: string, filtros: import('../../src/types/forms.ts').FiltrosHistorial) => {
    await opciones.esperarMeses?.();
    recuentos.meses++;
    const meses = new Map<string, number>();
    for (const fila of filtrar(filtros)) {
      const fecha = new Date(fila.fecha_hora), mes = fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0');
      meses.set(mes, (meses.get(mes) || 0) + 1);
    }
    return [...meses].sort(([a], [b]) => b.localeCompare(a)).map(([mes, cantidad]) => ({ mes, cantidad }));
  };
  const consultarPagina = async (id: string, filtros: import('../../src/types/forms.ts').FiltrosHistorial, cursor?: {fecha_hora:string;id:string}|null) => {
    recuentos.consultas++; consultas.push({ filtros, cursor });
    const filas = opciones.consultarPagina ? await opciones.consultarPagina(id, filtros, cursor) : filtrar(filtros)
      .filter(m => !cursor || m.fecha_hora < cursor.fecha_hora || (m.fecha_hora === cursor.fecha_hora && m.id < cursor.id))
      .sort((a,b) => b.fecha_hora.localeCompare(a.fecha_hora) || b.id.localeCompare(a.id)).slice(0,50)
      .map(m => ({ ...m, deposito_nombre: deposito.nombre }));
    recuentos.filas += filas.length; return filas;
  };
  const adaptadores: Record<string, unknown> = {
    react,
    '../components/ScreenHeaderFrame': { __esModule: true, default: 'View' },
    '../components/HeaderScrollView': { DesplazamientoEncabezado: 'ScrollView' },
    'react-native': {
      ...Object.fromEntries(['View', 'Text', 'Pressable', 'ScrollView', 'Modal', 'KeyboardAvoidingView', 'ActivityIndicator'].map(n => [n, n])),
      Platform: { OS: 'android' }, StyleSheet: { create: (valor: unknown) => valor },
      useWindowDimensions: () => ({ width: 360, height: 780 }),
    },
    '@react-navigation/native': { useFocusEffect: (callback: () => unknown) => react.useEffect(() => enfocada ? callback() : undefined, [callback, enfocada]) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../contexts/AppearanceContext': { ContextoApariencia: apariencia },
    '../contexts/ToastContext': { ContextoAvisos: avisos },
    '../social/financialOperation': { operacionFinancieraEnCurso: () => false },
    '../recurrences/recurrenceService': { consultarRecurrenciasDeposito: async () => [] },
    '../profile/balanceVisibilityService': { consultarSaldoOculto: async () => false },
    '../integrations/integrationStore': { observarIntegraciones: () => () => {} },
    '../mercadoPago/mercadoPagoService': {
      consultarResumenMp: async () => null,
      cargarMercadoPago: async () => ({ estado: { vinculacion: null }, operaciones: [] }),
    },
    '../utils/renderFrame': { esperarDibujo: opciones.esperarDibujo || (() => new Promise<void>(resolver => setImmediate(() => setImmediate(resolver)))) },
    '../deposits/depositService': {
      ErrorDeposito: class extends Error {},
      consultarDetalleDeposito: async () => ({ deposito, cantidadMovimientos: movimientos.length, categoriasMovimientos: [...new Set(movimientos.map(m => m.categoria))], comparacionMensual: null }),
      consultarMesesMovimientosDeposito: consultarMeses,
      consultarPaginaMovimientosDeposito: consultarPagina,
    },
    '../movements/movementService': {
      cargarMesesHistorialMovimientos: consultarMeses, cargarPaginaHistorialMovimientos: consultarPagina,
      cargarOpcionesHistorialMovimientos: async () => { await opciones.esperarOpciones?.(); return { usuarioId: 'usuario', cantidad: movimientos.length,
        categorias: [...new Map(movimientos.map(m => [m.tipo + m.categoria, { tipo: m.tipo, categoria: m.categoria }])).values()], depositos: [deposito] }; },
    },
    './MovementCard': { __esModule: true, default: 'MovementCard' },
    './CollapsibleSectionHeader': { __esModule: true, default: 'CollapsibleSectionHeader' },
    '../components/MovementFilterSections': Object.fromEntries(['FiltroTipoMovimientos', 'FiltroFechaMovimientos', 'FiltroCategoriasMovimientos', 'FiltroMontoMovimientos'].map(n => [n, n])),
  };
  for (const nombre of ['DepositForm', 'DepositIconModal', 'MovementQuickFilters', 'SegmentedSelector', 'MovementSearchFilters', 'MovementFiltersPanel', 'RecurrencePanel', 'PrimaryButton', 'SectionHeader', 'MainHeader', 'MovementCard', 'CollapsibleSectionHeader']) {
    adaptadores['../components/' + nombre] = { __esModule: true, default: nombre };
  }
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const { cargar } = crearCargadorComponentes(raiz, adaptadores);
  const { TEMAS } = cargar<typeof import('../../src/styles/colors.ts')>('src/styles/colors.ts');
  tema = TEMAS.claro;
  const pantalla = cargar<typeof import('../../src/screens/DepositDetailScreen.tsx')>(opciones.pantalla === 'movimientos' ? 'src/screens/MovementsScreen.tsx' : 'src/screens/DepositDetailScreen.tsx').default;
  const propiedades = { route: { params: { depositoId: 'deposito' } }, navigation: { getParent: () => ({ navigate() {} }), addListener: () => () => {}, goBack() {}, push() {} } };
  function renderizar() {
    indice = 0; efectos = [];
    arbol = pantalla(propiedades as unknown as Parameters<typeof pantalla>[0]);
    textosRenderizados.push(nodos(arbol).filter(nodo => nodo.type === 'Text').map(nodo => JSON.stringify(nodo.props.children)).join(' '));
    efectos.forEach(efecto => efecto());
    return arbol;
  }
  async function asentar() { for (let i = 0; i < 6; i++) { await new Promise(resolve => setImmediate(resolve)); renderizar(); } }
  function nodos(nodo: unknown): { type: string; props: Record<string, unknown> }[] {
    if (Array.isArray(nodo)) return nodo.flatMap(nodos);
    if (!nodo || typeof nodo !== 'object' || !('props' in nodo)) return [];
    const componente = nodo as { type: unknown; props: Record<string, unknown> };
    if (typeof componente.type === 'function' && componente.type.name === 'ListaMesesMovimientos') return nodos(componente.type(componente.props));
    const elemento = nodo as { type: string; props: Record<string, unknown> };
    return [elemento, ...nodos(elemento.props.children)];
  }
  function buscar(tipo: string) {
    const nodo = nodos(arbol).find(n => n.type === tipo);
    if (!nodo) throw new Error('No se encontró ' + tipo);
    return nodo;
  }
  function invocar(nodo: { props: Record<string, unknown> }, evento: string, ...argumentos: unknown[]) {
    const callback = nodo.props[evento];
    if (typeof callback !== 'function') throw new Error('Callback no disponible: ' + evento);
    callback(...argumentos); renderizar();
  }
  return {
    renderizar, asentar, buscar, nodos: (nodo: unknown = arbol) => nodos(nodo), invocar, recuentos, consultas, posicionesScroll, textosRenderizados,
    prepararScroll(posicionBoton = 550, posicionEncabezado = 200) {
      const componente = (arbol: unknown): Record<string, unknown> | null => {
        if (Array.isArray(arbol)) { for (const hijo of arbol) { const encontrado = componente(hijo); if (encontrado) return encontrado; } return null; }
        if (!arbol || typeof arbol !== 'object' || !('props' in arbol)) return null;
        const nodo = arbol as { type: unknown; props: Record<string, unknown> };
        return typeof nodo.type === 'function' && nodo.type.name === 'ListaMesesMovimientos' ? nodo.props : componente(nodo.props.children);
      };
      const propiedadesLista = componente(arbol);
      if (!propiedadesLista) throw new Error('No se encontró la lista mensual');
      const datos = propiedadesLista.datos as ReturnType<typeof import('../../src/movements/useMonthlyMovements.ts').useMovimientosPorMes>;
      datos.referenciaScroll.current = {
        scrollTo: (opciones: { y: number; animated: boolean }) => posicionesScroll.push(opciones),
        getNativeScrollRef: () => ({ measureInWindow: (recibir: (...valores: number[]) => void) => recibir(0,0,360,600) }),
      } as unknown as import('react-native').ScrollView;
      for (const nodo of nodos(arbol)) if (nodo.props.collapsable === false && typeof nodo.props.ref === 'function') {
        const y = String(nodo.props.nativeID).startsWith('encabezado-') ? posicionEncabezado : posicionBoton;
        nodo.props.ref({ measureInWindow: (recibir: (...valores: number[]) => void) => recibir(0,y,360,48) });
      }
    },
    cambiarEnfoque(valor: boolean) { enfocada = valor; renderizar(); },
    desmontar() { casillas.forEach(casilla => casilla.limpiar?.()); },
    cambiarTema() { tema = tema === TEMAS.claro ? TEMAS.oscuro : TEMAS.claro; renderizar(); },
    async recargar(nuevos: Movimiento[]) {
      movimientos = nuevos;
      // La pestaña de recurrencias recibe el mismo callback de recarga del detalle.
      invocar(buscar('SegmentedSelector'), 'alSeleccionar', 'recurrentes');
      invocar(buscar('RecurrencePanel'), 'alCambiar');
      await asentar();
      invocar(buscar('SegmentedSelector'), 'alSeleccionar', 'movimientos');
    },
  };
}
