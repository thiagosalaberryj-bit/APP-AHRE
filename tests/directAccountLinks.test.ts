import assert from 'node:assert/strict';
import test from 'node:test';
import {randomUUID} from 'node:crypto';
import {preparar} from './helpers/localDatabase.ts';

test('vincular sincroniza la ficha, normaliza el correo y permite solicitar otra vez después de cancelar una respuesta perdida',async prueba=>{
  let revision=0,perder=true,numero=0;
  let vinculo:{id:string;persona_id:string;cuenta_id:string;nombre:string;estado:string}|null=null;
  const operaciones=new Map<string,object>(),solicitudes:string[]=[],personas=new Set<string>();
  const transporte:typeof fetch=async(url,opciones)=>{
    const ruta=String(url),datos=opciones?.body?JSON.parse(String(opciones.body)):undefined;
    if(ruta.endsWith('/social/vinculos/solicitar')){
      assert.ok(personas.has(datos.personaId));assert.equal(datos.correo,'sofi@example.test');
      solicitudes.push(datos.idOperacion);
      if(operaciones.has(datos.idOperacion))return Response.json(operaciones.get(datos.idOperacion));
      vinculo={id:'vinculo-'+(++numero),persona_id:datos.personaId,cuenta_id:'sofi',nombre:'Sofi',estado:'solicitado'};
      const resultado={id:vinculo.id,estado:vinculo.estado};operaciones.set(datos.idOperacion,resultado);
      if(perder){perder=false;throw new Error('respuesta perdida');}
      return Response.json(resultado);
    }
    if(ruta.endsWith('/cancelar')){assert.ok(vinculo);vinculo.estado='cancelado';return Response.json({id:vinculo.id,estado:'cancelado'});}
    if(ruta.endsWith('/sync')&&opciones?.method==='POST'){
      assert.equal(datos.base,revision);
      for(const cambio of datos.cambios)if(cambio.tabla==='personas')personas.add(cambio.datos.id);
      return Response.json({revision:++revision});
    }
    if(ruta.endsWith('/social/vinculos'))return Response.json({vinculos:vinculo?[vinculo]:[]});
    if(ruta.endsWith('/social/salas'))return Response.json({salas:[]});
    if(ruta.endsWith('/social/deudas'))return Response.json({deudas:[]});
    if(ruta.endsWith('/social/operaciones-personales'))return Response.json({operaciones:[]});
    return Response.json({revision,generacion:1,lotes:[],mas:false});
  };
  const e=await preparar(prueba,true,{url:'https://ahre.test/api/v1',fetch:transporte});
  const usuario=await e.usuariosRepositorio.crear({id:randomUUID(),nombre:'Juan',correo_electronico:'juan@example.test',activo:1});
  await e.guardarSesionRemota(usuario.id,{token:'a'.repeat(64),vence:Date.now()+86400000,usuario,dispositivoId:await e.obtenerInstalacion(),generacion:1,revision:0},false);
  await e.crearSesion(usuario.id,false);
  const persona=await e.guardarPersona({nombre:'Sofi',apellido:'Prueba',apodo:'Sofi'});assert.ok(persona);
  await assert.rejects(e.solicitarVinculoOnline(persona.id,' Sofi@Example.Test '));
  await e.sincronizarSocialOnline();
  await e.cancelarVinculoOnline('vinculo-1');
  await e.solicitarVinculoOnline(persona.id,' Sofi@Example.Test ');
  assert.equal(numero,2);assert.notEqual(solicitudes[0],solicitudes[1]);
  const cache=await e.leerDatosOnline<{id:string;estado:string}[]>(usuario.id,'vinculos',[]);
  assert.equal(cache[0].id,'vinculo-2');assert.equal(cache[0].estado,'solicitado');
  const despues=await e.cargarSocial();assert.equal(despues.salas.length,0);assert.equal(despues.deudas.length,0);
  assert.equal(despues.personas[0].id,persona.id);
});
