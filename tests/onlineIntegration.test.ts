import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {randomBytes,randomUUID} from 'node:crypto';
import {join} from 'node:path';
import type {Server} from 'node:http';
import {preparar} from './helpers/localDatabase.ts';
import type {DeudaOnline,OperacionPersonal,VinculoOnline} from '../src/social/online/types.ts';

const origen=process.env.AHRE_SERVER_SOURCE,disponible=!!origen&&process.env.AHRE_MYSQL_TEST==='1';

test('publicar conserva depósitos y movimientos preparados de la sala local, incluso con respuesta perdida',{skip:!disponible},async t=>{
  const e=await escenario(t,false),gastoId=randomUUID(),adjuntoId=randomUUID();
  const movimiento=await e.juan.movimientosRepositorio.crear({deposito_id:e.juan.deposito.id,tipo:'egreso',categoria:'transporte',monto:80,descripcion:'Taxi ya registrado',fecha_hora:new Date().toISOString()});
  for(const [id,monto,categoria,seleccion] of [[gastoId,'120','alimentacion',{depositoId:e.juan.deposito.id}],[adjuntoId,'80','transporte',{movimientoId:movimiento.id}]] as const){
    await e.juan.guardarGasto({id,claveOperacion:id,salaId:e.sala.id,descripcion:'Compra preparada '+id,monto,categoriaId:categoria,pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]},{compra:seleccion});
  }
  e.juan.perderRespuesta('/salas/publicar');await assert.rejects(e.juan.publicarSalaOnline(e.sala.id));
  await e.juan.publicarSalaOnline(e.sala.id);
  const detalle=await e.juan.obtenerSalaOnline(e.sala.id);
  assert.equal(detalle.misFinanzas?.find(o=>o.clave==='compra:'+gastoId)?.seleccion?.depositoId,e.juan.deposito.id);
  assert.equal(detalle.misFinanzas?.find(o=>o.clave==='compra:'+adjuntoId)?.seleccion?.movimientoId,movimiento.id);
  assert.equal((await e.db.get('SELECT COUNT(*) n FROM selecciones_financieras_sala'))!.n,2);
  await e.juan.cerrarSala(e.sala.id);await e.juan.sincronizarSocialOnline();await new Promise<void>(r=>setImmediate(r));await e.juan.sincronizarSocialOnline();
  assert.equal((await e.juan.depositosRepositorio.consultarPorId(e.juan.deposito.id))!.saldo_actual,800);
  assert.equal((await e.db.get('SELECT COUNT(*) n FROM incorporaciones_online'))!.n,2);
});

test('dos participantes pueden informar su parte y aceptar un aviso no invalida el otro',{skip:!disponible},async t=>{
  const e=await escenario(t),ana=await e.cliente('Ana'),personaAna=(await e.juan.guardarPersona({nombre:'Ana',apellido:'Prueba',apodo:'Ana'}))!;
  await e.juan.cambiarPersonasSala(e.sala.id,[e.persona.id,personaAna.id]);await e.juan.sincronizarSocialOnline();
  const {enlace}=await e.juan.invitarPersonaOnline(e.sala.id,personaAna.id);await ana.aceptarInvitacionOnline(new URL(enlace).hash.slice(1));
  const id=randomUUID();await e.juan.guardarGasto({id,claveOperacion:id,salaId:e.sala.id,descripcion:'Cena de tres',monto:'120',categoriaId:'alimentacion',pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id,personaAna.id],pagaron:[]});await e.juan.sincronizarSocialOnline();
  for(const cliente of [e.sofi,ana])await cliente.solicitarSocial('/salas/'+e.sala.id+'/solicitudes',{idOperacion:randomUUID(),solicitudId:randomUUID(),tipo:'parte_pagada',gastoId:id});
  const avisos=(await e.juan.recuperarSalaOnline(e.sala.id)).solicitudes.filter(s=>s.gasto_id===id);
  assert.equal(avisos.length,2);
  for(const aviso of avisos){const entrada={idOperacion:randomUUID(),decision:'resuelta'};await e.juan.solicitarSocial('/solicitudes/'+aviso.id+'/decidir',entrada);await e.juan.solicitarSocial('/solicitudes/'+aviso.id+'/decidir',entrada);}
  const gasto=(await e.juan.recuperarSalaOnline(e.sala.id)).sala.gastos.find(g=>g.id===id)!;
  assert.ok(gasto.pagaron.includes(e.persona.id));assert.ok(gasto.pagaron.includes(personaAna.id));
});

test('un aviso no autoriza aceptar otro pagador aunque conserve el importe de la parte',{skip:!disponible},async t=>{
  const e=await escenario(t),id=randomUUID(),aviso=randomUUID();
  const datos={id,claveOperacion:id,salaId:e.sala.id,descripcion:'Compra',monto:'120',categoriaId:'alimentacion',pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]} as const;
  await e.juan.guardarGasto({...datos,involucradas:[...datos.involucradas],pagaron:[]});await e.juan.sincronizarSocialOnline();
  await e.sofi.solicitarSocial('/salas/'+e.sala.id+'/solicitudes',{idOperacion:randomUUID(),solicitudId:aviso,tipo:'parte_pagada',gastoId:id});
  const gasto=(await e.juan.obtenerSalaOnline(e.sala.id)).sala.gastos.find(g=>g.id===id)!;
  await e.juan.guardarGasto({...datos,involucradas:[...datos.involucradas],pagaron:[],gastoId:id,version:gasto.version,pagadorId:e.persona.id,claveOperacion:randomUUID()});await e.juan.sincronizarSocialOnline();
  await assert.rejects(e.juan.solicitarSocial('/solicitudes/'+aviso+'/decidir',{idOperacion:randomUUID(),decision:'resuelta'}),/gasto cambió/i);
  assert.equal((await e.db.get('SELECT estado FROM solicitudes_online WHERE id=?',[aviso]))!.estado,'pendiente');
});

test('las propuestas cruzadas no aceptan dos acuerdos para la misma deuda privada',{skip:!disponible},async t=>{
  const e=await escenario(t),personaJuan=(await e.sofi.guardarPersona({nombre:'Juan',apellido:'Prueba',apodo:'Juan'}))!;
  await e.sofi.solicitarVinculoOnline(personaJuan.id,e.juan.correo);await e.juan.sincronizarSocialOnline();
  const vinculos=await e.juan.leerDatosOnline<VinculoOnline[]>(e.juan.usuario.id,'vinculos',[]);
  await e.juan.responderVinculoOnline(vinculos.find(v=>v.direccion==='recibida')!.id,'aceptado');
  const a=await e.juan.crearDeudaPersonal({personaId:e.persona.id,direccion:'me_deben',monto:'100',descripcion:'Préstamo'},{depositoId:e.juan.deposito.id});
  const b=await e.sofi.crearDeudaPersonal({personaId:personaJuan.id,direccion:'debo',monto:'100',descripcion:'Préstamo'});
  await e.juan.proponerDeudaOnline(a.id);await e.sofi.proponerDeudaOnline(b.id);
  await e.sofi.solicitarSocial('/deudas/deuda:'+a.id+'/decidir',{idOperacion:randomUUID(),decision:'aceptada',deudaLocalId:b.id});
  await assert.rejects(e.juan.solicitarSocial('/deudas/deuda:'+b.id+'/decidir',{idOperacion:randomUUID(),decision:'aceptada'}),/otro acuerdo/i);
  assert.equal((await e.db.get("SELECT COUNT(*) n FROM deudas_online WHERE sala_id IS NULL AND estado='aceptada'"))!.n,1);
  assert.equal((await e.db.get('SELECT deuda_online_id FROM origenes_deudas_online WHERE usuario_id=? AND deuda_local_id=?',[e.sofi.usuario.id,b.id]))!.deuda_online_id,'deuda:'+a.id);
  await e.juan.solicitarSocial('/deudas/deuda:'+b.id+'/decidir',{idOperacion:randomUUID(),decision:'rechazada'});
  assert.equal((await e.db.get('SELECT estado FROM deudas WHERE id=?',[b.id]))!.estado,'pendiente');
});

test('una publicación con una selección ajena se revierte completa y permite corregir el envío',{skip:!disponible},async t=>{
  const e=await escenario(t,false),id=randomUUID(),propia=String(e.juan.base.prepare('SELECT id FROM personas WHERE usuario_id=? AND es_usuario_actual=1').get(e.juan.usuario.id)!.id);
  const gastos=['g1','g2'].map(id=>({id,pagadorId:propia,categoriaId:'alimentacion',descripcion:'Compra',monto:120,fecha:new Date().toISOString(),version:1,reparto:'iguales',estado:'vigente',partes:[{personaId:propia,monto:120}],pagaron:[]}));
  const entrada={idOperacion:randomUUID(),personaPropiaId:propia,sala:{id,nombre:'Sala con asociaciones',descripcion:'',icono:'people-outline',color:'#BED5C8',fecha:new Date().toISOString().slice(0,10),participantes:[{id:propia,nombre:'Juan',activa:true}],gastos},financiaciones:[{clave:'compra:g1',depositoId:e.juan.deposito.id},{clave:'compra:g2',depositoId:e.sofi.deposito.id}]};
  await assert.rejects(e.juan.solicitarSocial('/salas/publicar',entrada),/propio activo/i);
  assert.equal(await e.db.get('SELECT id FROM salas_online WHERE id=?',[id]),undefined);
  assert.equal((await e.db.get('SELECT COUNT(*) n FROM selecciones_financieras_sala WHERE sala_id=?',[id]))!.n,0);
  entrada.financiaciones[1].depositoId=e.juan.deposito.id;
  await e.juan.solicitarSocial('/salas/publicar',entrada);
  assert.equal((await e.db.get('SELECT COUNT(*) n FROM selecciones_financieras_sala WHERE sala_id=?',[id]))!.n,2);
});

test('la ampliación social agrega la huella sin borrar avisos anteriores y conserva su validación por versión',{skip:!disponible},async t=>{
  const e=await escenario(t),id=randomUUID(),aviso=randomUUID();
  await e.juan.guardarGasto({id,claveOperacion:id,salaId:e.sala.id,descripcion:'Compra anterior',monto:'120',categoriaId:'alimentacion',pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]});await e.juan.sincronizarSocialOnline();
  await e.sofi.solicitarSocial('/salas/'+e.sala.id+'/solicitudes',{idOperacion:randomUUID(),solicitudId:aviso,tipo:'parte_pagada',gastoId:id});
  await e.db.run('ALTER TABLE solicitudes_online DROP COLUMN huella_gasto');
  const {prepararSocialOnline}=e.cargar('./dist/social/schema.js') as {prepararSocialOnline:(base:unknown)=>Promise<void>};
  await prepararSocialOnline(e.db);await prepararSocialOnline(e.db);
  assert.equal((await e.db.get('SELECT huella_gasto FROM solicitudes_online WHERE id=?',[aviso]))!.huella_gasto,null);
  await e.juan.solicitarSocial('/solicitudes/'+aviso+'/decidir',{idOperacion:randomUUID(),decision:'resuelta'});
  assert.equal((await e.db.get('SELECT estado FROM solicitudes_online WHERE id=?',[aviso]))!.estado,'resuelta');
});
async function escenario(t:import('node:test').TestContext,compartirSala=true){
  const cargar=createRequire(join(origen!,'backend/package.json'));
  const mysql=cargar('mysql2/promise') as {createConnection:(config:object)=>Promise<{query:(sql:string)=>Promise<unknown>;end:()=>Promise<void>}>};
  const {prepararAplicacion}=cargar('./dist/app.js') as {prepararAplicacion:(config:object)=>Promise<{app:unknown;db:{get:(sql:string,p?:unknown[])=>Promise<Record<string,string|number|null>|undefined>;run:(sql:string,p?:unknown[])=>Promise<unknown>;close:()=>Promise<void>}}>};
  const {crearServidorSocial}=cargar('./dist/social/realtime.js') as {crearServidorSocial:(app:unknown,db:unknown)=>Server};
  const configuracion={host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT)||3306,user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||''};
  const admin=await mysql.createConnection(configuracion),nombre='ahre_test_'+randomUUID().replaceAll('-','');await admin.query('CREATE DATABASE '+nombre);
  t.after(async()=>{assert.match(nombre,/^ahre_test_[a-f0-9]{32}$/);await admin.query('DROP DATABASE '+nombre);await admin.end();});
  const {app,db}=await prepararAplicacion({...configuracion,database:nombre}),servidor=crearServidorSocial(app,db);servidor.listen(0,'127.0.0.1');
  await new Promise<void>(resolver=>servidor.once('listening',resolver));const direccion=servidor.address();assert.ok(direccion&&typeof direccion!=='string');const url='http://127.0.0.1:'+direccion.port+'/api/v1';
  t.after(async()=>{(servidor as Server&{cerrarSocial:()=>void}).cerrarSocial();servidor.closeAllConnections();await new Promise<void>(resolver=>servidor.close(()=>resolver()));await db.close();});
  async function cliente(nombre:string){
    let offline=false,perder='';const transporte:typeof fetch=async(...args)=>{if(offline)throw new Error('sin conexión');const respuesta=await fetch(...args);if(perder&&String(args[0]).includes(perder)&&respuesta.ok){perder='';throw new Error('respuesta perdida');}return respuesta;};
    const e=await preparar(t,true,{url,fetch:transporte}),correo=randomUUID()+'@example.test';
    const usuario=await e.registrarUsuario({nombre,correo,contrasena:'ClaveOnline123!',confirmacion:'ClaveOnline123!'});await e.crearSesion(usuario.id,false);
    const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Depósito '+nombre,tipo:'efectivo',saldo_inicial:1000,icono:'cash-outline',fecha_creacion:'2020-01-01T00:00:00.000Z'});
    await e.cargarSocial();await e.sincronizarCuenta(usuario.id);
    return {...e,usuario,correo,deposito,conectar:()=>{offline=false;},desconectar:()=>{offline=true;},perderRespuesta:(ruta:string)=>{perder=ruta;}};
  }
  const juan=await cliente('Juan'),sofi=await cliente('Sofi');
  const persona=(await juan.guardarPersona({nombre:'Sofi',apellido:'Prueba',apodo:'Sofi'}))!;
  const sala=await juan.crearSala({nombre:'Sala online',fecha:'2026-11-06',icono:'people-outline',color:'#BED5C8',personasIds:[persona.id]});
  await juan.guardarGasto({id:'comida',claveOperacion:'comida',salaId:sala.id,descripcion:'Almuerzo',monto:'120',categoriaId:'alimentacion',pagadorId:persona.id,reparto:'iguales',involucradas:['vos',persona.id],pagaron:[]});
  if(compartirSala){
    await juan.publicarSalaOnline(sala.id);
    const {enlace}=await juan.invitarPersonaOnline(sala.id,persona.id),token=new URL(enlace).hash.slice(1);await sofi.aceptarInvitacionOnline(token);
    await juan.sincronizarSocialOnline();const vinculos=(await juan.solicitarSocial<{vinculos:{id:string}[]}>('/vinculos')).vinculos;
    await juan.solicitarSocial('/vinculos/'+vinculos[0].id+'/decidir',{idOperacion:randomUUID(),decision:'confirmado'});
  }
  return {juan,sofi,persona,sala,db,url,cargar,cliente,servidor,app};
}

test('online: vínculo por correo sin sala, deuda reconocida y pagos con depósitos conservan idempotencia ante respuestas perdidas',{skip:!disponible},async t=>{
  const e=await escenario(t,false);
  e.juan.perderRespuesta('/vinculos/solicitar');
  await assert.rejects(e.juan.solicitarVinculoOnline(e.persona.id,e.sofi.correo));
  await e.juan.solicitarVinculoOnline(e.persona.id,e.sofi.correo);
  await e.sofi.sincronizarSocialOnline();
  const recibidas=await e.sofi.leerDatosOnline<VinculoOnline[]>(e.sofi.usuario.id,'vinculos',[]);
  assert.equal(recibidas.length,1);assert.equal(recibidas[0].direccion,'recibida');
  e.sofi.perderRespuesta('/responder');await assert.rejects(e.sofi.responderVinculoOnline(recibidas[0].id,'aceptado'));
  await e.sofi.responderVinculoOnline(recibidas[0].id,'aceptado');await e.juan.sincronizarSocialOnline();
  assert.equal((await e.juan.leerDatosOnline<VinculoOnline[]>(e.juan.usuario.id,'vinculos',[]))[0].estado,'confirmado');
  assert.equal(Number((await e.db.get('SELECT COUNT(*) AS n FROM salas_online'))!.n),0);

  const deudaJuan=await e.juan.crearDeudaPersonal({personaId:e.persona.id,direccion:'me_deben',monto:120,descripcion:'Préstamo sin sala'},{depositoId:e.juan.deposito.id});
  const personaJuan=(await e.sofi.guardarPersona({nombre:'Juan',apellido:'Prueba',apodo:'Juan'}))!;
  const deudaSofi=await e.sofi.crearDeudaPersonal({personaId:personaJuan.id,direccion:'debo',monto:120,descripcion:'Préstamo anotado por Sofi'});
  await e.sofi.sincronizarCuenta(e.sofi.usuario.id);await e.juan.proponerDeudaOnline(deudaJuan.id);
  const acuerdoId='deuda:'+deudaJuan.id;
  await e.sofi.enviarAccionSocial('propuesta:'+acuerdoId,'/deudas/'+acuerdoId+'/decidir',{decision:'aceptada',deudaLocalId:deudaSofi.id,confirmarVinculo:true});
  await e.sofi.sincronizarSocialOnline();await e.juan.sincronizarSocialOnline();
  assert.equal((await e.sofi.cargarSocial()).deudas.find(d=>d.id===deudaSofi.id)!.acuerdoOnlineId,acuerdoId);
  assert.equal((await e.juan.depositosRepositorio.consultarPorId(e.juan.deposito.id))!.saldo_actual,880);
  await assert.rejects(e.sofi.informarPagoConDeposito(acuerdoId,15,e.juan.deposito.id),/depósito propio/);

  e.sofi.perderRespuesta('/pagos');await assert.rejects(e.sofi.informarPagoConDeposito(acuerdoId,15,e.sofi.deposito.id));
  await e.sofi.informarPagoConDeposito(acuerdoId,15,e.sofi.deposito.id);
  const informado=(await e.juan.solicitarSocial<{deudas:DeudaOnline[]}>('/deudas')).deudas.find(d=>d.id===acuerdoId)!;
  assert.equal(informado.pendiente,120);assert.equal(informado.pagos.length,1);assert.equal(informado.pagos[0].estado,'informado');
  assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,985);
  assert.equal((await e.juan.depositosRepositorio.consultarPorId(e.juan.deposito.id))!.saldo_actual,880);

  const pagoId=informado.pagos[0].id;
  e.juan.perderRespuesta('/decidir');await assert.rejects(e.juan.confirmarPagoConDeposito(pagoId,e.juan.deposito.id));
  await e.juan.confirmarPagoConDeposito(pagoId,e.juan.deposito.id);
  const operacion=(await e.juan.leerDatosOnline<OperacionPersonal[]>(e.juan.usuario.id,'operaciones',[])).find(o=>o.pagoId===pagoId)!;
  await e.juan.incorporarOperacionPersonal(operacion,{depositoId:e.juan.deposito.id});
  await e.sofi.recuperarEventosSociales();await e.juan.sincronizarSocialOnline();
  const confirmado=(await e.sofi.solicitarSocial<{deudas:DeudaOnline[]}>('/deudas')).deudas.find(d=>d.id===acuerdoId)!;
  assert.equal(confirmado.pendiente,105);assert.equal(confirmado.pagos.length,1);assert.equal(confirmado.pagos[0].estado,'confirmado');
  assert.equal((await e.juan.depositosRepositorio.consultarPorId(e.juan.deposito.id))!.saldo_actual,895);
  assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,985);
  assert.equal((await e.juan.cargarSocial()).totales.porCobrar,'$ 105');
  assert.equal((await e.sofi.cargarSocial()).totales.porPagar,'$ 105');
  assert.equal(Number((await e.db.get('SELECT COUNT(*) AS n FROM pagos_online WHERE deuda_id=?',[acuerdoId]))!.n),1);
  assert.equal(Number((await e.db.get('SELECT COUNT(*) AS n FROM salas_online'))!.n),0);
  await e.sofi.informarPagoConDeposito(acuerdoId,5,e.sofi.deposito.id);
  const otroPago=(await e.juan.solicitarSocial<{deudas:DeudaOnline[]}>('/deudas')).deudas.find(d=>d.id===acuerdoId)!.pagos.find(p=>p.id!==pagoId)!;
  await e.juan.enviarAccionSocial('pago-decision:'+otroPago.id,'/pagos/'+otroPago.id+'/decidir',{decision:'rechazado'});
  await e.sofi.recuperarEventosSociales();await e.juan.sincronizarSocialOnline();
  assert.equal((await e.sofi.cargarSocial()).totales.porPagar,'$ 105');
  assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,980);
  assert.equal((await e.juan.depositosRepositorio.consultarPorId(e.juan.deposito.id))!.saldo_actual,895);
  assert.ok(!(await e.juan.leerDatosOnline<OperacionPersonal[]>(e.juan.usuario.id,'operaciones',[])).some(o=>o.pagoId===otroPago.id));
  for(const cliente of [e.juan,e.sofi]){
    assert.equal(cliente.base.prepare("SELECT COUNT(*) AS n FROM datos_sociales_online WHERE clave LIKE 'accion:%'").get()!.n,0);
    await cliente.sincronizarCuenta(cliente.usuario.id);
    await new Promise<void>(resolve=>setImmediate(resolve));await cliente.sincronizarSocialOnline();
    await new Promise<void>(resolve=>setImmediate(resolve));
  }
});

test('online: solo el administrador edita; los cambios offline llegan sin duplicarse y el cierre espera conexión',{skip:!disponible},async t=>{
  const e=await escenario(t),gasto={id:'taxi',claveOperacion:randomUUID(),salaId:e.sala.id,descripcion:'Taxi',monto:'40',categoriaId:'transporte',pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]};
  await assert.rejects(e.sofi.guardarGasto({...gasto,involucradas:['vos']}),/administrador|lectura/);
  e.juan.desconectar();await e.juan.guardarGasto(gasto);
  assert.equal((await e.juan.cargarSocial()).salas[0].gastos.length,2);
  const remota=JSON.parse(String((await e.db.get('SELECT datos FROM salas_online WHERE id=?',[e.sala.id]))!.datos));assert.equal(remota.gastos.length,1);
  await assert.rejects(e.juan.cerrarSala(e.sala.id));assert.equal(remota.estado,'abierta');
  e.juan.conectar();await e.juan.sincronizarSocialOnline();await e.juan.sincronizarSocialOnline();await e.sofi.sincronizarSocialOnline();
  assert.equal((await e.sofi.cargarSocial()).salas[0].gastos.length,2);
  await e.juan.cerrarSala(e.sala.id);await e.juan.cerrarSala(e.sala.id);
  const operaciones=(await e.sofi.solicitarSocial<{operaciones:OperacionPersonal[]}>('/operaciones-personales')).operaciones;
  assert.equal(operaciones.filter(o=>o.tipo==='egreso'&&o.clave==='compra:comida')[0].monto,120);
  assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,1000);
  assert.equal((await e.juan.depositosRepositorio.consultarPorId(e.juan.deposito.id))!.saldo_actual,1000);
});

test('online: retirar a un integrante permite recuperar novedades y revoca su copia activa',{skip:!disponible},async t=>{
  const e=await escenario(t);
  assert.equal((await e.sofi.cargarSocial()).salas.length,1);
  await e.juan.cambiarPersonasSala(e.sala.id,[]);await e.juan.sincronizarSocialOnline();
  const canales=await e.sofi.recuperarEventosSociales();
  assert.ok(!canales.includes('sala:'+e.sala.id));
  assert.equal((await e.sofi.cargarSocial()).salas.length,0);
  await assert.rejects(e.sofi.solicitarSocial('/salas/'+e.sala.id),/acceso/);
});

test('online: los gastos offline aparecen en Sincronización hasta recibir su confirmación',{skip:!disponible},async t=>{
  const e=await escenario(t);e.juan.desconectar();
  await e.juan.guardarGasto({id:'gasto-pendiente',claveOperacion:randomUUID(),salaId:e.sala.id,descripcion:'Taxi sin conexión',monto:'40',categoriaId:'transporte',pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]});
  const pendientes=await e.juan.consultarPendientes();
  assert.ok(pendientes.registros.some(r=>r.titulo==='Gasto de sala: Taxi sin conexión'&&r.importe===40));
  e.juan.conectar();await e.juan.sincronizarSocialOnline();
  assert.ok(!(await e.juan.consultarPendientes()).registros.some(r=>r.titulo.includes('Taxi sin conexión')));
});

test('online: el creador delega gastos sin delegar integrantes, cierre ni permisos',{skip:!disponible},async t=>{
  const e=await escenario(t);
  await e.juan.cambiarPermisoGastos(e.sala.id,e.persona.id,true);await e.sofi.sincronizarSocialOnline();
  assert.equal((await e.sofi.cargarSocial()).salas[0].puedeEditarGastos,true);
  await e.sofi.guardarGasto({id:'delegado',claveOperacion:randomUUID(),salaId:e.sala.id,descripcion:'Compra autorizada',monto:'20',categoriaId:'alimentacion',pagadorId:'vos',reparto:'iguales',involucradas:['vos'],pagaron:[]});
  await e.sofi.sincronizarSocialOnline();
  const sala=await e.sofi.obtenerSalaOnline(e.sala.id);assert.ok(sala.sala.gastos.some(g=>g.id==='delegado'));
  for(const comando of [{tipo:'permisos',personaId:e.persona.id,puedeEditar:true},{tipo:'integrantes',personas:[]},{tipo:'cerrar'}])await assert.rejects(e.sofi.solicitarSocial('/salas/'+e.sala.id+'/comandos',{...comando,idOperacion:randomUUID(),versionBase:sala.sala.revision}),/administrador/);
  await e.juan.sincronizarSocialOnline();await e.juan.cambiarPermisoGastos(e.sala.id,e.persona.id,false);
  await assert.rejects(e.sofi.solicitarSocial('/salas/'+e.sala.id+'/comandos',{tipo:'guardar_gasto',idOperacion:randomUUID(),versionBase:sala.sala.revision,gasto:sala.sala.gastos[0]}),/autorizada/);
});

test('online: el aviso de un invitado se revisa por persona y no registra pagos ni movimientos',{skip:!disponible},async t=>{
  const e=await escenario(t),invitada=await e.juan.guardarPersona({nombre:'Invitada',apellido:'Prueba',apodo:'Invitada'});
  await e.juan.cambiarPersonasSala(e.sala.id,[e.persona.id,invitada!.id]);await e.juan.sincronizarSocialOnline();
  await e.juan.guardarGasto({id:'compra-invitada',claveOperacion:randomUUID(),salaId:e.sala.id,descripcion:'Cena con invitada',monto:'100',categoriaId:'alimentacion',pagadorId:'vos',reparto:'iguales',involucradas:['vos',invitada!.id],pagaron:[]});await e.juan.sincronizarSocialOnline();
  const {enlace}=await e.juan.invitarPersonaOnline(e.sala.id,invitada!.id);let cookie='';
  const web=async(ruta:string,datos:unknown)=>{const r=await fetch(e.url+'/social'+ruta,{method:'POST',headers:{Origin:new URL(e.url).origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(datos)});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie')!.split(';')[0];return {estado:r.status,datos:await r.json()};};
  assert.equal((await web('/invitaciones/aceptar',{token:new URL(enlace).hash.slice(1),idOperacion:randomUUID()})).estado,200);
  const solicitudId=randomUUID(),aviso={idOperacion:randomUUID(),solicitudId,tipo:'parte_pagada',gastoId:'compra-invitada'};
  assert.equal((await web('/salas/'+e.sala.id+'/solicitudes',aviso)).estado,200);
  assert.equal((await web('/salas/'+e.sala.id+'/solicitudes',aviso)).estado,200);
  const respuesta=await e.juan.recuperarSalaOnline(e.sala.id),pedido=respuesta.solicitudes.find(s=>s.id===solicitudId)!;
  assert.equal(pedido.personaId,invitada!.id);assert.equal(pedido.tipo,'parte_pagada');
  assert.equal(respuesta.sala.gastos.find(g=>g.id==='compra-invitada')!.pagaron.length,0);
  assert.equal(Number((await e.db.get('SELECT COUNT(*) AS n FROM pagos_online'))!.n),0);
  await e.juan.solicitarSocial('/solicitudes/'+solicitudId+'/decidir',{idOperacion:randomUUID(),decision:'resuelta'});
  const aprobada=await e.juan.recuperarSalaOnline(e.sala.id);assert.ok(aprobada.sala.gastos.find(g=>g.id==='compra-invitada')!.pagaron.includes(invitada!.id));
  await assert.rejects(e.juan.solicitarSocial('/solicitudes/'+solicitudId+'/decidir',{idOperacion:randomUUID(),decision:'resuelta'}),/decisión/);
  assert.equal(Number((await e.db.get('SELECT COUNT(*) AS n FROM pagos_online'))!.n),0);
  assert.equal((await e.juan.depositosRepositorio.consultarPorId(e.juan.deposito.id))!.saldo_actual,1000);
  await e.juan.cerrarSala(e.sala.id);
  assert.equal((await web('/salas/'+e.sala.id+'/solicitudes',{idOperacion:randomUUID(),solicitudId:randomUUID(),tipo:'parte_pagada',gastoId:'compra-invitada'})).estado,409);
  const deuda=await e.db.get('SELECT d.id FROM deudas_online d JOIN integrantes_online i ON i.identidad_id=d.deudor_id WHERE i.persona_local_id=?',[invitada!.id]);
  assert.equal((await web('/deudas/'+deuda!.id+'/pagos',{idOperacion:randomUUID(),pagoId:randomUUID(),monto:1})).estado,403);
});

test('online: perder la respuesta al publicar conserva un único envío e impide editar o cerrar la copia local',{skip:!disponible},async t=>{
  const e=await escenario(t),local=await e.juan.crearSala({nombre:'Publicación pendiente',fecha:'2026-11-06',icono:'people-outline',color:'#BED5C8',personasIds:[e.persona.id]});
  e.juan.perderRespuesta('/salas/publicar');await assert.rejects(e.juan.publicarSalaOnline(local.id));
  assert.equal((await e.juan.cargarSocial()).salas.find(s=>s.id===local.id)!.publicacionPendiente,true);
  await assert.rejects(e.juan.cambiarPersonasSala(local.id,[]),/publicación.*pendiente/);
  await assert.rejects(e.juan.cerrarSala(local.id),/publicación.*pendiente/);
  await e.juan.publicarSalaOnline(local.id);
  const confirmada=(await e.juan.cargarSocial()).salas.find(s=>s.id===local.id)!;
  assert.equal(confirmada.online,true);assert.equal(confirmada.publicacionPendiente,false);
  assert.equal(Number((await e.db.get('SELECT COUNT(*) AS n FROM salas_online WHERE id=?',[local.id]))!.n),1);
  await e.juan.cambiarPersonasSala(local.id,[]);await e.juan.sincronizarSocialOnline();
});

test('online: informar no salda, solo el acreedor confirma y dos pagos no pueden superar el pendiente',{skip:!disponible},async t=>{
  const e=await escenario(t);await e.juan.cerrarSala(e.sala.id);
  const deuda=(await e.juan.solicitarSocial<{deudas:DeudaOnline[]}>('/deudas')).deudas[0];assert.equal(deuda.pendiente,60);
  await e.sofi.sincronizarSocialOnline();
  assert.equal((await e.juan.cargarSocial()).totales.porPagar,'$ 60');
  assert.equal((await e.sofi.cargarSocial()).totales.porCobrar,'$ 60');
  const primero=randomUUID(),segundo=randomUUID();
  const envio={idOperacion:randomUUID(),pagoId:primero,monto:40};await e.juan.solicitarSocial('/deudas/'+deuda.id+'/pagos',envio);await e.juan.solicitarSocial('/deudas/'+deuda.id+'/pagos',envio);
  await e.juan.solicitarSocial('/deudas/'+deuda.id+'/pagos',{idOperacion:randomUUID(),pagoId:segundo,monto:40});
  await assert.rejects(e.juan.solicitarSocial('/pagos/'+primero+'/decidir',{idOperacion:randomUUID(),decision:'confirmado'}),/cobra|recepción/);
  const confirmaciones=await Promise.allSettled([primero,segundo].map(id=>e.sofi.solicitarSocial('/pagos/'+id+'/decidir',{idOperacion:randomUUID(),decision:'confirmado'})));
  assert.equal(confirmaciones.filter(r=>r.status==='fulfilled').length,1);
  const indiceRechazado=confirmaciones.findIndex(r=>r.status==='rejected');assert.match(String((confirmaciones[indiceRechazado] as PromiseRejectedResult).reason),/importe/);
  await e.sofi.solicitarSocial('/pagos/'+[primero,segundo][indiceRechazado]+'/decidir',{idOperacion:randomUUID(),decision:'rechazado'});
  const actual=(await e.juan.solicitarSocial<{deudas:DeudaOnline[]}>('/deudas')).deudas[0];assert.equal(actual.pendiente,20);assert.equal(actual.pagos.length,2);
});

test('online: incorporar un gasto solo modifica el depósito propio y eliminarlo conserva la deuda compartida',{skip:!disponible},async t=>{
  const e=await escenario(t);await e.juan.cerrarSala(e.sala.id);
  const operacion=(await e.sofi.solicitarSocial<{operaciones:OperacionPersonal[]}>('/operaciones-personales')).operaciones[0];
  await assert.rejects(e.juan.incorporarOperacionPersonal(operacion,{depositoId:e.sofi.deposito.id}));
  await e.sofi.incorporarOperacionPersonal(operacion,{depositoId:e.sofi.deposito.id});await e.sofi.sincronizarSocialOnline();
  await e.sofi.incorporarOperacionPersonal(operacion,{depositoId:e.sofi.deposito.id});await e.sofi.sincronizarSocialOnline();
  assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,880);
  const movimiento=e.sofi.base.prepare('SELECT movimiento_id FROM incorporaciones_sociales_locales WHERE clave=?').get(operacion.clave)!;
  await e.sofi.eliminarMovimiento(String(movimiento.movimiento_id));await e.sofi.sincronizarCuenta(e.sofi.usuario.id);
  assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,1000);
  assert.equal((await e.juan.solicitarSocial<{deudas:DeudaOnline[]}>('/deudas')).deudas[0].pendiente,60);
});

test('online: rechazar la propuesta de una deuda anterior conserva su registro y movimientos privados',{skip:!disponible},async t=>{
  const e=await escenario(t);const deuda=await e.juan.crearDeudaPersonal({personaId:e.persona.id,direccion:'debo',monto:'35',descripcion:'Antes de la sala'});await e.juan.sincronizarCuenta(e.juan.usuario.id);
  const propuestaId=randomUUID();await e.juan.solicitarSocial('/deudas/propuestas',{idOperacion:randomUUID(),propuestaId,deudaLocalId:deuda.id});
  await e.sofi.solicitarSocial('/deudas/'+propuestaId+'/decidir',{idOperacion:randomUUID(),decision:'rechazada'});
  assert.equal((await e.juan.deudasRepositorio.consultarPorId(deuda.id))!.estado,'pendiente');
  assert.equal((await e.db.get('SELECT estado FROM deudas WHERE id=?',[deuda.id]))!.estado,'pendiente');
  assert.equal((await e.db.get('SELECT estado FROM deudas_online WHERE id=?',[propuestaId]))!.estado,'rechazada');
  const recibidas=await e.sofi.solicitarSocial<{deudas:{id:string}[]}>('/deudas');
  assert.ok(!recibidas.deudas.some(d=>d.id===propuestaId));
  assert.ok((await e.juan.solicitarSocial<{deudas:{id:string}[]}>('/deudas')).deudas.some(d=>d.id===propuestaId));
});

test('online: invitaciones guardan solo hashes, vencen, se revocan y no permiten tomar otra identidad',{skip:!disponible},async t=>{
  const e=await escenario(t);const {enlace}=await e.juan.invitarPersonaOnline(e.sala.id,e.persona.id),token=new URL(enlace).hash.slice(1);
  const tercero=await e.cliente('Otra persona');await assert.rejects(tercero.aceptarInvitacionOnline(token),/otra cuenta/);
  const hash=(await e.db.get('SELECT token_hash FROM invitaciones_online WHERE revocada=0'))!.token_hash;assert.notEqual(hash,token);
  const almacenadas=await e.db.get('SELECT COUNT(*) AS n FROM operaciones_online WHERE resultado LIKE ?',['%'+token+'%']);assert.equal(almacenadas!.n,0);
  await e.db.run('UPDATE invitaciones_online SET vence=0 WHERE token_hash=?',[hash]);await assert.rejects(e.sofi.aceptarInvitacionOnline(token),/venció/);
});

test('online: conserva dos ediciones y solicitudes offline; un ACK perdido no duplica el gasto',{skip:!disponible},async t=>{
  const e=await escenario(t);e.juan.desconectar();e.sofi.desconectar();
  await e.sofi.guardarSolicitudOnline(e.sala.id,'Revisar el ticket');
  assert.equal((await e.sofi.consultarSolicitudesPendientes(e.sala.id)).length,1);
  for(const [id,monto] of [['uno',12],['dos',16]] as const)await e.juan.guardarGasto({id,claveOperacion:id,salaId:e.sala.id,descripcion:id,monto,categoriaId:'transporte',pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]});
  e.juan.conectar();e.juan.perderRespuesta('/comandos');await assert.rejects(e.juan.sincronizarSocialOnline());
  await e.juan.sincronizarSocialOnline();e.sofi.conectar();await e.sofi.sincronizarSocialOnline();
  const sala=await e.sofi.obtenerSalaOnline(e.sala.id);assert.equal(sala.sala.gastos.length,3);assert.equal(sala.solicitudes.length,1);
  assert.equal((await e.sofi.consultarSolicitudesPendientes(e.sala.id)).length,0);
});

test('online: un conflicto conserva las ediciones y permite revisión explícita sobre la versión actual',{skip:!disponible},async t=>{
  const e=await escenario(t);e.juan.desconectar();
  await e.juan.guardarGasto({id:'offline',claveOperacion:'offline',salaId:e.sala.id,descripcion:'Cambio offline',monto:30,categoriaId:'transporte',pagadorId:'vos',reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]});
  await assert.rejects(e.juan.sincronizarSocialOnline());e.juan.conectar();
  await e.juan.solicitarSocial('/salas/'+e.sala.id+'/comandos',{idOperacion:randomUUID(),versionBase:1,tipo:'guardar_gasto',gasto:{id:'remoto',pagadorId:e.persona.id,categoriaId:'salud',descripcion:'Cambio remoto',monto:20,fecha:new Date().toISOString(),version:1,reparto:'iguales',estado:'vigente',pagaron:[],partes:[{personaId:e.persona.id,monto:20,orden:0}]}});
  await e.juan.sincronizarSocialOnline();const antes=await e.juan.obtenerSalaOnline(e.sala.id);assert.ok(antes.pendientes[0].error);assert.equal(antes.sala.gastos.length,3);
  await e.juan.resolverConflictoSala(e.sala.id,'reaplicar');const despues=await e.juan.obtenerSalaOnline(e.sala.id);assert.equal(despues.pendientes.length,0);assert.equal(despues.sala.gastos.length,3);
  assert.equal(e.juan.base.prepare("SELECT COUNT(*) AS n FROM datos_sociales_online WHERE clave LIKE 'revision:%'").get()!.n,1);
});

test('online: respuesta perdida de un pago conserva su identificador y el balance de la sala se actualiza al confirmar',{skip:!disponible},async t=>{
  const e=await escenario(t);await e.juan.cerrarSala(e.sala.id);
  const deuda=(await e.juan.solicitarSocial<{deudas:DeudaOnline[]}>('/deudas')).deudas[0];
  e.juan.perderRespuesta('/pagos');
  await assert.rejects(e.juan.enviarAccionSocial('pago:'+deuda.id,'/deudas/'+deuda.id+'/pagos',{monto:25}));
  await e.juan.enviarAccionSocial('pago:'+deuda.id,'/deudas/'+deuda.id+'/pagos',{monto:25});
  const pagos=(await e.sofi.solicitarSocial<{deudas:DeudaOnline[]}>('/deudas')).deudas[0].pagos;assert.equal(pagos.length,1);
  await e.sofi.enviarAccionSocial('confirmar:'+pagos[0].id,'/pagos/'+pagos[0].id+'/decidir',{decision:'confirmado'});
  await e.juan.sincronizarSocialOnline();const sala=(await e.juan.cargarSocial()).salas[0];assert.equal(sala.gastos[0].partes.find(p=>p.personaId==='vos')!.pendienteNumero,35);
});

test('online: dos registros privados se reconocen como un solo acuerdo sin modificar sus históricos',{skip:!disponible},async t=>{
  const e=await escenario(t),juanLocal=await e.sofi.guardarPersona({nombre:'Juan',apellido:'Prueba',apodo:'Juan'});
  const a=await e.juan.crearDeudaPersonal({personaId:e.persona.id,direccion:'debo',monto:35,descripcion:'Anterior'}),b=await e.sofi.crearDeudaPersonal({personaId:juanLocal!.id,direccion:'me_deben',monto:35,descripcion:'Mi anotación'},{depositoId:e.sofi.deposito.id});
  await e.juan.sincronizarCuenta(e.juan.usuario.id);await e.sofi.sincronizarCuenta(e.sofi.usuario.id);
  const propuestaId=randomUUID();await e.juan.solicitarSocial('/deudas/propuestas',{idOperacion:randomUUID(),propuestaId,deudaLocalId:a.id});
  await e.sofi.solicitarSocial('/deudas/'+propuestaId+'/decidir',{idOperacion:randomUUID(),decision:'aceptada',deudaLocalId:b.id,confirmarVinculo:true});
  await e.juan.sincronizarSocialOnline();await e.sofi.sincronizarSocialOnline();
  assert.equal((await e.juan.cargarSocial()).deudas.find(d=>d.id===a.id)!.acuerdoOnlineId,propuestaId);
  assert.equal((await e.sofi.cargarSocial()).deudas.find(d=>d.id===b.id)!.acuerdoOnlineId,propuestaId);
  assert.equal((await e.sofi.deudasRepositorio.consultarPorId(b.id))!.estado,'pendiente');
  assert.equal((await e.juan.cargarSocial()).totales.porPagar,'$ 35');
  assert.equal((await e.sofi.cargarSocial()).totales.porCobrar,'$ 35');
});

test('online: WebSocket exige ticket único, restringe canales y permite recuperar eventos persistidos por HTTP',{skip:!disponible},async t=>{
  const e=await escenario(t);
  type Socket=import('node:events').EventEmitter&{send:(datos:string)=>void;terminate:()=>void;close:()=>void};
  const {WebSocket}=e.cargar('ws') as {WebSocket:new(url:string,protocolos:string[])=>Socket};
  const {ticket}=await e.sofi.solicitarSocial<{ticket:string}>('/realtime-ticket',{}),url=e.url.replace('http:','ws:')+'/social/ws';
  const socket=new WebSocket(url,['ahre.social.v1','ticket.'+ticket]);t.after(()=>socket.terminate());
  await new Promise<void>((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
  const esperar=(tipo:string)=>new Promise<Record<string,unknown>>((resolve,reject)=>{
    const limite=setTimeout(()=>{socket.off('message',recibir);reject(Error('No llegó '+tipo));},6000);
    const recibir=(mensaje:{toString:()=>string})=>{const datos=JSON.parse(mensaje.toString());if(datos.tipo===tipo){clearTimeout(limite);socket.off('message',recibir);resolve(datos);}};socket.on('message',recibir);
  });
  const suscripcion=esperar('recuperar');socket.send(JSON.stringify({canal:'sala:'+e.sala.id}));await suscripcion;
  const recibido=esperar('solicitud_creada');await e.juan.guardarSolicitudOnline(e.sala.id,'Verificar fecha');await e.juan.sincronizarSocialOnline();
  const evento=await recibido;assert.ok(Number(evento.id)>0);
  const historial=await e.sofi.solicitarSocial<{eventos:{id:number}[]}>('/eventos?canal='+encodeURIComponent('sala:'+e.sala.id)+'&desde=0');assert.ok(historial.eventos.some(x=>x.id===evento.id));
  const repetido=new WebSocket(url,['ahre.social.v1','ticket.'+ticket]);repetido.on('error',()=>{});t.after(()=>repetido.terminate());
  await new Promise<void>(resolve=>repetido.once('close',()=>resolve()));
  const denegado=new Promise<number>(resolve=>socket.once('close',codigo=>resolve(Number(codigo))));socket.send(JSON.stringify({canal:'sala:ajena'}));assert.equal(await denegado,1008);
});

test('online: reiniciar el transporte conserva los eventos y permite volver a suscribirse sin perder cambios',{skip:!disponible},async t=>{
  const e=await escenario(t),canal='sala:'+e.sala.id;
  await e.juan.guardarSolicitudOnline(e.sala.id,'Antes del reinicio');await e.juan.sincronizarSocialOnline();
  const anteriores=await e.sofi.solicitarSocial<{eventos:{id:number;tipo:string}[]}>('/eventos?canal='+encodeURIComponent(canal));
  const ultimo=anteriores.eventos.at(-1)!;assert.ok(ultimo.id>0);
  const {token}= (await e.sofi.obtenerSesionRemota(e.sofi.usuario.id))!;
  (e.servidor as Server&{cerrarSocial:()=>void}).cerrarSocial();e.servidor.closeAllConnections();
  await new Promise<void>(resolve=>e.servidor.close(()=>resolve()));
  const {crearServidorSocial}=e.cargar('./dist/social/realtime.js') as {crearServidorSocial:(app:unknown,db:unknown)=>Server&{cerrarSocial:()=>void}};
  const servidor=crearServidorSocial(e.app,e.db);
  type Socket=import('node:events').EventEmitter&{send:(datos:string)=>void;terminate:()=>void};
  let socket:Socket|undefined;
  try{
    servidor.listen(0,'127.0.0.1');await new Promise<void>(resolve=>servidor.once('listening',resolve));
    const direccion=servidor.address();assert.ok(direccion&&typeof direccion!=='string');const url='http://127.0.0.1:'+direccion.port+'/api/v1/social';
    const recuperada=await fetch(url+'/eventos?canal='+encodeURIComponent(canal)+'&desde='+(ultimo.id-1),{headers:{Authorization:'Bearer '+token}});
    assert.equal(recuperada.status,200);assert.ok((await recuperada.json()).eventos.some((evento:{id:number})=>evento.id===ultimo.id));
    const respuesta=await fetch(url+'/realtime-ticket',{method:'POST',headers:{Authorization:'Bearer '+token}});assert.equal(respuesta.status,200);
    const {ticket}=await respuesta.json(),{WebSocket}=e.cargar('ws') as {WebSocket:new(url:string,protocolos:string[])=>Socket};
    socket=new WebSocket(url.replace('http:','ws:')+'/ws',['ahre.social.v1','ticket.'+ticket]);
    await new Promise<void>((resolve,reject)=>{socket!.once('open',resolve);socket!.once('error',reject);});
    const suscrito=new Promise<void>((resolve,reject)=>{
      const limite=setTimeout(()=>reject(Error('No se recuperó la suscripción tras reiniciar')),6000);
      socket!.on('message',(mensaje:{toString:()=>string})=>{if(JSON.parse(mensaje.toString()).tipo==='recuperar'){clearTimeout(limite);resolve();}});
    });
    socket.send(JSON.stringify({canal}));await suscrito;
  }finally{
    socket?.terminate();servidor.cerrarSocial();servidor.closeAllConnections();
    await new Promise<void>(resolve=>servidor.close(()=>resolve()));
  }
});

test('online: un invitado se registra conservando participación y no accede a datos privados',{skip:!disponible},async t=>{
  const e=await escenario(t),persona=await e.juan.guardarPersona({nombre:'Invitada',apellido:'Prueba',apodo:'Invitada'});
  await e.juan.cambiarPersonasSala(e.sala.id,[e.persona.id,persona!.id]);await e.juan.sincronizarSocialOnline();
  const {enlace}=await e.juan.invitarPersonaOnline(e.sala.id,persona!.id),token=new URL(enlace).hash.slice(1);
  let cookie='';
  const web=async(ruta:string,datos?:unknown)=>{
    const respuesta=await fetch(e.url+'/social'+ruta,{method:datos===undefined?'GET':'POST',headers:{Origin:new URL(e.url).origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(datos===undefined?{}:{body:JSON.stringify(datos)})});
    const nueva=respuesta.headers.get('set-cookie');if(nueva)cookie=nueva.split(';')[0];
    return {estado:respuesta.status,datos:await respuesta.json()};
  };
  assert.equal((await web('/invitaciones/aceptar',{token,idOperacion:randomUUID()})).estado,200);
  const antes=await web('/salas/'+e.sala.id);assert.equal(antes.datos.personaPropiaId,persona!.id);assert.equal(antes.datos.administrador,false);
  assert.equal((await web('/salas/'+e.sala.id+'/comandos',{idOperacion:randomUUID(),tipo:'cerrar',versionBase:antes.datos.sala.revision})).estado,403);
  assert.equal((await web('/auth/login',{correo:e.sofi.correo,contrasena:'ClaveOnline123!'})).estado,409);
  const correoInvitada=randomUUID()+'@example.test';
  const registro=await web('/auth/register',{nombre:'Invitada registrada',correo:correoInvitada,contrasena:'ClaveInvitada123!'});assert.equal(registro.estado,200);
  assert.equal((await web('/salas/'+e.sala.id)).datos.personaPropiaId,persona!.id);
  const vinculo=await e.db.get('SELECT id FROM vinculos_online WHERE propietario_id=? AND persona_id=?',[e.juan.usuario.id,persona!.id]);
  await e.juan.enviarAccionSocial('confirmar-vinculo-invitada','/vinculos/'+vinculo!.id+'/decidir',{decision:'confirmado'});
  assert.equal((await web('/auth/login',{correo:correoInvitada,contrasena:'ClaveInvitada123!'})).estado,200);
  assert.equal((await e.db.get('SELECT estado FROM vinculos_online WHERE id=?',[vinculo!.id]))!.estado,'confirmado');
  const evento=await e.db.get('SELECT id FROM eventos_online WHERE canal=? AND datos LIKE ?',['usuario:'+e.juan.usuario.id,'%identidad_vinculada%']);assert.ok(evento);
  const autorizacion=await e.db.get('SELECT dispositivo_id FROM autorizaciones_dispositivo WHERE usuario_id=?',[registro.datos.usuario.id]);assert.equal(autorizacion!.dispositivo_id,null);
  await e.sofi.solicitarSocial('/auth/status');
  const privado=await fetch(e.url+'/sync/snapshot',{headers:{Cookie:cookie,'X-AHRE-Protocolo':'3'}});assert.equal(privado.status,401);
  cookie='ahre_social='+'f'.repeat(64);
  assert.equal((await web('/auth/login',{correo:e.sofi.correo,contrasena:'ClaveOnline123!'})).estado,200);
});

test('online: una instalación nueva recupera el estado actual sin reinterpretar lotes históricos',{skip:!disponible},async t=>{
  const e=await escenario(t);
  const nueva=await preparar(t,true,{url:e.url,fetch});
  const usuario=await nueva.iniciarSesion({correo:e.sofi.correo,contrasena:'ClaveOnline123!',recordar:true,reemplazarDispositivo:true});
  await nueva.crearSesion(usuario.id,false);await nueva.sincronizarCuenta(usuario.id);
  const deposito=await nueva.depositosRepositorio.consultarPorId(e.sofi.deposito.id);assert.equal(deposito!.saldo_actual,1000);
  assert.equal(nueva.base.prepare('SELECT COUNT(*) AS n FROM personas WHERE usuario_id=? AND es_usuario_actual=1').get(usuario.id)!.n,1);
  await nueva.sincronizarSocialOnline();assert.equal((await nueva.cargarSocial()).salas.length,1);
});

test('recupera una cuenta vacía marcada preparada tras fallar la primera descarga sin alterar datos remotos',{skip:!disponible},async t=>{
  const e=await escenario(t);let bloquear=true;
  const transporte:typeof fetch=(...args)=>bloquear&&String(args[0]).includes('/sync/snapshot')?Promise.resolve(new Response('{}',{status:503})):fetch(...args);
  const nueva=await preparar(t,true,{url:e.url,fetch:transporte});
  const usuario=await nueva.iniciarSesion({correo:e.sofi.correo,contrasena:'ClaveOnline123!',recordar:true,reemplazarDispositivo:true});
  nueva.base.prepare('UPDATE sync_state SET preparada=1,revision=0 WHERE usuario_id=?').run(usuario.id);
  assert.equal(nueva.base.prepare('SELECT COUNT(*) AS n FROM depositos').get()!.n,0);
  bloquear=false;await nueva.sincronizarCuenta(usuario.id);
  assert.equal((await nueva.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,1000);
  const perfil=await nueva.cargarPerfil();assert.equal(perfil.usuario.id,usuario.id);assert.ok(perfil.preferencias.id);
  assert.equal((await e.db.get('SELECT saldo_actual FROM depositos WHERE id=?',[e.sofi.deposito.id]))!.saldo_actual,1000);
});

test('una edición por corrección conserva saldo y original al sincronizar con MySQL',{skip:!disponible},async t=>{
  const e=await escenario(t),fecha=new Date();
  const datos={monto:'100',descripcion:'Movimiento corregible',categoria:'servicios',deposito_id:e.juan.deposito.id,fecha,hora:String(fecha.getHours()).padStart(2,'0')+':'+String(fecha.getMinutes()).padStart(2,'0'),recurrente:false,frecuencia:'mensual'};
  const original=await e.juan.crearMovimiento(datos,'egreso');await e.juan.sincronizarCuenta(e.juan.usuario.id);
  await e.juan.corregirMovimiento(original.id,{...datos,monto:'150'},'egreso','correccion-mysql');await e.juan.sincronizarCuenta(e.juan.usuario.id);
  assert.equal((await e.db.get('SELECT saldo_actual FROM depositos WHERE id=?',[e.juan.deposito.id]))!.saldo_actual,850);
  assert.equal((await e.db.get('SELECT monto FROM movimientos WHERE id=?',[original.id]))!.monto,100);
  assert.ok((await e.db.get('SELECT fecha_eliminacion FROM movimientos WHERE id=?',[original.id]))!.fecha_eliminacion);
});

test('global: contraseña y aprobación protegen fichas vinculadas y admiten varios invitados con el mismo enlace',{skip:!disponible},async t=>{
 const e=await escenario(t),ana=(await e.juan.guardarPersona({nombre:'Ana',apellido:'Invitada',apodo:'Ana'}))!;
 await e.juan.configurarAccesoSala(e.sala.id,'Sala1234');
 const acceso=(await e.juan.obtenerSalaOnline(e.sala.id)).acceso!;
 const enlace=e.juan.enlaceGlobalSala(acceso.codigo);assert.ok(enlace.includes('#sala='));
 assert.equal((await e.juan.obtenerSalaOnline(e.sala.id)).acceso!.codigo,acceso.codigo);
 let cookie='';
 const web=async(ruta:string,datos?:unknown)=>{const r=await fetch(e.url+'/social'+ruta,{method:datos?'POST':'GET',headers:{Origin:new URL(e.url).origin,...(datos?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(datos?{body:JSON.stringify(datos)}:{})});const nueva=r.headers.get('set-cookie');if(nueva)cookie=nueva.split(';')[0];return {estado:r.status,datos:await r.json()};};
 const ruta='/accesos/'+acceso.codigo+'/solicitar';
 assert.equal((await web(ruta,{idOperacion:randomUUID(),nombre:'Ana',contrasena:'incorrecta'})).estado,403);
 const entrada={idOperacion:randomUUID(),nombre:'Ana',contrasena:'Sala1234'},pedido=await web(ruta,entrada);assert.equal(pedido.estado,200);assert.equal(pedido.datos.estado,'pendiente');
 assert.equal((await web('/salas/'+e.sala.id)).estado,403);
 assert.equal((await web('/ingresos')).datos.ingresos[0].id,pedido.datos.id);
 await assert.rejects(e.juan.decidirIngresoSala(pedido.datos.id,'aceptada',e.persona.id),/otra cuenta/);
 // Resolver la misma petición tras elegir otra ficha usa el identificador estable
 // solamente para contenido idéntico; un rechazo no consume la operación.
 await e.juan.decidirIngresoSala(pedido.datos.id,'aceptada',ana.id);
 const admitida=await web('/salas/'+e.sala.id);assert.equal(admitida.estado,200);assert.equal(admitida.datos.personaPropiaId,ana.id);assert.equal(admitida.datos.misFinanzas.length,0);assert.equal(admitida.datos.admisiones.length,0);
 cookie='';const segundo=await web(ruta,{idOperacion:randomUUID(),nombre:'Otra invitada',contrasena:'Sala1234'});assert.equal(segundo.estado,200);assert.notEqual(segundo.datos.id,pedido.datos.id);
 await e.juan.solicitarSocial('/ingresos/'+segundo.datos.id+'/decidir',{idOperacion:randomUUID(),decision:'rechazada'});
 assert.equal((await web('/ingresos')).datos.ingresos[0].estado,'rechazada');
 await e.juan.configurarAccesoSala(e.sala.id,'',{renovar:true});assert.notEqual((await e.juan.obtenerSalaOnline(e.sala.id)).acceso!.codigo,acceso.codigo);
 assert.equal((await web(ruta,{idOperacion:randomUUID(),nombre:'No entra',contrasena:'Sala1234'})).estado,403);
});

test('finanzas de sala: elegir depósito no afecta saldo y el cierre incorpora la compra una sola vez',{skip:!disponible},async t=>{
 const e=await escenario(t);await e.sofi.sincronizarSocialOnline();
 const compra=(await e.sofi.obtenerSalaOnline(e.sala.id)).misFinanzas!.find(o=>o.clave==='compra:comida')!;
 await assert.rejects(e.sofi.solicitarSocial('/salas/'+e.sala.id+'/mis-finanzas',{idOperacion:randomUUID(),clave:compra.clave,huella:compra.huella,depositoId:e.juan.deposito.id}),/propio/);
 await e.sofi.elegirFinanciacionSala(e.sala.id,compra,{depositoId:e.sofi.deposito.id});await e.sofi.sincronizarSocialOnline();
 assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,1000);
 await e.juan.cerrarSala(e.sala.id);await e.sofi.sincronizarSocialOnline();await e.sofi.sincronizarSocialOnline();
 assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,880);
 assert.equal((await e.juan.cargarSocial()).deudas.filter(d=>d.acuerdoOnlineId&&d.tipo==='debo')[0].pendienteNumero,60);
 assert.equal((await e.juan.cargarSocial()).totales.porPagar,'$ 60');
 await new Promise<void>(r=>setImmediate(r));await e.sofi.sincronizarSocialOnline();await new Promise<void>(r=>setImmediate(r));
});

test('finanzas de sala: una parte pagada sin depósito no vuelve a ser deuda; cambiar el pagador invalida asociaciones',{skip:!disponible},async t=>{
 const e=await escenario(t);await e.sofi.sincronizarSocialOnline();
 const compra=(await e.sofi.obtenerSalaOnline(e.sala.id)).misFinanzas![0];
 await e.sofi.elegirFinanciacionSala(e.sala.id,compra,{depositoId:e.sofi.deposito.id});await e.sofi.sincronizarSocialOnline();
 await e.juan.marcarPartePagada(e.sala.id,'comida','vos',true);await e.juan.sincronizarSocialOnline();
 await e.juan.cerrarSala(e.sala.id);await e.sofi.sincronizarSocialOnline();
 assert.equal((await e.juan.cargarSocial()).totales.porPagar,'$ 0');
 assert.equal((await e.juan.depositosRepositorio.consultarPorId(e.juan.deposito.id))!.saldo_actual,1000);
 const operaciones=await e.juan.leerDatosOnline<OperacionPersonal[]>(e.juan.usuario.id,'operaciones',[]);
 assert.ok(operaciones.some(o=>o.tipo==='egreso'&&!o.incorporada));
 await new Promise<void>(r=>setImmediate(r));await e.sofi.sincronizarSocialOnline();await new Promise<void>(r=>setImmediate(r));
});

test('finanzas de sala: cambiar pagador o importe exige revisar la selección y no debita el depósito anterior',{skip:!disponible},async t=>{
 const e=await escenario(t);await e.sofi.sincronizarSocialOnline();
 const compra=(await e.sofi.obtenerSalaOnline(e.sala.id)).misFinanzas!.find(o=>o.clave==='compra:comida')!;
 await e.sofi.elegirFinanciacionSala(e.sala.id,compra,{depositoId:e.sofi.deposito.id});await e.sofi.sincronizarSocialOnline();
 const gasto=(await e.juan.obtenerSalaOnline(e.sala.id)).sala.gastos[0];
 await e.juan.guardarGasto({gastoId:gasto.id,version:gasto.version,claveOperacion:randomUUID(),salaId:e.sala.id,descripcion:'Compra revisada',monto:140,categoriaId:'compras',pagadorId:e.persona.id,reparto:'iguales',involucradas:['vos',e.persona.id],pagaron:[]});
 await e.juan.sincronizarSocialOnline();await e.sofi.sincronizarSocialOnline();
 const revisada=(await e.sofi.obtenerSalaOnline(e.sala.id)).misFinanzas!.find(o=>o.clave===compra.clave)!;assert.equal(revisada.necesitaRevision,true);assert.equal(revisada.seleccion,undefined);
 await e.juan.cerrarSala(e.sala.id);await e.sofi.sincronizarSocialOnline();
 assert.equal((await e.sofi.depositosRepositorio.consultarPorId(e.sofi.deposito.id))!.saldo_actual,1000);
 assert.equal((await e.juan.cargarSocial()).totales.porPagar,'$ 70');
});
