import test from 'node:test';
import assert from 'node:assert/strict';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

test('los tres puntos repiten un timing nativo y vuelven al origen sin saltos',()=>{
 let limpiar=()=>{},inicios=0,detenciones=0;
 const curvas:any[]=[],opciones:any[]=[];
 const {cargar}=crearCargadorComponentes(process.cwd(),{
  react:{useRef:(v:unknown)=>({current:v}),useEffect:(f:()=>()=>void)=>{limpiar=f();}},
  '../hooks/useReducedMotion':{useMovimientoReducido:()=>false},
  'react-native':{View:'View',StyleSheet:{create:(v:unknown)=>v},Easing:{linear:(v:number)=>v},Animated:{
   View:'AnimatedView',Value:class{setValue(){} interpolate(curva:unknown){curvas.push(curva);return curva;}},
   timing:(_v:unknown,config:any)=>{opciones.push(config);return {tipo:'timing'};},
   loop:(animacion:any)=>{
    assert.equal(animacion.tipo,'timing','El controlador nativo no admite loop con stagger/sequence/parallel');
    return{start:()=>{inicios++;},stop:()=>{detenciones++;}};
   },
  }},
 });
 const Puntos=cargar<typeof import('../src/components/LoadingDots.tsx')>('src/components/LoadingDots.tsx').default;
 const arbol=Puntos({color:'#FFFFFF'}) as any;
 assert.equal(arbol.props.children.length,3);assert.equal(inicios,1);
 assert.equal(opciones[0].useNativeDriver,true);assert.equal(opciones[0].isInteraction,false);
 for(const curva of curvas){
  assert.equal(curva.inputRange[0],0);assert.equal(curva.inputRange.at(-1),1);
  assert.equal(curva.outputRange[0],0);assert.equal(curva.outputRange.at(-1),0);
  assert.equal(Math.min(...curva.outputRange),-4);
  assert.ok(curva.inputRange.every((v:number,i:number)=>i===0||v>curva.inputRange[i-1]));
 }
 assert.ok(curvas[0].inputRange[1]<curvas[1].inputRange[2]);
 limpiar();assert.equal(detenciones,1);
});
