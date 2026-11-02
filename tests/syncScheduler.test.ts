import test from 'node:test';
import assert from 'node:assert/strict';
import {crearProgramadorSincronizacion} from '../src/sync/syncScheduler.ts';
const vuelta=()=>new Promise<void>(resolver=>setTimeout(resolver,20));

test('un cambio recibido durante una comprobación se envía al terminar sin abrir pantallas',async t=>{
  let terminar=()=>{};
  const bloqueo=new Promise<void>(resolver=>{terminar=resolver;});
  const llamadas:boolean[]=[];
  const programador=crearProgramadorSincronizacion({estaActiva:()=>true,obtenerVista:()=>({estado:'local',pendientes:0}),sincronizar:async silenciosa=>{
    llamadas.push(silenciosa);if(llamadas.length===1)await bloqueo;
  }});
  t.after(()=>programador.cerrar());
  programador.activar();await vuelta();assert.equal(llamadas.length,1);
  programador.solicitar(false,0);programador.solicitar(false,0);await vuelta();
  assert.equal(llamadas.length,1);
  terminar();await vuelta();
  assert.deepEqual(llamadas,[true,false]);
});

test('los cambios guardados en segundo plano siguen pendientes hasta volver a la app',async t=>{
  let activa=false;const llamadas:boolean[]=[];
  const programador=crearProgramadorSincronizacion({estaActiva:()=>activa,obtenerVista:()=>({estado:'local',pendientes:0}),sincronizar:async s=>{llamadas.push(s);}});
  t.after(()=>programador.cerrar());
  programador.solicitar(false,0);await vuelta();assert.equal(llamadas.length,0);
  activa=true;programador.activar();await vuelta();
  assert.deepEqual(llamadas,[false]);
});

test('una nueva escritura después de terminar también inicia el envío automáticamente',async t=>{
  let llamadas=0;
  const programador=crearProgramadorSincronizacion({estaActiva:()=>true,obtenerVista:()=>({estado:'online',pendientes:0}),sincronizar:async()=>{llamadas++;}});
  t.after(()=>programador.cerrar());
  programador.activar();await vuelta();assert.equal(llamadas,1);
  programador.solicitar(false,0);await vuelta();assert.equal(llamadas,2);
  programador.cerrar();programador.solicitar(false,0);await vuelta();assert.equal(llamadas,2);
});
