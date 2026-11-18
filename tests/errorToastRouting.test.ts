import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';
const raiz=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
type Nodo={type:unknown;props:Record<string,any>};
function nodos(v:any):Nodo[]{if(Array.isArray(v))return v.flatMap(nodos);return v?.props?[v,...nodos(v.props.children)]:[];}
test('el toast elige el modal más profundo y no repite el aviso al cerrar la ventana',()=>{
 let indice=0;const casillas:any[]=[];
 const {cargar}=crearCargadorComponentes(raiz,{
  react:{createContext:(valor:unknown)=>({Provider:'Provider',valor}),useState:(valor:any)=>{const i=indice++;casillas[i]??={valor};return [casillas[i].valor,(v:any)=>{casillas[i].valor=typeof v==='function'?v(casillas[i].valor):v;}];},useRef:(current:any)=>casillas[indice++]??={current},useCallback:(v:unknown)=>v,useMemo:(f:()=>unknown)=>f()},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:24})},
  '../components/ToastNotification':{__esModule:true,default:'Toast'},
 });
 const {ProveedorAvisos}=cargar<typeof import('../src/contexts/ToastContext.tsx')>('src/contexts/ToastContext.tsx');
 const renderizar=()=>{indice=0;return ProveedorAvisos({children:null}) as unknown as Nodo;};
 const contexto=renderizar().props.value;
 let padre:any=null,hijo:any=null;
 // Registrar el padre después del hijo no altera la prioridad del modal más profundo.
 const cerrarHijo=contexto.registrarPresentador((v:any)=>{hijo=v;},2);
 const cerrarPadre=contexto.registrarPresentador((v:any)=>{padre=v;},1);
 contexto.mostrarAviso(' Falló el guardado. ',{tipo:'error'});
 assert.equal(hijo.mensaje,'Falló el guardado.');assert.equal(padre,null);assert.ok(!nodos(renderizar()).some(n=>n.type==='Toast'));
 cerrarHijo();assert.equal(padre,null);cerrarPadre();assert.ok(!nodos(renderizar()).some(n=>n.type==='Toast'));
 contexto.mostrarAviso('Guardado',{tipo:'exito',duracion:1});const exito=nodos(renderizar()).find(n=>n.type==='Toast')!;assert.equal(exito.props.tipo,'exito');assert.equal(exito.props.duracion,1500);
});
test('los errores generales conservan estado, notifican una vez y permiten avisar tras un reintento',()=>{
 const avisos:any[]=[];let indice=0;const casillas:any[]=[];const mostrarAviso=(...v:any[])=>avisos.push(v);
 const {cargar}=crearCargadorComponentes(raiz,{
  '../contexts/ToastContext':{ContextoAvisos:{}},
  react:{useContext:()=>({mostrarAviso}),useState:(valor:any)=>{const i=indice++;casillas[i]??={valor};return [casillas[i].valor,(v:any)=>{casillas[i].valor=v;}];},useRef:(current:any)=>casillas[indice++]??={current},useCallback:(v:unknown)=>v},
 });
 const {useErrorNotificado}=cargar<typeof import('../src/hooks/useErrorNotice.ts')>('src/hooks/useErrorNotice.ts');
 const renderizar=()=>{indice=0;return useErrorNotificado('');};
 const [,notificar]=renderizar();notificar('Sin conexión');notificar('Sin conexión');assert.equal(avisos.length,1);assert.equal(renderizar()[0],'Sin conexión');
 notificar('');assert.equal(renderizar()[0],'');notificar('Sin conexión');assert.equal(avisos.length,2);assert.equal(avisos[1][1].tipo,'error');
});
