import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

type Nodo={type:unknown;props:Record<string,any>};
function nodos(a:any):Nodo[]{if(Array.isArray(a))return a.flatMap(nodos);if(!a||typeof a!=='object'||!a.props)return [];return [a,...nodos(a.props.children)];}
for(const nombre of ['claro','oscuro'] as const)test('selección MP: revisión compacta y acciones explícitas, con bloqueo y recuperación en '+nombre,async()=>{
 let indice=0;const estados:any[]=[false,''];let registrados=0,ignorados=0,alternados=0,alertas=0;
 const {cargar}=crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),{
  '../contexts/ToastContext': {ContextoAvisos:{},AvisosEnModal:({children}:{children:unknown})=>children},
  react:{useContext:()=>({mostrarAviso:()=>alertas++}),useState:()=>{const i=indice++;return[estados[i],(v:any)=>{estados[i]=v;}];}},
  'react-native':{View:'View',Text:'Text',Pressable:'Pressable',Modal:'Modal',ActivityIndicator:'ActivityIndicator',Alert:{alert:()=>alertas++},StyleSheet:{create:(e:unknown)=>e,absoluteFill:{}}},
 });
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const Acciones=cargar<typeof import('../src/components/MercadoPagoSelectionActions.tsx')>('src/components/MercadoPagoSelectionActions.tsx').default;
 const props={tema:TEMAS[nombre],cantidad:0,todas:false,disponibles:true,ocupada:false,recuperando:false,motivoBloqueo:'',alAlternar:()=>alternados++,alRegistrar:()=>registrados++,alIgnorar:()=>ignorados++};
 const render=()=>{indice=0;return nodos(Acciones(props));};
 const boton=(texto:string)=>render().find(n=>n.props.texto===texto)!;
 let filas=render();assert.equal(filas.find(n=>n.type==='Modal')!.props.visible,false);
 filas.find(n=>n.props.accessibilityLabel==='Revisar 0 movimientos seleccionados')!.props.onPress();assert.equal(alertas,1);assert.equal(estados[0],false);assert.equal(registrados,0);
 filas.find(n=>n.props.accessibilityRole==='checkbox')!.props.onPress();assert.equal(alternados,1);
 props.cantidad=2;render().find(n=>n.props.accessibilityLabel==='Revisar 2 movimientos seleccionados')!.props.onPress();assert.equal(render().find(n=>n.type==='Modal')!.props.visible,true);
 props.motivoBloqueo='Hay un pago sin importe';assert.equal(boton('Registrar seleccionados').props.deshabilitado,true);assert.equal(registrados,0);assert.equal(estados[0],true);
 await boton('Ignorar seleccionados').props.alPresionar();assert.equal(ignorados,1);assert.equal(estados[0],false);
 props.motivoBloqueo='';await boton('Registrar seleccionados').props.alPresionar();assert.equal(registrados,1);
 props.recuperando=true;assert.ok(!render().some(n=>n.props.texto==='Ignorar seleccionados'));await boton('Volver a pendientes').props.alPresionar();assert.equal(registrados,2);
 props.ocupada=true;assert.equal(render().find(n=>n.props.accessibilityLabel==='Revisar 2 movimientos seleccionados')!.props.disabled,true);
});
