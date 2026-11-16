import test from 'node:test';
import assert from 'node:assert/strict';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

function preparar(t:any){
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});
 const original=Object.getOwnPropertyDescriptor(globalThis,'requestAnimationFrame');
 Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:()=>1});
 t.after(()=>{if(original)Object.defineProperty(globalThis,'requestAnimationFrame',original);else Reflect.deleteProperty(globalThis,'requestAnimationFrame');});
 let completado=false,cerrar=()=>{};
 const {cargar}=crearCargadorComponentes(process.cwd(),{
  react:{useState:()=>[false,(v:boolean)=>{completado=v;}],useRef:(v:unknown)=>({current:v}),useEffect:(f:()=>()=>void)=>{cerrar=f();}},
 });
 const accion=cargar<typeof import('../src/hooks/useActionCompletion.ts')>('src/hooks/useActionCompletion.ts').useFinalizacionAccion();
 const avanzar=async(ms:number)=>{t.mock.timers.tick(ms);await Promise.resolve();await Promise.resolve();};
 return {accion,avanzar,completado:()=>completado,cerrar:()=>cerrar()};
}

test('una escritura local muestra dos segundos de carga y dos de Listo antes de cerrar',async t=>{
 const e=preparar(t);e.accion.iniciar();let cerrado=false;
 const terminar=e.accion.confirmar().then(ok=>{cerrado=ok;});
 await e.avanzar(1999);assert.equal(e.completado(),false);assert.equal(cerrado,false);
 await e.avanzar(1);assert.equal(e.completado(),true);assert.equal(cerrado,false);
 await e.avanzar(1999);assert.equal(cerrado,false);await e.avanzar(1);await terminar;assert.equal(cerrado,true);
});

test('una operación online espera la respuesta y luego mantiene Listo visible',async t=>{
 const e=preparar(t);e.accion.iniciar();await e.avanzar(5000);assert.equal(e.completado(),false);
 let cerrado=false;const terminar=e.accion.confirmar().then(ok=>{cerrado=ok;});await e.avanzar(0);
 assert.equal(e.completado(),true);assert.equal(cerrado,false);
 await e.avanzar(2000);await terminar;assert.equal(cerrado,true);
});

test('desmontar cancela el cierre pendiente y un error no confirma éxito',async t=>{
 const e=preparar(t);e.accion.iniciar();await e.avanzar(1000);assert.equal(e.completado(),false);
 const terminar=e.accion.confirmar();await e.avanzar(0);e.cerrar();assert.equal(await terminar,false);
});
