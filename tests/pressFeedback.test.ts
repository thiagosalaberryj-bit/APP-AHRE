import test from 'node:test';
import assert from 'node:assert/strict';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

test('un toque ejecuta la navegación inmediatamente sin esperar temporizadores',()=>{
 const {cargar}=crearCargadorComponentes(process.cwd());
 const {conRespuestaVisual}=cargar<typeof import('../src/utils/pressFeedback.ts')>('src/utils/pressFeedback.ts');
 let llamadas=0;
 const pulsar=conRespuestaVisual(()=>++llamadas),evento={nativeEvent:{}} as any;
 assert.equal(pulsar(evento),1);assert.equal(llamadas,1);
});

test('las consultas esperan dos dibujos y se cancelan al salir de pantalla',t=>{
 const nombres=['requestAnimationFrame','cancelAnimationFrame'];
 const originales=nombres.map(nombre=>Object.getOwnPropertyDescriptor(globalThis,nombre));
 const cuadros=new Map<number,()=>void>();let id=0;
 Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:(f:()=>void)=>{cuadros.set(++id,f);return id;}});
 Object.defineProperty(globalThis,'cancelAnimationFrame',{configurable:true,value:(n:number)=>cuadros.delete(n)});
 t.after(()=>nombres.forEach((nombre,i)=>{const original=originales[i];if(original)Object.defineProperty(globalThis,nombre,original);else Reflect.deleteProperty(globalThis,nombre);}));
 const dibujar=()=>{const pendientes=[...cuadros.values()];cuadros.clear();pendientes.forEach(f=>f());};
 const {cargar}=crearCargadorComponentes(process.cwd());
 const {programarCargaVisible}=cargar<typeof import('../src/utils/visibleScreenWork.ts')>('src/utils/visibleScreenWork.ts');
 let consultas=0;
 const cancelar=programarCargaVisible(()=>consultas++);dibujar();assert.equal(consultas,0);cancelar();dibujar();assert.equal(consultas,0);
 programarCargaVisible(()=>consultas++);dibujar();assert.equal(consultas,0);dibujar();assert.equal(consultas,1);
});

test('se reutilizan los estilos de un mismo tema sin construirlos por cada botón',()=>{
 const {cargar}=crearCargadorComponentes(process.cwd());
 const {TEMAS}=cargar<typeof import('../src/styles/colors.ts')>('src/styles/colors.ts');
 const {crearEstilosGlobales}=cargar<typeof import('../src/styles/globalStyles.ts')>('src/styles/globalStyles.ts');
 assert.equal(crearEstilosGlobales(TEMAS.claro),crearEstilosGlobales(TEMAS.claro));
 assert.equal(crearEstilosGlobales(TEMAS.oscuro),crearEstilosGlobales(TEMAS.oscuro));
 assert.notEqual(crearEstilosGlobales(TEMAS.oscuro),crearEstilosGlobales(TEMAS.claro));
});

test('un botón recién montado no simula una pulsación ni una transición de texto',()=>{
 let animaciones=0;
 const {cargar}=crearCargadorComponentes(process.cwd(),{
  react:{useState:(v:unknown)=>[v,()=>{}],useRef:(v:unknown)=>({current:v}),useEffect:(f:()=>unknown)=>f()},
  '../hooks/useReducedMotion':{useMovimientoReducido:()=>false},
  'react-native':{StyleSheet:{create:(v:unknown)=>v},Text:'Text',Animated:{View:'AnimatedView',Value:class{setValue(){}interpolate(){return 0;}},timing:()=>{animaciones++;return{start(){},stop(){}};}}},
 });
 const Contenido=cargar<typeof import('../src/components/ActionContent.tsx')>('src/components/ActionContent.tsx').default;
 Contenido({texto:'Guardar',color:'#024C42'});assert.equal(animaciones,0);
});
