import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {preparar} from './helpers/localDatabase.ts';
import type {DeudaOnline} from '../src/social/online/types.ts';

test('social: una actualización solicitada durante otra descarga recupera las novedades posteriores antes de terminar',async t=>{
  let pendiente=120,descargas=0,concurrentes=0,maximoConcurrentes=0;
  let liberar!:()=>void,avisarDescarga!:()=>void;
  const bloqueo=new Promise<void>(resolve=>{liberar=resolve;}),descargada=new Promise<void>(resolve=>{avisarDescarga=resolve;});
  const transporte:typeof fetch=async(url)=>{
    const ruta=String(url);
    if(ruta.endsWith('/social/salas'))return Response.json({salas:[]});
    if(ruta.endsWith('/social/deudas')){
      descargas++;concurrentes++;maximoConcurrentes=Math.max(maximoConcurrentes,concurrentes);
      return Response.json({deudas:[{id:'deuda',pendiente}]});
    }
    if(ruta.endsWith('/social/vinculos'))return Response.json({vinculos:[]});
    if(ruta.endsWith('/social/operaciones-personales')){
      if(descargas===1){avisarDescarga();await bloqueo;}
      concurrentes--;return Response.json({operaciones:[]});
    }
    return Response.json({revision:0,generacion:1,lotes:[],mas:false});
  };
  const e=await preparar(t,true,{url:'https://ahre.test/api/v1',fetch:transporte});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Social',correo_electronico:'social@example.test',activo:1});
  await e.guardarSesionRemota(usuario.id,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
  await e.crearSesion(usuario.id,false);
  const primera=e.sincronizarSocialOnline();await descargada;
  pendiente=105;
  const segunda=e.sincronizarSocialOnline(),tercera=e.sincronizarSocialOnline();
  await new Promise<void>(resolve=>setImmediate(resolve));liberar();
  await Promise.all([primera,segunda,tercera]);
  assert.equal((await e.leerDatosOnline<DeudaOnline[]>(usuario.id,'deudas',[]))[0].pendiente,105);
  assert.equal(descargas,2);assert.equal(maximoConcurrentes,1);
});

test('social: sin novedades no descarga todo ni reescribe el caché; un evento y volver a primer plano sí recuperan',async t=>{
  let descargas=0,evento=0,escrituras=0;
  let instante=Date.now();class Reloj extends Date{static override now(){return instante;}}
  const transporte:typeof fetch=async(url)=>{
    const ruta=String(url);
    if(ruta.includes('/social/eventos?'))return Response.json({eventos:evento?[{id:evento}]:[],mas:false});
    if(ruta.endsWith('/social/salas')){descargas++;return Response.json({salas:[]});}
    if(ruta.endsWith('/social/deudas'))return Response.json({deudas:[]});
    if(ruta.endsWith('/social/vinculos'))return Response.json({vinculos:[]});
    if(ruta.endsWith('/social/operaciones-personales'))return Response.json({operaciones:[]});
    return Response.json({revision:0,generacion:1,lotes:[],mas:false});
  };
  const e=await preparar(t,true,{url:'https://ahre.test/api/v1',fetch:transporte,reloj:Reloj,registrarSql:sql=>{if(/INSERT|UPDATE|DELETE/i.test(sql))escrituras++;}});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Social',correo_electronico:'eventos@example.test',activo:1});
  await e.guardarSesionRemota(usuario.id,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);await e.crearSesion(usuario.id,false);
  await e.recuperarEventosSociales();assert.equal(descargas,1);const anteriores=escrituras;
  await e.recuperarEventosSociales();await e.recuperarEventosSociales();
  assert.equal(descargas,1);assert.equal(escrituras,anteriores);
  evento=1;await e.recuperarEventosSociales();assert.equal(descargas,2);
  await e.recuperarEventosSociales();assert.equal(descargas,2);
  await e.recuperarEventosSociales(true);assert.equal(descargas,3);
  instante+=60001;await e.recuperarEventosSociales();assert.equal(descargas,4);
  instante-=120000;await e.recuperarEventosSociales();assert.equal(descargas,5);
});
