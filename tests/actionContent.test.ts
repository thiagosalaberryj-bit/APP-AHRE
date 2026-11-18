import test from 'node:test';
import assert from 'node:assert/strict';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

function preparar(reducido=false){
 let indice=0;
 const casillas:any[]=[],efectos:(()=>void)[]=[],animaciones:any[]=[];
 const react={
  useState:(v:unknown)=>{const i=indice++;casillas[i]??={valor:v};return[casillas[i].valor,(nuevo:any)=>{casillas[i].valor=typeof nuevo==='function'?nuevo(casillas[i].valor):nuevo;}];},
  useRef:(v:unknown)=>{const i=indice++;return casillas[i]??={current:v};},
  useEffect:(f:()=>unknown,deps:unknown[])=>{const i=indice++;if(!casillas[i]||deps.some((v,j)=>v!==casillas[i].deps[j])){casillas[i]?.limpiar?.();const estado={deps,limpiar:undefined as any};casillas[i]=estado;efectos.push(()=>{estado.limpiar=f();});}},
 };
 const {cargar}=crearCargadorComponentes(process.cwd(),{react:{...react,useLayoutEffect:react.useEffect},
  'react/jsx-runtime':{jsx:(type:unknown,props:unknown,key:unknown)=>({type,props,key}),jsxs:(type:unknown,props:unknown,key:unknown)=>({type,props,key}),Fragment:'Fragment'},
  '../hooks/useReducedMotion':{useMovimientoReducido:()=>reducido},
  'react-native':{View:'View',Text:'Text',StyleSheet:{create:(v:unknown)=>v},Animated:{View:'AnimatedView',Value:class{valor:number;constructor(valor:number){this.valor=valor;}setValue(v:number){this.valor=v;}interpolate(v:unknown){return v;}},timing:(_v:unknown,opciones:unknown)=>{const registro={opciones,callback:undefined as unknown,detenida:false};animaciones.push(registro);return{start:(callback:unknown)=>{registro.callback=callback;},stop:()=>{registro.detenida=true;}};}}},
 });
 const Contenido=cargar<typeof import('../src/components/ActionContent.tsx')>('src/components/ActionContent.tsx').default;
 const renderizar=(props:Partial<Parameters<typeof Contenido>[0]>={})=>{indice=0;const arbol=Contenido({texto:'Guardar',color:'#024C42',...props}) as any;efectos.splice(0).forEach(f=>f());return arbol;};
 return{renderizar,animaciones};
}

function fila(arbol:any,indice:number){
 const contenido=arbol.props.children[indice].props.children.props.children;
 return {icono:contenido[0],texto:contenido[1].props.children};
}

test('texto e icono entran juntos sin esperar un callback a mitad de la animación',()=>{
 const e=preparar();e.renderizar();assert.equal(e.animaciones.length,0);
 e.renderizar({cargando:true});assert.equal(e.animaciones.length,0,'No comienza antes de montar ambas filas');const carga=e.renderizar({cargando:true});
 assert.equal(carga.type,'View','La máscara queda fija, solo se desplazan las filas');
 assert.equal(fila(carga,0).texto,'Guardar');assert.equal(fila(carga,0).icono,null);
 assert.equal(fila(carga,1).texto,'Procesando');assert.equal(fila(carga,1).icono.props.animado,true);
 assert.equal(e.animaciones.length,1);assert.equal(typeof e.animaciones[0].callback,'function');
 assert.equal(e.animaciones[0].opciones.useNativeDriver,true);assert.equal(e.animaciones[0].opciones.isInteraction,false);
 // Sin ejecutar ningún callback nativo, ya puede entrar el éxito completo.
 e.renderizar({completado:true});const exito=e.renderizar({completado:true});
 assert.equal(e.animaciones[0].detenida,true);
 assert.equal(fila(exito,0).texto,'Procesando');assert.equal(fila(exito,0).icono.props.animado,true);
 assert.equal(exito.props.children[0].key,carga.props.children[1].key,'La fila saliente conserva su identidad y los puntos siguen animados');
 assert.equal(fila(exito,1).texto,'Listo');assert.equal(fila(exito,1).icono.props.name,'checkmark');
 assert.equal(exito.props.children[0].props.importantForAccessibility,'no-hide-descendants');
 e.animaciones[1].callback({finished:true});
 const terminado=e.renderizar({completado:true});
 assert.equal(terminado.props.children[0],null,'Los puntos se desmontan recién después de salir con la palabra');
 assert.equal(fila(terminado,1).texto,'Listo');
});

test('Reducir movimiento cambia el estado completo sin desplazamientos ni copias visibles',()=>{
 const e=preparar(true);e.renderizar();e.renderizar({cargando:true});const carga=e.renderizar({cargando:true});
 assert.equal(e.animaciones.length,0);assert.equal(carga.props.children[0],null);
 assert.equal(fila(carga,1).texto,'Procesando');assert.equal(fila(carga,1).icono.props.animado,true);
});

test('un control bloqueado actualiza su texto sin animación de pulsación o carga',()=>{
 const e=preparar();e.renderizar({texto:'Permitir editar',animarCambios:false});
 e.renderizar({texto:'Quitar permiso',animarCambios:false});const arbol=e.renderizar({texto:'Quitar permiso',animarCambios:false});
 assert.equal(e.animaciones.length,0);assert.equal(arbol.props.children[0],null);
 assert.equal(fila(arbol,1).texto,'Quitar permiso');assert.equal(fila(arbol,1).icono,null);
});
