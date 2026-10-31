import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import babel from '@babel/core';

const require = createRequire(import.meta.url);
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Ejecuta los componentes y callbacks reales; sustituye únicamente React/native.
// No es un motor de layout ni una comprobación visual en dispositivo.
export function interfazSocial(servicios, nombreTema) {
  let instancias = new Map(), actual, indice, efectos, usados;
  const avisos = [], destinos = [], cache = new Map();
  const apariencia = {}, notificaciones = {};
  let temas, propiedades, arbol;
  const iguales = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    createContext(valor) { const contexto = { valor }; contexto.Provider = { contexto }; return contexto; },
    useContext: contexto => contexto === apariencia ? { tema: temas[nombreTema] } : contexto === notificaciones ? { mostrarAviso: mensaje => avisos.push(mensaje) } : contexto.valor,
    useState(inicial) {
      const registro = actual, posicion = indice++;
      if (!(posicion in registro)) registro[posicion] = { valor: typeof inicial === 'function' ? inicial() : inicial };
      const casilla = registro[posicion];
      return [casilla.valor, valor => { const siguiente = typeof valor === 'function' ? valor(casilla.valor) : valor; if (!Object.is(siguiente, casilla.valor)) casilla.valor = siguiente; }];
    },
    useRef(inicial) { const posicion = indice++; return actual[posicion] ||= { current: inicial }; },
    useCallback(funcion, deps) {
      const posicion = indice++;
      if (!actual[posicion] || !iguales(actual[posicion].deps, deps)) actual[posicion] = { deps, funcion };
      return actual[posicion].funcion;
    },
    useEffect(funcion, deps) {
      const registro = actual, posicion = indice++;
      if (!registro[posicion] || !iguales(registro[posicion].deps, deps)) {
        const anterior = registro[posicion]; registro[posicion] = { deps };
        efectos.push(() => { anterior?.limpiar?.(); registro[posicion].limpiar = funcion(); });
      }
    },
  };
  const elemento = (type, props, key) => ({ type, props: props || {}, key });
  const nativo = Object.fromEntries(['View', 'Text', 'Pressable', 'ScrollView', 'Modal', 'TextInput', 'KeyboardAvoidingView'].map(n => [n, n]));
  nativo.Platform = { OS: 'android' };
  nativo.StyleSheet = { create: x => x, absoluteFillObject: { position: 'absolute' } };
  function cargar(archivo) {
    archivo = path.resolve(archivo);
    if (cache.has(archivo)) return cache.get(archivo);
    const modulo = { exports: {} };
    const codigo = babel.transformSync(fs.readFileSync(archivo, 'utf8'), { configFile: false, babelrc: false, plugins: [
      [require.resolve('@babel/plugin-transform-react-jsx'), { runtime: 'automatic' }], require.resolve('@babel/plugin-transform-modules-commonjs'),
    ] }).code;
    const importar = nombre => {
      if (nombre === 'react') return react;
      if (nombre === 'react/jsx-runtime') return { jsx: elemento, jsxs: elemento, Fragment: 'Fragment' };
      if (nombre === 'react-native') return nativo;
      if (nombre === '@expo/vector-icons') return { Ionicons: 'Icon' };
      if (nombre === '@react-navigation/native') return { useFocusEffect: callback => react.useEffect(callback, [callback]) };
      if (nombre === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ bottom: 24 }) };
      if (nombre.endsWith('/MainHeader') || nombre.endsWith('/SectionHeader')) return { __esModule: true, default: 'Header' };
      if (nombre.endsWith('/AppearanceContext')) return { ContextoApariencia: apariencia };
      if (nombre.endsWith('/ToastContext')) return { ContextoAvisos: notificaciones };
      if (nombre.endsWith('/socialService')) return servicios;
      if (nombre.startsWith('.')) return cargar(path.resolve(path.dirname(archivo), nombre + '.js'));
      return require(nombre);
    };
    new Function('require', 'module', 'exports', codigo)(importar, modulo, modulo.exports);
    cache.set(archivo, modulo.exports);
    return modulo.exports;
  }
  temas = cargar(path.join(raiz, 'src/styles/colors.js')).TEMAS;
  const rutas = cargar(path.join(raiz, 'src/constants/routes.js')).RUTAS;
  const adaptadores = cargar(path.join(raiz, 'src/navigation/socialRoutes.js'));
  const principal = cargar(path.join(raiz, 'src/screens/SocialScreen.js')).default;
  const persona = cargar(path.join(raiz, 'src/screens/SocialPersonScreen.js')).default;
  const gasto = cargar(path.join(raiz, 'src/screens/SocialExpenseScreen.js')).default;
  function expandir(nodo, sitio = 'raiz') {
    if (nodo == null || typeof nodo === 'boolean') return null;
    if (Array.isArray(nodo)) return nodo.map((h, i) => expandir(h, `${sitio}/${h?.key ?? i}`));
    if (typeof nodo !== 'object') return String(nodo);
    if (nodo.type?.contexto) {
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
  async function abrir(nombre = rutas.SOCIAL, params = {}) {
    for (const valores of instancias.values()) valores.forEach(v => v?.limpiar?.());
    instancias = new Map();
    const navegar = (...args) => destinos.push(args);
    propiedades = { route: { name: nombre, params }, navigation: { push: navegar, replace: navegar, navigate: navegar, popTo: navegar, getParent: () => ({ navigate: navegar }), goBack: () => destinos.push(['Atrás']) } };
    renderizar(); await asentar();
  }
  function todos(nodo = arbol) {
    if (Array.isArray(nodo)) return nodo.flatMap(todos);
    if (!nodo || typeof nodo !== 'object') return [];
    return [nodo, ...todos(nodo.children)];
  }
  function texto(nodo = arbol) {
    if (Array.isArray(nodo)) return nodo.map(texto).join('');
    if (!nodo || typeof nodo !== 'object') return nodo || '';
    return texto(nodo.children);
  }
  const ambito = () => todos().filter(n => n.type === 'Modal').at(-1) || arbol;
  const buscarBoton = (etiqueta, porTexto) => {
    const opciones = todos(ambito()).filter(n => n.type === 'Pressable' && (porTexto ? texto(n).includes(etiqueta)
      && !todos(n.children).some(h => h.type === 'Pressable' && texto(h).includes(etiqueta)) : n.props.accessibilityLabel === etiqueta || texto(n) === etiqueta));
    assert.equal(opciones.length, 1, `Control único ${etiqueta}: ${opciones.length} ${opciones.map(n => texto(n)).join(' | ')}`);
    return opciones[0];
  };
  async function pulsar(etiqueta, porTexto = false) {
    const boton = buscarBoton(etiqueta, porTexto); assert.ok(!boton.props.disabled, etiqueta + ' habilitado');
    await boton.props.onPress(); renderizar(); await asentar();
  }
  async function llenar(etiqueta, valor) {
    const campo = todos(ambito()).find(n => n.type === 'TextInput' && n.props.accessibilityLabel === etiqueta);
    assert.ok(campo, 'Campo ' + etiqueta); campo.props.onChangeText(valor); renderizar(); await asentar();
  }
  return { abrir, pulsar, llenar, texto, todos, buscarBoton, avisos, destinos, rutas, asentar };
}
