import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';

test('regreso protegido ignora repeticiones, falta de foco, falta de historial y operaciones pendientes', () => {
  let foco = true, historial = true, bloqueado = false, regresos = 0;
  let alEnfocar: () => void = () => {};
  const referencia = { current: false };
  let indice = 0;
  const referencias: { current: unknown }[] = [referencia];
  const { cargar } = crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), {
    'react-native': { Platform: { OS: 'ios' } },
    react: {
      useRef: (valor: unknown) => referencias[indice++] ||= { current: valor },
      useCallback: (accion: unknown) => accion,
    },
    '@react-navigation/native': { useFocusEffect: (accion: () => void) => { alEnfocar = accion; } },
  });
  const { useRegresoProtegido } = cargar<typeof import('../src/navigation/useSafeGoBack.ts')>('src/navigation/useSafeGoBack.ts');
  const navegacion = { isFocused: () => foco, canGoBack: () => historial, goBack: () => { regresos++; } };
  const renderizar = (bloqueo: () => boolean) => { indice = 0; return useRegresoProtegido(navegacion, bloqueo); };
  const volver = renderizar(() => bloqueado);
  alEnfocar();
  foco = false; volver(); assert.equal(regresos, 0);
  foco = true; historial = false; volver(); assert.equal(regresos, 0);
  historial = true; bloqueado = true; volver(); assert.equal(regresos, 0);
  bloqueado = false; volver(); volver(); assert.equal(regresos, 1);
  alEnfocar(); volver(); assert.equal(regresos, 2);
  alEnfocar(); renderizar(() => true); volver(); assert.equal(regresos, 2);
  renderizar(() => false); volver(); assert.equal(regresos, 3);
});


test('el hook conecta Atrás Android al regreso protegido y retira la escucha al perder foco', () => {
  let alEnfocar: () => void | (() => void) = () => {};
  let atras: () => boolean = () => false;
  let foco = true, bloqueado = true, historial = true, regresos = 0, retiradas = 0;
  const { cargar } = crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), {
    react: { useRef: (valor: unknown) => ({ current: valor }), useCallback: (accion: unknown) => accion },
    '@react-navigation/native': { useFocusEffect: (accion: typeof alEnfocar) => { alEnfocar = accion; } },
    'react-native': { Platform: { OS: 'android' }, BackHandler: { addEventListener: (evento: string, accion: () => boolean) => {
      assert.equal(evento, 'hardwareBackPress'); atras = accion;
      return { remove: () => { retiradas++; } };
    } } },
  });
  const { useRegresoProtegido } = cargar<typeof import('../src/navigation/useSafeGoBack.ts')>('src/navigation/useSafeGoBack.ts');
  const volver = useRegresoProtegido({ isFocused: () => foco, canGoBack: () => historial, goBack: () => { regresos++; } }, () => bloqueado);
  const limpiar = alEnfocar();
  assert.equal(atras(), true); assert.equal(regresos, 0);
  foco = false; assert.equal(atras(), false);
  foco = true; bloqueado = false; historial = false; assert.equal(atras(), false);
  historial = true; assert.equal(atras(), true); assert.equal(regresos, 1);
  volver(); assert.equal(atras(), true); assert.equal(regresos, 1);
  assert.equal(typeof limpiar, 'function'); if (limpiar) limpiar();
  assert.equal(retiradas, 1);
});
