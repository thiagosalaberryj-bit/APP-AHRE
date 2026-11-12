import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';

interface Nodo { type: string | ((propiedades: Record<string, unknown>) => unknown); props: Record<string, unknown>; }
function expandir(arbol: unknown): unknown {
  if (Array.isArray(arbol)) return arbol.map(expandir);
  if (!arbol || typeof arbol !== 'object' || !('props' in arbol)) return arbol;
  const nodo = arbol as Nodo;
  if (typeof nodo.type === 'function') return expandir(nodo.type(nodo.props));
  return { ...nodo, props: { ...nodo.props, children: expandir(nodo.props.children) } };
}
function nodos(arbol: unknown): Nodo[] {
  if (Array.isArray(arbol)) return arbol.flatMap(nodos);
  if (!arbol || typeof arbol !== 'object' || !('props' in arbol)) return [];
  const nodo = arbol as Nodo;
  return [nodo, ...nodos(nodo.props.children)];
}
function invocar(nodo: Nodo, propiedad: string) {
  assert.equal(typeof nodo.props[propiedad], 'function');
  (nodo.props[propiedad] as () => void)();
}

for (const nombreTema of ['claro', 'oscuro'] as const) {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { cargar } = crearCargadorComponentes(raiz);
  const { TEMAS } = cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
  const tema = TEMAS[nombreTema];
  const { crearEstilosPerfil } = cargar<typeof import('../src/styles/ProfileScreenStyles.ts')>('src/styles/ProfileScreenStyles.ts');
  const estilos = crearEstilosPerfil(tema);
  const ModalPerfil = cargar<typeof import('../src/components/ProfileModal.tsx')>('src/components/ProfileModal.tsx').default;
  const ListaOpcionesPerfil = cargar<typeof import('../src/components/ProfileOptionsList.tsx')>('src/components/ProfileOptionsList.tsx').default;

  for (const desplazable of [false, true]) test(`modal de Perfil conserva cierres y estructura (${nombreTema}, desplazable=${desplazable})`, () => {
    let cierres = 0;
    const contenido = { type: 'TextInput', key: null, props: { accessibilityLabel: 'Campo de prueba', value: 'Sin perder el contenido' } };
    const propiedades = { tema, estilos, visible: true, desplazable, titulo: 'Editar perfil', descripcion: 'Descripción',
      icono: 'person-outline' as const, etiquetaCerrar: 'Cerrar edición', alCerrar: () => { cierres++; }, children: contenido,
    };
    const arbol = expandir(ModalPerfil(propiedades));
    const controles = nodos(arbol);
    const modal = controles.find(nodo => nodo.type === 'Modal')!;
    assert.equal(modal.props.animationType, 'fade'); assert.equal(modal.props.transparent, true); assert.equal(modal.props.visible, true);
    invocar(modal, 'onRequestClose');
    const fondo = controles.find(nodo => nodo.type === 'Pressable' && nodo.props.accessibilityLabel === 'Cerrar edición' && !nodo.props.accessibilityRole)!;
    const cerrar = controles.find(nodo => nodo.type === 'Pressable' && nodo.props.accessibilityRole === 'button')!;
    invocar(fondo, 'onPress'); invocar(cerrar, 'onPress'); assert.equal(cierres, 3);
    assert.equal(fondo.props.style, estilos.fondoSuperpuesto);
    const scroll = controles.find(nodo => nodo.type === 'ScrollView');
    assert.equal(Boolean(scroll), desplazable);
    if (scroll) {
      assert.equal(scroll.props.keyboardShouldPersistTaps, 'handled');
      assert.equal(scroll.props.showsVerticalScrollIndicator, false);
      assert.equal(scroll.props.contentContainerStyle, estilos.contenidoScrollModal);
    }
    assert.equal(controles.filter(nodo => nodo.props.style === estilos.separadorModal).length, desplazable ? 1 : 0);
    assert.equal(controles.find(nodo => nodo.type === 'TextInput')?.props.value, 'Sin perder el contenido');
    const oculto = nodos(expandir(ModalPerfil({ ...propiedades, visible: false }))).find(nodo => nodo.type === 'Modal');
    assert.equal(oculto?.props.visible, false);
  });

  test(`cierre de sesión conserva su etiqueta de fondo y color de peligro (${nombreTema})`, () => {
    let cierres = 0;
    const arbol = expandir(ModalPerfil({ tema, estilos, visible: true, alCerrar: () => { cierres++; },
      titulo: 'Cerrar sesión', descripcion: 'Descripción', icono: 'log-out-outline', colorIcono: tema.error,
      etiquetaCerrar: 'Cerrar confirmación de cierre de sesión', etiquetaCerrarFondo: 'Cerrar confirmación', children: null,
    }));
    const controles = nodos(arbol);
    invocar(controles.find(nodo => nodo.props.accessibilityLabel === 'Cerrar confirmación')!, 'onPress');
    invocar(controles.find(nodo => nodo.props.accessibilityLabel === 'Cerrar confirmación de cierre de sesión')!, 'onPress');
    assert.equal(cierres, 2);
    assert.equal(controles.find(nodo => nodo.props.name === 'log-out-outline')?.props.color, tema.error);
    // La tarjeta sigue interceptando el toque sin añadir un cierre propio.
    assert.equal(controles.find(nodo => nodo.props.style === estilos.tarjetaSuperpuesta)?.props.onPress, undefined);
  });

  test(`opciones de Perfil conservan selección, textos y callbacks (${nombreTema})`, () => {
    let seleccion = '';
    const opciones = [
      { id: 'claro', nombre: 'Modo claro', descripcion: 'Fondos claros', icono: 'sunny-outline' as const },
      { id: 'oscuro', nombre: 'Modo oscuro', descripcion: 'Fondos oscuros', icono: 'moon-outline' as const },
    ];
    const arbol = ListaOpcionesPerfil({ tema, estilos, opciones, valor: 'claro', alSeleccionar: id => { seleccion = id; } });
    const controles = nodos(arbol), botones = controles.filter(nodo => nodo.type === 'Pressable');
    assert.deepEqual(botones.map(nodo => nodo.props.accessibilityState), [{ selected: true }, { selected: false }]);
    invocar(botones[1], 'onPress'); assert.equal(seleccion, 'oscuro');
    assert.deepEqual(controles.filter(nodo => nodo.type === 'Text').map(nodo => nodo.props.children), ['Modo claro', 'Fondos claros', 'Modo oscuro', 'Fondos oscuros']);
    const siguiente = ListaOpcionesPerfil({ tema, estilos, opciones, valor: seleccion, alSeleccionar() {} });
    assert.deepEqual(nodos(siguiente).filter(nodo => nodo.type === 'Pressable').map(nodo => nodo.props.accessibilityState), [{ selected: false }, { selected: true }]);
    assert.ok(nodos(siguiente).some(nodo => nodo.props.name === 'checkmark-circle' && nodo.props.color === tema.foco));
  });
}

for(const nombre of ['claro','oscuro'] as const)test('modal de notificaciones separa el fondo del scroll y mantiene fija la X en '+nombre,()=>{
 const {cargar}=crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');const {crearEstilosPerfil}=cargar<typeof import('../src/styles/ProfileScreenStyles.ts')>('src/styles/ProfileScreenStyles.ts');
 const ModalPerfil=cargar<typeof import('../src/components/ProfileModal.tsx')>('src/components/ProfileModal.tsx').default;let cierres=0;
 const arbol=expandir(ModalPerfil({tema:TEMAS[nombre],estilos:crearEstilosPerfil(TEMAS[nombre]),visible:true,separarFondo:true,desplazable:true,estiloTarjeta:{height:'85%'},estiloDesplazamiento:{flex:1},titulo:'Notificaciones',descripcion:'Ajustes',icono:'notifications-outline',etiquetaCerrar:'Cerrar ajustes',etiquetaCerrarFondo:'Cerrar fondo',alCerrar:()=>cierres++,children:{type:'Text',props:{children:'Contenido largo'}} as never}));
 const elementos=nodos(arbol),scroll=elementos.find(n=>n.type==='ScrollView')!;assert.ok(scroll);assert.equal(scroll.props.nestedScrollEnabled,true);
 const fondo=elementos.find(n=>n.props.accessibilityLabel==='Cerrar fondo')!;assert.ok(!nodos(fondo.props.children).some(n=>n.type==='ScrollView'));
 assert.ok(!nodos(scroll).some(n=>n.props.accessibilityLabel==='Cerrar ajustes'));
 invocar(fondo,'onPress');invocar(elementos.find(n=>n.props.accessibilityLabel==='Cerrar ajustes')!,'onPress');assert.equal(cierres,2);
});
