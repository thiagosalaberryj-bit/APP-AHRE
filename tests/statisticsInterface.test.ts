import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';

interface Nodo { type: string; props: Record<string, unknown>; }
function nodos(arbol: unknown): Nodo[] {
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (!arbol || typeof arbol !== 'object' || !('props' in arbol)) return [];
  const nodo = arbol as Nodo;
  return [nodo, ...nodos(nodo.props.children)];
}
function invocar(nodo: unknown, evento: string, ...valores: unknown[]) {
  const propiedades = (nodo as Nodo).props;
  assert.equal(typeof propiedades[evento], 'function');
  (propiedades[evento] as (...argumentos: unknown[]) => void)(...valores);
}
function preparar(nombreTema: 'claro' | 'oscuro') {
  const estados: unknown[] = [], dependencias: (readonly unknown[] | undefined)[] = [];
  let indice = 0, efectos: (() => unknown)[] = [];
  const react = {
    useState(inicial: unknown) {
      const posicion = indice++;
      if (!(posicion in estados)) estados[posicion] = typeof inicial === 'function' ? inicial() : inicial;
      return [estados[posicion], (valor: unknown) => { estados[posicion] = typeof valor === 'function' ? valor(estados[posicion]) : valor; }];
    },
    useRef(inicial: unknown) { const posicion = indice++; return estados[posicion] ||= { current: inicial }; },
    useCallback: (callback: unknown) => callback,
    useEffect(callback: () => unknown, deps: readonly unknown[]) {
      const posicion = indice++, anteriores = dependencias[posicion];
      if (!anteriores || deps.some((valor, i) => !Object.is(valor, anteriores[i]))) efectos.push(callback);
      dependencias[posicion] = deps;
    },
  };
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { cargar } = crearCargadorComponentes(raiz, { react, 'react-native-svg': { __esModule: true, default: 'Svg', Circle: 'Circle', Path: 'Path' } });
  const { TEMAS } = cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
  const tema = TEMAS[nombreTema];
  const { crearEstilosEstadisticas } = cargar<typeof import('../src/styles/StatisticsScreenStyles.ts')>('src/styles/StatisticsScreenStyles.ts');
  return {
    tema, estilos: crearEstilosEstadisticas(tema),
    circular: cargar<typeof import('../src/components/StatisticsPieChart.tsx')>('src/components/StatisticsPieChart.tsx').default,
    columnas: cargar<typeof import('../src/components/StatisticsBarChart.tsx')>('src/components/StatisticsBarChart.tsx').default,
    fechas: cargar<typeof import('../src/components/StatisticsDateControls.tsx')>('src/components/StatisticsDateControls.tsx'),
    datos: cargar<typeof import('../src/statistics/statisticsPresentation.ts')>('src/statistics/statisticsPresentation.ts'),
    renderizar<T>(callback: () => T): T { indice = 0; efectos = []; return callback(); },
    ejecutarEfectos() { efectos.forEach(efecto => efecto()); },
  };
}

for (const tema of ['claro', 'oscuro'] as const) {
  test(`calendario conserva año bisiesto, navegación, selección y reapertura (${tema})`, () => {
    const e = preparar(tema);
    let seleccion: Date | null = null, cerrado = false;
    let fecha = new Date(2024, 1, 29), visible = true;
    const renderizar = () => e.renderizar(() => e.fechas.CalendarioDesplegable({ tema: e.tema, estilos: e.estilos, fecha, visible,
      alCerrar: () => { cerrado = true; }, alSeleccionar: valor => { seleccion = valor; },
    }));
    let arbol = renderizar(); e.ejecutarEfectos(); arbol = renderizar();
    const dias = nodos(arbol).filter(n => n.type === 'Pressable' && n.props.accessibilityState);
    assert.equal(dias.length, 29);
    const elegido = dias.find(n => (n.props.accessibilityState as { selected: boolean }).selected)!;
    assert.equal(elegido.props.accessibilityLabel, fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }));
    invocar(elegido, 'onPress'); assert.equal(Number(seleccion), fecha.getTime());
    invocar(nodos(arbol).find(n => n.props.accessibilityLabel === 'Mes anterior'), 'onPress');
    assert.equal(nodos(renderizar()).filter(n => n.type === 'Pressable' && n.props.accessibilityState).length, 31);
    visible = false; assert.equal(renderizar(), null); e.ejecutarEfectos();
    fecha = new Date(2025, 1, 5); visible = true; renderizar(); e.ejecutarEfectos(); arbol = renderizar();
    assert.equal(nodos(arbol).filter(n => n.type === 'Pressable' && n.props.accessibilityState).length, 28);
    invocar(nodos(arbol).find(n => n.props.accessibilityLabel === 'Cerrar calendario'), 'onPress'); assert.equal(cerrado, true);
    const hoy = nodos(arbol).filter(n => n.type === 'Pressable').at(-1)!;
    invocar(hoy, 'onPress'); assert.equal(Number(seleccion), e.datos.normalizarFecha(new Date()).getTime());
  });

  test(`selector flotante conserva selección y límite de altura (${tema})`, () => {
    const e = preparar(tema); let seleccionado: string | number = '';
    const propiedades = { tema: e.tema, estilos: e.estilos, visible: true, titulo: 'Año', opciones: [{ id: 2024, nombre: '2024' }, { id: 2025, nombre: '2025' }], valorSeleccionado: 2025, altoMaximo: 100,
      alCerrar() {}, alSeleccionar: (valor: string | number) => { seleccionado = valor; },
    };
    const arbol = e.fechas.SelectorDesplegable(propiedades);
    assert.deepEqual(nodos(arbol).filter(n => n.type === 'Pressable').map(n => n.props.accessibilityState), [{ selected: false }, { selected: true }]);
    invocar(nodos(arbol).find(n => n.props.accessibilityLabel === 'Año: 2024'), 'onPress'); assert.equal(seleccionado, 2024);
    assert.ok(JSON.stringify(nodos(arbol).find(n => n.type === 'ScrollView')?.props.style).includes('"maxHeight":100'));
    assert.equal(e.fechas.SelectorDesplegable({ ...propiedades, visible: false }), null);
  });

  test(`gráfico circular conserva círculo completo, sectores y selección (${tema})`, () => {
    const e = preparar(tema), categorias = e.datos.obtenerCategorias('egreso', e.tema).slice(0, 2);
    let seleccion = '';
    const datos = e.datos.crearDatosResumen(categorias, categorias.map((c, i) => ({ categoria: c.id, total: i ? 25 : 75, cantidad: 1 })), 100);
    const base = { tema: e.tema, tamano: 280, totalGeneral: 100, seleccionadaId: categorias[0].id, alSeleccionar: (id: string) => { seleccion = id; } };
    const sectores = nodos(e.circular({ ...base, categorias: datos })).filter(n => n.type === 'Path');
    assert.equal(sectores.length, 2);
    assert.equal(sectores.at(-1)?.props.fill, categorias[0].color);
    assert.equal(sectores.at(-1)?.props.strokeWidth, 4);
    invocar(sectores[0], 'onPress'); assert.equal(seleccion, categorias[1].id);
    const unico = e.datos.crearDatosResumen(categorias.slice(0, 1), [{ categoria: categorias[0].id, total: 100, cantidad: 1 }], 100);
    const circulos = nodos(e.circular({ ...base, categorias: unico }));
    assert.equal(circulos.filter(n => n.type === 'Path').length, 0);
    invocar(circulos.find(n => n.type === 'Circle' && n.props.onPress), 'onPress'); assert.equal(seleccion, categorias[0].id);
    assert.ok(String(circulos.find(n => n.props.accessibilityLabel)?.props.accessibilityLabel).endsWith('100%'));
  });

  test(`columnas conservan umbral de arrastre, límites y supresión del toque posterior (${tema})`, () => {
    const e = preparar(tema), categorias = e.datos.obtenerCategorias('egreso', e.tema).slice(0, 1);
    const barras = e.datos.crearDatosColumnas(categorias, 'anio', [{ periodo: '2024-01', categoria: categorias[0].id, total: 10 }], new Date(2024, 0, 1), 2024).slice(0, 3);
    const selecciones: number[] = []; let inicios = 0, finales = 0;
    const arbol = e.renderizar(() => e.columnas({ barras, tema: e.tema, estilos: e.estilos, tamano: 280, graficoActivo: false, indiceSeleccionado: 1,
      alSeleccionar: valor => { selecciones.push(valor); }, alIniciarSeleccion: () => { inicios++; }, alFinalizarSeleccion: () => { finales++; },
    }));
    const raiz = nodos(arbol)[0];
    (raiz.props.ref as { current: unknown }).current = { measureInWindow: (callback: (x: number, y: number, ancho: number) => void) => callback(100, 0, 300) };
    const evento = (x: number) => ({ nativeEvent: { pageX: x } });
    invocar(raiz, 'onLayout', { nativeEvent: { layout: { width: 300 } } });
    invocar(raiz, 'onTouchStart', evento(100)); invocar(raiz, 'onTouchMove', evento(106)); assert.deepEqual(selecciones, []);
    invocar(raiz, 'onTouchMove', evento(250)); assert.deepEqual(selecciones, [1]);
    invocar(raiz, 'onTouchMove', evento(999)); invocar(raiz, 'onTouchMove', evento(0)); assert.deepEqual(selecciones, [1, 2, 0]);
    invocar(raiz, 'onTouchEnd'); assert.equal(finales, 1); assert.equal(inicios, 1);
    const botones = nodos(arbol).filter(n => n.type === 'Pressable');
    invocar(botones[2], 'onPress'); assert.deepEqual(selecciones, [1, 2, 0]);
    invocar(botones[2], 'onPress'); assert.deepEqual(selecciones, [1, 2, 0, 2]);
    invocar(raiz, 'onTouchCancel'); assert.equal(finales, 2);
    assert.deepEqual(botones.map(n => n.props.accessibilityState), [{ selected: false }, { selected: true }, { selected: false }]);
  });
}
