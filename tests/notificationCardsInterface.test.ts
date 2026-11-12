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
