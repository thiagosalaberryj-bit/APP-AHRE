import {useEffect,useRef,useState} from 'react';
import {ANIMACION_ACCION} from '../styles/globalStyles';

/** La persistencia termina antes de confirmar; el cierre espera a que se vea Listo. */
export function useFinalizacionAccion(){
 const [completado,cambiarCompletado]=useState(false);
 const inicio=useRef(0),montado=useRef(true);
 const esperas=useRef(new Set<()=>void>());
 useEffect(()=>{montado.current=true;return()=>{montado.current=false;for(const cancelar of esperas.current)cancelar();esperas.current.clear();};},[]);
 const esperar=(ms:number)=>new Promise<boolean>(resolver=>{
  if(typeof requestAnimationFrame!=='function'||ms<=0){resolver(montado.current);return;}
  const cancelar=()=>{clearTimeout(tiempo);resolver(false);};
  const tiempo=setTimeout(()=>{esperas.current.delete(cancelar);resolver(montado.current);},ms);
  esperas.current.add(cancelar);
 });
 return {completado,
  iniciar:()=>{inicio.current=Date.now();cambiarCompletado(false);},
  confirmar:async()=>{
   if(!await esperar(Math.max(0,ANIMACION_ACCION.cargaMinima-(Date.now()-inicio.current))))return false;
   if(!montado.current)return false;cambiarCompletado(true);
   return esperar(ANIMACION_ACCION.exitoVisible);
  },
 };
}
