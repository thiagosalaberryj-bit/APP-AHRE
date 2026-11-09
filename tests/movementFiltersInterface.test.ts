import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { compilarFuente, resolverFuente } from './helpers/typescript.ts';

interface Nodo { type: string; props: Record<string, unknown>; }
type Estado = unknown | ((anterior: unknown) => unknown);

// Ejecuta los controles compartidos; los selectores nativos quedan como hojas
// para comprobar sus propiedades y callbacks sin simular layout de Android.
function preparar(nombreTema: 'claro' | 'oscuro') {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const cache = new Map<string, unknown>();
  const estados: unknown[] = [];
  let indice = 0;
  const elemento = (type: string, props: Record<string, unknown>) => ({ type, props });
  const react = {
    useState(inicial: unknown) {
      const posicion = indice++;
      if (!(posicion in estados)) estados[posicion] = inicial;
      return [estados[posicion], (valor: Estado) => {
        estados[posicion] = typeof valor === 'function' ? valor(estados[posicion]) : valor;
      }];
    },
    useRef(inicial: unknown) {
      const posicion = indice++;
      return estados[posicion] ||= { current: inicial };
    },
    useCallback: (callback: unknown) => callback,
  };
  function cargar<T>(relativa: string): T {
    const archivo = resolverFuente(path.resolve(raiz, relativa));
    if (cache.has(archivo)) return cache.get(archivo) as T;
    const modulo = { exports: {} };
    const importar = (nombre: string): unknown => {
      if (nombre === 'react') return react;
      if (nombre === 'react/jsx-runtime') return { jsx: elemento, jsxs: elemento, Fragment: 'Fragment' };
      if (nombre === 'react-native') return {
        Pressable: 'Pressable', Text: 'Text', View: 'View', ScrollView: 'ScrollView',
        StyleSheet: { create: (estilos: unknown) => estilos },
      };
      if (nombre === '@expo/vector-icons') return { Ionicons: 'Icon' };
      if (nombre === 'react-native-svg') return {
        __esModule: true, default: 'Svg', Defs: 'Defs', LinearGradient: 'LinearGradient', Rect: 'Rect', Stop: 'Stop',
      };
      if (nombre === './MovementFiltersPanel') return { SeccionFiltro: 'SeccionFiltro' };
      if (['./DateSelector', './CategorySelector', './MoneyInput'].includes(nombre)) return { __esModule: true, default: nombre.slice(2) };
      if (nombre.startsWith('.')) return cargar(path.resolve(path.dirname(archivo), nombre));
      throw new Error('Import no previsto: ' + nombre);
    };
    new Function('require', 'module', 'exports', compilarFuente(fs.readFileSync(archivo, 'utf8'), archivo, true))(importar, modulo, modulo.exports);
    cache.set(archivo, modulo.exports);
    return modulo.exports as T;
  }
  const { TEMAS } = cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
  const tema = TEMAS[nombreTema];
  const { crearEstilosMovimientos } = cargar<typeof import('../src/styles/MovementsScreenStyles.ts')>('src/styles/MovementsScreenStyles.ts');
  const { crearEstilosBusquedaFiltros } = cargar<typeof import('../src/styles/MovementSearchFiltersStyles.ts')>('src/styles/MovementSearchFiltersStyles.ts');
  const { crearEstilosGlobales } = cargar<typeof import('../src/styles/globalStyles.ts')>('src/styles/globalStyles.ts');
  const estilos = crearEstilosMovimientos(tema, 360);
  return {
    secciones: cargar<typeof import('../src/components/MovementFilterSections.tsx')>('src/components/MovementFilterSections.tsx'),
    rapidos: cargar<typeof import('../src/components/MovementQuickFilters.tsx')>('src/components/MovementQuickFilters.tsx').default,
    preajustes: cargar<typeof import('../src/utils/statisticsFilters.ts')>('src/utils/statisticsFilters.ts').obtenerPreajustesMovimientos,
    base: { tema, estilos, estilosSelectores: estilos, estilosGlobales: crearEstilosGlobales(tema), resumen: 'Resumen', abierta: true, alAlternar() {} },
    estilosAccesos: crearEstilosBusquedaFiltros(tema),
    renderizar<T>(componente: () => T): T { indice = 0; return componente(); },
  };
}

function nodos(arbol: unknown): Nodo[] {
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (!arbol || typeof arbol !== 'object' || !('props' in arbol)) return [];
  const nodo = arbol as Nodo;
  return [nodo, ...nodos(nodo.props.children)];
}
function texto(arbol: unknown): string {
  if (Array.isArray(arbol)) return arbol.map(texto).join('');
  if (typeof arbol === 'string' || typeof arbol === 'number') return String(arbol);
  return arbol && typeof arbol === 'object' && 'props' in arbol ? texto((arbol as Nodo).props.children) : '';
}
function buscar(arbol: unknown, tipo: string, etiqueta?: string) {
  const encontrados = nodos(arbol).filter(nodo => nodo.type === tipo && (etiqueta === undefined || texto(nodo) === etiqueta));
  assert.equal(encontrados.length, 1, `${tipo}: ${etiqueta ?? ''}`);
  return encontrados[0];
}
function invocar(nodo: Nodo, propiedad: string, ...argumentos: unknown[]) {
  assert.equal(typeof nodo.props[propiedad], 'function');
  (nodo.props[propiedad] as (...valores: unknown[]) => void)(...argumentos);
}

for (const tema of ['claro', 'oscuro'] as const) {
  test(`los filtros conservan selección, estilos y callbacks de cada pantalla (${tema})`, () => {
    const e = preparar(tema);
    let tipo = '', categorias: string[] = [], minimo = '', maximo = '', alternadas = 0;
    for (const estilosChips of [undefined, e.estilosAccesos]) {
      const arbol = e.secciones.FiltroTipoMovimientos({ ...e.base, estilosChips, tipoFiltro: 'egreso', cambiarTipoFiltro: valor => { tipo = valor; }, alAlternar: () => { alternadas++; } });
      const egresos = buscar(arbol, 'Pressable', 'Egresos');
      assert.deepEqual(egresos.props.accessibilityState, { selected: true });
      assert.deepEqual(egresos.props.style, [estilosChips?.filtro ?? e.base.estilos.chip, e.base.estilos.chipTipo, estilosChips?.filtroActivo ?? e.base.estilos.chipActivo]);
      invocar(buscar(arbol, 'Pressable', 'Ingresos'), 'onPress');
      assert.equal(tipo, 'ingreso');
      invocar(buscar(arbol, 'SeccionFiltro'), 'alAlternar');
    }
    assert.equal(alternadas, 2);
    const arbolCategorias = e.secciones.FiltroCategoriasMovimientos({ ...e.base,
      categoriasDisponiblesFiltro: [{ id: 'hogar', nombre: 'Hogar', icono: 'home-outline' }], tipoMovimiento: 'egreso',
      categoriaFiltroIds: ['hogar'], establecerCategoriaFiltroIds: valor => { categorias = valor; },
    });
    const selector = buscar(arbolCategorias, 'CategorySelector');
    assert.equal(selector.props.estilosMovimiento, e.base.estilos);
    assert.equal(selector.props.tipoMovimiento, 'egreso');
    assert.equal(selector.props.seleccionMultiple, true);
    invocar(selector, 'alCambiarMulti', ['hogar', 'compras']);
    assert.deepEqual(categorias, ['hogar', 'compras']);
    const arbolMonto = e.secciones.FiltroMontoMovimientos({ ...e.base,
      montoMinimo: '5000', montoMaximo: '1000', errorMontoFiltro: 'El monto mínimo no puede superar al máximo.',
      establecerMontoMinimo: valor => { minimo = valor; }, establecerMontoMaximo: valor => { maximo = valor; },
    });
    const campos = nodos(arbolMonto).filter(nodo => nodo.type === 'MoneyInput');
    assert.equal(campos.length, 2);
    invocar(campos[0], 'alCambiarTexto', '1000,50'); invocar(campos[1], 'alCambiarTexto', '5000');
    assert.deepEqual([minimo, maximo], ['1000,50', '5000']);
    assert.ok(texto(arbolMonto).includes('El monto mínimo no puede superar al máximo.'));
    assert.ok(campos.every(campo => campo.props.compacto && campo.props.mostrarLimpiar === false));
  });

  test(`fecha conserva día, semana opcional, mes, rango y desvanecidos (${tema})`, () => {
    const e = preparar(tema);
    let fechaElegida: Date | null = null, anio = 2026, modo = '';
    const dia = new Date(2026, 10, 9), fin = new Date(2026, 10, 12);
    const propiedades = { ...e.base, fechaFiltro: 'dia', cambiarFechaFiltro: (valor: string) => { modo = valor; },
      fechaDia: dia, establecerFechaDia: (valor: Date) => { fechaElegida = valor; },
      anioMesVisible: anio, establecerAnioMesVisible: (valor: number | ((previo: number) => number)) => { anio = typeof valor === 'function' ? valor(anio) : valor; },
      mesSeleccionado: dia, establecerMesSeleccionado: (valor: Date) => { fechaElegida = valor; },
      fechaInicial: dia, fechaFinal: fin, seleccionarFechaPersonalizada: (valor: Date) => { fechaElegida = valor; },
    };
    const renderizar = (cambios = {}) => e.renderizar(() => e.secciones.FiltroFechaMovimientos({ ...propiedades, ...cambios }));
    let arbol = renderizar();
    invocar(buscar(arbol, 'DateSelector'), 'alSeleccionar', fin); assert.equal(fechaElegida, fin);
    invocar(buscar(arbol, 'Pressable', 'Mes'), 'onPress'); assert.equal(modo, 'mes');
    assert.equal(nodos(renderizar({ fechaFiltro: 'semana' })).filter(nodo => nodo.type === 'DateSelector').length, 0);
    assert.equal(buscar(renderizar({ fechaFiltro: 'semana', mostrarSelectorSemana: true }), 'DateSelector').props.etiqueta, 'Semana que incluye');
    arbol = renderizar({ fechaFiltro: 'mes' });
    invocar(buscar(arbol, 'Pressable', 'Enero'), 'onPress');
    assert.equal(Number(fechaElegida), new Date(2026, 0, 1).getTime());
    invocar(nodos(arbol).find(nodo => nodo.props.accessibilityLabel === 'Año anterior')!, 'onPress'); assert.equal(anio, 2025);
    arbol = renderizar({ fechaFiltro: 'personalizado', errorFechaFiltro: 'Elegí una fecha desde y una fecha hasta.' });
    const rango = buscar(arbol, 'DateSelector');
    assert.equal(rango.props.rangoInicio, dia); assert.equal(rango.props.rangoFin, fin);
    assert.equal(rango.props.resaltarExtremosRango, true);
    assert.equal(rango.props.textoValor, `${dia.toLocaleDateString('es-AR')} – ${fin.toLocaleDateString('es-AR')}`);
    assert.ok(texto(arbol).includes('Elegí una fecha desde y una fecha hasta.'));
    invocar(rango, 'alSeleccionar', dia); assert.equal(fechaElegida, dia);
    arbol = renderizar();
    invocar(buscar(arbol, 'ScrollView'), 'onLayout', { nativeEvent: { layout: { width: 200 } } });
    invocar(buscar(arbol, 'ScrollView'), 'onContentSizeChange', 400);
    assert.deepEqual(nodos(renderizar()).filter(nodo => nodo.type === 'LinearGradient').map(nodo => nodo.props.id), ['desvanecidoFechaDerecha']);
    invocar(buscar(renderizar(), 'ScrollView'), 'onScroll', { nativeEvent: { contentOffset: { x: 100 } } });
    assert.equal(nodos(renderizar()).filter(nodo => nodo.type === 'Svg').length, 2);
    invocar(buscar(renderizar(), 'ScrollView'), 'onScroll', { nativeEvent: { contentOffset: { x: 200 } } });
    assert.deepEqual(nodos(renderizar()).filter(nodo => nodo.type === 'LinearGradient').map(nodo => nodo.props.id), ['desvanecidoFechaIzquierda']);
  });

  test(`accesos rápidos acumulan grupos, cambian tipo y alternan montos (${tema})`, () => {
    const e = preparar(tema);
    let tipo = 'todos', ids: string[] = [], minimo = '', maximo = '';
    const renderizar = () => e.rapidos({ estilosAccesos: e.estilosAccesos, tipoFiltro: tipo,
      cambiarTipoFiltro: valor => { tipo = valor; }, establecerTipoFiltro: valor => { tipo = valor; },
      preajustesCategorias: e.preajustes(tipo, [{ id: 'hogar', tipo: 'egreso' }, { id: 'servicios', tipo: 'egreso' }, { id: 'sueldo', tipo: 'ingreso' }]),
      categoriaFiltroIds: ids, establecerCategoriaFiltroIds: valor => { ids = typeof valor === 'function' ? valor(ids) : valor; },
      montoMinimoNumerico: minimo ? Number(minimo) : null, montoMaximoNumerico: maximo ? Number(maximo) : null,
      errorMontoFiltro: null, establecerMontoMinimo: valor => { minimo = valor; }, establecerMontoMaximo: valor => { maximo = valor; },
    });
    invocar(buscar(renderizar(), 'Pressable', 'Día a día'), 'onPress'); assert.deepEqual(ids, ['hogar']);
    invocar(buscar(renderizar(), 'Pressable', 'Servicios y obligaciones'), 'onPress'); assert.deepEqual(ids, ['hogar', 'servicios']);
    invocar(buscar(renderizar(), 'Pressable', 'Día a día'), 'onPress'); assert.deepEqual(ids, ['servicios']);
    assert.equal(buscar(renderizar(), 'Pressable', 'Bienestar y formación').props.disabled, true);
    tipo = 'todos';
    invocar(buscar(renderizar(), 'Pressable', 'Trabajo y ventas'), 'onPress');
    assert.equal(tipo, 'ingreso'); assert.deepEqual(ids, ['servicios', 'sueldo']);
    invocar(buscar(renderizar(), 'Pressable', 'Egresos'), 'onPress'); assert.equal(tipo, 'egreso');
    invocar(buscar(renderizar(), 'Pressable', '$1.000–$5.000'), 'onPress'); assert.deepEqual([minimo, maximo], ['1000', '5000']);
    assert.deepEqual(buscar(renderizar(), 'Pressable', '$1.000–$5.000').props.accessibilityState, { selected: true });
    invocar(buscar(renderizar(), 'Pressable', '$1.000–$5.000'), 'onPress'); assert.deepEqual([minimo, maximo], ['', '']);
    invocar(buscar(renderizar(), 'Pressable', 'Hasta $1.000'), 'onPress'); assert.deepEqual([minimo, maximo], ['', '1000']);
    invocar(buscar(renderizar(), 'Pressable', '$5.000 o más'), 'onPress'); assert.deepEqual([minimo, maximo], ['5000', '']);
  });
}
