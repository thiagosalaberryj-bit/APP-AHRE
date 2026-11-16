import assert from 'node:assert/strict';
import test from 'node:test';
import {preparar} from './helpers/localDatabase.ts';
import {interfazSocial} from './helpers/socialInterface.ts';
import {gastoDePendiente,pendientesCierreLocales} from '../src/social/roomClosing.ts';

for(const tema of ['claro','oscuro'] as const)test('el café ya pagado y asociado no aparece pendiente ni bloquea el cierre local en '+tema,async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba();
 const sala=(await e.cargarSocial()).salas.find(s=>s.nombre==='Encuentro de prueba')!;
 const cafe=sala.gastos.find(g=>g.descripcion==='Café ya pagado de prueba')!;
 const propia=cafe.partes.find(p=>p.personaId==='vos')!;
 assert.equal(propia.tipo,'saldado');assert.equal(propia.pendienteNumero,0);assert.equal(propia.pagadoNumero,750);
 assert.equal(pendientesCierreLocales(sala).length,0);
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});
 assert.equal(vista.buscarBoton('Cerrar sala').props.disabled,false);
 assert.ok(!vista.texto().includes(cafe.descripcion));
 const fila=e.base.prepare('SELECT plan_pagos FROM gastos_compartidos WHERE id=?').get(cafe.id)!;
 const plan=JSON.parse(String(fila.plan_pagos));plan.financiaciones={};
 e.base.prepare('UPDATE gastos_compartidos SET plan_pagos=? WHERE id=?').run(JSON.stringify(plan),cafe.id);
 const actual=(await e.cargarSocial()).salas.find(s=>s.id===sala.id)!;
 assert.equal(pendientesCierreLocales(actual).length,1);
 assert.equal(pendientesCierreLocales(actual)[0].descripcion,'Pago: '+cafe.descripcion);
 await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});assert.equal(vista.buscarBoton('Cerrar sala').props.disabled,true);
});

for(const tema of ['claro','oscuro'] as const)test('el reparto inicia abierto, permite abrir gastos y conserva el plegado al actualizar en '+tema,async t=>{
 const e=await preparar(t);await e.prepararDatosPrueba({vistaSocialOnline:true});
 const datos=await e.cargarSocial(),sala=datos.salas.find(s=>s.nombre==='Demo · Viaje con amigos')!;
 const pendientes=sala.gastos.flatMap(g=>g.partes.filter(p=>p.tipo!=='saldado'&&!p.cancelada).map(p=>({g,p})));
 assert.ok(pendientes.length);
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});
 const filas=()=>vista.todos().filter(n=>n.type==='Pressable'&&n.props.accessibilityHint==='Abre el ítem y sus pagos.');
 assert.deepEqual(vista.buscarBoton('Quién le debe a quién').props.accessibilityState,{expanded:true});assert.equal(filas().length,pendientes.length);
 assert.ok(vista.texto().includes('Tu balance en esta sala'));
 await (filas()[0].props.onPress as ()=>void)();
 assert.deepEqual(vista.destinos.at(-1),[vista.rutas.GASTO_SOCIAL,{salaId:sala.id,gastoId:pendientes[0].g.id}]);
 await vista.pulsar('Quién le debe a quién');assert.equal(filas().length,0);
 await vista.asentar();
 assert.equal(filas().length,0);assert.deepEqual(vista.buscarBoton('Quién le debe a quién').props.accessibilityState,{expanded:false});
 await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});assert.equal(filas().length,pendientes.length);
});

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
