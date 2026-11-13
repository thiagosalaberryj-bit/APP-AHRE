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

test('cambiar permiso o volver de Ajustes reemplaza alarmas previas; una reconciliación normal no las duplica',async t=>{
 const e=await escenario(t);e.establecerPermisoAlarmas('desactivadas');await e.reconciliarRecordatorios();
 const [id,primera]=[...e.avisosNativos.entries()][0];assert.ok(primera);
 await e.reconciliarRecordatorios();assert.equal(e.avisosNativos.get(id),primera);
 e.establecerPermisoAlarmas('permitidas');await e.reconciliarRecordatorios();
 const precisa=e.avisosNativos.get(id);assert.notEqual(precisa,primera);
 const fila=e.base.prepare('SELECT datos FROM programaciones_avisos WHERE nativo=?').get(id)!;
 assert.equal(JSON.parse(String(fila.datos)).precision,'permitidas');
 const cantidad=e.avisosNativos.size;await e.reconciliarRecordatorios(true);assert.notEqual(e.avisosNativos.get(id),precisa);assert.equal(e.avisosNativos.size,cantidad);
 e.establecerPermisoAlarmas('desactivadas');await e.reconciliarRecordatorios();
 assert.equal(JSON.parse(String(e.base.prepare('SELECT datos FROM programaciones_avisos WHERE nativo=?').get(id)!.datos)).precision,'desactivadas');
});

test('cambiar la hora de una deuda a cobrar crea otra entrega del mismo día aunque la anterior siga pendiente',async t=>{
 const e=await escenario(t),persona=await e.guardarPersona({nombre:'Lucía',apellido:'Pérez',apodo:'Lu'});assert.ok(persona);
 const deuda=await e.crearDeudaPersonal({personaId:persona.id,direccion:'me_deben',monto:'100',descripcion:'Cobro pendiente'},{depositoId:e.deposito.id});
 await e.reconciliarRecordatorios();e.viajar('2026-11-09T13:00:00Z');await e.reconciliarRecordatorios();
 const anterior=e.base.prepare("SELECT id FROM avisos_locales WHERE json_extract(datos,'$.destino.id')=?").get(deuda.id)!;
 const ajustes=await e.cargarAjustesAvisos();ajustes.tipos.me_deben.hora='10:30';await e.guardarAjustesAvisos(ajustes);await e.reconciliarRecordatorios();
 const nueva=e.base.prepare("SELECT datos,fecha,nativo FROM programaciones_avisos WHERE json_extract(datos,'$.destino.id')=? ORDER BY fecha LIMIT 1").get(deuda.id)!;
 assert.equal(nueva.fecha,'2026-11-09T13:30:00.000Z');assert.notEqual(JSON.parse(String(nueva.datos)).id,anterior.id);assert.ok(e.avisosNativos.has(String(nueva.nativo)));
 e.viajar('2026-11-09T13:31:00Z');await e.reconciliarRecordatorios();
 const avisos=e.base.prepare("SELECT id,resuelta FROM avisos_locales WHERE json_extract(datos,'$.destino.id')=?").all(deuda.id);
 assert.equal(avisos.length,2);assert.ok(avisos.every(a=>a.resuelta===0));
 ajustes.tipos.me_deben.hora='10:31';await e.guardarAjustesAvisos(ajustes);await e.reconciliarRecordatorios();
 const siguiente=e.base.prepare("SELECT fecha FROM programaciones_avisos WHERE json_extract(datos,'$.destino.id')=? ORDER BY fecha LIMIT 1").get(deuda.id)!;
 assert.equal(siguiente.fecha,'2026-11-10T13:31:00.000Z');
});

test('apagar y reactivar el general conserva tipos y horarios y solo cancela/recrea las alarmas',async t=>{
 const e=await escenario(t),ajustes=await e.cargarAjustesAvisos();
 ajustes.tipos.registro.hora='21:07';ajustes.tipos.debo.activo=false;await e.guardarAjustesAvisos(ajustes);await e.reconciliarRecordatorios();
 const guardado=JSON.stringify(await e.cargarAjustesAvisos());assert.ok(e.avisosNativos.size>0);
 await e.actualizarPreferencias({notificaciones_activas:false});await e.reconciliarRecordatorios();assert.equal(e.avisosNativos.size,0);
 assert.equal(JSON.stringify(await e.cargarAjustesAvisos()),guardado);
 await e.actualizarPreferencias({notificaciones_activas:true});await e.reconciliarRecordatorios();assert.ok(e.avisosNativos.size>0);
 assert.equal(JSON.stringify(await e.cargarAjustesAvisos()),guardado);
});

test('guardar espera la programación local más reciente aunque ya haya otra reconciliación en curso y no llama a la red',async t=>{
 const e=await escenario(t);let iniciada!:()=>void,soltar!:()=>void;
 const inicio=new Promise<void>(r=>iniciada=r),pausa=new Promise<void>(r=>soltar=r);
 e.interceptarProgramacion(async()=>{e.interceptarProgramacion(null);iniciada();await pausa;});
 const primera=e.reconciliarRecordatorios();await inicio;
 const ajustes=await e.cargarAjustesAvisos();ajustes.tipos.registro.hora='21:10';let guardada=false;
 const segunda=e.guardarYProgramarAvisos(ajustes).then(()=>{guardada=true;});
 await Promise.resolve();assert.equal(guardada,false);soltar();await Promise.all([primera,segunda]);
 const filas=e.base.prepare("SELECT fecha,nativo FROM programaciones_avisos WHERE json_extract(datos,'$.tipo')='registro' ORDER BY fecha").all();assert.equal(filas.length,60);
 assert.equal(filas[0].fecha,'2026-11-10T00:10:00.000Z');assert.ok(filas.every(f=>e.avisosNativos.has(String(f.nativo))));
 assert.equal((await e.cargarAjustesAvisos()).tipos.registro.hora,'21:10');
});

test('una alarma retrasada por Android no se cancela al pasar la hora; sí al resolver la deuda',async t=>{
 const e=await escenario(t),persona=await e.guardarPersona({nombre:'Lucía',apellido:'Pérez',apodo:'Lu'});assert.ok(persona);
 const deuda=await e.crearDeudaPersonal({personaId:persona.id,direccion:'debo',monto:'100',descripcion:'Pendiente'});
 await e.reconciliarRecordatorios();
 const fila=e.base.prepare("SELECT nativo FROM programaciones_avisos WHERE json_extract(datos,'$.destino.id')=? ORDER BY fecha LIMIT 1").get(deuda.id)!;
 e.retenerAlarmasVencidas(true);e.viajar('2026-11-09T12:15:00Z');await e.reconciliarRecordatorios();assert.ok(e.avisosNativos.has(String(fila.nativo)),'Android todavía puede entregar esta alarma');
 await e.registrarPagoDeuda({deudaId:deuda.id,monto:'100',claveOperacion:'pago-retrasado'},{depositoId:e.deposito.id});await e.reconciliarRecordatorios();assert.ok(!e.avisosNativos.has(String(fila.nativo)));
});

test('abrir el historial materializa los recordatorios vencidos sin esperar al controlador ni a Internet',async t=>{
 const e=await escenario(t);await e.reconciliarRecordatorios();e.viajar('2026-11-10T01:00:00Z');
 const pagina=await e.cargarPaginaAvisos('todas');assert.ok(pagina.avisos.some(a=>a.tipo==='registro'));
 const cantidad=e.base.prepare('SELECT COUNT(*) n FROM avisos_locales').get()!.n;
 await e.cargarPaginaAvisos('todas');assert.equal(e.base.prepare('SELECT COUNT(*) n FROM avisos_locales').get()!.n,cantidad);
});

test('el error nativo de programación llega a Guardar y el siguiente intento puede recuperarse',async t=>{
 const e=await escenario(t);e.interceptarProgramacion(async()=>{throw Error('Fallo nativo simulado');});
 await assert.rejects(e.guardarYProgramarAvisos(await e.cargarAjustesAvisos()),/Fallo nativo simulado/);
 e.interceptarProgramacion(null);await e.guardarYProgramarAvisos(await e.cargarAjustesAvisos());assert.ok(e.avisosNativos.size>0);
});

test('si el sistema pierde una alarma futura, la app la repone aunque SQLite conserve el identificador',async t=>{
 const e=await escenario(t);await e.reconciliarRecordatorios();const id=[...e.avisosNativos.keys()][0];
 e.avisosNativos.delete(id);await e.reconciliarRecordatorios();assert.ok(e.avisosNativos.has(id));
});
