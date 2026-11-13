import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

type Nodo={type:unknown;props:Record<string,any>};
function nodos(a:any):Nodo[]{if(Array.isArray(a))return a.flatMap(nodos);if(!a||typeof a!=='object'||!a.props)return [];return [a,...nodos(a.props.children)];}
for(const nombre of ['claro','oscuro'] as const)test('selección MP: revisión compacta y acciones explícitas, con bloqueo y recuperación en '+nombre,()=>{
 let abierto=false,registrados=0,ignorados=0,alternados=0,alertas=0;
 const {cargar}=crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),{
  react:{useState:()=>[abierto,(v:boolean)=>{abierto=v;}]},
  'react-native':{View:'View',Text:'Text',Pressable:'Pressable',Modal:'Modal',ActivityIndicator:'ActivityIndicator',Alert:{alert:()=>alertas++},StyleSheet:{create:(e:unknown)=>e,absoluteFill:{}}},
 });
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const Acciones=cargar<typeof import('../src/components/MercadoPagoSelectionActions.tsx')>('src/components/MercadoPagoSelectionActions.tsx').default;
 const props={tema:TEMAS[nombre],cantidad:0,todas:false,disponibles:true,ocupada:false,recuperando:false,motivoBloqueo:'',alAlternar:()=>alternados++,alRegistrar:()=>registrados++,alIgnorar:()=>ignorados++};
 const render=()=>nodos(Acciones(props));
 const boton=(texto:string)=>render().find(n=>n.type==='Pressable'&&nodos(n.props.children).some(c=>c.type==='Text'&&c.props.children===texto))!;
 let filas=render();assert.equal(filas.find(n=>n.type==='Modal')!.props.visible,false);
 filas.find(n=>n.props.accessibilityLabel==='Revisar 0 movimientos seleccionados')!.props.onPress();assert.equal(alertas,1);assert.equal(abierto,false);assert.equal(registrados,0);
 filas.find(n=>n.props.accessibilityRole==='checkbox')!.props.onPress();assert.equal(alternados,1);
 props.cantidad=2;render().find(n=>n.props.accessibilityLabel==='Revisar 2 movimientos seleccionados')!.props.onPress();assert.equal(render().find(n=>n.type==='Modal')!.props.visible,true);
 props.motivoBloqueo='Hay un pago sin importe';boton('Registrar seleccionados').props.onPress();assert.equal(alertas,2);assert.equal(registrados,0);assert.equal(abierto,true);
 boton('Ignorar seleccionados').props.onPress();assert.equal(ignorados,1);assert.equal(abierto,false);
 props.motivoBloqueo='';boton('Registrar seleccionados').props.onPress();assert.equal(registrados,1);
 props.recuperando=true;assert.ok(!render().some(n=>n.type==='Text'&&n.props.children==='Ignorar seleccionados'));boton('Volver a pendientes').props.onPress();assert.equal(registrados,2);
 props.ocupada=true;assert.equal(render().find(n=>n.props.accessibilityLabel==='Revisar 2 movimientos seleccionados')!.props.disabled,true);
});
