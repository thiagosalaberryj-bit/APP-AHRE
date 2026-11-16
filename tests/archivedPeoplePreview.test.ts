import assert from 'node:assert/strict';
import test from 'node:test';
import {preparar} from './helpers/localDatabase.ts';
import {interfazSocial} from './helpers/socialInterface.ts';

for(const tema of ['claro','oscuro'] as const)test('archivadas se abre debajo de la lista en un modal y desarchiva sin perder datos en '+tema,async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});
 const datos=await e.cargarSocial(),archivada=datos.personas.find(p=>p.nombre==='Diego')!;
 assert.equal(archivada.activa,false);assert.equal((await e.cargarPerfil()).usuario.apellido,'AHRE');
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.PERSONAS_SOCIAL,{todas:true});
 assert.ok(!vista.texto().includes('Diego Medina'));
 const controles=vista.todos(),indice=controles.indexOf(vista.buscarBoton('Ver personas archivadas'));
 assert.ok(controles.filter(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel||'').startsWith('Abrir persona ')).every(n=>controles.indexOf(n)<indice));
 await vista.pulsar('Ver personas archivadas');assert.ok(vista.todos().some(n=>n.type==='Modal'));assert.ok(vista.texto().includes('Diego Medina'));
 await vista.pulsar('Desarchivar a Diego Medina');assert.equal((await e.cargarSocial()).personas.find(p=>p.id===archivada.id)!.activa,true);
 await vista.pulsar('Cerrar personas archivadas');assert.ok(vista.buscarBoton('Abrir persona Diego Medina'));
 await e.prepararDatosPrueba({vistaSocialOnline:true});assert.equal((await e.cargarSocial()).personas.find(p=>p.id===archivada.id)!.activa,true);
 assert.deepEqual((await e.cargarSocial()).deudas,datos.deudas);
});

test('la solicitud demo exige ficha con apodo y muestra correo sin llamar al servidor',async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});
 const datos=await e.cargarSocial(),vista=interfazSocial(e,'claro');
 await vista.abrir(vista.rutas.PERSONAS_SOCIAL,{todas:true});await vista.pulsar('Aceptar vínculo de Martina');
 await vista.pulsar('Registrar y aceptar vínculo');assert.ok(vista.texto().includes('Completá un apodo'));
 await vista.llenar('Apodo','Marti');await vista.pulsar('Registrar y aceptar vínculo');
 const persona=(await e.cargarSocial()).personas.find(p=>p.apodo==='Marti')!;assert.ok(persona);
 const vinculos=await e.leerDatosOnline<import('../src/social/online/types').VinculoOnline[]>(datos.usuarioId,'vinculos',[]);
 assert.equal(vinculos.find(v=>v.persona_id===persona.id)!.estado,'confirmado');
 assert.equal(vinculos.find(v=>v.persona_id===persona.id)!.correo_electronico,'martina@ejemplo.ahre.test');
 assert.equal(e.base.prepare('SELECT COUNT(*) n FROM comandos_sociales_locales').get()!.n,0);
});

test('los vínculos locales permiten solicitar y cancelar sin servidor y el pago marcado resuelve el aviso demo',async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});
 const datos=await e.cargarSocial(),persona=datos.personas.find(p=>p.nombre==='Ana')!;
 const respuesta=await e.solicitarVinculoOnline(persona.id,'ana@ejemplo.ahre.test') as {id:string};
 await e.cancelarVinculoOnline(respuesta.id);
 assert.equal((await e.leerDatosOnline<import('../src/social/online/types').VinculoOnline[]>(datos.usuarioId,'vinculos',[])).find(v=>v.id===respuesta.id)!.estado,'cancelado');
 const sala=datos.salas.find(s=>s.nombre==='Demo · Viaje con amigos')!,detalle=await e.obtenerSalaOnline(sala.id),aviso=detalle.solicitudes.find(q=>q.tipo==='parte_pagada'&&q.estado==='pendiente')!;
 assert.ok(aviso.monto_parte);
 await e.marcarPartePagada(sala.id,aviso.gasto_id!,aviso.personaId!,true);
 await e.sincronizarSocialOnline();
 assert.equal((await e.obtenerSalaOnline(sala.id)).solicitudes.find(q=>q.id===aviso.id)!.estado,'resuelta');
});
