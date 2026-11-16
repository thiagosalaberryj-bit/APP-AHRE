import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compilarFuente} from './helpers/typescript.ts';
import {preparar} from './helpers/localDatabase.ts';
import {interfazSocial} from './helpers/socialInterface.ts';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';
import {TEMAS} from '../src/styles/colors.ts';

test('cerrar sesión limpia el correo recordado y el recordatorio nunca guarda contraseña',async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba();const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);
 await e.crearSesion(usuario.id,true);
 assert.deepEqual({...await e.leerRecordatorioIngreso()},{recordar:true,correo:usuario.correo_electronico.toLowerCase()});
 assert.equal(await e.obtenerIdentificadorSesionGuardado(),usuario.id);
 await e.cerrarSesion();assert.equal((await e.obtenerSesionActual()).usuario,null);
 assert.equal((await e.leerRecordatorioIngreso()).correo,'');
 await e.crearSesion(usuario.id,false);assert.equal(await e.obtenerIdentificadorSesionGuardado(),null);
 assert.deepEqual({...await e.leerRecordatorioIngreso()},{recordar:false,correo:''});
 assert.deepEqual(Object.keys(JSON.parse(e.almacenamiento.get('ahre.ingreso.recordatorio')!)).sort(),['correo','recordar']);
});

for(const huella of [false,true])test('Inicio usa la sesión recordada con huella configurada='+huella,async()=>{
 const estados:{valor:unknown}[]=[],destinos:string[]=[],gestos:{current:any}={current:null};let verificaciones=0;
 const valor=class{setValue(){} interpolate(){return 0;}stopAnimation(f?:(v:number)=>void){f?.(0);}};
 const react={useContext:()=>({tema:TEMAS.claro,establecerApariencia:()=>{},mostrarAviso:()=>{}}),useCallback:(f:unknown)=>f,useEffect:()=>{},useMemo:(f:()=>unknown)=>f(),useRef:(v:unknown)=>({current:v}),useState:(v:unknown)=>{const estado={valor:v};estados.push(estado);return [v,(nuevo:unknown)=>{estado.valor=nuevo;}];}};
 const modulo={exports:{}};
 const importar=(nombre:string):unknown=>{
  if(nombre==='react')return react;
  if(nombre==='react/jsx-runtime')return {jsx:(type:unknown,props:unknown)=>({type,props}),jsxs:(type:unknown,props:unknown)=>({type,props})};
  if(nombre==='react-native')return {Animated:{Value:valor,View:'View',Text:'Text',timing:()=>({start:(f?:(r:object)=>void)=>f?.({finished:true})}),spring:()=>({start:()=>{}})},Easing:{out:()=>0,cubic:0},PanResponder:{create:(m:unknown)=>{gestos.current=m;return {panHandlers:{}};}},useWindowDimensions:()=>({width:400,height:800})};
  if(nombre==='expo-local-authentication')return {hasHardwareAsync:async()=>huella,isEnrolledAsync:async()=>huella,authenticateAsync:async()=>{verificaciones++;return {success:true};}};
  if(nombre.endsWith('/sessionService'))return {obtenerSesionActual:async()=>({usuario:{id:'cuenta'}})};
  if(nombre.endsWith('/useSafeGoBack'))return {useRegresoProtegido:()=>{}};
  if(nombre.endsWith('/HomeScreenStyles'))return {crearEstilosInicio:()=>({}),TAMANO_CONTROL_DESLIZADOR:52};
  if(nombre.endsWith('/globalStyles'))return {ESPACIADO:{pequeno:8},MARGEN_LATERAL_PANTALLA:16};
  if(nombre.endsWith('/colors'))return {COLORES_MARCA:{}};
  if(nombre.endsWith('/routes'))return {RUTAS:{INICIO_SESION:'Login'}};
  if(nombre.endsWith('/errors'))return {ErrorAutenticacion:class extends Error{},ErrorBaseDatos:class extends Error{}};
  return {};
 };
 const archivo=process.cwd()+'/src/screens/HomeScreen.tsx';
 new Function('require','module','exports','__DEV__',compilarFuente(readFileSync(archivo,'utf8'),archivo,true))(importar,modulo,modulo.exports,false);
 (modulo.exports as {default:(p:unknown)=>unknown}).default({navigation:{replace:(ruta:string)=>destinos.push(ruta)}});
 gestos.current.onPanResponderMove(null,{dx:1000});gestos.current.onPanResponderRelease();
 await new Promise<void>(r=>setImmediate(r));assert.equal(estados[2].valor,huella);assert.deepEqual(destinos,huella?[]:['Login']);assert.equal(verificaciones,huella?1:0);
});

for(const nombre of ['claro','oscuro'] as const)test('las decisiones comparten botón y animan solo la acción elegida en '+nombre,()=>{
 const {cargar}=crearCargadorComponentes(process.cwd(),{'../contexts/ToastContext':{ContextoAvisos:{}}});
 const Componente=cargar<typeof import('../src/components/social/RequestDecisionActions.tsx')>('src/components/social/RequestDecisionActions.tsx').default;
 const Boton=cargar<typeof import('../src/components/ActionButton.tsx')>('src/components/ActionButton.tsx').default;
 const aceptar=()=>{},rechazar=()=>{};
 for(const procesando of ['aceptar','rechazar'] as const){
  const resultado=Componente({tema:TEMAS[nombre],alAceptar:aceptar,alRechazar:rechazar,etiquetaAceptar:'Aceptar',etiquetaRechazar:'Rechazar',procesando,completado:true}) as any;
  const columnas=resultado.props.children;assert.equal(columnas.length,2);assert.deepEqual(columnas[0].props.style,columnas[1].props.style);
  for(const columna of columnas){const boton=columna.props.children;assert.equal(boton.type,Boton);assert.equal(boton.props.deshabilitado,true);
   const elegida=boton.props.etiquetaAccesibilidad===(procesando==='aceptar'?'Aceptar':'Rechazar');
   assert.equal(boton.props.cargando,elegida);assert.equal(boton.props.completado,elegida);
   assert.equal(boton.props.alPresionar,boton.props.etiquetaAccesibilidad==='Aceptar'?aceptar:rechazar);
  }
 }
});

for(const tema of ['claro','oscuro'] as const)test('archivar oculta la ficha sin impedir nuevas deudas ni participación y la salida bloquea el cierre en '+tema,async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});const datos=await e.cargarSocial(),ana=datos.personas.find(p=>p.nombre==='Ana')!;
 await e.cambiarActividadPersona(ana.id,false);
 const deuda=await e.crearDeudaPersonal({personaId:ana.id,direccion:'debo',monto:12,descripcion:'Archivada sigue disponible'});assert.ok(deuda.id);
 const nueva=await e.crearSala({nombre:'Sala con archivada',fecha:'2026-11-15',icono:'people-outline',color:'#BED5C8',personasIds:[ana.id]});assert.ok(nueva.id);
 assert.equal((await e.cargarSocial()).personas.find(p=>p.id===ana.id)!.activa,false);
 const formulario=interfazSocial(e,tema);await formulario.abrir(formulario.rutas.REGISTRO_SOCIAL,{tipo:'gasto',salaId:nueva.id});await formulario.pulsar('Quién pagó');assert.ok(formulario.buscarBoton('Ana'));
 const sala=datos.salas.find(s=>s.nombre==='Demo · Viaje con amigos')!,detalle=await e.obtenerSalaOnline(sala.id),bruno=datos.personas.find(p=>p.nombre==='Bruno')!;
 await e.cambiarPersonasSala(sala.id,detalle.sala.participantes.filter(p=>p.activa&&p.id!==bruno.id).map(p=>p.id));
 const actual=await e.obtenerSalaOnline(sala.id);assert.ok(actual.sala.salidas?.some(s=>s.personaId===bruno.id&&!s.revisada));
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});assert.ok(vista.texto().includes('Revisión pendiente'));assert.equal(vista.buscarBoton('Cerrar sala').props.disabled,true);
 await e.revisarSalidaSala(sala.id,bruno.id);assert.ok((await e.obtenerSalaOnline(sala.id)).sala.salidas?.find(s=>s.personaId===bruno.id)!.revisada);
});
