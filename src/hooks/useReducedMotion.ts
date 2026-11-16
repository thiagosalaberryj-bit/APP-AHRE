import {useEffect,useState} from 'react';
import {AccessibilityInfo} from 'react-native';

let reducido=true,generacion=0;
const oyentes=new Set<(valor:boolean)=>void>();
let evento:ReturnType<typeof AccessibilityInfo.addEventListener>|undefined;
const publicar=(valor:boolean)=>{reducido=valor;for(const oyente of oyentes)oyente(valor);};
export function useMovimientoReducido(){
 const [valor,cambiar]=useState(reducido);
 useEffect(()=>{
  oyentes.add(cambiar);cambiar(reducido);
  if(oyentes.size===1){
   const consulta=++generacion;
   evento=AccessibilityInfo.addEventListener('reduceMotionChanged',valor=>{generacion++;publicar(valor);});
   void AccessibilityInfo.isReduceMotionEnabled().then(valor=>{if(consulta===generacion)publicar(valor);}).catch(()=>{});
  }
  return()=>{oyentes.delete(cambiar);if(!oyentes.size){generacion++;evento?.remove();evento=undefined;}};
 },[]);
 return valor;
}
