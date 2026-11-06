import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {preparar} from './helpers/localDatabase.ts';

async function cuentaNueva(t:import('node:test').TestContext,registrarSql:(sql:string)=>void){
  const e=await preparar(t,true,{url:'http://127.0.0.1/api/v1',fetch:async()=>{throw new Error('sin red');},registrarSql});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Prueba',correo_electronico:'pruebas@ahre.test',activo:1});
  await e.registrarAutorizacion(usuario.id,await e.obtenerInstalacion(),0);
  await e.crearSesion(usuario.id,false);
  return {...e,usuario};
}

test('la primera lectura crea una sola identidad y las siguientes no escriben ni emiten pendientes',async t=>{
  const sql:string[]=[];const e=await cuentaNueva(t,s=>sql.push(s));
  let avisos=0;const dejar=e.observarCambiosLocales(()=>avisos++);t.after(dejar);
  const [uno,dos]=await Promise.all([e.cargarSocial(),e.cargarSocial()]);
  assert.equal(uno.personaActual.idPersistente,dos.personaActual.idPersistente);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM personas').get()!.n,1);
  assert.equal(avisos,1);
  const cola=JSON.stringify(e.base.prepare('SELECT * FROM sync_outbox').all());sql.length=0;
  assert.equal(JSON.stringify(await e.cargarSocial()),JSON.stringify(uno));
  assert.ok(sql.length>0);assert.ok(sql.every(s=>/^SELECT/i.test(s)));
  assert.ok(sql.every(s=>!s.includes('SELECT MAX(secuencia) AS n')));
  assert.equal(avisos,1);assert.equal(JSON.stringify(e.base.prepare('SELECT * FROM sync_outbox').all()),cola);
});

test('un error de lectura revierte la identidad inicial y permite reintentar sin duplicarla',async t=>{
  let fallar=true;
  const e=await cuentaNueva(t,sql=>{if(fallar&&sql.includes('FROM "gastos_compartidos"'))throw new Error('fallo de lectura');});
  const cola=JSON.stringify(e.base.prepare('SELECT * FROM sync_outbox').all());
  await assert.rejects(e.cargarSocial());
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM personas').get()!.n,0);
  assert.equal(JSON.stringify(e.base.prepare('SELECT * FROM sync_outbox').all()),cola);
  fallar=false;assert.equal((await e.cargarSocial()).personas.length,0);
  assert.equal(e.base.prepare('SELECT COUNT(*) n FROM personas').get()!.n,1);
});

test('las consultas conservan los adelantos y reflejan las ediciones sin usar datos cacheados',async t=>{
  const e=await preparar(t);await e.prepararDatosPrueba();
  const antes=await e.cargarSocial();
  const persona=antes.personas[0];
  const deuda=await e.crearDeudaPersonal({personaId:persona.id,direccion:'me_deben',monto:'100',descripcion:'Adelanto de prueba'}, {depositoId:antes.depositos[0].id});
  const actualizado=await e.cargarSocial();
  const visible=actualizado.deudas.find(d=>d.id===deuda.id)!;
  assert.ok(visible);assert.match(visible.origen,/Adelanto/);assert.equal(visible.movimientoOrigen!.monto,100);
  assert.equal(antes.deudas.some(d=>d.id===deuda.id),false);
  assert.deepEqual(await e.cargarSocial(),actualizado);
});
