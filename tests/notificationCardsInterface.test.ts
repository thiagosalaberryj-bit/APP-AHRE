import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';
import { TIPOS_AVISO, ajustesPredeterminados, type Aviso } from '../src/notifications/types.ts';
type Nodo={type:unknown;props:Record<string,any>};
function nodos(a:any):Nodo[]{if(Array.isArray(a))return a.flatMap(nodos);if(!a||typeof a!=='object'||!a.props)return [];return [a,...nodos(a.props.children)];}
const raiz=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

for(const nombre of ['claro','oscuro'] as const)test('el aviso plegado solo muestra icono, título y hora; el detalle se abre explícitamente en '+nombre,()=>{
 let abierta=false,entradas=0;
 const {cargar}=crearCargadorComponentes(raiz,{react:{useState:()=>[abierta,(v:any)=>{abierta=typeof v==='function'?v(abierta):v;}]}});
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const Card=cargar<typeof import('../src/components/NotificationCard.tsx')>('src/components/NotificationCard.tsx').default;
 const aviso:Aviso={id:'demo',tipo:'salas',titulo:'Gastos por registrar',mensaje:'Descripción que solo se ve desplegada',fecha:new Date().toISOString(),vista:false,resuelta:false,destino:{tipo:'sala',id:'sala'}};
 const render=()=>Card({aviso,tema:TEMAS[nombre],alAbrir:()=>entradas++});
 let filas=nodos(render());assert.equal(filas.filter(n=>n.type==='Text').length,2);assert.ok(!filas.some(n=>n.props.children===aviso.mensaje));
 filas.find(n=>n.type==='Pressable')!.props.onPress();filas=nodos(render());assert.ok(filas.some(n=>n.props.children===aviso.mensaje));assert.equal(entradas,0);
 filas.find(n=>n.props.accessibilityLabel==='Abrir detalle de '+aviso.titulo)!.props.onPress();assert.equal(entradas,1);
 filas.find(n=>n.type==='Pressable')!.props.onPress();assert.equal(nodos(render()).filter(n=>n.type==='Text').length,2);
 const iconos=TIPOS_AVISO.map(tipo=>nodos(Card({aviso:{...aviso,tipo},tema:TEMAS[nombre],alAbrir:()=>{}})).find(n=>n.type==='Icon')!.props.name);assert.equal(new Set(iconos).size,TIPOS_AVISO.length);
});

test('configuración pide permiso solo si falta y no insiste al volver a renderizar',async()=>{
 let solicitudes=0;const ref={current:false},cambios:string[]=[];
 const {cargar}=crearCargadorComponentes(raiz,{react:{useRef:()=>ref,useEffect:(f:()=>void)=>f()},'../notifications/nativeAdapter':{solicitarPermisoAvisos:async()=>{solicitudes++;return 'Permitidas';}}});
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const Ajustes=cargar<typeof import('../src/components/NotificationSettings.tsx')>('src/components/NotificationSettings.tsx').default;
 const props={tema:TEMAS.claro,ajustes:ajustesPredeterminados(),alCambiar:()=>{},alCerrar:()=>{},alGuardar:()=>{},guardando:false,alCambiarPermiso:(p:string)=>cambios.push(p),canales:{}};
 const permitido=Ajustes({...props,permiso:'Permitidas'});assert.equal(solicitudes,0);assert.ok(!nodos(permitido).some(n=>String(n.props.children).includes('Permitir avisos')));
 Ajustes({...props,permiso:'Sin permiso'});await Promise.resolve();assert.equal(solicitudes,1);assert.deepEqual(cambios,['Permitidas']);
 Ajustes({...props,permiso:'Sin permiso'});await Promise.resolve();assert.equal(solicitudes,1);
});

for(const nombre of ['claro','oscuro'] as const)test('guardar conserva el diseño del formulario y bloquea sus controles en '+nombre,()=>{
 let cambios=0,guardados=0;
 const {cargar}=crearCargadorComponentes(raiz,{react:{useRef:()=>({current:false}),useEffect:()=>{}},'../notifications/nativeAdapter':{solicitarPermisoAvisos:async()=>'Permitidas'}});
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const Ajustes=cargar<typeof import('../src/components/NotificationSettings.tsx')>('src/components/NotificationSettings.tsx').default;
 const ajustes=ajustesPredeterminados();ajustes.tipos.registro.hora='21:07';const original=JSON.stringify(ajustes);
 const props={tema:TEMAS[nombre],ajustes,alCambiar:()=>cambios++,alCerrar:()=>{},alGuardar:()=>guardados++,guardando:false,permiso:'Permitidas',alCambiarPermiso:()=>{},canales:{}};
 const editables=nodos(Ajustes(props)),guardando=nodos(Ajustes({...props,guardando:true}));
 const formulario=(filas:Nodo[])=>filas.find(n=>n.props.pointerEvents!==undefined)!;
 assert.deepEqual(formulario(guardando).props.style,formulario(editables).props.style);
 assert.deepEqual(formulario(guardando).props.style,{width:'100%',alignItems:'stretch'});
 assert.equal(formulario(editables).props.pointerEvents,'auto');assert.equal(formulario(guardando).props.pointerEvents,'none');
 assert.deepEqual(guardando.filter(n=>n.type==='Text').map(n=>n.props.children).filter(t=>t!=='Guardando…'),editables.filter(n=>n.type==='Text').map(n=>n.props.children).filter(t=>t!=='Guardar ajustes'));
 for(const nodo of guardando.filter(n=>typeof n.props.alCambiar==='function')){assert.equal(nodo.props.deshabilitado,true);nodo.props.alCambiar(false);}
 for(const nodo of guardando.filter(n=>typeof n.props.alSeleccionar==='function')){assert.equal(nodo.props.deshabilitado,true);nodo.props.alSeleccionar('22:00');}
 const guardar=guardando.find(n=>n.type==='Pressable'&&nodos(n.props.children).some(c=>c.props.children==='Guardando…'))!;assert.equal(guardar.props.disabled,true);guardar.props.onPress();
 assert.equal(cambios,0);assert.equal(guardados,0);assert.equal(JSON.stringify(ajustes),original);
 assert.ok(!editables.some(n=>n.type==='Text'&&String(n.props.children).includes('10 segundos')));
});

for(const nombre of ['claro','oscuro'] as const)test('general apagado bloquea edición y guardado sin borrar preferencias en '+nombre,()=>{
 let cambios=0,guardados=0,solicitudes=0;
 const {cargar}=crearCargadorComponentes(raiz,{react:{useRef:()=>({current:false}),useEffect:(f:()=>void)=>f()},'../notifications/nativeAdapter':{solicitarPermisoAvisos:async()=>{solicitudes++;return 'Permitidas';}}});
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const Ajustes=cargar<typeof import('../src/components/NotificationSettings.tsx')>('src/components/NotificationSettings.tsx').default;
 const ajustes=ajustesPredeterminados();ajustes.tipos.registro.hora='21:07';ajustes.tipos.debo.activo=false;const original=JSON.stringify(ajustes);
 const props={tema:TEMAS[nombre],ajustes,alCambiar:()=>cambios++,alCerrar:()=>{},alGuardar:()=>guardados++,guardando:false,permiso:'Sin permiso',alCambiarPermiso:()=>{},canales:{},generales:false};
 const filas=nodos(Ajustes(props));assert.equal(solicitudes,0);
 for(const nodo of filas.filter(n=>typeof n.props.alCambiar==='function')){assert.equal(nodo.props.deshabilitado,true);nodo.props.alCambiar(true);}
 for(const nodo of filas.filter(n=>typeof n.props.alSeleccionar==='function')){assert.equal(nodo.props.deshabilitado,true);nodo.props.alSeleccionar('22:00');}
 const guardar=filas.find(n=>n.type==='Pressable'&&nodos(n.props.children).some(c=>c.props.children==='Guardar ajustes'))!;assert.equal(guardar.props.disabled,true);guardar.props.onPress();
 assert.equal(cambios,0);assert.equal(guardados,0);assert.equal(JSON.stringify(ajustes),original);
 const activadas=nodos(Ajustes({...props,generales:true,permiso:'Permitidas'}));assert.ok(activadas.some(n=>n.props.valor==='21:07'&&!n.props.deshabilitado));assert.ok(activadas.some(n=>n.props.etiquetaAccesibilidad==='Deudas que debo'&&n.props.valor===false));
});
