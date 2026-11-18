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

test('el éxito externo se mantiene al iniciar el cierre y permite reutilizar la acción después',async()=>{
 const e=prepararBoton();let terminar!:()=>void;
 const props={tema:TEMAS.oscuro,texto:'Guardar ingreso',completado:false,cargando:false,alPresionar:()=>new Promise<void>(r=>{terminar=r;})};
 const pendiente=e.renderizar(props).props.onPress();
 const exito={...props,completado:true};
 const durante=e.renderizar({...exito,cargando:true});
 assert.equal(durante.props.children.props.completado,true);
 const cerrando=e.renderizar(exito);
 assert.equal(cerrando.props.children.props.cargando,false);
 assert.equal(cerrando.props.children.props.completado,true);
 terminar();await pendiente;
 const final=e.renderizar(exito);
 assert.equal(final.props.children.props.completado,false);
 assert.equal(final.props.children.props.cargando,false);
 assert.equal(final.props.disabled,false);e.cerrar();
});

for(const nombre of ['claro','oscuro'] as const)test('tick y cruz compactos conservan la misma geometría en '+nombre,()=>{
 const {cargar}=crearCargadorComponentes(process.cwd());
 const {crearEstilosSocialOnline}=cargar<typeof import('../src/styles/social/OnlineSocialStyles.ts')>('src/styles/social/OnlineSocialStyles.ts');
 const tema=TEMAS[nombre],comun=crearEstilosSocialOnline(tema).decisionSimple;
 const estilos=[{variante:'texto',deshabilitado:false},{variante:'texto',deshabilitado:true},{variante:'contorno',deshabilitado:false},{variante:'contorno',deshabilitado:true},{variante:'texto',deshabilitado:true,cargando:true},{variante:'contorno',deshabilitado:true,cargando:true}].map(({variante,deshabilitado,cargando})=>{
  const e=prepararBoton();const boton=e.renderizar({tema,texto:'Decidir',deshabilitado,cargando,variante:variante as 'texto'|'contorno',ocultarTexto:true,icono:variante==='texto'?'checkmark':'close',estilo:comun,alPresionar:()=>{}});
  const estilo=Object.assign({},...boton.props.style({pressed:false}).filter(Boolean));e.cerrar();return estilo;
 });
 for(const estilo of estilos.slice(1))for(const propiedad of ['height','minHeight','paddingVertical','paddingHorizontal','borderWidth','borderRadius','borderColor'])assert.equal(estilos[0][propiedad],estilo[propiedad],propiedad);
 for(const estilo of estilos){assert.ok(48-2*estilo.paddingHorizontal-2*estilo.borderWidth>=22,'El tick bloqueado conserva espacio horizontal para el icono');assert.ok(estilo.height-2*estilo.paddingVertical-2*estilo.borderWidth>=28,'El contenido no se recorta al bloquear el botón');}
 assert.equal(estilos[0].height,48);assert.equal(estilos[0].paddingVertical,0);
});

for(const nombre of ['claro','oscuro'] as const)test('el botón opuesto bloqueado queda quieto y la acción del modal no anima el disparador en '+nombre,async()=>{
 const e=prepararBoton();let terminar!:()=>void;
 const props={tema:TEMAS[nombre],texto:'Confirmar',alPresionar:()=>new Promise<void>(r=>{terminar=r;})};
 const bloqueado=e.renderizar({...props,deshabilitado:true});
 assert.equal(bloqueado.props.children.props.cargando,false);assert.equal(bloqueado.props.children.props.completado,false);
 assert.equal(bloqueado.props.children.props.animarCambios,false);
 assert.deepEqual(bloqueado.props.style({pressed:true}),bloqueado.props.style({pressed:false}),'No conserva el sombreado de toque');
 const pendiente=e.renderizar(props).props.onPress();
 const fondo=e.renderizar({...props,deshabilitado:true,mostrarActividad:false});
 assert.equal(fondo.props.disabled,true);assert.equal(fondo.props.accessibilityState.busy,false);
 assert.equal(fondo.props.children.props.cargando,false);assert.equal(fondo.props.children.props.completado,false);assert.equal(fondo.props.children.props.animarCambios,false);
 terminar();await pendiente;e.cerrar();
});
