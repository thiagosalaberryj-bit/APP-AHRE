/** Deja dibujar el foco sin añadir un retardo fijo a la navegación. */
export function programarCargaVisible(accion:()=>unknown){
 if(typeof requestAnimationFrame!=='function'){void accion();return()=>{};}
 let cancelada=false,segundo:number|undefined;
 const primero=requestAnimationFrame(()=>{segundo=requestAnimationFrame(()=>{if(!cancelada)void accion();});});
 return()=>{cancelada=true;cancelAnimationFrame(primero);if(segundo!==undefined)cancelAnimationFrame(segundo);};
}
