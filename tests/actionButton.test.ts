import test from 'node:test';
import assert from 'node:assert/strict';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';
import { TEMAS } from '../src/styles/colors.ts';

function prepararBoton() {
  let indice=0;
  const casillas:any[]=[],efectos:(()=>void)[]=[],limpiezas:(()=>void)[]=[],avisos:string[]=[];
  const react={
    useState:(inicial:unknown)=>{const i=indice++;casillas[i]??={valor:inicial};return [casillas[i].valor,(v:any)=>{casillas[i].valor=typeof v==='function'?v(casillas[i].valor):v;}];},
    useRef:(inicial:unknown)=>{const i=indice++;return casillas[i]??={current:inicial};},
    useContext:()=>({mostrarAviso:(texto:string)=>avisos.push(texto)}),
    useEffect:(f:()=>void|(()=>void),deps:unknown[])=>{const i=indice++;if(!casillas[i]||deps.some((v,j)=>v!==casillas[i][j])){casillas[i]=deps;efectos.push(()=>{const limpiar=f();if(limpiar)limpiezas.push(limpiar);});}},
  };
  const {cargar}=crearCargadorComponentes(process.cwd(),{react,'../contexts/ToastContext':{ContextoAvisos:{}}});
  const Boton=cargar<typeof import('../src/components/ActionButton.tsx')>('src/components/ActionButton.tsx').default;
  const renderizar=(props:Parameters<typeof Boton>[0])=>{indice=0;const arbol=Boton(props);efectos.splice(0).forEach(f=>f());return arbol as any;};
  return {renderizar,avisos,cerrar:()=>limpiezas.forEach(f=>f())};
}

for(const nombre of ['claro','oscuro'] as const)test('una acción conserva su color al cargar, impide doble envío y libera el bloqueo tras un error en '+nombre,async()=>{
  const e=prepararBoton();let llamadas=0,rechazar!:(e:Error)=>void;
  const pendiente=new Promise((_,fallar)=>{rechazar=fallar;});
  const props={tema:TEMAS[nombre],texto:'Guardar',alPresionar:()=>{llamadas++;return pendiente;}};
  const boton=e.renderizar(props),promesa=boton.props.onPress();await boton.props.onPress();assert.equal(llamadas,1);
  const cargando=e.renderizar({...props,deshabilitado:true});assert.equal(cargando.props.accessibilityState.busy,true);
  assert.ok(!cargando.props.style({pressed:false}).some((s:any)=>s?.backgroundColor===TEMAS[nombre].fondoDeshabilitado));
  rechazar(new Error('Fallo simulado'));await promesa;
  const listo=e.renderizar(props);assert.equal(listo.props.disabled,false);assert.equal(listo.props.children.props.completado,false);assert.deepEqual(e.avisos,['Fallo simulado']);e.cerrar();
});

test('un éxito explícito muestra Listo y vuelve a habilitar la acción tras confirmarlo',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});
 const original=Object.getOwnPropertyDescriptor(globalThis,'requestAnimationFrame');
 Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:()=>1});
 t.after(()=>{if(original)Object.defineProperty(globalThis,'requestAnimationFrame',original);else Reflect.deleteProperty(globalThis,'requestAnimationFrame');});
 const e=prepararBoton();let resolver!:(v:boolean)=>void;
 const props={tema:TEMAS.oscuro,texto:'Permitir editar',alPresionar:()=>new Promise<boolean>(r=>{resolver=r;})};
 const promesa=e.renderizar(props).props.onPress();resolver(true);await Promise.resolve();
 t.mock.timers.tick(2000);await Promise.resolve();await Promise.resolve();
 const listo=e.renderizar(props);assert.equal(listo.props.children.props.completado,true);assert.equal(listo.props.children.props.cargando,false);assert.equal(listo.props.disabled,true);
 t.mock.timers.tick(1000);await promesa;
 const siguiente={...props,texto:'Quitar permiso'};e.renderizar(siguiente);
 assert.equal(e.renderizar(siguiente).props.disabled,false);e.cerrar();
});

test('un resultado fallido o sin confirmación no muestra un éxito ficticio',async()=>{
  for(const resultado of [false,undefined]){const e=prepararBoton(),props={tema:TEMAS.claro,texto:'Guardar',alPresionar:async()=>resultado};await e.renderizar(props).props.onPress();assert.equal(e.renderizar(props).props.children.props.completado,false);e.cerrar();}
});
