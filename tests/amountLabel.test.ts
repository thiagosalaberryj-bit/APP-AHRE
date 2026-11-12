import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, URL } from 'node:url';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';

type Nodo = {type:string;props:Record<string,any>};
async function escenario(reducir=false) {
  const estados:any[]=[], efectos:(()=>void|(()=>void))[]=[], limpiezas:(()=>void)[]=[], ciclos:any[]=[];
  let indice=0, cambiarEstado:(valor:string)=>void=()=>{};
  const react={
    useState:(inicial:any)=>{const i=indice++;if(!(i in estados))estados[i]=typeof inicial==='function'?inicial():inicial;return [estados[i],(v:any)=>{estados[i]=typeof v==='function'?v(estados[i]):v;}];},
    useRef:(inicial:any)=>{const i=indice++;return estados[i]??=( {current:inicial} );},
    useEffect:(efecto:()=>void)=>{efectos.push(efecto);},
  };
  class Valor {valor:number;constructor(v:number){this.valor=v;}setValue(v:number){this.valor=v;}}
  const nativo={useWindowDimensions:()=>({fontScale:1}),View:'View',Text:'Text',ScrollView:'ScrollView',StyleSheet:{create:(v:unknown)=>v,flatten:(v:unknown)=>v},
    Easing:{linear:'linear'},AppState:{currentState:'active',addEventListener:(_e:string,fn:typeof cambiarEstado)=>{cambiarEstado=fn;return {remove(){}};}},
    AccessibilityInfo:{isReduceMotionEnabled:async()=>reducir,addEventListener:()=>({remove(){}})},
    Animated:{Value:Valor,View:'AnimatedView',timing:(valor:Valor,opciones:any)=>{
      let terminar:((r:{finished:boolean})=>void)|undefined;
      const ciclo={valor,...opciones,iniciado:false,detenido:false,start(fn:typeof terminar){this.iniciado=true;terminar=fn;},stop(){this.detenido=true;terminar?.({finished:false});},finalizar(){valor.setValue(opciones.toValue);terminar?.({finished:true});}};
      ciclos.push(ciclo);return ciclo;}},
  };
  const {cargar}=crearCargadorComponentes(fileURLToPath(new URL('../',import.meta.url)),{react,'react-native':nativo});
  const Componente=cargar<{default:(p:{children:string})=>Nodo}>('src/components/AmountLabel.tsx').default;
  function renderizar(texto='Etiqueta larga por registrar') {limpiezas.splice(0).forEach(f=>f());indice=0;efectos.length=0;const nodo=Componente({children:texto});efectos.forEach(f=>{const limpiar=f();if(limpiar)limpiezas.push(limpiar);});return nodo;}
  function buscar(nodo:Nodo,tipo:string):Nodo|undefined {if(nodo.type===tipo)return nodo;const hijos=[nodo.props?.children].flat();for(const h of hijos)if(h&&typeof h==='object'){const encontrado=buscar(h,tipo);if(encontrado)return encontrado;}}
  let nodo=renderizar();await Promise.resolve();nodo=renderizar();
  function medir(ancho:number,texto:number){nodo.props.onLayout({nativeEvent:{layout:{width:ancho}}});buscar(nodo,'Text')!.props.onTextLayout({nativeEvent:{lines:[{width:texto}]}});nodo=renderizar();return nodo;}
  return {medir,renderizar,ciclos,buscar,cambiarEstado:(v:string)=>cambiarEstado(v)};
}

test('repite con dos segundos al inicio y al final, y cancela al salir',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const e=await escenario();e.medir(100,70);t.mock.timers.tick(5000);assert.equal(e.ciclos.length,0);
  const nodo=e.medir(60,150);t.mock.timers.tick(1999);assert.equal(e.ciclos.length,0);
  t.mock.timers.tick(1);
  for(let i=0;i<3;i++){
    const actual=e.ciclos.at(-1)!;assert.equal(actual.duration,1000);assert.equal(actual.toValue,-90);assert.equal(actual.useNativeDriver,true);
    actual.finalizar();t.mock.timers.tick(1999);assert.equal(actual.valor.valor,-90);
    t.mock.timers.tick(1);assert.equal(actual.valor.valor,0);assert.equal(e.ciclos.length,i+1);
    t.mock.timers.tick(1999);assert.equal(e.ciclos.length,i+1);
    t.mock.timers.tick(1);assert.equal(e.ciclos.length,i+2);
  }
  assert.equal(e.buscar(nodo,'Text')!.props.numberOfLines,1);
  const ultima=e.ciclos.at(-1)!;e.cambiarEstado('background');e.renderizar();
  assert.equal(ultima.detenido,true);assert.equal(ultima.valor.valor,0);
  const cantidad=e.ciclos.length;ultima.finalizar();t.mock.timers.tick(10000);assert.equal(e.ciclos.length,cantidad);
});

test('reducir movimiento permite leer horizontalmente sin iniciar una animación automática',async()=>{
  const e=await escenario(true),nodo=e.medir(60,150);
  assert.equal(e.ciclos.length,0);assert.equal(e.buscar(nodo,'ScrollView')!.props.scrollEnabled,true);
  assert.equal(nodo.props.accessibilityLabel,'Etiqueta larga por registrar');
});
