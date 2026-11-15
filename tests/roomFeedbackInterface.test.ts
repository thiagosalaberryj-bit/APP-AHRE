import assert from 'node:assert/strict';
import test from 'node:test';
import {preparar} from './helpers/localDatabase.ts';
import {interfazSocial} from './helpers/socialInterface.ts';
import {gastoDePendiente} from '../src/social/roomClosing.ts';

for(const tema of ['claro','oscuro'] as const)test('cierre muestra quién falta, bloquea guardar y la tarjeta de gasto no contiene texto fuera de Text en '+tema,async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});
 const datos=await e.cargarSocial(),sala=datos.salas.find(s=>s.nombre==='Demo · Viaje con amigos')!,detalle=await e.obtenerSalaOnline(sala.id);
 assert.ok(detalle.pendientesCierre!.some(p=>p.personaId!==detalle.personaPropiaId));
 await assert.rejects(e.cerrarSala(sala.id),/Falta registrar/);
 assert.equal((await e.obtenerSalaOnline(sala.id)).sala.estado,'abierta');
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});
 assert.ok(vista.texto().includes('Pendientes para cerrar'));assert.ok(vista.texto().includes('Bruno'));
 assert.equal(vista.buscarBoton('Cerrar sala').props.disabled,true);
 assert.ok(!vista.texto().includes('Categoría por gasto'));assert.ok(!vista.texto().includes(sala.gastos.length+' gastos'));
 assert.ok(vista.texto().includes(sala.fecha+' · '+(sala.participantes.length+1)+' participantes'));
 const descripcion=vista.todos().find(n=>n.type==='Text'&&vista.texto(n)===sala.descripcion)!;
 assert.ok(descripcion);assert.equal(descripcion.props.numberOfLines,undefined);
 const propio=detalle.pendientesCierre!.find(p=>p.personaId===detalle.personaPropiaId&&!p.clave.startsWith('solicitud:'))!;
 const gastoId=gastoDePendiente(propio.clave,sala.gastos)!;assert.ok(gastoId);
 await vista.pulsar('Registrar '+propio.descripcion);
 assert.deepEqual(vista.destinos.at(-1),[vista.rutas.GASTO_SOCIAL,{salaId:sala.id,gastoId}]);
 for(const otro of detalle.pendientesCierre!.filter(p=>p.personaId!==detalle.personaPropiaId))assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Registrar '+otro.descripcion));
 assert.ok(vista.todos().some(n=>Array.isArray(n.props.style)&&n.props.style.some(s=>s&&typeof s==='object'&&'borderTopWidth' in s&&s.borderTopWidth===1)));
 await vista.pulsar('Simular registros de los demás');assert.equal(vista.buscarBoton('Cerrar sala').props.disabled,true);
 assert.ok((await e.obtenerSalaOnline(sala.id)).pendientesCierre!.some(p=>p.personaId===detalle.personaPropiaId));
 await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'cerrar',salaId:sala.id});
 assert.ok(!vista.texto().includes('Pendientes para cerrar'));assert.ok(!vista.texto().includes('Simular registros de los demás'));
 assert.equal(vista.buscarBoton('Confirmar cierre').props.disabled,true);
 const aviso=detalle.solicitudes.find(q=>q.tipo==='parte_pagada')!;
 await vista.abrir(vista.rutas.GASTO_SOCIAL,{salaId:sala.id,gastoId:aviso.gasto_id!});
 assert.ok(vista.buscarBoton('Aceptar solicitud'));
 for(const n of vista.todos().filter(n=>['View','Pressable','ScrollView'].includes(String(n.type)))){const hijos:unknown[]=[];const agregar=(valor:unknown):void=>{if(Array.isArray(valor))valor.forEach(agregar);else hijos.push(valor);};agregar(n.children);for(const hijo of hijos)assert.ok(typeof hijo!=='string'&&typeof hijo!=='number','Texto fuera de Text: '+String(hijo));}
 for(const q of detalle.solicitudes.filter(q=>q.tipo==='parte_pagada'&&q.estado==='pendiente'))await e.enviarAccionSocial('rechazar:'+q.id,'/solicitudes/'+q.id+'/decidir',{decision:'rechazada'});
 for(const op of (await e.obtenerSalaOnline(sala.id)).misFinanzas||[])if(!op.seleccion)await e.elegirFinanciacionSala(sala.id,op,{depositoId:datos.depositos[0].id});
 await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});assert.equal(vista.buscarBoton('Cerrar sala').props.disabled,false);
 await vista.pulsar('Cerrar sala');assert.deepEqual(vista.destinos.at(-1),[vista.rutas.REGISTRO_SOCIAL,{tipo:'cerrar',salaId:sala.id}]);
});

test('los accesos de pendientes reconocen claves del servidor, locales y de demo sin confundir avisos',()=>{
 const gastos=[{id:'gasto:uno'},{id:'gasto:dos'}];
 for(const clave of ['compra:gasto:uno','parte:gasto:uno:persona:salida',JSON.stringify(['vos','gasto:uno','compra'])])assert.equal(gastoDePendiente(clave,gastos),'gasto:uno');
 for(const clave of ['solicitud:gasto:uno','compra:inexistente','[invalida'])assert.equal(gastoDePendiente(clave,gastos),undefined);
});

test('la aceptación usa selector deslizante y lista buscable para reutilizar una persona',async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});const vista=interfazSocial(e,'claro');
 await vista.abrir(vista.rutas.PERSONAS_SOCIAL,{todas:true});await vista.pulsar('Aceptar vínculo de Martina');
 await vista.pulsar('Registrar vínculo: Seleccionar persona');await vista.llenar('Buscar persona existente','Ana');
 await vista.pulsar('Seleccionar a Ana García');await vista.pulsar('Registrar y aceptar vínculo');
 const datos=await e.cargarSocial(),ana=datos.personas.find(p=>p.nombre==='Ana')!;
 const vinculos=await e.leerDatosOnline<import('../src/social/online/types').VinculoOnline[]>(datos.usuarioId,'vinculos',[]);
 assert.equal(vinculos.find(v=>v.cuenta_id==='demo-social:cuenta-martina')!.persona_id,ana.id);
});
