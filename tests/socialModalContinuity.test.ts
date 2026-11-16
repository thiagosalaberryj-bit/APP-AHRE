import assert from 'node:assert/strict';
import test from 'node:test';
import {preparar} from './helpers/localDatabase.ts';
import {interfazSocial} from './helpers/socialInterface.ts';

function espera(){let resolver!:()=>void;const promesa=new Promise<void>(r=>{resolver=r;});return {promesa,resolver};}
function mismaVentana(vista:ReturnType<typeof interfazSocial>,id:number){assert.deepEqual(vista.ventanas(),[id],'Conserva una sola ventana nativa, sin cerrarla ni volver a montarla');}

for(const tema of ['claro','oscuro'] as const){
 test('el vínculo conserva la ventana del menú durante carga, error y reintento en '+tema,async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});
  const persona=(await e.cargarSocial()).personas.find(p=>p.nombre==='Ana')!;
  let pendiente=espera(),fallar=true;
  const vista=interfazSocial({...e,solicitarVinculoOnline:async()=>{await pendiente.promesa;if(fallar)throw Error('Error de prueba');return {};}},tema);
  await vista.abrir(vista.rutas.PERSONA_SOCIAL,{personaId:persona.id});await vista.pulsar('Opciones de persona');
  const [id]=vista.ventanas();assert.ok(id);await vista.pulsar('Vincular cuenta');mismaVentana(vista,id);
  await vista.llenar('Correo de la cuenta a vincular','ana@ejemplo.ahre.test');
  const envio=(vista.buscarBoton('Enviar solicitud de vínculo').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Procesando'));
  pendiente.resolver();await envio;await vista.asentar();mismaVentana(vista,id);assert.ok(vista.avisos.includes('Error de prueba'));
  pendiente=espera();fallar=false;
  const reintento=(vista.buscarBoton('Enviar solicitud de vínculo').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,id);pendiente.resolver();await reintento;await vista.asentar();assert.deepEqual(vista.ventanas(),[]);
 });

 test('Unirme conserva la ventana de Salas y no la reemplaza al procesar en '+tema,async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});const datos=await e.cargarSocial(),pendiente=espera();
  const vista=interfazSocial({...e,aceptarInvitacionOnline:async()=>{await pendiente.promesa;return {salaId:datos.salas[0].id};}},tema);
  await vista.abrir();await vista.pulsar('Salas');const [id]=vista.ventanas();assert.ok(id);
  await vista.pulsar('Unirme a sala');mismaVentana(vista,id);
  await vista.llenar('Enlace de invitación','https://ahre.example.test/invitacion/#'+'a'.repeat(64));
  const ingreso=(vista.buscarBoton('Aceptar invitación').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Procesando'));
  pendiente.resolver();await ingreso;await vista.asentar();assert.deepEqual(vista.ventanas(),[]);
 });

 test('compartir, configurar y guardar el acceso usan la misma ventana en '+tema,async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});
  const sala=(await e.cargarSocial()).salas.find(s=>s.demo&&s.online&&s.administrador&&s.estado==='abierta')!;
  await e.configurarAccesoSala(sala.id,'ahre1234');const pendiente=espera();
  const vista=interfazSocial({...e,configurarAccesoSala:async(...args)=>{await pendiente.promesa;return e.configurarAccesoSala(...args);}},tema);
  await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});await vista.pulsar('Compartir sala');
  const [id]=vista.ventanas();assert.ok(id);await vista.pulsar('Opciones de acceso');mismaVentana(vista,id);
  const guardado=(vista.buscarBoton('Guardar').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Procesando'));
  pendiente.resolver();await guardado;await vista.asentar();mismaVentana(vista,id);assert.ok(vista.buscarBoton('Opciones de acceso'));
 });

 test('registrar persona mantiene el formulario y bloquea el cierre durante el guardado en '+tema,async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba();const pendiente=espera();
  const vista=interfazSocial({...e,guardarPersona:async(...args)=>{await pendiente.promesa;return e.guardarPersona(...args);}},tema);
  await vista.abrir(vista.rutas.PERSONAS_SOCIAL,{todas:true});await vista.pulsar('Agregar persona');const [id]=vista.ventanas();assert.ok(id);
  await vista.llenar('Nombre','Prueba');await vista.llenar('Apellido','Modal');await vista.llenar('Apodo','Modal estable');
  const anterior=Object.getOwnPropertyDescriptor(globalThis,'requestAnimationFrame');
  Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:()=>1});
  t.after(()=>{if(anterior)Object.defineProperty(globalThis,'requestAnimationFrame',anterior);else Reflect.deleteProperty(globalThis,'requestAnimationFrame');});
  t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.now()});
  const guardado=(vista.buscarBoton('Registrar persona').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Procesando'));
  (vista.todos().find(n=>n.type==='Modal')!.props.onRequestClose as ()=>void)();await vista.asentar();mismaVentana(vista,id);
  pendiente.resolver();await vista.asentar();
  t.mock.timers.tick(1999);await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Procesando'));
  t.mock.timers.tick(1);await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Listo'));
  t.mock.timers.tick(999);await vista.asentar();mismaVentana(vista,id);
  t.mock.timers.tick(1);await guardado;await vista.asentar();assert.deepEqual(vista.ventanas(),[]);
 });

 test('archivar y desarchivar conservan la ventana de opciones durante la operación en '+tema,async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba();const persona=(await e.cargarSocial()).personas[0];let pendiente=espera();
  const vista=interfazSocial({...e,cambiarActividadPersona:async(...args)=>{await pendiente.promesa;return e.cambiarActividadPersona(...args);}},tema);
  await vista.abrir(vista.rutas.PERSONA_SOCIAL,{personaId:persona.id});await vista.pulsar('Opciones de persona');const [id]=vista.ventanas();
  await vista.pulsar('Archivar persona');mismaVentana(vista,id);
  const archivado=(vista.buscarBoton('Sí, archivar persona').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Procesando'));
  pendiente.resolver();await archivado;await vista.asentar();assert.deepEqual(vista.ventanas(),[]);
  await vista.abrir(vista.rutas.PERSONA_SOCIAL,{personaId:persona.id});await vista.pulsar('Opciones de persona');const [otra]=vista.ventanas();pendiente=espera();
  const desarchivado=(vista.buscarBoton('Desarchivar persona').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,otra);assert.ok(vista.texto().includes('Procesando'));
  pendiente.resolver();await desarchivado;await vista.asentar();assert.deepEqual(vista.ventanas(),[]);
 });

 test('la confirmación de perdón permanece en su ventana al guardar en '+tema,async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba();const datos=await e.cargarSocial();
  const deuda=await e.crearDeudaPersonal({personaId:datos.personas[0].id,direccion:'me_deben',monto:20,descripcion:'Confirmación estable'},{depositoId:datos.depositos[0].id});
  const pendiente=espera();const vista=interfazSocial({...e,perdonarDeudaPersonal:async(...args)=>{await pendiente.promesa;return e.perdonarDeudaPersonal(...args);}},tema);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'eliminarDeuda',deudaId:deuda.id});await vista.pulsar('Confirmar perdón');const [id]=vista.ventanas();assert.ok(id);
  const guardado=(vista.buscarBoton('Sí, perdonar deuda').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Procesando'));
  pendiente.resolver();await guardado;await vista.asentar();assert.deepEqual(vista.ventanas(),[]);
 });

 test('la selección financiera conserva su ventana mientras registra la deuda en '+tema,async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba();const datos=await e.cargarSocial(),pendiente=espera();
  const vista=interfazSocial({...e,crearDeudaPersonal:async(...args)=>{await pendiente.promesa;return e.crearDeudaPersonal(...args);}},tema);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'deuda',personaId:datos.personas[0].id});
  await vista.llenar('Monto de la deuda','20');await vista.llenar('Descripción','Selección estable');await vista.pulsar('Registrar deuda');
  const [id]=vista.ventanas();assert.ok(id);await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);mismaVentana(vista,id);
  const guardado=(vista.buscarBoton('Confirmar y guardar').props.onPress as ()=>Promise<unknown>)();
  await vista.asentar();mismaVentana(vista,id);assert.ok(vista.texto().includes('Procesando'));
  pendiente.resolver();await guardado;await vista.asentar();assert.deepEqual(vista.ventanas(),[]);
 });
}
