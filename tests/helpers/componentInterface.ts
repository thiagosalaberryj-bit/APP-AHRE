import fs from 'node:fs';
import path from 'node:path';
import { compilarFuente, resolverFuente } from './typescript.ts';

// Ejecuta los componentes reales y reemplaza únicamente las primitivas nativas.
export function crearCargadorComponentes(raiz: string, adaptadores: Record<string, unknown> = {}) {
  const modulos = new Map<string, unknown>();
  const elemento = (type: string, props: Record<string, unknown>) => ({ type, props });
  function evaluar<T>(fuente: string, archivo: string): T {
    const modulo = { exports: {} };
    const importar = (nombre: string): unknown => {
      if (Object.hasOwn(adaptadores, nombre)) return adaptadores[nombre];
      if (nombre === 'react/jsx-runtime') return { jsx: elemento, jsxs: elemento, Fragment: 'Fragment' };
      if (nombre === 'react-native') return {
        View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable', Modal: 'Modal', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator',
        StyleSheet: { create: (estilos: unknown) => estilos },
      };
      if (nombre === '@expo/vector-icons') return { Ionicons: 'Icon' };
      if (nombre.startsWith('.')) return cargar(path.resolve(path.dirname(archivo), nombre));
      throw new Error('Import no previsto: ' + nombre);
    };
    new Function('require', 'module', 'exports', compilarFuente(fuente, archivo, true))(importar, modulo, modulo.exports);
    return modulo.exports as T;
  }
  function cargar<T>(relativa: string): T {
    const archivo = resolverFuente(path.resolve(raiz, relativa));
    if (!modulos.has(archivo)) modulos.set(archivo, evaluar(fs.readFileSync(archivo, 'utf8'), archivo));
    return modulos.get(archivo) as T;
  }
  return { cargar, evaluar };
}
