import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';

interface Nodo { type: string; props: Record<string, unknown>; }
function nodos(arbol: unknown): Nodo[] {
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (!arbol || typeof arbol !== 'object' || !('props' in arbol)) return [];
  const componente = arbol as { type: unknown; props: Record<string, unknown> };
  if (typeof componente.type === 'function' && componente.type.name === 'AccionesEncabezadoCompacto') return nodos(componente.type(componente.props));
  const nodo = arbol as Nodo; return [nodo, ...nodos(nodo.props.children)];
}
function preparar(nombre: 'claro' | 'oscuro', reducir = false, propiedadesEncabezado: import('../src/types/ui.ts').EncabezadoProps = {}) {
  type Casilla = { valor?: unknown; current?: unknown; deps?: readonly unknown[]; limpiar?: () => void };
  const instancias = new Map<string, Casilla[]>(); let casillas: Casilla[] = [], indice = 0, efectos: (() => void)[] = [];
  let contexto: unknown = null, tecladosCerrados = 0;
  const animaciones: { toValue: number; duration: number; useNativeDriver: boolean }[] = [];
  const destinos: string[] = [];
  const iguales = (a?: readonly unknown[], b?: readonly unknown[]) => a && b && a.length === b.length && a.every((valor,i) => Object.is(valor,b[i]));
  const react = {
    isValidElement: (valor: unknown) => !!valor && typeof valor === 'object' && 'props' in valor,
    createContext: (valor: unknown) => ({ valor, Provider: 'Provider' }), useContext: () => contexto,
    useState(inicial: unknown) {
      const posicion = indice++; casillas[posicion] ||= { valor: typeof inicial === 'function' ? inicial() : inicial };
      const casilla = casillas[posicion]; return [casilla.valor, (valor: unknown) => { casilla.valor = typeof valor === 'function' ? valor(casilla.valor) : valor; }];
    },
    useRef(inicial: unknown) { return casillas[indice++] ||= { current: inicial }; },
    useMemo<T>(calcular: () => T, deps: readonly unknown[]): T {
      const posicion = indice++; if (!casillas[posicion] || !iguales(casillas[posicion].deps,deps)) casillas[posicion] = { valor: calcular(), deps };
      return casillas[posicion].valor as T;
    },
    useCallback<T>(callback: T, deps: readonly unknown[]) { return react.useMemo(() => callback,deps); },
    useEffect(callback: () => unknown, deps: readonly unknown[]) {
      const posicion = indice++, registros = casillas, anterior = registros[posicion];
      if (anterior && iguales(anterior.deps,deps)) return;
      registros[posicion] = { deps };
      efectos.push(() => { anterior?.limpiar?.(); const limpiar = callback(); if (typeof limpiar === 'function') registros[posicion].limpiar = limpiar as () => void; });
    },
  };
  class Valor { valor: number; constructor(valor: number) { this.valor = valor; } setValue(valor: number) { this.valor = valor; } stopAnimation() {} interpolate({outputRange}: { outputRange: number[] }) { return outputRange[0] + this.valor * (outputRange[1] - outputRange[0]); } }
  const { cargar } = crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), {
    react,
    '@react-navigation/native': { useNavigation: () => ({ navigate: (ruta: string) => destinos.push(ruta) }) },
    './SyncStatus': { __esModule: true, default: 'SyncStatus' },
    'react-native': { View: 'View', Pressable: 'Pressable', ScrollView: 'ScrollView', SectionList: 'SectionList',
      StyleSheet: { create: (estilos: unknown) => estilos }, Keyboard: { dismiss: () => { tecladosCerrados++; } },
      AccessibilityInfo: { isReduceMotionEnabled: async () => reducir, addEventListener: () => ({ remove() {} }) },
      Animated: { Value: Valor, View: 'AnimatedView', timing: (valor: Valor, opciones: typeof animaciones[number]) => ({ start: () => { animaciones.push(opciones); valor.setValue(opciones.toValue); } }) },
    },
  });
  const marco = cargar<typeof import('../src/components/ScreenHeaderFrame.tsx')>('src/components/ScreenHeaderFrame.tsx').default;
  const desplazamientos = cargar<typeof import('../src/components/HeaderScrollView.tsx')>('src/components/HeaderScrollView.tsx');
  const { TEMAS } = cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
  function renderizar<T>(id: string, crear: () => T): T {
    if (!instancias.has(id)) instancias.set(id,[]); casillas = instancias.get(id)!; indice = 0; efectos = [];
    const resultado = crear(); efectos.forEach(efecto => efecto()); return resultado;
  }
  let arbol: unknown;
  const renderizarMarco = () => {
    arbol = renderizar('marco', () => marco({ tema: TEMAS[nombre], encabezado: { type: 'Header', props: propiedadesEncabezado } as never, children: { type: 'Contenido', props: {} } as never }));
    contexto = (arbol as Nodo).props.value; return arbol;
  };
  const evento = (y: number) => ({ nativeEvent: { contentOffset: { y }, contentSize: { height: 2000 }, layoutMeasurement: { height: 600 } } });
  function invocar(nodo: Nodo, propiedad: string, valor?: unknown) { assert.equal(typeof nodo.props[propiedad], 'function'); (nodo.props[propiedad] as (valor?:unknown)=>void)(valor); renderizarMarco(); }
  return { renderizar, renderizarMarco, evento, invocar, desplazamientos, animaciones, destinos, tema: TEMAS[nombre], get tecladosCerrados() { return tecladosCerrados; },
    elementos: () => nodos(arbol),
    boton(etiqueta: string) { const boton = nodos(arbol).find(n => n.props.accessibilityLabel === etiqueta); assert.ok(boton, etiqueta); return boton; },
    async asentar() { await new Promise(resolver => setImmediate(resolver)); renderizarMarco(); renderizarMarco(); },
    desmontar() { instancias.forEach(registros => registros.forEach(casilla => casilla.limpiar?.())); },
  };
}

for (const tema of ['claro', 'oscuro'] as const) test(`marco plegable conserva referencias, eventos y controles sin cubrir contenido (${tema})`, async prueba => {
  const e = preparar(tema); prueba.after(e.desmontar); e.renderizarMarco(); await e.asentar();
  const eventos: string[] = [], subidas: unknown[] = [];
  const ref = { current: null as import('react-native').ScrollView | null };
  const scroll = e.renderizar('scroll', () => e.desplazamientos.DesplazamientoEncabezado({ ref,
    onScroll: () => eventos.push('scroll'), onScrollBeginDrag: () => eventos.push('inicio'), onScrollEndDrag: () => eventos.push('fin'),
    onMomentumScrollBegin: () => eventos.push('inercia'), onMomentumScrollEnd: () => eventos.push('fin-inercia'),
    alVolverAlInicio: () => eventos.push('cancelar-paginacion'), keyboardShouldPersistTaps: 'handled',
  })) as unknown as Nodo;
  const nativo = { scrollTo: (opciones: unknown) => { eventos.push('subir'); subidas.push(opciones); } };
  (scroll.props.ref as (valor: unknown)=>void)(nativo); assert.equal(ref.current, nativo);
  assert.equal(scroll.props.keyboardShouldPersistTaps, 'handled');
  assert.ok(!e.elementos().some(n => n.props.accessibilityLabel === 'Volver al inicio de la pantalla'));
  e.invocar(scroll,'onScrollBeginDrag',e.evento(0)); e.invocar(scroll,'onScroll',e.evento(250)); await e.asentar();
  assert.ok(e.elementos().some(n => n.type === 'AnimatedView' && n.props.importantForAccessibility === 'no-hide-descendants'));
  assert.equal(e.elementos().filter(n => n.type === 'Pressable').length, 4);
  assert.equal(e.elementos().filter(n => n.type === 'SyncStatus').length, 1);
  e.invocar(e.boton('Desplegar encabezado'),'onPress'); await e.asentar(); e.boton('Plegar encabezado');
  e.invocar(scroll,'onScroll',e.evento(280)); e.boton('Plegar encabezado');
  e.invocar(scroll,'onScrollEndDrag',e.evento(280)); e.invocar(scroll,'onMomentumScrollBegin',e.evento(280)); e.invocar(scroll,'onMomentumScrollEnd',e.evento(280));
  e.invocar(e.boton('Volver al inicio de la pantalla'),'onPress');
  assert.deepEqual(subidas,[{ y: 0, animated: true }]); assert.equal(e.tecladosCerrados,1);
  assert.deepEqual(eventos.slice(-2),['cancelar-paginacion','subir']);
  for (const nombre of ['scroll','inicio','fin','inercia','fin-inercia']) assert.ok(eventos.includes(nombre));
  assert.ok(e.animaciones.every(animacion => animacion.duration === 180 && animacion.useNativeDriver === false));
  assert.ok(e.animaciones.length >= 2);
  assert.ok(!e.elementos().some(n => n.type === 'Pressable'));
  (scroll.props.ref as (valor: unknown)=>void)(null); assert.equal(ref.current,null);
});

test('SectionList vuelve al inicio con el mismo control y respeta reducir movimiento', async prueba => {
  const e = preparar('oscuro',true); prueba.after(e.desmontar); e.renderizarMarco(); await e.asentar();
  let referencia: unknown = null; const subidas: unknown[] = [];
  const lista = e.renderizar('secciones', () => e.desplazamientos.SeccionesEncabezado({ sections: [{ data: [1,2] }],
    ref: nodo => { referencia = nodo; }, renderItem: () => null,
  })) as unknown as Nodo;
  const nativo = { getScrollResponder: () => ({ scrollTo: (opciones: unknown) => subidas.push(opciones) }) };
  (lista.props.ref as (valor: unknown)=>void)(nativo); assert.equal(referencia,nativo);
  e.invocar(lista,'onScrollBeginDrag',e.evento(0)); e.invocar(lista,'onScroll',e.evento(250));
  e.invocar(e.boton('Volver al inicio de la pantalla'),'onPress');
  assert.deepEqual(subidas,[{ y: 0, animated: false }]); assert.equal(e.animaciones.length,0);
});

for (const tema of ['claro', 'oscuro'] as const) test(`barra compacta conserva color, iconos y acciones sin fondos individuales (${tema})`, async prueba => {
  let perfiles = 0, notificaciones = 0;
  const e = preparar(tema, false, { alAbrirPerfil: () => { perfiles++; }, alAbrirNotificaciones: () => { notificaciones++; } });
  prueba.after(e.desmontar); e.renderizarMarco(); await e.asentar();
  const scroll = e.renderizar('scroll', () => e.desplazamientos.DesplazamientoEncabezado({})) as unknown as Nodo;
  e.invocar(scroll,'onScrollBeginDrag',e.evento(0)); e.invocar(scroll,'onScroll',e.evento(250));
  const fila = e.elementos().find(n => n.type === 'View' && (n.props.style as import('react-native').ViewStyle)?.height === 44);
  assert.ok(fila); assert.equal((fila.props.style as import('react-native').ViewStyle).backgroundColor,e.tema.encabezado);
  for (const etiqueta of ['Perfil','Notificaciones']) {
    const boton = e.boton(etiqueta); const estilo = boton.props.style as import('react-native').ViewStyle;
    assert.equal(estilo.backgroundColor,undefined); assert.equal(estilo.width,44); assert.equal(estilo.height,44);
    e.invocar(boton,'onPress');
  }
  assert.equal(perfiles,1); assert.equal(notificaciones,1); assert.deepEqual(e.destinos,[]);
  const estado = e.elementos().find(n => n.type === 'SyncStatus'); assert.equal(estado?.props.soloIcono,true);
  assert.ok(e.elementos().filter(n => n.type === 'Icon').every(n => n.props.color === e.tema.botonPrincipal));
  e.invocar(e.boton('Desplegar encabezado'),'onPress');
  assert.ok(!e.elementos().some(n => n.props.accessibilityLabel === 'Perfil' || n.type === 'SyncStatus'));

  const secundaria = preparar(tema,false,{ mostrarSincronizacion: false }); prueba.after(secundaria.desmontar);
  secundaria.renderizarMarco(); await secundaria.asentar();
  const otro = secundaria.renderizar('scroll', () => secundaria.desplazamientos.DesplazamientoEncabezado({})) as unknown as Nodo;
  secundaria.invocar(otro,'onScrollBeginDrag',secundaria.evento(0)); secundaria.invocar(otro,'onScroll',secundaria.evento(250));
  secundaria.invocar(secundaria.boton('Perfil'),'onPress'); secundaria.invocar(secundaria.boton('Notificaciones'),'onPress');
  assert.deepEqual(secundaria.destinos,['Perfil','Notificaciones']); assert.ok(!secundaria.elementos().some(n => n.type === 'SyncStatus'));
});
