import test from 'node:test';
import assert from 'node:assert/strict';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

function preparar(t:any){
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});
 const original=Object.getOwnPropertyDescriptor(globalThis,'requestAnimationFrame');
 Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:()=>1});
 t.after(()=>{if(original)Object.defineProperty(globalThis,'requestAnimationFrame',original);else Reflect.deleteProperty(globalThis,'requestAnimationFrame');});
 let indice=0;const casillas:any[]=[];
 const {cargar}=crearCargadorComponentes(process.cwd(),{react:{
  useState:(v:any)=>{const i=indice++;casillas[i]??={valor:v};return[casillas[i].valor,(nuevo:any)=>{casillas[i].valor=nuevo;}];},
  useRef:(v:any)=>{const i=indice++;return casillas[i]??={current:v};},useEffect:()=>{},
 }});
 const {useAccionConfirmada}=cargar<typeof import('../src/hooks/useConfirmedAction.ts')>('src/hooks/useConfirmedAction.ts');
 const operacion=cargar<typeof import('../src/social/financialOperation.ts')>('src/social/financialOperation.ts');
 const renderizar=()=>{indice=0;return useAccionConfirmada();};
 const avanzar=async(ms:number)=>{t.mock.timers.tick(ms);for(let i=0;i<8;i++)await Promise.resolve();};
 return {renderizar,avanzar,operacion};
}

test('una acción conserva el botón y espera 2 segundos de carga y uno de éxito',async t=>{
 const clave='aceptar-vinculo';
 const e=preparar(t);let cerrado=false,actualizado=false,guardados=0;
 const accion=e.renderizar();
 const terminar=accion.ejecutar(async()=>{
  guardados++;e.operacion.actualizarTrasOperacion(()=>{actualizado=true;});return 'guardado';
 },resultado=>{assert.equal(resultado,'guardado');cerrado=true;},clave);
 assert.equal(e.renderizar().accionActiva,clave);
 assert.equal(await accion.ejecutar(async()=>{guardados++;}),false,'Impide doble envío');
 await e.avanzar(1999);assert.equal(guardados,1);assert.equal(e.renderizar().completado,false);assert.equal(actualizado,false);assert.equal(cerrado,false);
 await e.avanzar(1);assert.equal(e.renderizar().completado,true);assert.equal(actualizado,false);assert.equal(cerrado,false);
 await e.avanzar(999);assert.equal(cerrado,false);
 await e.avanzar(1);assert.equal(await terminar,true);assert.equal(actualizado,true);assert.equal(cerrado,true);assert.equal(e.renderizar().ocupado,false);
 assert.equal(e.operacion.operacionFinancieraEnCurso(),false);
});

test('un error libera el bloqueo sin Listo ni cierre y permite reintentar',async t=>{
 const e=preparar(t);let cerrado=false;
 await assert.rejects(e.renderizar().ejecutar(async()=>{throw new Error('Sin conexión');},()=>{cerrado=true;}),/Sin conexión/);
 assert.equal(e.renderizar().completado,false);assert.equal(cerrado,false);assert.equal(e.renderizar().ocupado,false);assert.equal(e.operacion.operacionFinancieraEnCurso(),false);
 const terminar=e.renderizar().ejecutar(async()=>true,()=>{cerrado=true;});
 await e.avanzar(2000);await e.avanzar(1000);assert.equal(await terminar,true);assert.equal(cerrado,true);
});
