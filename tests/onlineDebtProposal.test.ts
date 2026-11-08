import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {preparar} from './helpers/localDatabase.ts';
import type {LoteSync} from '../src/sync/protocol.ts';

test('la propuesta espera la sincronización privada y reutiliza su identificador tras perder la respuesta',async prueba=>{
  let offline=false,perderRespuesta=true,revision=0;
  const deudasRemotas=new Set<string>(),propuestas=new Set<string>(),intentos:string[]=[];
  const transporte:typeof fetch=async(url,opciones)=>{
    if(offline)throw new Error('sin red');
    const ruta=String(url);
    if(ruta.endsWith('/social/deudas/propuestas')){
      const datos=JSON.parse(String(opciones?.body));
      assert.ok(deudasRemotas.has(datos.deudaLocalId),'La deuda debe existir remotamente antes de proponerla');
      propuestas.add(datos.idOperacion);intentos.push(datos.idOperacion);
      if(perderRespuesta){perderRespuesta=false;throw new Error('respuesta perdida');}
      return Response.json({id:datos.propuestaId});
    }
    if(ruta.endsWith('/sync')&&opciones?.method==='POST'){
      const lote=JSON.parse(String(opciones.body)) as LoteSync;
      assert.equal(lote.base,revision);
      for(const cambio of lote.cambios)if(cambio.tabla==='deudas')deudasRemotas.add(String(cambio.datos.id));
      return Response.json({revision:++revision});
    }
    if(ruta.endsWith('/social/salas'))return Response.json({salas:[]});
    if(ruta.endsWith('/social/deudas'))return Response.json({deudas:[]});
    if(ruta.endsWith('/social/vinculos'))return Response.json({vinculos:[]});
    if(ruta.endsWith('/social/operaciones-personales'))return Response.json({operaciones:[]});
    return Response.json({revision,generacion:1,lotes:[],mas:false});
  };
  const e=await preparar(prueba,true,{url:'https://ahre.test/api/v1',fetch:transporte});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Prueba',correo_electronico:'propuesta@example.test',activo:1});
  await e.guardarSesionRemota(usuario.id,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
  await e.crearSesion(usuario.id,false);
  const persona=await e.guardarPersona({nombre:'Sofi',apellido:'Prueba',apodo:'Sofi'});assert.ok(persona);
  const deuda=await e.crearDeudaPersonal({id:randomUUID(),personaId:persona.id,direccion:'debo',monto:'120',descripcion:'Deuda nueva'});
  offline=true;
  await assert.rejects(e.proponerDeudaOnline(deuda.id),/pendientes/);
  assert.equal(propuestas.size,0);
  offline=false;
  await assert.rejects(e.proponerDeudaOnline(deuda.id),/conexión|respuesta/i);
  await e.proponerDeudaOnline(deuda.id);
  assert.deepEqual(intentos,['propuesta:'+deuda.id,'propuesta:'+deuda.id]);
  assert.equal(propuestas.size,1);
  assert.equal((await e.cargarSocial()).deudas.length,1);
});
