import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compilarFuente} from './helpers/typescript.ts';
import {preparar} from './helpers/localDatabase.ts';
import {TEMAS} from '../src/styles/colors.ts';

for(const caso of [
 {nombre:'sesión recordada al reabrir',recordar:true,sesion:true,esperado:'actual@ahre.test'},
 {nombre:'sesión cerrada o perdida',recordar:true,sesion:false,esperado:''},
 {nombre:'Recordarme desactivado',recordar:false,sesion:true,esperado:''},
])test('Login recupera correo según '+caso.nombre,async()=>{
 const estados:unknown[]=[],efectos:(()=>unknown)[]=[];
 const react={useContext:()=>({tema:TEMAS.claro,mostrarAviso:()=>{},establecerApariencia:()=>{}}),useRef:(valor:unknown)=>({current:valor}),useEffect:(f:()=>unknown)=>efectos.push(f),useState:(valor:unknown)=>{const i=estados.length;estados.push(valor);return [valor,(nuevo:unknown)=>{estados[i]=typeof nuevo==='function'?nuevo(estados[i]):nuevo;}];}};
 const importar=(nombre:string):unknown=>{
  if(nombre==='react')return react;
  if(nombre==='react/jsx-runtime')return {jsx:(type:unknown,props:unknown)=>({type,props}),jsxs:(type:unknown,props:unknown)=>({type,props})};
  if(nombre==='react-native')return {Animated:{Value:class{interpolate(){return 0;}setValue(){}},spring:()=>({start:()=>{}})},Alert:{}};
  if(nombre.endsWith('/loginMemory'))return {leerRecordatorioIngreso:async()=>({recordar:caso.recordar,correo:'viejo@ahre.test'})};
  if(nombre.endsWith('/sessionService'))return {obtenerSesionActual:async()=>({usuario:caso.sesion?{correo_electronico:'actual@ahre.test'}:null})};
  if(nombre.endsWith('/useSafeGoBack'))return {useRegresoProtegido:()=>{}};
  if(nombre.endsWith('/useActionCompletion'))return {useFinalizacionAccion:()=>({completado:false,iniciar(){},confirmar:async()=>true})};
  if(nombre.endsWith('/pressFeedback'))return {conRespuestaVisual:(accion:unknown)=>accion};
  if(nombre.endsWith('/globalStyles'))return {crearEstilosGlobales:()=>({})};
  if(nombre.endsWith('/authStyles'))return {crearEstilosAutenticacion:()=>({})};
  return {};
 };
 const archivo=process.cwd()+'/src/screens/LoginScreen.tsx',modulo={exports:{}};
 new Function('require','module','exports',compilarFuente(readFileSync(archivo,'utf8'),archivo,true))(importar,modulo,modulo.exports);
 (modulo.exports as {default:(props:unknown)=>unknown}).default({navigation:{}});
 efectos.forEach(f=>f());await new Promise<void>(r=>setImmediate(r));
 assert.equal(estados[0],caso.esperado);assert.equal(estados[1],'','Nunca se recupera la contraseña');
});

test('el correo recordado sobrevive a un arranque nuevo y desaparece después de cerrar sesión',async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba();const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);await e.crearSesion(usuario.id,true);
 const remoto={url:'',fetch:async()=>{throw Error('No se necesita red');},base:e.base,almacenamiento:e.almacenamiento};
 const reapertura=await preparar(t,true,remoto);
 assert.equal((await reapertura.obtenerSesionActual()).usuario!.id,usuario.id);
 assert.equal((await reapertura.leerRecordatorioIngreso()).correo,usuario.correo_electronico);
 await reapertura.cerrarSesion();const siguiente=await preparar(t,true,remoto);
 assert.equal((await siguiente.obtenerSesionActual()).usuario,null);assert.equal((await siguiente.leerRecordatorioIngreso()).correo,'');
});
