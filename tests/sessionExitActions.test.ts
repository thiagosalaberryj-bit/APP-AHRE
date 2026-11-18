import test from 'node:test';
import assert from 'node:assert/strict';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';
import {TEMAS} from '../src/styles/colors.ts';

for(const nombre of ['claro','oscuro'] as const)test('cierre y desvinculación bloquean ambos controles y animan solo la acción elegida en '+nombre,()=>{
 const {cargar}=crearCargadorComponentes(process.cwd(),{'./ActionButton':{default:'BotonAccion',__esModule:true}});
 const Acciones=cargar<typeof import('../src/components/SessionExitActions.tsx')>('src/components/SessionExitActions.tsx').default;
 const desvincular=()=>{},cerrar=()=>{};
 for(const accionActiva of ['','cerrar','desvincular'])for(const completado of [false,true]){
  const arbol=Acciones({tema:TEMAS[nombre],accionActiva,completado,alDesvincular:desvincular,alCerrarSesion:cerrar}) as any;
  const botones=arbol.props.children;assert.equal(botones.length,2);
  botones.forEach((boton:any,i:number)=>{
   const elegida=accionActiva===(i===0?'desvincular':'cerrar');
   assert.equal(boton.props.cargando,elegida);
   assert.equal(boton.props.completado,elegida&&completado);
   assert.equal(boton.props.deshabilitado,!!accionActiva);
   assert.equal(boton.props.alPresionar,i===0?desvincular:cerrar);
  });
 }
});
