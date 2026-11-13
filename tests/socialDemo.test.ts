import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.ts';
import { presente } from './helpers/assertions.ts';
import { interfazSocial } from './helpers/socialInterface.ts';
import { TEMAS } from '../src/styles/colors.ts';

for(const tema of ['claro','oscuro'] as const)test(`la selección financiera bloquea cerrar el modal hasta terminar el guardado en ${tema}`,async prueba=>{
  const {e,abierta}=await prepararDemo(prueba),sala=presente((await e.cargarSocial()).salas.find(s=>s.id===abierta.id));
  let liberar!:()=>void,iniciada!:()=>void;
  const espera=new Promise<void>(r=>{liberar=r;}),inicio=new Promise<void>(r=>{iniciada=r;});
  const vista=interfazSocial({...e,elegirFinanciacionSala:async(...args:Parameters<typeof e.elegirFinanciacionSala>)=>{iniciada();await espera;return e.elegirFinanciacionSala(...args);}},tema);
  const detalle=await e.obtenerSalaOnline(abierta.id),operacion=presente(detalle.misFinanzas?.find(o=>o.clave.startsWith('compra:')));
  await vista.abrir(vista.rutas.GASTO_SOCIAL,{salaId:sala.id,gastoId:operacion.gastoId});
  const opcion=presente(vista.todos().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===operacion.descripcion));await vista.pulsar(String(opcion.props.accessibilityLabel));
  await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);
  const boton=vista.buscarBoton('Guardar');const guardado=(boton.props.onPress as ()=>unknown)();await inicio;await vista.asentar();
  assert.equal(vista.buscarBoton('Cerrar invitación').props.disabled,true);
  const modal=presente(vista.todos().find(n=>n.type==='Modal'));(modal.props.onRequestClose as ()=>void)();await vista.asentar();assert.ok(vista.texto().includes('Mis movimientos'));
  liberar();await guardado;await vista.asentar();assert.ok(!vista.todos().some(n=>n.type==='Modal'));
});

for(const tema of ['claro','oscuro'] as const)test(`perdonar la deuda demo conserva el dinero y distingue lo recibido de lo perdonado en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Demo · Pagos y perdón'));
  const antes=e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo;
  const cantidad=e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n;
  const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  await vista.pulsar('Perdonar deuda');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'eliminarDeuda',deudaId:deuda.id});assert.ok(vista.texto().includes('No se creará un ingreso ni un egreso'));
  await vista.pulsar('Confirmar perdón');await vista.pulsar('Sí, perdonar deuda');
  const despues=presente((await e.cargarSocial()).deudas.find(d=>d.id===deuda.id));
  assert.equal(despues.pendienteNumero,0);assert.equal(despues.perdonadoNumero,800);assert.equal(despues.estado,'Perdonada');
  assert.equal(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo,antes);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n,cantidad);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  assert.deepEqual(vista.buscarBoton('Ver importe Recibiste').props.accessibilityValue,{text:'$ 200'});
  assert.ok(vista.texto().includes('Perdonado sin pago · $ 800'));
  const cache=presente((await e.leerDatosOnline<import('../src/social/online/types.ts').DeudaOnline[]>(datos.usuarioId,'deudas',[])).find(d=>d.id===deuda.id));
  assert.equal(cache.pagos.find(p=>p.monto===150)?.estado,'rechazado');assert.equal(cache.pagos.find(p=>p.monto===200)?.estado,'confirmado');
  await e.perdonarDeudaOnline(deuda.id,800);await vista.asentar();assert.equal(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n,cantidad);comprobarRed();
});

test('el deudor no puede perdonar y un pendiente desactualizado impide cerrar sin pago',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Demo · Pagos y perdón'));
  await assert.rejects(e.perdonarDeudaOnline(deuda.id,700));
  const propia=presente(datos.deudas.find(d=>d.invitacionOnline));await e.enviarAccionSocial('aceptar-sin-perdon','/deudas/'+propia.id+'/decidir',{decision:'aceptada'});
  await assert.rejects(e.perdonarDeudaOnline(propia.id,4500));
  const vista=interfazSocial(e,'claro');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:propia.id});
  assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&vista.texto(n)==='Perdonar deuda'));comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`cada entrada de Registrar pago tiene un único escenario en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Cena con pago parcial'));
  const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id});
  assert.ok(vista.texto().includes('Cobro que recibiste'));assert.ok(vista.texto().includes('Monto recibido'));assert.ok(!vista.texto().includes('Rechazar'));
  assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel).startsWith('Tipo de registro:')));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id,pagoId:deuda.id.replace(':deuda',':por-confirmar')});
  assert.ok(vista.texto().includes('Dinero por confirmar'));assert.ok(!vista.texto().includes('Monto recibido'));
  await vista.pulsar('Origen del movimiento: Adjuntar movimiento');assert.deepEqual(vista.buscarBoton('Origen del movimiento: Adjuntar movimiento').props.accessibilityState,{selected:true});
  await vista.pulsar('Origen del movimiento: Crear movimiento');await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);
  assert.equal(vista.buscarBoton('Confirmar').props.disabled,false);assert.ok(vista.texto().includes('Rechazar'));comprobarRed();
});

test('una deuda online permite abrir la ficha de Carla y Registrar pago no repite Cancelar',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.invitacionOnline));
  const vista=interfazSocial(e,'claro');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  await vista.pulsar('Ver persona');assert.ok(vista.destinos.some(d=>d[0]===vista.rutas.PERSONA_SOCIAL&&(d[1] as {personaId?:string}).personaId===deuda.personaId));
  await vista.abrir(vista.rutas.PERSONA_SOCIAL,{personaId:deuda.personaId});assert.ok(vista.texto().includes('Carla'));
  await e.enviarAccionSocial('aceptar-ficha','/deudas/'+deuda.id+'/decidir',{decision:'aceptada'});
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id});
  assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&vista.texto(n)==='Cancelar'));comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`la invitación oculta el historial y al aceptar muestra la creación dentro del historial en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.invitacionOnline));
  const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  assert.ok(vista.texto().includes('Invitación de deuda'));
  assert.ok(!vista.texto().includes('Historial de la deuda'));assert.ok(!vista.texto().includes('Deuda registrada ·'));
  await vista.pulsar('Aceptar');
  assert.ok(vista.texto().includes('Historial de la deuda'));assert.ok(vista.texto().includes('Deuda registrada ·'));
  assert.ok(!vista.texto().includes('Invitación de deuda'));assert.ok(!vista.texto().includes('Depósito desde el que pagaste'));
  assert.ok(!vista.texto().includes('Informar pago · Espera confirmación de recepción'));
  comprobarRed();
});

test('el historial aceptado no vuelve a mostrar una invitación durante la carga del caché',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.invitacionOnline));
  await e.enviarAccionSocial('aceptar-sin-parpadeo','/deudas/'+deuda.id+'/decidir',{decision:'aceptada'});
  let liberar:()=>void=()=>{};const espera=new Promise<void>(resolver=>{liberar=resolver;});
  const leer:typeof e.leerDatosOnline=async(usuario,clave,defecto)=>{if(clave==='deudas')await espera;return e.leerDatosOnline(usuario,clave,defecto);};
  const vista=interfazSocial({...e,leerDatosOnline:leer},'claro');
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  assert.ok(vista.texto().includes('Historial de la deuda'));assert.ok(!vista.texto().includes('Invitación de deuda'));
  assert.ok(!vista.todos().some(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Importe que pagaste'));
  liberar();await vista.asentar();assert.ok(!vista.texto().includes('Invitación de deuda'));
  comprobarRed();
});

test('el acreedor puede registrar por su cuenta un ingreso; el pago informado anterior sigue sin confirmar',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Cena con pago parcial'));
  const vista=interfazSocial(e,'claro');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id});
  await vista.pulsar('Otro importe');await vista.llenar('Monto recibido','100');
  await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);await vista.pulsar('Registrar pago nuevo');
  const acuerdo=presente((await e.leerDatosOnline<import('../src/social/online/types.ts').DeudaOnline[]>(datos.usuarioId,'deudas',[])).find(d=>d.id===deuda.id));
  assert.equal(acuerdo.pendiente,1400);assert.ok(acuerdo.pagos.some(p=>p.monto===100&&p.estado==='confirmado'));assert.ok(acuerdo.pagos.some(p=>p.monto===250&&p.estado==='informado'));comprobarRed();
});

test('confirmar adjuntando un movimiento no duplica dinero y su flecha abre el detalle del movimiento',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Cena con pago parcial'));
  const deposito=presente(datos.depositos.find(d=>d.nombre==='Efectivo de prueba'));
  const movimiento=await e.movimientosRepositorio.crear({deposito_id:deposito.id,tipo:'ingreso',categoria:'devoluciones',monto:250,descripcion:'Transferencia ya registrada',fecha_hora:new Date().toISOString()});
  const saldo=e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual;
  const vista=interfazSocial(e,'oscuro');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  assert.ok(!vista.texto().includes('Depósito donde recibiste el pago'));
  const aviso=presente(vista.todos().find(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel).startsWith('Gestionar registro: Pago ·')));
  await vista.pulsar(String(aviso.props.accessibilityLabel));assert.ok(vista.destinos.some(d=>d[0]===vista.rutas.REGISTRO_SOCIAL));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id,pagoId:deuda.id.replace(':deuda',':por-confirmar')});await vista.pulsar('Origen del movimiento: Adjuntar movimiento');await vista.pulsar('Transferencia ya registrada · Efectivo de prueba');await vista.pulsar('Confirmar');
  assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual,saldo);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  const flecha=presente(vista.todos().find(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel).startsWith('Ver movimiento: Pago ·')&&String(n.props.accessibilityLabel).includes('250')));
  await vista.pulsar(String(flecha.props.accessibilityLabel));assert.ok(vista.destinos.some(d=>d[0]===vista.rutas.DETALLE_MOVIMIENTO&&(d[1] as {movimientoId?:string}).movimientoId===movimiento.id));comprobarRed();
});

test('el acreedor rechaza un aviso desde Registrar pago sin elegir depósito ni modificar la deuda',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Cena con pago parcial'));
  const antes=e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo;
  const vista=interfazSocial(e,'claro');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id,pagoId:deuda.id.replace(':deuda',':por-confirmar')});await vista.pulsar('Rechazar');
  assert.equal((await e.cargarSocial()).deudas.find(d=>d.id===deuda.id)?.pendienteNumero,1500);assert.equal(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo,antes);comprobarRed();
});

test('Registrar pago recibido usa el formulario común y confirma solo el aviso elegido',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Cena con pago parcial'));
  const vista=interfazSocial(e,'claro');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id,pagoId:deuda.id.replace(':deuda',':por-confirmar')});
  assert.ok(vista.texto().includes('Confirmar pago recibido'));
  assert.ok(!vista.todos().some(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Monto recibido'));
  await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);await vista.pulsar('Confirmar');
  assert.equal((await e.cargarSocial()).deudas.find(d=>d.id===deuda.id)?.pendienteNumero,1250);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id});assert.ok(vista.texto().includes('Monto recibido'));
  comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`la deuda online aceptada usa Registrar pago y el formulario común en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.invitacionOnline));
  await e.enviarAccionSocial('aceptar-formulario','/deudas/'+deuda.id+'/decidir',{decision:'aceptada'});
  const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  assert.ok(vista.texto().includes('Registrar pago'));assert.ok(!vista.texto().includes('Acuerdo con esta persona'));
  assert.ok(!vista.todos().some(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Importe que pagaste'));
  await vista.pulsar('Registrar mi pago');
  assert.ok(vista.destinos.some(d=>d[0]===vista.rutas.REGISTRO_SOCIAL&&(d[1] as {tipo?:string}).tipo==='pago'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id});
  await vista.pulsar('Otro importe');await vista.llenar('Monto que pagaste','10');
  await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);await vista.pulsar('Informar pago realizado');
  const acuerdo=presente((await e.leerDatosOnline<import('../src/social/online/types.ts').DeudaOnline[]>(datos.usuarioId,'deudas',[])).find(d=>d.id===deuda.id));
  assert.equal(acuerdo.pagos.length,1);assert.equal(acuerdo.pagos[0].monto,10);assert.equal(acuerdo.pendiente,4500);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});assert.ok(vista.texto().includes('En espera de Carla'));
  comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`Invitaciones filtra propuestas pendientes y deja de incluirlas al aceptarlas en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),vista=interfazSocial(e,tema);
  const propuesta=presente(datos.deudas.find(d=>d.invitacionOnline));
  await vista.abrir(vista.rutas.PERSONAS_SOCIAL);
  await vista.pulsar('Origen de deudas: Online');await vista.pulsar('Saldadas');await vista.pulsar('Invitaciones');
  assert.deepEqual(vista.buscarBoton('Invitaciones').props.accessibilityState,{checked:true});
  assert.ok(vista.texto().includes('Invitación'));
  assert.ok(!vista.texto().includes('Invitación pendiente'));assert.ok(!vista.texto().includes('Invitación ·'));
  assert.ok(vista.texto().includes(propuesta.descripcion.replace(/^Invitación · /,'')));assert.ok(!vista.texto().includes('Cena con pago parcial'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:propuesta.id});assert.ok(!vista.texto().includes('Actualizar acuerdos'));assert.ok(vista.texto().includes('Rechazar'));await vista.pulsar('Aceptar');
  await vista.abrir(vista.rutas.PERSONAS_SOCIAL);await vista.pulsar('Origen de deudas: Online');await vista.pulsar('Invitaciones');
  assert.ok(vista.texto().includes('No hay invitaciones pendientes'));
  await vista.pulsar('Debo');assert.ok(vista.texto().includes('Le debés'));assert.ok(!vista.texto().includes('Invitación ·'));
  await vista.pulsar('Origen de deudas: Locales');
  assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Invitaciones'));
  comprobarRed();
});

async function prepararDemo(prueba: import('node:test').TestContext) {
  let solicitudes = 0;
  const e = await preparar(prueba, true, {url:'https://servidor.invalid/api/v1', fetch:async () => { solicitudes++; throw new Error('La demo no debe usar HTTP.'); }});
  await e.prepararDatosPrueba({vistaSocialOnline:true});
  const datos = await e.cargarSocial(), abierta = presente(datos.salas.find(s => s.nombre === 'Demo · Viaje con amigos'));
  return {e, datos, abierta, comprobarRed:() => assert.equal(solicitudes,0)};
}

test('rechazar la invitación demo la retira del historial del destinatario',async prueba=>{
 const {e,datos}=await prepararDemo(prueba),invitacion=presente(datos.deudas.find(d=>d.invitacionOnline));
 await e.enviarAccionSocial('rechazar-prueba','/deudas/'+invitacion.acuerdoOnlineId+'/decidir',{decision:'rechazada'});
 assert.ok(!(await e.cargarSocial()).deudas.some(d=>d.id===invitacion.id));
});

for(const tema of ['claro','oscuro'] as const)test(`Social muestra todas las salas abiertas y las cerradas con registros pendientes sin límite en ${tema}`,async prueba=>{
 const {e,datos}=await prepararDemo(prueba);await e.sincronizarSocialOnline();
 const fila=presente(e.base.prepare('SELECT datos FROM salas_online_locales WHERE usuario_id=? LIMIT 1').get(datos.usuarioId));
 const original=JSON.parse(String(fila.datos)) as import('../src/social/online/types.ts').RespuestaSala;
 for(let i=0;i<5;i++){
   const copia={...original,sala:{...original.sala,id:'sala-listado-'+i,nombre:'Sala visible '+i,estado:'abierta'}};
   e.base.prepare('INSERT INTO salas_online_locales(usuario_id,sala_id,datos,administrador,persona_propia_id,fecha_actualizacion) VALUES(?,?,?,?,?,?)').run(datos.usuarioId,copia.sala.id,JSON.stringify(copia),0,copia.personaPropiaId,new Date().toISOString());
 }
 const operaciones=await e.leerDatosOnline<import('../src/social/online/types.ts').OperacionPersonal[]>(datos.usuarioId,'operaciones',[]);
 const salas=(await e.cargarSocial()).salas;
 const cerrada=presente(salas.find(s=>s.estado==='cerrada'&&s.movimientosPorRegistrar>0));
 const vista=interfazSocial(e,tema);await vista.abrir();
 for(let i=0;i<5;i++)assert.ok(vista.buscarBoton('Abrir Sala visible '+i));
 assert.ok(vista.buscarBoton('Abrir '+cerrada.nombre));
 assert.ok(vista.todos(vista.buscarBoton('Abrir '+cerrada.nombre)).some(n=>n.props.accessibilityLabel===`${cerrada.movimientosPorRegistrar} movimientos por registrar`));
 for(const sala of salas.filter(s=>s.estado==='cerrada'&&!s.movimientosPorRegistrar))assert.ok(!vista.todos().some(n=>n.props.accessibilityLabel==='Abrir '+sala.nombre));
 for(const operacion of operaciones.filter(o=>o.salaId===cerrada.id&&!o.incorporada))await e.incorporarOperacionPersonal(operacion,{depositoId:datos.depositos[0].id});
 await vista.asentar();
 assert.equal(presente((await e.cargarSocial()).salas.find(s=>s.id===cerrada.id)).movimientosPorRegistrar,0);
 assert.ok(!vista.todos().some(n=>n.props.accessibilityLabel==='Abrir '+cerrada.nombre));
 for(let i=0;i<5;i++)assert.ok(vista.buscarBoton('Abrir Sala visible '+i));
});

test('la sala cerrada indica incorporaciones pendientes y las actualiza con el registro local',async prueba=>{
 const {e,datos}=await prepararDemo(prueba);await e.sincronizarSocialOnline();
 const operaciones=await e.leerDatosOnline<import('../src/social/online/types.ts').OperacionPersonal[]>(datos.usuarioId,'operaciones',[]);
 const operacion=presente(operaciones.find(o=>o.salaId&&o.gastoId&&!o.incorporada)),salaId=operacion.salaId!;
 const cantidad=operaciones.filter(o=>o.salaId===salaId&&!o.incorporada).length;
 const vista=interfazSocial(e,'oscuro');await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId});
 assert.ok(vista.texto().includes(cantidad+' movimientos por registrar'));
 await e.incorporarOperacionPersonal(operacion,{depositoId:datos.depositos[0].id});await vista.asentar();
 assert.ok(vista.texto().includes(cantidad===1?'Sin movimientos por registrar':(cantidad-1)+' movimientos por registrar'));
});

test('confirmar un pago bloquea rechazar y solo muestra carga en la acción elegida',async prueba=>{
 const {e,datos}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Cena con pago parcial'));
 let liberar!:()=>void,empezo!:()=>void,llamadas=0;
 const espera=new Promise<void>(r=>{liberar=r;}),inicio=new Promise<void>(r=>{empezo=r;});prueba.after(()=>liberar());
 const vista=interfazSocial({...e,confirmarPagoConSeleccion:async(...args:Parameters<typeof e.confirmarPagoConSeleccion>)=>{llamadas++;empezo();await espera;return e.confirmarPagoConSeleccion(...args);}},'oscuro');
 await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id,pagoId:deuda.id.replace(':deuda',':por-confirmar')});
 await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);
 const confirmar=vista.buscarBoton('Confirmar');(confirmar.props.onPress as ()=>void)();await inicio;await vista.asentar();
 assert.equal(vista.buscarBoton('Rechazar').props.disabled,true);assert.ok(vista.texto().includes('Guardando…'));
 (confirmar.props.onPress as ()=>void)();await vista.asentar();assert.equal(llamadas,1);
 liberar();await vista.asentar();
});

test('el historial muestra una sola creación con su movimiento de origen, sin adelanto duplicado',async prueba=>{
 const {e,datos}=await prepararDemo(prueba),persona=presente(datos.personas.find(p=>p.id!=='vos')),deposito=datos.depositos[0];
 const deuda=await e.crearDeudaPersonal({personaId:persona.id,direccion:'me_deben',monto:'200',descripcion:'Préstamo único'},{depositoId:deposito.id});
 const vista=interfazSocial(e,'oscuro');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
 assert.ok(!vista.texto().includes('Adelanto registrado'));assert.ok(vista.texto().includes('Movimiento de origen vinculado'));
 assert.equal(vista.todos().filter(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel).startsWith('Ver movimiento: Deuda registrada')).length,1);
});

test('aceptar un aviso demo actualiza su gasto y persiste sin HTTP ni comandos pendientes', async prueba => {
  const {e,abierta,comprobarRed} = await prepararDemo(prueba);
  const detalle = await e.obtenerSalaOnline(abierta.id), aviso = presente(detalle.solicitudes.find(s => s.tipo === 'parte_pagada'));
  await e.enviarAccionSocial('aceptar-demo','/solicitudes/'+aviso.id+'/decidir',{decision:'resuelta'});
  await e.sincronizarSocialOnline();
  const despues = await e.obtenerSalaOnline(abierta.id);
  assert.equal(despues.solicitudes.find(s => s.id === aviso.id)?.estado,'resuelta');
  assert.ok(despues.sala.gastos.find(g => g.id === aviso.gasto_id)?.pagaron.includes(aviso.personaId!));
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM comandos_sociales_locales').get()!.n,0);
  await e.prepararDatosPrueba({vistaSocialOnline:true});
  assert.equal((await e.obtenerSalaOnline(abierta.id)).solicitudes.find(s => s.id === aviso.id)?.estado,'resuelta');
  comprobarRed();
});

test('cerrar una sala demo incorpora la compra elegida una sola vez y conserva deudas pendientes', async prueba => {
  const {e,datos,abierta,comprobarRed} = await prepararDemo(prueba);
  const detalle = await e.obtenerSalaOnline(abierta.id), compra = presente(detalle.misFinanzas?.find(o => o.clave.startsWith('compra:'))), deposito = datos.depositos[0];
  const antes = e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual as number;
  await e.elegirFinanciacionSala(abierta.id,compra,{depositoId:deposito.id});
  await e.cerrarSala(abierta.id); await e.cerrarSala(abierta.id);
  assert.equal((await e.obtenerSalaOnline(abierta.id)).sala.estado,'cerrada');
  assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual,antes-compra.monto);
  assert.ok((await e.cargarSocial()).deudas.some(d => d.salaId===abierta.id && !d.saldada));
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM incorporaciones_sociales_locales WHERE clave=?').get(compra.clave)!.n,1);
  assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(),[]); comprobarRed();
});

test('confirmar un pago demo exige depósito, actualiza deuda y balance de sala sin duplicar el ingreso', async prueba => {
  const {e,datos,comprobarRed} = await prepararDemo(prueba);
  const deuda = presente(datos.deudas.find(d => d.descripcion==='Cena con pago parcial')), deposito = datos.depositos[0];
  const acuerdo = presente((await e.leerDatosOnline<import('../src/social/online/types.ts').DeudaOnline[]>(datos.usuarioId,'deudas',[])).find(d => d.id===deuda.id)), pago = presente(acuerdo.pagos.find(p => p.estado==='informado'));
  const antes = e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual as number;
  await assert.rejects(e.confirmarPagoConDeposito(pago.id,'deposito-inexistente'));
  await e.confirmarPagoConDeposito(pago.id,deposito.id);
  await assert.rejects(e.confirmarPagoConDeposito(pago.id,deposito.id));
  const despues = presente((await e.cargarSocial()).deudas.find(d => d.id===deuda.id));
  assert.equal(despues.pendienteNumero,1500-pago.monto);
  assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual,antes+pago.monto);
  assert.equal((await e.obtenerSalaOnline(deuda.salaId!)).sala.obligaciones?.find(o => o.id===deuda.id)?.pendiente,1250);
  comprobarRed();
});

test('aceptar una propuesta demo e informar un pago conserva el pendiente hasta que lo confirmen', async prueba => {
  const {e,datos,comprobarRed} = await prepararDemo(prueba);
  const deuda = presente(datos.deudas.find(d => d.invitacionOnline)), deposito = datos.depositos[0];
  await e.enviarAccionSocial('aceptar-propuesta','/deudas/'+deuda.id+'/decidir',{decision:'aceptada'});
  const antes = e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual as number;
  await e.informarPagoConDeposito(deuda.id,4400,deposito.id);
  await assert.rejects(e.informarPagoConDeposito(deuda.id,200,deposito.id));
  const despues = presente((await e.leerDatosOnline<import('../src/social/online/types.ts').DeudaOnline[]>(datos.usuarioId,'deudas',[])).find(d => d.id===deuda.id));
  assert.equal(despues.pendiente,4500); assert.equal(despues.pagos[0].estado,'informado');
  assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(deposito.id)!.saldo_actual,antes-4400);
  comprobarRed();
});

test('la vista participante demo puede avisar su pago pero no administrar gastos ni cerrar', async prueba => {
  const {e,datos,comprobarRed} = await prepararDemo(prueba);
  const sala = presente(datos.salas.find(s => !s.administrador)), detalle = await e.obtenerSalaOnline(sala.id);
  const gasto = presente(detalle.sala.gastos.find(g => g.pagadorId!==detalle.personaPropiaId && !g.pagaron.includes(detalle.personaPropiaId)));
  const opcion = presente(detalle.misFinanzas?.find(o => o.gastoId===gasto.id && o.tipo==='egreso'));
  await e.elegirFinanciacionSala(sala.id,opcion,{depositoId:datos.depositos[0].id});
  await e.informarPartePagada(sala.id,gasto.id);
  assert.ok((await e.obtenerSalaOnline(sala.id)).solicitudes.some(s => s.gasto_id===gasto.id && s.estado==='pendiente'));
  await assert.rejects(e.cambiarPermisoGastos(sala.id,detalle.personaPropiaId,true));
  await assert.rejects(e.cerrarSala(sala.id)); comprobarRed();
});

test('crear y editar gastos demo respeta las versiones y el mismo envío no duplica el gasto', async prueba => {
  const {e,abierta,comprobarRed} = await prepararDemo(prueba), detalle = await e.obtenerSalaOnline(abierta.id);
  const datos = {salaId:abierta.id, id:'gasto-demo-nuevo', claveOperacion:'crear-gasto-demo', descripcion:'Merienda de prueba', monto:4000, categoriaId:'alimentacion', pagadorId:'vos', reparto:'iguales' as const, involucradas:detalle.sala.participantes.map(p=>p.id), montosManuales:{}, pagaron:[]};
  await e.guardarGasto(datos); await e.guardarGasto(datos);
  const creado = presente((await e.obtenerSalaOnline(abierta.id)).sala.gastos.find(g=>g.id===datos.id));
  assert.equal((await e.obtenerSalaOnline(abierta.id)).sala.gastos.filter(g=>g.id===datos.id).length,1);
  await e.guardarGasto({...datos, gastoId:creado.id, version:creado.version, claveOperacion:'editar-gasto-demo', monto:6000});
  await assert.rejects(e.guardarGasto({...datos, gastoId:creado.id, version:creado.version, claveOperacion:'editar-version-vieja'}));
  assert.equal((await e.obtenerSalaOnline(abierta.id)).sala.gastos.find(g=>g.id===datos.id)?.monto,6000);
  comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`el detalle demo permite confirmar un pago con su depósito en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),deuda=presente(datos.deudas.find(d=>d.descripcion==='Cena con pago parcial'));
  const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  assert.ok(!vista.texto().includes('Confirmar'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id,pagoId:deuda.id.replace(':deuda',':por-confirmar')});
  await vista.pulsar('Depósito');await vista.pulsar('Efectivo de prueba',true);await vista.pulsar('Confirmar');
  assert.equal((await e.cargarSocial()).deudas.find(d=>d.id===deuda.id)?.pendienteNumero,1250);
  assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&vista.texto(n)==='Confirmar'));
  comprobarRed();
});

for (const tema of ['claro','oscuro'] as const) test(`los botones demo permiten aceptar avisos y configurar el acceso desde la interfaz en ${tema}`, async prueba => {
  const {e,abierta,comprobarRed} = await prepararDemo(prueba), vista = interfazSocial(e,tema);
  await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:abierta.id});
  assert.equal(vista.buscarBoton('Agregar gasto').props.disabled,undefined);
  await vista.pulsar('Compartir sala');
  await vista.llenar('Contraseña de la sala','Demo1234'); await vista.pulsar('Guardar');
  assert.ok((await e.obtenerSalaOnline(abierta.id)).acceso?.codigo);
  await vista.pulsar('Cerrar invitación');
  await vista.pulsar('Sección de sala: Personas'); await vista.pulsar('Solicitudes de Bruno');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,vista.destinos.at(-1)![1] as import('../src/social/types.ts').ParametrosSociales); await vista.pulsar('Aceptar');
  assert.equal((await e.obtenerSalaOnline(abierta.id)).solicitudes.find(s => s.tipo==='parte_pagada')?.estado,'resuelta');
  comprobarRed();
});

test('una autorización revocada y una build release no pueden ejecutar acciones demo', async prueba => {
  const {e,abierta,comprobarRed} = await prepararDemo(prueba);
  const aviso = (await e.obtenerSalaOnline(abierta.id)).solicitudes[0];
  e.base.prepare('UPDATE sync_authorization SET revocada=1').run();
  await assert.rejects(e.enviarAccionSocial('revocada','/solicitudes/'+aviso.id+'/decidir',{decision:'resuelta'}));
  const release = await preparar(prueba,false);
  await assert.rejects(release.enviarAccionSocial('release','/solicitudes/demo-social:ajeno/decidir',{decision:'resuelta'}));
  await assert.rejects(release.simularRespuestaDemo('demo-social:ajeno',{decision:'perdonado',pendienteEsperado:100}));
  comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`la misma deuda demo permite recibir rechazo, aceptación y perdón sin duplicar movimientos en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba);
  const deuda=presente(datos.deudas.find(d=>d.descripcion==='Demo · Compra compartida con Bruno')),deposito=datos.depositos[0];
  const saldo=()=>Number(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo);
  const cantidad=()=>Number(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n);
  const inicial=saldo(),movimientos=cantidad(),vista=interfazSocial(e,tema);
  const comprobarIcono=(etiqueta:string,icono:string,color:string)=>{
    const indicador=presente(vista.todos().find(n=>n.type==='Icon'&&n.props.accessibilityLabel===etiqueta));
    assert.equal(indicador.props.name,icono);assert.equal(indicador.props.color,color);
  };
  const abrirDetalle=()=>vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:deuda.id});
  const cache=async()=>presente((await e.leerDatosOnline<import('../src/social/online/types.ts').DeudaOnline[]>(datos.usuarioId,'deudas',[])).find(d=>d.id===deuda.id));
  await abrirDetalle();assert.ok(vista.texto().includes('Simular respuesta de Bruno'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id});
  await vista.pulsar('Otro importe');await vista.llenar('Monto que pagaste','100');
  await vista.pulsar('Depósito');await vista.pulsar(deposito.nombre,true);await vista.pulsar('Informar pago realizado');
  assert.equal(saldo(),inicial-100);assert.equal((await cache()).pendiente,1000);
  await abrirDetalle();assert.ok(vista.texto().includes('En espera de Bruno'));
  comprobarIcono('Pendiente de confirmación','time-outline',TEMAS[tema].textoSecundario);
  await vista.pulsar('Simular respuesta de Bruno');await vista.pulsar('Rechazar pago de $ 100');
  assert.ok(vista.texto().includes('Rechazado por Bruno'));assert.equal((await cache()).pendiente,1000);
  comprobarIcono('Pago rechazado','close-circle-outline',TEMAS[tema].error);
  assert.equal(saldo(),inicial-100);assert.equal(cantidad(),movimientos+1);
  const rechazo=(await cache()).pagos[0];
  const flecha=presente(vista.todos().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Ver movimiento: Pago · $ 100'));
  await vista.pulsar(String(flecha.props.accessibilityLabel));assert.equal(vista.destinos.at(-1)?.[0],vista.rutas.DETALLE_MOVIMIENTO);
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:deuda.id,pagoId:rechazo.id,operacionClave:'pago:'+rechazo.id});
  assert.ok(vista.texto().includes('Este pago fue rechazado'));
  assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Depósito'));
  await e.registrarPagoConSeleccion(deuda.id,200,{depositoId:deposito.id},false);
  await abrirDetalle();await vista.pulsar('Simular respuesta de Bruno');await vista.pulsar('Aceptar pago de $ 200');
  const aceptado=presente((await cache()).pagos.find(p=>p.monto===200));
  assert.equal(aceptado.estado,'confirmado');assert.equal((await cache()).pendiente,800);
  assert.ok(vista.texto().includes('Confirmado por Bruno'));assert.deepEqual(vista.buscarBoton('Ver importe Pagaste').props.accessibilityValue,{text:'$ 200'});
  comprobarIcono('Pago confirmado','checkmark-circle-outline',TEMAS[tema].exito);
  assert.equal(saldo(),inicial-300);assert.equal(cantidad(),movimientos+2);
  await e.simularRespuestaDemo(deuda.id,{decision:'confirmado',pagoId:aceptado.id,pendienteEsperado:1000});
  assert.equal((await cache()).pendiente,800);assert.equal(saldo(),inicial-300);
  await e.registrarPagoConSeleccion(deuda.id,50,{depositoId:deposito.id},false);
  await abrirDetalle();await vista.pulsar('Simular respuesta de Bruno');await vista.pulsar('Perdonarme $ 800');
  assert.ok(vista.texto().includes('Te perdonaron · $ 800'));assert.equal((await cache()).pendiente,0);
  comprobarIcono('Deuda perdonada','heart-outline',TEMAS[tema].foco);
  comprobarIcono('Origen de la deuda','document-text-outline',TEMAS[tema].textoSecundario);
  assert.equal((await cache()).pagos.find(p=>p.monto===50)?.estado,'rechazado');
  assert.equal(saldo(),inicial-350);assert.equal(cantidad(),movimientos+3);
  assert.deepEqual(vista.buscarBoton('Ver importe Pagaste').props.accessibilityValue,{text:'$ 200'});
  assert.ok(!vista.texto().includes('Simular respuesta de Bruno'));
  assert.equal((await e.cargarSocial()).salas.find(s=>s.id===deuda.salaId)?.porPagar,'$ 2.000');
  await e.prepararDatosPrueba({vistaSocialOnline:true});await vista.asentar();
  assert.equal((await cache()).pagos.length,3);assert.equal((await cache()).perdon?.monto,800);
  assert.equal(saldo(),inicial-350);comprobarRed();
});

test('las respuestas demo respetan rol, decisiones previas y autorización local',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba);
  const deuda=presente(datos.deudas.find(d=>d.descripcion==='Demo · Compra compartida con Bruno'));
  const acreedor=presente(datos.deudas.find(d=>d.descripcion==='Demo · Pagos y perdón'));
  await assert.rejects(e.simularRespuestaDemo(acreedor.id,{decision:'perdonado',pendienteEsperado:800}));
  await assert.rejects(e.simularRespuestaDemo(deuda.id,{decision:'perdonado',pendienteEsperado:900}));
  await e.registrarPagoConSeleccion(deuda.id,100,{depositoId:datos.depositos[0].id},false);
  const pago=presente((await e.leerDatosOnline<import('../src/social/online/types.ts').DeudaOnline[]>(datos.usuarioId,'deudas',[])).find(d=>d.id===deuda.id)).pagos[0];
  await Promise.all([e.simularRespuestaDemo(deuda.id,{decision:'confirmado',pagoId:pago.id,pendienteEsperado:1000}),e.simularRespuestaDemo(deuda.id,{decision:'confirmado',pagoId:pago.id,pendienteEsperado:1000})]);
  assert.equal((await e.cargarSocial()).deudas.find(d=>d.id===deuda.id)?.pendienteNumero,900);
  await assert.rejects(e.simularRespuestaDemo(deuda.id,{decision:'rechazado',pagoId:pago.id,pendienteEsperado:900}));
  e.base.prepare('UPDATE sync_authorization SET revocada=1').run();
  await assert.rejects(e.simularRespuestaDemo(deuda.id,{decision:'perdonado',pendienteEsperado:900}));comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`crear, compartir y admitir un invitado demo funciona sin servidor en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),vista=interfazSocial(e,tema);
  const saldo=e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo;
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'crear'});
  await vista.llenar('Nombre de la ocasión','Sala creada sin Internet');await vista.pulsar('Compartir online');
  await vista.llenar('Contraseña de la sala','Demo1234');await vista.pulsar('Crear y compartir sala');
  const sala=presente((await e.cargarSocial()).salas.find(s=>s.nombre==='Sala creada sin Internet'));
  assert.equal(sala.online,true);assert.equal(sala.demo,true);assert.equal(sala.administrador,true);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM salas WHERE id=?').get(sala.id)!.n,1);
  assert.equal((await e.cargarSocial()).salas.filter(s=>s.nombre==='Sala creada sin Internet').length,1);
  await e.publicarSalaOnline(sala.id);
  const acceso=presente((await e.obtenerSalaOnline(sala.id)).acceso);
  await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});await vista.pulsar('Compartir sala');
  await vista.pulsar('Copiar enlace de invitación');assert.ok(vista.copias.at(-1)?.includes(acceso.codigo));
  await vista.pulsar('Cerrar invitación');await vista.pulsar('Sección de sala: Personas');
  await vista.pulsar('Simular ingreso de un invitado');await vista.llenar('Nombre del invitado','Marina');await vista.pulsar('Enviar solicitud de ingreso demo');
  assert.ok(!vista.texto().includes('Elegir ficha'));await vista.pulsar('Revisar ingreso de Marina');
  await vista.pulsar('Identidad del invitado: Crear persona');await vista.llenar('Apellido','Pérez');await vista.llenar('Apodo','Mari');await vista.pulsar('Admitir');
  const detalle=await e.obtenerSalaOnline(sala.id);assert.equal(detalle.admisiones?.at(-1)?.estado,'aceptada');
  const marina=presente((await e.cargarSocial()).personas.find(p=>p.nombre==='Marina'));
  assert.ok(detalle.sala.participantes.some(p=>p.id===marina.id&&p.activa));
  await vista.pulsar('Personas de la sala: Integrantes');assert.ok(vista.texto().includes('Marina Pérez'));
  await vista.pulsar('Agregar personas a la sala');await vista.pulsar('Seleccionar a Ana García');await vista.pulsar('Agregar seleccionadas');
  assert.ok((await e.obtenerSalaOnline(sala.id)).sala.participantes.some(p=>p.nombre==='Ana'&&p.activa));
  await e.configurarAccesoSala(sala.id,'');assert.equal((await e.obtenerSalaOnline(sala.id)).acceso?.codigo,acceso.codigo);
  await assert.rejects(e.solicitarIngresoSala(acceso.codigo,'Prueba','incorrecta'));
  assert.equal((await e.solicitarIngresoSala(acceso.codigo,'Prueba','Demo1234')).estado,'aceptada');
  await e.configurarAccesoSala(sala.id,'',{renovar:true});assert.notEqual((await e.obtenerSalaOnline(sala.id)).acceso?.codigo,acceso.codigo);
  await assert.rejects(e.solicitarIngresoSala(acceso.codigo,'Prueba','Demo1234'));
  await e.cerrarSala(sala.id);assert.equal((await e.obtenerSalaOnline(sala.id)).sala.estado,'cerrada');
  assert.equal(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo,saldo);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM comandos_sociales_locales').get()!.n,0);comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`unirse a la sala demo como participante y recibir respuestas mantiene permisos y dinero en ${tema}`,async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),vista=interfazSocial(e,tema);
  await vista.abrir();await vista.pulsar('Salas');await vista.pulsar('Unirme a sala',true);
  await vista.pulsar('Usar sala demo como participante');await vista.pulsar('Solicitar ingreso');
  const destino=presente(vista.destinos.at(-1));assert.equal(destino[0],vista.rutas.SALA_SOCIAL);
  const salaId=(destino[1] as {salaId:string}).salaId,detalle=await e.obtenerSalaOnline(salaId);
  assert.equal(detalle.administrador,false);
  const saldo=e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo;
  const gasto=presente(detalle.sala.gastos.find(g=>g.pagadorId!==detalle.personaPropiaId&&g.partes.some(p=>p.personaId===detalle.personaPropiaId)));
  await vista.abrir(vista.rutas.GASTO_SOCIAL,{salaId,gastoId:gasto.id});await vista.pulsar('Ya pagué mi parte');
  await vista.pulsar('Depósito');await vista.pulsar(datos.depositos[0].nombre,true);await vista.pulsar('Guardar');
  assert.ok((await e.obtenerSalaOnline(salaId)).solicitudes.some(s=>s.tipo==='parte_pagada'&&s.estado==='pendiente'));
  await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId});await vista.pulsar('Sección de sala: Personas');
  assert.ok(!vista.texto().includes('Compartir sala'));assert.ok(!vista.texto().includes('Ingresos'));assert.ok(!vista.texto().includes('Cerrar sala'));
  await vista.pulsar('Solicitudes de Vos');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,vista.destinos.at(-1)![1] as import('../src/social/types.ts').ParametrosSociales);await vista.pulsar('Simular rechazo');assert.ok(vista.texto().includes('Rechazada'));
  await vista.llenar('Solicitud de cambio','Revisar mi pago');await vista.pulsar('Enviar solicitud');await vista.pulsar('Simular aceptación');assert.ok(vista.texto().includes('Aceptada'));
  assert.ok(!vista.texto().includes('Volver a integrantes'));(vista.todos().find(n=>n.type==='Header')!.props.alVolver as ()=>void)();await vista.asentar();await vista.abrir(vista.rutas.SALA_SOCIAL,vista.destinos.findLast(d=>(d[1] as {tipo?:string}|undefined)?.tipo==='personaSala')![1] as import('../src/social/types.ts').ParametrosSociales);await vista.pulsar('Sección de sala: Personas');await vista.pulsar('Simular permiso para editar gastos');assert.ok(vista.texto().includes('Agregar gasto'));
  await vista.pulsar('Simular retiro del permiso de gastos');assert.ok(!vista.texto().includes('Agregar gasto'));
  await assert.rejects(e.simularIngresoDemo(salaId,'Ajeno'));
  await assert.rejects(e.cambiarPersonasSala(salaId,[]));await assert.rejects(e.configurarAccesoSala(salaId,'Demo1234'));
  assert.equal(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo,saldo);comprobarRed();
});

test('las vistas de sala comparten la lectura y recuperan un evento recibido mientras cargaban',async prueba=>{
  const {e,abierta,comprobarRed}=await prepararDemo(prueba);
  let liberar:()=>void=()=>{},consultas=0;
  const espera=new Promise<void>(resolver=>{liberar=resolver;});
  const obtener:typeof e.obtenerSalaOnline=async id=>{const detalle=await e.obtenerSalaOnline(id);consultas++;if(consultas===1)await espera;return detalle;};
  const vista=interfazSocial({...e,obtenerSalaOnline:obtener},'claro');
  await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:abierta.id});assert.equal(consultas,1);
  await e.configurarAccesoSala(abierta.id,'Demo1234');
  liberar();await vista.asentar();assert.equal(consultas,2);
  await vista.pulsar('Compartir sala');assert.ok(vista.texto().includes('Enlace de invitación'));
  assert.ok(!vista.todos().some(n=>n.type==='TextInput'&&n.props.accessibilityLabel==='Contraseña de la sala'));comprobarRed();
});

test('publicar una sala local demo conserva gastos y depósitos preparados sin duplicar el cierre',async prueba=>{
  const {e,datos,comprobarRed}=await prepararDemo(prueba),sala=presente(datos.salas.find(s=>!s.online));
  const saldo=Number(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo);
  const cantidad=Number(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n);
  await e.publicarSalaOnline(sala.id);await e.publicarSalaOnline(sala.id);
  const detalle=await e.obtenerSalaOnline(sala.id);
  assert.equal(detalle.sala.gastos.length,sala.gastos.length);
  assert.deepEqual(detalle.sala.gastos.map(g=>[g.id,g.monto,g.version]).sort(),sala.gastos.map(g=>[g.id,g.montoNumero,g.version]).sort());
  assert.ok(detalle.misFinanzas?.some(o=>o.seleccion?.depositoId));
  const despues=await e.cargarSocial();assert.equal(despues.salas.filter(s=>s.id===sala.id).length,1);
  assert.equal(despues.salas.length,datos.salas.length);assert.equal(despues.salas.find(s=>s.id===sala.id)?.porCobrar,sala.porCobrar);
  assert.equal(Number(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo),saldo);
  await e.cerrarSala(sala.id);const cerrado=Number(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo);
  assert.notEqual(cerrado,saldo);const movimientos=Number(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n);assert.ok(movimientos>cantidad);
  await e.cerrarSala(sala.id);assert.equal(Number(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo),cerrado);
  assert.equal(Number(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n),movimientos);comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`el gasto integra checks, tarjetas individuales y acceso con interruptor en ${tema}`,async prueba=>{
  const {e,abierta,comprobarRed}=await prepararDemo(prueba),detalle=await e.obtenerSalaOnline(abierta.id),gasto=detalle.sala.gastos[0],vista=interfazSocial(e,tema);
  await vista.abrir(vista.rutas.GASTO_SOCIAL,{salaId:abierta.id,gastoId:gasto.id});
  assert.equal(vista.todos().filter(n=>n.type==='Text'&&vista.texto(n)==='Partes y pagos').length,1);
  assert.ok(!vista.texto().includes('Partes pagadas'));
  const contenedor=presente(vista.todos().find(n=>n.type==='View'&&vista.todos(n).some(h=>h.type==='Text'&&vista.texto(h)==='Partes y pagos')&&vista.todos(n).some(h=>h.props.accessibilityRole==='checkbox')&&!vista.todos(n).some(h=>h.type==='Text'&&vista.texto(h)==='Mis movimientos')));
  assert.ok(contenedor);
  const compra=presente(vista.todos().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Compra: '+gasto.descripcion));
  assert.ok(Array.isArray(compra.props.style));
  assert.ok(vista.todos().some(n=>n.type==='Icon'&&n.props.name==='restaurant-outline'));
  await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:abierta.id});await vista.pulsar('Compartir sala');await vista.llenar('Contraseña de la sala','Demo1234');await vista.pulsar('Guardar');
  await vista.pulsar('Opciones de acceso');assert.equal(vista.buscarBoton('Permitir ingresos').props.accessibilityRole,'switch');
  await vista.pulsar('Permitir ingresos');assert.equal((await e.obtenerSalaOnline(abierta.id)).acceso?.habilitado,0);
  await vista.pulsar('Permitir ingresos');assert.equal((await e.obtenerSalaOnline(abierta.id)).acceso?.habilitado,1);
  await vista.pulsar('Cerrar invitación');await vista.pulsar('Sección de sala: Personas');await vista.pulsar('Solicitudes de Bruno');await vista.abrir(vista.rutas.REGISTRO_SOCIAL,vista.destinos.at(-1)![1] as import('../src/social/types.ts').ParametrosSociales);
  assert.ok(vista.texto().includes('Historial de solicitudes'));assert.ok(!vista.todos().some(n=>n.type==='Modal'));
  assert.ok(!vista.texto().includes('Volver a integrantes'));(vista.todos().find(n=>n.type==='Header')!.props.alVolver as ()=>void)();await vista.asentar();await vista.abrir(vista.rutas.SALA_SOCIAL,vista.destinos.findLast(d=>(d[1] as {tipo?:string}|undefined)?.tipo==='personaSala')![1] as import('../src/social/types.ts').ParametrosSociales);await vista.pulsar('Sección de sala: Personas');assert.ok(!vista.texto().includes('Historial de solicitudes'));comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test(`cada integrante abre una pantalla propia con estados y bordes en ${tema}`,async prueba=>{
  const {e,abierta,comprobarRed}=await prepararDemo(prueba),detalle=await e.obtenerSalaOnline(abierta.id),vista=interfazSocial(e,tema);
  const bruno=presente(detalle.sala.participantes.find(p=>p.nombre.startsWith('Bruno'))),carla=presente(detalle.sala.participantes.find(p=>p.nombre.startsWith('Carla')));
  await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:abierta.id});await vista.pulsar('Sección de sala: Personas');
  await vista.pulsar('Solicitudes de '+bruno.nombre);
  const destino=presente(vista.destinos.at(-1));assert.equal((destino[1] as {tipo:string}).tipo,'personaSala');
  assert.ok(!vista.texto().includes('Historial de solicitudes'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,destino[1] as import('../src/social/types.ts').ParametrosSociales);
  assert.ok(vista.texto().includes('Historial de solicitudes'));assert.ok(!vista.texto().includes('Tu balance en esta sala'));
  assert.ok(vista.todos().some(n=>n.type==='Icon'&&n.props.name==='time-outline'));
  await vista.pulsar('Rechazar');assert.ok(vista.todos().some(n=>n.type==='Icon'&&n.props.name==='close-circle-outline'));
  await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'personaSala',salaId:abierta.id,personaId:carla.id});
  assert.ok(vista.todos().some(n=>n.type==='Icon'&&n.props.name==='checkmark-circle-outline'));
  assert.ok(!vista.texto().includes('Ya pagué mi parte'));
  const tarjeta=presente(vista.todos().find(n=>n.type==='View'&&n.props.style&&typeof n.props.style==='object'&&!Array.isArray(n.props.style)&&(n.props.style as {borderWidth?:number}).borderWidth===1&&vista.texto(n).includes('Corregir la descripción')));
  assert.ok(tarjeta);comprobarRed();
});

for (const tema of ['claro', 'oscuro'] as const) test('indicadores de sala y gasto se reducen al incorporar offline en '+tema, async prueba => {
  const {e, datos, comprobarRed} = await prepararDemo(prueba);
  await e.sincronizarSocialOnline();
  const sala = presente((await e.cargarSocial()).salas.find(s => s.nombre === 'Demo · Cena cerrada'));
  const operaciones = (await e.leerDatosOnline<import('../src/social/online/types.ts').OperacionPersonal[]>(datos.usuarioId,'operaciones',[])).filter(o => o.salaId === sala.id && o.gastoId && !o.incorporada);
  assert.ok(operaciones.length > 1);
  const vista = interfazSocial(e, tema);
  await vista.abrir(vista.rutas.SALA_SOCIAL, {salaId:sala.id});
  await vista.pulsar('Sección de sala: Gastos');
  const gasto = presente(sala.gastos.find(g => g.id === operaciones[0].gastoId));
  const card = () => vista.buscarBoton('Ver gasto '+gasto.descripcion);
  const pendientesGasto = () => vista.todos(card()).filter(n => String(n.props.accessibilityLabel || '').endsWith('movimientos por registrar'));
  assert.equal(pendientesGasto().length, 0);
  assert.ok(card().props.accessibilityValue);
  assert.ok(vista.texto(card()).includes(operaciones.filter(o=>o.gastoId===gasto.id).length+' por registrar'));
  const totalGastos = sala.movimientosPorRegistrar;
  assert.ok(vista.texto(vista.buscarBoton('Sección de sala: Gastos')).includes('Gastos · '+totalGastos));
  for (const op of operaciones) { await e.incorporarOperacionPersonal(op,{depositoId:datos.depositos[0].id}); await vista.asentar(); }
  assert.ok(!vista.texto(card()).includes('por registrar'));
  assert.ok(vista.texto(card()).includes('Importe'));
  const restantes = sala.movimientosPorRegistrar - operaciones.length;
  assert.equal(vista.texto(vista.buscarBoton('Sección de sala: Gastos')), restantes ? 'Gastos · '+restantes : 'Gastos');
  assert.equal(pendientesGasto().length, 0);
  assert.equal(presente((await e.cargarSocial()).salas.find(s => s.id === sala.id)).movimientosPorRegistrar, sala.movimientosPorRegistrar - operaciones.length);
  comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test('sala abierta cuenta selecciones pendientes sin registrar dinero en '+tema,async prueba=>{
 const {e,datos,abierta,comprobarRed}=await prepararDemo(prueba);await e.sincronizarSocialOnline();
 const antes=presente((await e.cargarSocial()).salas.find(s=>s.id===abierta.id));assert.ok(antes.movimientosPorRegistrar>0);
 const detalle=await e.obtenerSalaOnline(abierta.id),op=presente(detalle.misFinanzas?.find(o=>!o.seleccion&&o.tipo==='ingreso'));
 const saldo=e.base.prepare('SELECT SUM(saldo_actual) n FROM depositos').get()!.n;
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:abierta.id});
 assert.ok(vista.texto().includes('movimientos por registrar'));assert.ok(vista.texto().includes('se aplicará al cerrar'));
 await e.elegirFinanciacionSala(abierta.id,op,{depositoId:datos.depositos[0].id});await vista.asentar();
 assert.equal(presente((await e.cargarSocial()).salas.find(s=>s.id===abierta.id)).movimientosPorRegistrar,antes.movimientosPorRegistrar-1);
 assert.equal(e.base.prepare('SELECT SUM(saldo_actual) n FROM depositos').get()!.n,saldo);comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test('los pagos pendientes de quien debe se ven y abren el registro desde la sala en '+tema,async prueba=>{
 const {e,datos,comprobarRed}=await prepararDemo(prueba);await e.sincronizarSocialOnline();
 const op=presente((await e.leerDatosOnline<import('../src/social/online/types.ts').OperacionPersonal[]>(datos.usuarioId,'operaciones',[])).find(o=>o.deudaId&&o.salaId?.includes(':recibidos:')&&!o.gastoId&&!o.incorporada));
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:op.salaId!});await vista.pulsar('Sección de sala: Gastos');
 assert.ok(vista.texto().includes('Pagos por registrar'));assert.ok(vista.buscarBoton('Registrar '+op.descripcion));
 await vista.pulsar('Registrar '+op.descripcion);
 const destino=presente(vista.destinos.at(-1));assert.equal(destino[0],vista.rutas.REGISTRO_SOCIAL);
 const parametros=destino[1] as import('../src/social/types.ts').ParametrosSociales;assert.equal(parametros.operacionClave,op.clave);
 await vista.abrir(vista.rutas.REGISTRO_SOCIAL,parametros);assert.ok(vista.texto().toLowerCase().includes('depósito'),vista.texto());comprobarRed();
});

for(const tema of ['claro','oscuro'] as const)test('el listado y el detalle coinciden en pendientes demo desde la primera entrada offline en '+tema,async prueba=>{
 const {e,abierta,comprobarRed}=await prepararDemo(prueba);
 const detalle=await e.obtenerSalaOnline(abierta.id);
 const pendientes=(detalle.misFinanzas||[]).filter(o=>!o.seleccion&&!o.incorporada&&(o.clave.startsWith('compra:')||o.tipo==='ingreso'||detalle.sala.gastos.find(g=>g.id===o.gastoId)?.pagaron.includes(detalle.personaPropiaId)));
 assert.equal(pendientes.length,2);
 const sala=presente((await e.cargarSocial()).salas.find(s=>s.id===abierta.id));assert.equal(sala.movimientosPorRegistrar,pendientes.length);
 const vista=interfazSocial(e,tema);await vista.abrir();
 assert.ok(vista.todos(vista.buscarBoton('Abrir '+sala.nombre)).some(n=>n.props.accessibilityLabel===pendientes.length+' movimientos por registrar'));
 comprobarRed();
});
