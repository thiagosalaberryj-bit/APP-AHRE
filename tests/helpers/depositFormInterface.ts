import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCargadorComponentes } from './componentInterface.ts';

// Solo reemplaza las primitivas nativas: estilos y componentes son los reales.
export function interfazFormularioDeposito(nombreTema: 'claro' | 'oscuro') {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const { cargar, evaluar } = crearCargadorComponentes(raiz);
  const { TEMAS } = cargar<typeof import('../../src/styles/colors.ts')>('src/styles/colors.ts');
  const tema = TEMAS[nombreTema];
  const { crearEstilosDeposito } = cargar<typeof import('../../src/styles/DepositScreenStyles.ts')>('src/styles/DepositScreenStyles.ts');
  const { crearEstilosGlobales } = cargar<typeof import('../../src/styles/globalStyles.ts')>('src/styles/globalStyles.ts');
  return {
    formulario: cargar<typeof import('../../src/components/DepositForm.tsx')>('src/components/DepositForm.tsx').default,
    modal: cargar<typeof import('../../src/components/DepositIconModal.tsx')>('src/components/DepositIconModal.tsx').default,
    base: { tema, estilos: crearEstilosDeposito(tema), estilosGlobales: crearEstilosGlobales(tema) },
    cargar, evaluar,
  };
}

export interface NodoFormulario { type: string; props: Record<string, unknown>; }
export function nodosFormulario(arbol: unknown): NodoFormulario[] {
  if (Array.isArray(arbol)) return arbol.flatMap(nodosFormulario);
  if (!arbol || typeof arbol !== 'object' || !('props' in arbol)) return [];
  const nodo = arbol as NodoFormulario;
  return [nodo, ...nodosFormulario(nodo.props.children)];
}
export function textoFormulario(arbol: unknown): string {
  if (Array.isArray(arbol)) return arbol.map(textoFormulario).join('');
  if (typeof arbol === 'string' || typeof arbol === 'number') return String(arbol);
  return arbol && typeof arbol === 'object' && 'props' in arbol ? textoFormulario((arbol as NodoFormulario).props.children) : '';
}
