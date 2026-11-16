import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';
type Nodo={type:unknown;props:Record<string,any>};
function nodos(a:any):Nodo[]{if(Array.isArray(a))return a.flatMap(nodos);if(!a||typeof a!=='object'||!a.props)return [];return [a,...nodos(a.props.children)];}
for(const nombre of ['claro','oscuro'] as const)test('ajustes de alarmas refleja el permiso al regresar y omite acciones en Expo Go en '+nombre,async()=>{
 let estado:any=null,permiso='desactivadas',aperturas=0,iniciado=false,cerrar:(()=>void)|undefined,retorno:((v:string)=>void)|undefined,retiradas=0;
 const {cargar}=crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),{
  react:{useState:()=>[estado,(v:any)=>{estado=v;}],useEffect:(f:()=>void|(()=>void))=>{if(!iniciado){iniciado=true;cerrar=f()||undefined;}}},
  'react-native':{View:'View',Text:'Text',Pressable:'Pressable',StyleSheet:{create:(e:unknown)=>e},Alert:{alert:()=>assert.fail('No debe fallar')},AppState:{addEventListener:(_n:string,f:(v:string)=>void)=>{retorno=f;return {remove:()=>retiradas++};}}},
  '../notifications/nativeAdapter':{consultarAlarmasExactas:async()=>permiso,abrirAjustesAlarmasExactas:async()=>{aperturas++;}},
 });
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const Ajustes=cargar<typeof import('../src/components/ExactAlarmSettings.tsx')>('src/components/ExactAlarmSettings.tsx').default;
 const render=()=>nodos(Ajustes({tema:TEMAS[nombre],visible:true}));
 render();await Promise.resolve();let filas=render();assert.ok(filas.some(n=>n.props.children==='Horarios precisos'));
 filas.find(n=>n.type==='Pressable')!.props.onPress();await Promise.resolve();assert.equal(aperturas,1);assert.equal(estado,'desactivadas','Abrir ajustes no concede permiso');
 const pasoDos=nodos(Ajustes({tema:TEMAS[nombre],visible:true,aviso:true}));assert.ok(pasoDos.some(n=>n.props.accessibilityLabel==='Paso 2: configurar horarios precisos'));
 permiso='permitidas';retorno!('active');await Promise.resolve();assert.ok(render().some(n=>n.props.etiquetaAccesibilidad==='Horarios precisos'));assert.equal(Ajustes({tema:TEMAS[nombre],visible:true,aviso:true}),null);
 render().find(n=>n.props.etiquetaAccesibilidad==='Horarios precisos')!.props.alCambiar(false);await Promise.resolve();assert.equal(aperturas,2);assert.equal(estado,'permitidas','Desactivar abre Android y espera su estado real');
 permiso='desactivadas';retorno!('active');await Promise.resolve();assert.ok(nodos(Ajustes({tema:TEMAS[nombre],visible:true,aviso:true})).some(n=>n.props.accessibilityLabel==='Paso 2: configurar horarios precisos'));
 permiso='expo_go';retorno!('active');await Promise.resolve();filas=render();assert.ok(filas.filter(n=>n.type==='Pressable').every(n=>n.props.disabled));assert.ok(filas.some(n=>String(n.props.children).includes('Expo Go conserva')));
 cerrar!();assert.equal(retiradas,1);
});
