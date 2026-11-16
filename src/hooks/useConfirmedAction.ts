import {useRef,useState} from 'react';
import {useFinalizacionAccion} from './useActionCompletion';
import {iniciarOperacionFinanciera} from '../social/financialOperation';

/** Guarda primero y conserva el control visible hasta terminar Procesando → Listo. */
export function useAccionConfirmada(){
 const finalizacion=useFinalizacionAccion(),bloqueo=useRef(false);
 const [accionActiva,cambiarAccionActiva]=useState('');
 async function ejecutar<Resultado>(accion:()=>Promise<Resultado>,alExito:(resultado:Resultado)=>unknown=()=>{},clave='guardar'){
  if(bloqueo.current)return false;
  const liberar=iniciarOperacionFinanciera();if(!liberar)return false;
  bloqueo.current=true;cambiarAccionActiva(clave);finalizacion.iniciar();
  try{
   const resultado=await accion();
   if(!await finalizacion.confirmar())return false;
   liberar();await alExito(resultado);return true;
  }finally{liberar();bloqueo.current=false;cambiarAccionActiva('');}
 }
 return {ejecutar,accionActiva,ocupado:!!accionActiva,completado:finalizacion.completado};
}
