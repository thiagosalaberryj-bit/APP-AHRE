import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCargadorComponentes } from './componentInterface.ts';
import type { Movimiento } from '../../src/database/types.ts';

export function interfazDetalleDeposito(movimientosIniciales: Movimiento[]) {
  const casillas: { valor?: unknown; current?: unknown; deps?: readonly unknown[]; limpiar?: () => void }[] = [];
  let indice = 0, efectos: (() => unknown)[] = [], arbol: unknown;
  const recuentos = { filtros: 0, ordenamientos: 0 };
  let movimientos = movimientosIniciales;
  const iguales = (a?: readonly unknown[], b?: readonly unknown[]) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const apariencia = {}, avisos = {}, mostrarAviso = () => {};
  let tema: typeof import('../../src/styles/colors.ts').TEMAS[keyof typeof import('../../src/styles/colors.ts').TEMAS];
  const react = {
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
  // Observa las operaciones de la colección recibida por la pantalla, sin cambiar sus resultados.
  function observar<T>(filas: T[]): T[] {
    return new Proxy(filas, {
      get(lista, propiedad, receptor) {
        if (propiedad === 'map' || propiedad === 'filter' || propiedad === 'sort') return (...argumentos: unknown[]) => {
          if (propiedad === 'filter') recuentos.filtros++;
          if (propiedad === 'sort') recuentos.ordenamientos++;
          return observar(Reflect.apply(Array.prototype[propiedad], lista, argumentos) as T[]);
        };
        return Reflect.get(lista, propiedad, receptor);
      },
    });
  }
  const deposito = { id: 'deposito', usuario_id: 'usuario', nombre: 'Cuenta', tipo: 'banco', saldo_actual: 1000, descripcion: 'Cuenta de prueba' };
  const adaptadores: Record<string, unknown> = {
    react,
    'react-native': {
      ...Object.fromEntries(['View', 'Text', 'Pressable', 'ScrollView', 'Modal', 'KeyboardAvoidingView', 'ActivityIndicator'].map(n => [n, n])),
      Platform: { OS: 'android' }, StyleSheet: { create: (valor: unknown) => valor },
      useWindowDimensions: () => ({ width: 360, height: 780 }),
    },
    '@react-navigation/native': { useFocusEffect: (callback: () => unknown) => react.useEffect(callback, [callback]) },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../contexts/AppearanceContext': { ContextoApariencia: apariencia },
    '../contexts/ToastContext': { ContextoAvisos: avisos },
    '../social/financialOperation': { operacionFinancieraEnCurso: () => false },
    '../recurrences/recurrenceService': { consultarRecurrenciasDeposito: async () => [] },
    '../profile/balanceVisibilityService': { consultarSaldoOculto: async () => false },
    '../deposits/depositService': {
      ErrorDeposito: class extends Error {},
      consultarDetalleDeposito: async () => ({ deposito, movimientos: observar(movimientos), comparacionMensual: null }),
    },
    '../components/MovementFilterSections': Object.fromEntries(['FiltroTipoMovimientos', 'FiltroFechaMovimientos', 'FiltroCategoriasMovimientos', 'FiltroMontoMovimientos'].map(n => [n, n])),
  };
  for (const nombre of ['DepositForm', 'DepositIconModal', 'MovementQuickFilters', 'SegmentedSelector', 'MovementSearchFilters', 'MovementFiltersPanel', 'RecurrencePanel', 'PrimaryButton', 'SectionHeader', 'MovementCard', 'CollapsibleSectionHeader']) {
    adaptadores['../components/' + nombre] = { __esModule: true, default: nombre };
  }
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const { cargar } = crearCargadorComponentes(raiz, adaptadores);
  const { TEMAS } = cargar<typeof import('../../src/styles/colors.ts')>('src/styles/colors.ts');
  tema = TEMAS.claro;
  const pantalla = cargar<typeof import('../../src/screens/DepositDetailScreen.tsx')>('src/screens/DepositDetailScreen.tsx').default;
  const propiedades = { route: { params: { depositoId: 'deposito' } }, navigation: { addListener: () => () => {}, goBack() {}, push() {} } };
  function renderizar() {
    indice = 0; efectos = [];
    arbol = pantalla(propiedades as unknown as Parameters<typeof pantalla>[0]);
    efectos.forEach(efecto => efecto());
    return arbol;
  }
  async function asentar() { for (let i = 0; i < 4; i++) { await new Promise(resolve => setImmediate(resolve)); renderizar(); } }
  function nodos(nodo: unknown): { type: string; props: Record<string, unknown> }[] {
    if (Array.isArray(nodo)) return nodo.flatMap(nodos);
    if (!nodo || typeof nodo !== 'object' || !('props' in nodo)) return [];
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
    renderizar, asentar, buscar, nodos: () => nodos(arbol), invocar, recuentos,
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
