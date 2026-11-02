import { compilarFuente, resolverFuente } from './typescript.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { TEMAS } from '../../src/styles/colors.ts';
import type { RUTAS } from '../../src/constants/routes.ts';
import type { ParametrosSociales } from '../../src/social/types.ts';

const require = createRequire(import.meta.url);
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
interface Contexto { valor?: unknown; Provider?: { contexto: Contexto }; }
interface Propiedades { children?: Nodo; value?: unknown; [clave: string]: unknown; }
interface Elemento { type: string | Componente | { contexto: Contexto }; props: Propiedades; key?: string | number; children?: Nodo; }
type Nodo = Elemento | Nodo[] | string | number | boolean | null | undefined;
type Componente = (props: Propiedades) => Nodo;
interface Casilla { valor?: unknown; current?: unknown; deps?: readonly unknown[]; funcion?: (...args: never[]) => unknown; limpiar?: void | (() => void); }
type Rutas = typeof RUTAS;

// Ejecuta los componentes y callbacks reales; sustituye únicamente React/native.
// No es un motor de layout ni una comprobación visual en dispositivo.
export function interfazSocial(servicios: typeof import('../../src/social/socialService.ts'), nombreTema: keyof typeof TEMAS) {
  let instancias = new Map<string, Casilla[]>(), actual: Casilla[] = [], indice = 0;
  let efectos: (() => void)[] = [], usados = new Set<string>();
  const avisos: string[] = [], destinos: unknown[][] = [], cache = new Map<string, unknown>();
  const apariencia: Contexto = {}, notificaciones: Contexto = {};
  let temas: typeof TEMAS, propiedades: {route:{name:string;params:ParametrosSociales};navigation:unknown}, arbol: Nodo;
  const iguales = (a?: readonly unknown[], b?: readonly unknown[]) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    createContext(valor: unknown) { const contexto: Contexto = { valor }; contexto.Provider = { contexto }; return contexto; },
    useContext: (contexto: Contexto) => contexto === apariencia ? { tema: temas[nombreTema] } : contexto === notificaciones ? { mostrarAviso: (mensaje: string) => avisos.push(mensaje) } : contexto.valor,
    useState<T>(inicial: T | (() => T)): [T, (valor: T | ((anterior: T) => T)) => void] {
      const registro = actual, posicion = indice++;
      if (!(posicion in registro)) registro[posicion] = { valor: typeof inicial === 'function' ? (inicial as () => T)() : inicial };
      const casilla = registro[posicion];
      return [casilla.valor as T, valor => { const siguiente = typeof valor === 'function' ? (valor as (anterior:T)=>T)(casilla.valor as T) : valor; if (!Object.is(siguiente, casilla.valor)) casilla.valor = siguiente; }];
    },
    useRef<T>(inicial: T) { const posicion = indice++; return (actual[posicion] ||= { current: inicial }) as {current:T}; },
    useCallback<F extends (...args: never[]) => unknown>(funcion: F, deps?: readonly unknown[]): F {
      const posicion = indice++;
      if (!actual[posicion] || !iguales(actual[posicion].deps, deps)) actual[posicion] = { deps, funcion };
      return actual[posicion].funcion as F;
    },
    useEffect(funcion: () => void | (() => void), deps?: readonly unknown[]) {
      const registro = actual, posicion = indice++;
      if (!registro[posicion] || !iguales(registro[posicion].deps, deps)) {
        const anterior = registro[posicion]; registro[posicion] = { deps };
        efectos.push(() => { anterior?.limpiar?.(); registro[posicion].limpiar = funcion(); });
      }
    },
  };
  const elemento = (type: Elemento['type'], props: Propiedades | null, key?: string | number): Elemento => ({ type, props: props || {}, key });
  const nativo: Record<string, unknown> = Object.fromEntries(['View', 'Text', 'Pressable', 'ScrollView', 'Modal', 'TextInput', 'KeyboardAvoidingView'].map(n => [n, n]));
  nativo.Platform = { OS: 'android' };
  nativo.StyleSheet = { create: <T>(x: T) => x, absoluteFill: { position: 'absolute' } };
  function cargar<T>(archivo: string): T {
    archivo = path.resolve(archivo);
    if (cache.has(archivo)) return cache.get(archivo) as T;
    const modulo: {exports: unknown} = { exports: {} };
    const codigo = compilarFuente(fs.readFileSync(archivo, 'utf8'), archivo, true);
    const importar = (nombre: string): unknown => {
      if (nombre === 'react') return react;
      if (nombre === 'react/jsx-runtime') return { jsx: elemento, jsxs: elemento, Fragment: 'Fragment' };
      if (nombre === 'react-native') return nativo;
      if (nombre === '@expo/vector-icons') return { Ionicons: 'Icon' };
      if (nombre === '@react-navigation/native') return { useFocusEffect: (callback:()=>void|(()=>void)) => react.useEffect(callback, [callback]) };
      if (nombre === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ bottom: 24 }) };
      if (nombre.endsWith('/MainHeader') || nombre.endsWith('/SectionHeader')) return { __esModule: true, default: 'Header' };
      if (nombre.endsWith('/AppearanceContext')) return { ContextoApariencia: apariencia };
      if (nombre.endsWith('/ToastContext')) return { ContextoAvisos: notificaciones };
      if (nombre.endsWith('/socialService')) return servicios;
      if (nombre.startsWith('.')) return cargar(resolverFuente(path.resolve(path.dirname(archivo), nombre)));
      return require(nombre);
    };
    new Function('require', 'module', 'exports', codigo)(importar, modulo, modulo.exports);
    cache.set(archivo, modulo.exports);
    return modulo.exports as T;
  }
  temas = cargar<{TEMAS:typeof TEMAS}>(path.join(raiz, 'src/styles/colors.ts')).TEMAS;
  const rutas = cargar<{RUTAS:Rutas}>(path.join(raiz, 'src/constants/routes.ts')).RUTAS;
  const adaptadores = cargar<Record<string, Componente>>(path.join(raiz, 'src/navigation/socialRoutes.tsx'));
  const principal = cargar<{default:Componente}>(path.join(raiz, 'src/screens/SocialScreen.tsx')).default;
  const persona = cargar<{default:Componente}>(path.join(raiz, 'src/screens/SocialPersonScreen.tsx')).default;
  const gasto = cargar<{default:Componente}>(path.join(raiz, 'src/screens/SocialExpenseScreen.tsx')).default;
  function expandir(nodo: Nodo, sitio = 'raiz'): Nodo {
    if (nodo == null || typeof nodo === 'boolean') return null;
    if (Array.isArray(nodo)) return nodo.map((h, i) => expandir(h, `${sitio}/${typeof h === 'object' && h && !Array.isArray(h) ? h.key ?? i : i}`));
    if (typeof nodo !== 'object') return String(nodo);
    if (typeof nodo.type === 'object') {
      const contexto = nodo.type.contexto, anterior = contexto.valor;
      contexto.valor = nodo.props.value;
      const resultado = expandir(nodo.props.children, sitio + '/proveedor');
      contexto.valor = anterior;
      return resultado;
    }
    if (typeof nodo.type === 'function') {
      const clave = sitio + '/' + nodo.type.name;
      usados.add(clave); actual = instancias.get(clave) || []; instancias.set(clave, actual); indice = 0;
      return expandir(nodo.type(nodo.props), clave);
    }
    if (nodo.type === 'Modal' && !nodo.props.visible) return null;
    return { type: nodo.type, props: nodo.props, children: expandir(nodo.props.children, sitio + '/' + nodo.type) };
  }
  function renderizar() {
    efectos = []; usados = new Set();
    const nombre = propiedades.route.name;
    const pantalla = nombre === rutas.SALA_SOCIAL ? adaptadores.RutaSalas : nombre === rutas.PERSONAS_SOCIAL ? adaptadores.RutaPersonas
      : nombre === rutas.REGISTRO_SOCIAL ? adaptadores.RutaRegistro : nombre === rutas.PERSONA_SOCIAL ? persona : nombre === rutas.GASTO_SOCIAL ? gasto : principal;
    arbol = expandir(elemento(pantalla, propiedades));
    for (const [clave, valores] of instancias) if (!usados.has(clave)) { valores.forEach(v => v?.limpiar?.()); instancias.delete(clave); }
    efectos.forEach(f => f());
  }
  async function asentar() {
    for (let i = 0; i < 5; i++) { await new Promise(resolve => setImmediate(resolve)); renderizar(); }
  }
  async function abrir(nombre: string = rutas.SOCIAL, params: ParametrosSociales = {}) {
    for (const valores of instancias.values()) valores.forEach(v => v?.limpiar?.());
    instancias = new Map();
    const navegar = (...args: unknown[]) => destinos.push(args);
    propiedades = { route: { name: nombre, params }, navigation: { push: navegar, replace: navegar, navigate: navegar, popTo: navegar, getParent: () => ({ navigate: navegar }), goBack: () => destinos.push(['Atrás']) } };
    renderizar(); await asentar();
  }
  function todos(nodo: Nodo = arbol): Elemento[] {
    if (Array.isArray(nodo)) return nodo.flatMap(hijo => todos(hijo));
    if (!nodo || typeof nodo !== 'object') return [];
    return [nodo, ...todos(nodo.children)];
  }
  function texto(nodo: Nodo = arbol): string {
    if (Array.isArray(nodo)) return nodo.map(hijo => texto(hijo)).join('');
    if (!nodo || typeof nodo !== 'object') return nodo ? String(nodo) : '';
    return texto(nodo.children);
  }
  const ambito = () => todos().filter(n => n.type === 'Modal').at(-1) || arbol;
  const buscarBoton = (etiqueta: string, porTexto = false) => {
    const opciones = todos(ambito()).filter(n => n.type === 'Pressable' && (porTexto ? texto(n).includes(etiqueta)
      && !todos(n.children).some(h => h.type === 'Pressable' && texto(h).includes(etiqueta)) : n.props.accessibilityLabel === etiqueta || texto(n) === etiqueta));
    assert.equal(opciones.length, 1, `Control único ${etiqueta}: ${opciones.length} ${opciones.map(n => texto(n)).join(' | ')}`);
    return opciones[0];
  };
  async function pulsar(etiqueta: string, porTexto = false) {
    const boton = buscarBoton(etiqueta, porTexto); assert.ok(!boton.props.disabled, etiqueta + ' habilitado');
    assert.equal(typeof boton.props.onPress, 'function');
    await (boton.props.onPress as () => unknown)(); renderizar(); await asentar();
  }
  async function llenar(etiqueta: string, valor = '') {
    const campo = todos(ambito()).find(n => n.type === 'TextInput' && n.props.accessibilityLabel === etiqueta);
    assert.ok(campo, 'Campo ' + etiqueta); assert.equal(typeof campo.props.onChangeText, 'function');
    (campo.props.onChangeText as (valor:string)=>void)(valor); renderizar(); await asentar();
  }
  return { abrir, pulsar, llenar, texto, todos, buscarBoton, avisos, destinos, rutas, asentar };
}
