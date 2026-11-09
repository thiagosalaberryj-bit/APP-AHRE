import assert from 'node:assert/strict';
import test from 'node:test';
import { interfazFormularioDeposito, nodosFormulario, textoFormulario, type NodoFormulario } from './helpers/depositFormInterface.ts';

function control(arbol: unknown, etiqueta: string) {
  const coincidencias = nodosFormulario(arbol).filter(nodo => nodo.props.accessibilityLabel === etiqueta);
  assert.equal(coincidencias.length, 1, etiqueta);
  return coincidencias[0];
}
function invocar(nodo: NodoFormulario, evento: string, ...argumentos: unknown[]) {
  assert.equal(typeof nodo.props[evento], 'function');
  (nodo.props[evento] as (...valores: unknown[]) => void)(...argumentos);
}

for (const tema of ['claro', 'oscuro'] as const) for (const variante of ['creacion', 'edicion'] as const) {
  test(`campos de depósito conservan cambios, foco, limpieza y selecciones (${variante}, ${tema})`, () => {
    const e = interfazFormularioDeposito(tema);
    const cambios: [string, string | null][] = [];
    let focoNombre = false, focoDescripcion = false, iconosAbiertos = false;
    const valores = { nombre: 'Mi cuenta', descripcion: 'Ahorros', tipo: 'banco', icono: 'card-outline', color: '#CEC0E1' };
    const propiedades = { ...e.base, variante, valores, errores: {},
      alCambiar: (campo: string, valor: string | null) => { cambios.push([campo, valor]); },
      focoNombre: { enfocado: false, alCambiar: (valor: boolean) => { focoNombre = valor; } },
      focoDescripcion: { enfocado: false, alCambiar: (valor: boolean) => { focoDescripcion = valor; } },
      iconosAdicionalesVisibles: false, alAbrirIconos: () => { iconosAbiertos = true; },
      deshabilitado: variante === 'creacion' ? false : undefined,
    };
    const arbol = e.formulario(propiedades);
    const nombre = control(arbol, 'Nombre del depósito'), descripcion = control(arbol, 'Descripción opcional');
    assert.equal(nombre.props.maxLength, 30); assert.equal(descripcion.props.maxLength, 60);
    assert.equal(descripcion.props.multiline, true);
    invocar(nombre, 'onFocus'); assert.equal(focoNombre, true);
    invocar(nombre, 'onBlur'); assert.equal(focoNombre, false);
    invocar(descripcion, 'onFocus'); assert.equal(focoDescripcion, true);
    invocar(descripcion, 'onBlur'); assert.equal(focoDescripcion, false);
    invocar(nombre, 'onChangeText', 'Nueva cuenta'); invocar(descripcion, 'onChangeText', 'Reserva');
    invocar(control(arbol, 'Limpiar nombre'), 'onPress'); invocar(control(arbol, 'Limpiar descripción'), 'onPress');
    invocar(control(arbol, 'Efectivo'), 'onPress'); invocar(control(arbol, 'Ícono Banco'), 'onPress');
    invocar(control(arbol, 'Color azul suave predeterminado'), 'onPress');
    assert.deepEqual(cambios, [
      ['nombre', 'Nueva cuenta'], ['descripcion', 'Reserva'], ['nombre', ''], ['descripcion', ''],
      ['tipo', 'efectivo'], ['icono', 'business-outline'], ['color', variante === 'creacion' ? null : '#C3D1E3'],
    ]);
    assert.deepEqual(control(arbol, 'Banco').props.accessibilityState, { selected: true });
    const mas = control(arbol, 'Ícono Tarjeta. Ver más íconos');
    assert.deepEqual(mas.props.accessibilityState, { expanded: false, selected: true });
    invocar(mas, 'onPress'); assert.equal(iconosAbiertos, true);
    assert.ok(textoFormulario(arbol).includes('Ícono seleccionado: Tarjeta'));
    const vacio = e.formulario({ ...propiedades, valores: { nombre: '', descripcion: '', tipo: null, icono: 'cash-outline', color: null } });
    assert.ok(!nodosFormulario(vacio).some(nodo => nodo.props.accessibilityLabel === 'Limpiar nombre'));
    assert.deepEqual(control(vacio, 'Color azul suave predeterminado').props.accessibilityState, { selected: true });
    assert.equal(control(vacio, 'Ver más íconos').props.disabled, variante === 'creacion' ? false : undefined);
    assert.ok(!nodosFormulario(vacio).some(nodo => nodo.props.accessibilityLabel === 'Saldo inicial'));
  });

  test(`errores, ayudas y controles deshabilitados conservan diferencias (${variante}, ${tema})`, () => {
    const e = interfazFormularioDeposito(tema);
    const arbol = e.formulario({ ...e.base, variante, valores: { nombre: 'Banco', descripcion: 'Descripción' },
      errores: { nombre: 'Error de nombre', tipo: 'Error de tipo', descripcion: 'Error de descripción' },
      alCambiar() {}, focoNombre: { enfocado: true, alCambiar() {} }, focoDescripcion: { enfocado: true, alCambiar() {} },
      iconosAdicionalesVisibles: false, alAbrirIconos() {}, deshabilitado: variante === 'creacion' ? true : undefined,
    });
    const nombre = control(arbol, 'Nombre del depósito');
    assert.equal(nombre.props.editable, variante === 'creacion' ? false : undefined);
    assert.equal(nombre.props.accessibilityHint, variante === 'creacion' ? 'Error de nombre' : undefined);
    assert.equal(control(arbol, 'Banco').props.disabled, variante === 'creacion' ? true : undefined);
    const texto = textoFormulario(arbol);
    const error = texto.indexOf('Error de descripción'), ayuda = texto.indexOf('Si la dejás vacía');
    assert.ok(error >= 0 && ayuda >= 0);
    assert.equal(error < ayuda, variante === 'creacion');
    assert.ok(texto.includes(variante === 'creacion' ? 'se genera automáticamente' : 'se generará automáticamente'));
    const virtual = variante === 'creacion' ? 'Ícono Billetera virtual' : 'Ícono Virtual';
    assert.equal(control(arbol, virtual).props.accessibilityRole, 'button');
  });

  test(`modal de íconos conserva cierre, selección y presentación (${variante}, ${tema})`, () => {
    const e = interfazFormularioDeposito(tema);
    let cerrado = 0, elegido = '';
    const arbol = e.modal({ ...e.base, variante, visible: true, icono: 'card-outline',
      alCerrar: () => { cerrado++; }, alSeleccionar: valor => { elegido = valor; },
      deshabilitado: variante === 'creacion' ? false : undefined,
    });
    assert.equal(arbol.props.visible, true);
    invocar(arbol as unknown as NodoFormulario, 'onRequestClose'); assert.equal(cerrado, 1);
    const cierre = nodosFormulario(arbol).find(nodo => nodo.props.accessibilityLabel === (variante === 'creacion' ? 'Cerrar' : 'Cerrar selector de íconos') && nodo.props.accessibilityRole === 'button');
    assert.ok(cierre); invocar(cierre, 'onPress'); assert.equal(cerrado, 2);
    invocar(control(arbol, 'Ícono Ahorros'), 'onPress'); assert.equal(elegido, 'briefcase-outline');
    assert.deepEqual(control(arbol, 'Ícono Tarjeta').props.accessibilityState, { selected: true });
    const radios = nodosFormulario(arbol).filter(nodo => nodo.type === 'Icon' && /^radio-button-/.test(String(nodo.props.name)));
    assert.equal(radios.length, variante === 'creacion' ? 2 : 0);
  });
}
