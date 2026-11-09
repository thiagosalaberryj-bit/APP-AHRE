import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCargadorComponentes } from './componentInterface.ts';
import type { Movimiento } from '../../src/database/types.ts';

export function interfazDetalleDeposito(movimientosIniciales: Movimiento[], opciones: {
  consultarPagina?: typeof import('../../src/deposits/depositService.ts').consultarPaginaMovimientosDeposito;
} = {}) {
  const casillas: { valor?: unknown; current?: unknown; deps?: readonly unknown[]; limpiar?: () => void }[] = [];
  let indice = 0, efectos: (() => unknown)[] = [], arbol: unknown;
  const recuentos = { consultas: 0, filas: 0 };
  const consultas: { filtros: import('../../src/types/forms.ts').FiltrosHistorial; cursor?: { fecha_hora: string; id: string } | null }[] = [];
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
  let enfocada = true;
  const deposito = { id: 'deposito', usuario_id: 'usuario', nombre: 'Cuenta', tipo: 'banco', saldo_actual: 1000, descripcion: 'Cuenta de prueba' };
  const adaptadores: Record<string, unknown> = {
    react,
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
    '../deposits/depositService': {
      ErrorDeposito: class extends Error {},
      consultarDetalleDeposito: async () => ({ deposito, cantidadMovimientos: movimientos.length, categoriasMovimientos: [...new Set(movimientos.map(m => m.categoria))], comparacionMensual: null }),
    },
    './depositService': {
      consultarPaginaMovimientosDeposito: async (id: string, filtros: import('../../src/types/forms.ts').FiltrosHistorial, cursor?: {fecha_hora:string;id:string}|null) => {
        recuentos.consultas++;
        consultas.push({ filtros, cursor });
        const filas = opciones.consultarPagina ? await opciones.consultarPagina(id, filtros, cursor) : movimientos
          .filter(m => (!filtros.desde || m.fecha_hora >= filtros.desde) && (!filtros.hasta || m.fecha_hora < filtros.hasta)
            && (!filtros.busqueda || m.descripcion.toLocaleLowerCase('es-AR').includes(filtros.busqueda.toLocaleLowerCase('es-AR')))
            && (filtros.tipo === 'todos' || !filtros.tipo || (filtros.tipo === 'ingreso' ? ['ingreso','transferencia_entrada'].includes(m.tipo) : ['egreso','transferencia_salida'].includes(m.tipo)))
            && (!filtros.categoriaIds || filtros.categoriaIds.includes(m.categoria))
            && (filtros.montoMinimo == null || m.monto >= filtros.montoMinimo) && (filtros.montoMaximo == null || m.monto <= filtros.montoMaximo)
            && (!cursor || m.fecha_hora < cursor.fecha_hora || (m.fecha_hora === cursor.fecha_hora && m.id < cursor.id)))
          .sort((a,b) => b.fecha_hora.localeCompare(a.fecha_hora) || b.id.localeCompare(a.id)).slice(0,50)
          .map(m => ({ ...m, deposito_nombre: deposito.nombre }));
        recuentos.filas += filas.length;
        return filas;
      },
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
  async function asentar() { for (let i = 0; i < 6; i++) { await new Promise(resolve => setImmediate(resolve)); renderizar(); } }
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
    renderizar, asentar, buscar, nodos: () => nodos(arbol), invocar, recuentos, consultas,
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
