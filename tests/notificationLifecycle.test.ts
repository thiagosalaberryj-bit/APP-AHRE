import test from 'node:test';
import assert from 'node:assert/strict';
import { preparar } from './helpers/localDatabase.ts';

async function escenario(t:import('node:test').TestContext){
 let instante=Date.parse('2026-11-09T10:00:00Z');
 class Reloj extends Date {constructor(valor?:string|number){super(valor??instante);}static now(){return instante;}}
 const e=await preparar(t,true,{url:'http://example.test',fetch:async()=>{throw Error('sin red');},reloj:Reloj});
 const usuario=await e.registrarUsuario({nombre:'Prueba',correo:'pruebas@ahre.test',localPruebas:true,contrasena:'ClavePrueba123!',confirmacion:'ClavePrueba123!'});
 await e.crearSesion(usuario.id,false);
 e.base.prepare('UPDATE preferencias SET notificaciones_activas=1 WHERE usuario_id=?').run(usuario.id);
 const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Caja',tipo:'efectivo',saldo_inicial:10000,icono:'cash-outline',fecha_creacion:'2020-01-01T00:00:00Z'});
 return {...e,usuario,deposito,viajar:(fecha:string)=>{instante=Date.parse(fecha);}};
}

test('deuda: pago parcial mantiene avisos; saldo cero resuelve todos y cancela programaciones sin marcar vistos',async t=>{
 const e=await escenario(t),persona=await e.guardarPersona({nombre:'Lucía',apellido:'Pérez',apodo:'Lu'});assert.ok(persona);
 const deuda=await e.crearDeudaPersonal({personaId:persona.id,direccion:'debo',monto:'100',descripcion:'Préstamo'});
 await e.reconciliarRecordatorios();
 const programadas=()=>e.base.prepare("SELECT COUNT(*) n FROM programaciones_avisos WHERE json_extract(datos,'$.destino.id')=?").get(deuda.id)!.n;
 assert.equal(programadas(),60);
 e.viajar('2026-11-09T13:00:00Z');await e.reconciliarRecordatorios();
 await e.registrarPagoDeuda({deudaId:deuda.id,monto:'40',claveOperacion:'parcial-notificacion'},{depositoId:e.deposito.id});
 await e.reconciliarRecordatorios();
 assert.equal(e.base.prepare("SELECT resuelta FROM avisos_locales WHERE json_extract(datos,'$.destino.id')=?").get(deuda.id)!.resuelta,0);
 e.viajar('2026-11-10T13:00:00Z');await e.reconciliarRecordatorios();
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM avisos_locales WHERE json_extract(datos,'$.destino.id')=? AND resuelta=0").get(deuda.id)!.n,2);
 e.base.prepare("INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,'deudas',?)").run(e.usuario.id,JSON.stringify([{id:'acuerdo-online',estado:'aceptada',origenLocalId:deuda.id,pendiente:60,esDeudor:true}]));
 await e.reconciliarRecordatorios();
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM avisos_locales WHERE json_extract(datos,'$.destino.id')=? AND resuelta=0").get(deuda.id)!.n,2,'Vincular la deuda online no la salda');
 e.base.prepare("DELETE FROM datos_sociales_online WHERE clave='deudas'").run();
 await e.registrarPagoDeuda({deudaId:deuda.id,monto:'60',claveOperacion:'final-notificacion'},{depositoId:e.deposito.id});await e.reconciliarRecordatorios();
 assert.equal(programadas(),0);
 const filas=e.base.prepare("SELECT vista,resuelta FROM avisos_locales WHERE json_extract(datos,'$.destino.id')=?").all(deuda.id);
 assert.equal(filas.length,2);assert.ok(filas.every(f=>f.resuelta===1&&f.vista===0));
 assert.ok(![...e.avisosNativos.keys()].some(k=>k.includes(deuda.id)));
});

test('no registrar un día conserva el aviso informativo y programa el siguiente sin acumular tareas pendientes',async t=>{
 const e=await escenario(t);await e.reconciliarRecordatorios();
 e.viajar('2026-11-10T01:00:00Z');await e.reconciliarRecordatorios();
 const aviso=e.base.prepare("SELECT id,vista,resuelta FROM avisos_locales WHERE json_extract(datos,'$.tipo')='registro'").get()!;
 assert.equal(aviso.resuelta,1);assert.equal(aviso.vista,0);
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM programaciones_avisos WHERE json_extract(datos,'$.tipo')='registro'").get()!.n,59);
 e.viajar('2026-11-10T12:00:00Z');await e.reconciliarRecordatorios();
 assert.equal(e.base.prepare('SELECT resuelta FROM avisos_locales WHERE id=?').get(aviso.id)!.resuelta,1);
});

test('recurrencia anticipada queda pendiente hasta confirmar su ocurrencia; los recordatorios posteriores se cancelan',async t=>{
 const e=await escenario(t),fecha='2026-11-10T12:00:00.000Z';
 const r=await e.recurrenciasRepositorio.crear({deposito_id:e.deposito.id,categoria:'alimentacion',tipo:'egreso',monto:10,descripcion:'Recurrente',frecuencia:'mensual',fecha_inicio:fecha,fecha_fin:null,proxima_ejecucion:fecha,zona_horaria:'America/Argentina/Buenos_Aires',dia_ancla:10,activa:1});
 await e.reconciliarRecordatorios();e.viajar('2026-11-09T13:00:00Z');await e.reconciliarRecordatorios();
 const aviso=e.base.prepare("SELECT id,resuelta FROM avisos_locales WHERE json_extract(datos,'$.destino.id')=?").get(r.id)!;assert.equal(aviso.resuelta,0);
 e.viajar('2026-11-11T13:00:00Z');await e.reconciliarRecordatorios();
 assert.equal(e.base.prepare('SELECT resuelta FROM avisos_locales WHERE id=?').get(aviso.id)!.resuelta,0);
 await e.aceptarOcurrenciaRecurrencia(r.id,fecha,new Date('2026-11-11T13:00:00Z'));await e.reconciliarRecordatorios();
 assert.equal(e.base.prepare('SELECT resuelta FROM avisos_locales WHERE id=?').get(aviso.id)!.resuelta,1);
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM programaciones_avisos WHERE json_extract(datos,'$.ocurrencia')=?").get(fecha)!.n,0);
});

test('sala: repetición offline usa días fijos y se cancela al incorporar todas las operaciones',async t=>{
 const e=await escenario(t);
 await e.ejecutarTransaccion(c=>e.guardarDato(c,e.usuario.id,'dato-prueba',{}));
 e.base.prepare("INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,'operaciones',?)").run(e.usuario.id,JSON.stringify([{clave:'op-sala',salaId:'sala-prueba',incorporada:false}]));
 await e.reconciliarRecordatorios();e.viajar('2026-11-10T13:00:00Z');await e.reconciliarRecordatorios();
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM avisos_locales WHERE json_extract(datos,'$.tipo')='salas' AND resuelta=0").get()!.n,2);
 e.base.prepare("UPDATE datos_sociales_online SET datos='[]' WHERE clave='operaciones'").run();await e.reconciliarRecordatorios();
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM avisos_locales WHERE json_extract(datos,'$.tipo')='salas' AND resuelta=0").get()!.n,0);
 assert.equal(e.base.prepare("SELECT COUNT(*) n FROM programaciones_avisos WHERE json_extract(datos,'$.tipo')='salas'").get()!.n,0);
});
