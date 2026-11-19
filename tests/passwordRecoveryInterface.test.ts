import assert from 'node:assert/strict';
import {setImmediate} from 'node:timers/promises';
import {URL, fileURLToPath} from 'node:url';
import test from 'node:test';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

function nodos(elemento: any): any[] {
  if (Array.isArray(elemento)) return elemento.flatMap(nodos);
  return elemento?.props ? [elemento, ...nodos(elemento.props.children)] : [];
}

test('la recuperación separa el correo, las seis casillas y el guardado de contraseña', async t => {
  const estados: unknown[] = [];
  const referencias: unknown[] = [];
  let indiceEstado = 0;
  let indiceReferencia = 0;
  let rechazarCodigo = true;
  let autorizacionVencida = false;
  let vistaPrueba = false;
  const solicitudes: unknown[] = [];
  const verificadores: unknown[] = [];
  const completados: string[] = [];
  const avisos: {mensaje: string; tipo: string}[] = [];
  class ErrorRemoto extends Error {}
  const {cargar} = crearCargadorComponentes(fileURLToPath(new URL('..', import.meta.url)), {
    react: {
      useCallback: (accion: unknown) => accion,
      useContext: () => ({mostrarAviso: (mensaje: string, opciones: {tipo: string}) => avisos.push({mensaje, tipo: opciones.tipo})}),
      useState(inicial: unknown) {
        const indice = indiceEstado++;
        if (!(indice in estados)) estados[indice] = typeof inicial === 'function' ? inicial() : inicial;
        return [estados[indice], (valor: unknown) => {
          estados[indice] = typeof valor === 'function' ? valor(estados[indice]) : valor;
        }];
      },
      useRef(inicial: unknown) { return referencias[indiceReferencia++] ??= {current: inicial}; },
      useEffect() {},
    },
    'react-native': {
      View: 'View', Text: 'Text', TextInput: 'TextInput', Pressable: 'Pressable',
      Keyboard: {dismiss() {}}, StyleSheet: {create: (estilos: unknown) => estilos},
    },
    './AuthContainer': 'Pantalla', './AuthInput': 'Correo', './PasswordInput': 'Contraseña',
    './ProfileModal': 'Modal', './PrimaryButton': 'Botón',
    './ActionButton': 'Acción',
    '../contexts/ToastContext': {ContextoAvisos: {}},
    '../database/repositories/authenticationRepository': {
      autenticacionRepositorio: {actualizarVerificadorContrasena: (...datos: unknown[]) => verificadores.push(datos)},
    },
    '../sync/remote': {
      ErrorRemoto,
      async solicitarRemoto(ruta: string, datos: unknown) {
        solicitudes.push([ruta, datos]);
        if (ruta.endsWith('/verificar')) {
          if (rechazarCodigo) throw Object.assign(new ErrorRemoto('El código es inválido o venció.'), {estado: 400, codigo: 'codigo_invalido'});
          return {autorizacion: 'autorizacion-sintetica'};
        }
        if (ruta.endsWith('/confirmar') && autorizacionVencida) {
          throw Object.assign(new ErrorRemoto('La verificación venció.'), {estado: 400, codigo: 'autorizacion_invalida'});
        }
        return {usuarioId: 'usuario'};
      },
    },
  });
  const {TEMAS} = cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
  const Recuperacion = cargar<typeof import('../src/components/PasswordRecovery.tsx')>('src/components/PasswordRecovery.tsx').default;
  const render = () => {
    indiceEstado = 0;
    indiceReferencia = 0;
    return nodos(Recuperacion({tema: TEMAS.claro, correoInicial: 'Cuenta@ejemplo.com', fondo: null, vistaPrueba, alCerrar() {}, alCompletar: correo => completados.push(correo)}));
  };
  const pulsar = (titulo: string) => render().find(nodo => nodo.type === 'Botón' && nodo.props.titulo === titulo).props.alPresionar();
  const casillas = () => render().filter(nodo => nodo.type === 'TextInput');

  assert.ok(render().some(nodo => nodo.type === 'Modal'));
  pulsar('Enviar código');
  await setImmediate();
  assert.equal(casillas().length, 6);
  assert.equal(render()[0].props.accionInicial.props.accessibilityLabel, 'Volver al correo');
  render()[0].props.accionInicial.props.onPress();
  assert.ok(render().some(nodo => nodo.type === 'Modal'));
  pulsar('Enviar código');
  assert.equal(casillas().length, 6);
  assert.equal(solicitudes.length, 1);
  pulsar('Continuar');
  assert.equal(casillas().length, 6);
  casillas()[3].props.onChangeText('012345');
  assert.deepEqual(casillas().map(nodo => nodo.props.value), ['0', '1', '2', '3', '4', '5']);
  pulsar('Continuar');
  await setImmediate();
  assert.equal(casillas().length, 6);
  assert.ok(!render().some(nodo => nodo.type === 'Contraseña'));
  assert.deepEqual(avisos.at(-1), {mensaje: 'El código es inválido o venció.', tipo: 'error'});
  assert.ok(casillas().every(nodo => nodo.props.style.at(-1)?.borderColor === TEMAS.claro.error));
  assert.deepEqual(completados, []);
  assert.deepEqual(verificadores, []);

  rechazarCodigo = false;
  Array.from('654320').forEach((digito, indice) => casillas()[indice].props.onChangeText(digito));
  pulsar('Continuar');
  await setImmediate();
  const nueva = 'Secreto123!';
  render().filter(nodo => nodo.type === 'Contraseña').forEach(nodo => nodo.props.alCambiarTexto(nueva));
  autorizacionVencida = true;
  pulsar('Actualizar contraseña');
  await setImmediate();
  assert.equal(casillas().length, 6);
  assert.deepEqual(avisos.at(-1), {mensaje: 'La verificación venció.', tipo: 'error'});

  autorizacionVencida = false;
  pulsar('Continuar');
  await setImmediate();
  pulsar('Actualizar contraseña');
  await setImmediate();
  assert.deepEqual(solicitudes, [
    ['/auth/recuperacion/solicitar', {correo: 'cuenta@ejemplo.com'}],
    ['/auth/recuperacion/verificar', {correo: 'cuenta@ejemplo.com', codigo: '012345'}],
    ['/auth/recuperacion/verificar', {correo: 'cuenta@ejemplo.com', codigo: '654320'}],
    ['/auth/recuperacion/confirmar', {correo: 'cuenta@ejemplo.com', autorizacion: 'autorizacion-sintetica', nueva}],
    ['/auth/recuperacion/verificar', {correo: 'cuenta@ejemplo.com', codigo: '654320'}],
    ['/auth/recuperacion/confirmar', {correo: 'cuenta@ejemplo.com', autorizacion: 'autorizacion-sintetica', nueva}],
  ]);
  assert.deepEqual(verificadores, [['usuario', 'requiere_ingreso_en_linea']]);
  assert.deepEqual(completados, ['cuenta@ejemplo.com']);

  await t.test('la vista de prueba permite escribir el código y navegar sin enviar correos ni guardar la contraseña', () => {
    Object.defineProperty(globalThis, '__DEV__', {value: true, configurable: true});
    vistaPrueba = true;
    estados.length = 0;
    referencias.length = 0;

    const entrada = render().find(nodo => nodo.type === 'Correo');
    assert.equal(entrada.props.placeholder, 'Ingresá tu correo electrónico');
    assert.equal(entrada.props.editable, false);
    pulsar('Enviar código');
    assert.equal(casillas().length, 6);
    assert.ok(casillas().every(nodo => nodo.props.editable && nodo.props.value === ''));
    Array.from('123456').forEach((digito, indice) => casillas()[indice].props.onChangeText(digito));
    const pantalla = render();
    const reenviar = pantalla.find(nodo => nodo.type === 'Acción' && nodo.props.texto === 'Reenviar código');
    assert.equal(reenviar.props.variante, 'secundario');
    assert.equal(reenviar.props.icono, 'refresh-outline');
    assert.ok(pantalla.indexOf(reenviar) > pantalla.findIndex(nodo => nodo.props.titulo === 'Continuar'));
    reenviar.props.alPresionar();
    assert.ok(casillas().every(nodo => nodo.props.value === ''));
    casillas()[0].props.onChangeText('012345');
    pulsar('Continuar');
    assert.equal(casillas().length, 6);
    assert.deepEqual(avisos.at(-1), {mensaje: 'El código es incorrecto. Probá con el código de ejemplo.', tipo: 'error'});
    casillas()[0].props.onChangeText('123456');
    pulsar('Continuar');
    assert.deepEqual(render().filter(nodo => nodo.type === 'Contraseña').map(nodo => nodo.props.placeholder), [
      'Ingresá la nueva contraseña', 'Repetí la nueva contraseña',
    ]);
    assert.equal(render().find(nodo => nodo.props.titulo === 'Actualizar contraseña').props.deshabilitado, true);
    pulsar('Actualizar contraseña');
    assert.equal(solicitudes.length, 6);
    assert.equal(verificadores.length, 1);
    assert.equal(completados.length, 1);
    assert.equal(render()[0].props.accionInicial.props.accessibilityLabel, 'Volver al código');
    render()[0].props.accionInicial.props.onPress();
    assert.equal(casillas().map(nodo => nodo.props.value).join(''), '123456');
  });
});
