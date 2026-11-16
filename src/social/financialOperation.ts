let ocupada=false;
const oyentes=new Set<()=>void>();
export const operacionFinancieraEnCurso=()=>ocupada;
export function observarOperacionFinanciera(oyente:()=>void){oyentes.add(oyente);return()=>{oyentes.delete(oyente);};}
/** Mantiene visible la acción hasta que termine su confirmación, también en demos. */
export function actualizarTrasOperacion(actualizar:()=>void){
 if(!ocupada){actualizar();return;}
 const dejar=observarOperacionFinanciera(()=>{if(!ocupada){dejar();actualizar();}});
}
export function iniciarOperacionFinanciera(){
 if(ocupada)return null;
 ocupada=true;for(const o of oyentes)o();let terminada=false;
 return()=>{if(terminada)return;terminada=true;ocupada=false;for(const o of oyentes)o();};
}
