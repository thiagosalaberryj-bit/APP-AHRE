import assert from 'node:assert/strict';
import test from 'node:test';

test('la vista online de prueba incluye salas, solicitudes, vínculos e invitaciones sin tocar saldos ni duplicarse',async prueba=>{
 const e=await preparar(prueba);await e.prepararDatosPrueba();
 const antes=e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo;
 await e.prepararDatosPrueba({vistaSocialOnline:true});
 const datos=await e.cargarSocial(),demos=datos.salas.filter(s=>s.id.startsWith('demo-social:'));
 assert.equal(demos.length,4);assert.ok(demos.some(s=>s.estado==='cerrada'));assert.ok(demos.some(s=>!s.administrador));
 assert.ok(datos.deudas.some(d=>d.invitacionOnline));assert.ok(datos.deudas.some(d=>d.saldada&&d.soloOnline));
 assert.equal(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo,antes);
 await e.prepararDatosPrueba({vistaSocialOnline:true});assert.equal((await e.cargarSocial()).salas.length,datos.salas.length);
 assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(),[]);
});

for(const tema of ['claro','oscuro'] as const)test(`los ejemplos sociales permiten revisar solicitudes y omiten fichas vinculadas al admitir en ${tema}`,async prueba=>{
 const e=await preparar(prueba);await e.prepararDatosPrueba({vistaSocialOnline:true});
 const datos=await e.cargarSocial(),sala=presente(datos.salas.find(s=>s.nombre==='Demo · Viaje con amigos'));
 const cache=presente(e.base.prepare('SELECT datos FROM salas_online_locales WHERE sala_id=?').get(sala.id));
 const detalle=JSON.parse(String(cache.datos)),bruno=datos.personas.find(p=>p.nombre==='Bruno')!;
 // El vínculo de agenda también excluye la ficha si la identidad de la sala aún no se actualizó.
 detalle.identidades=detalle.identidades.filter((i:{personaId:string})=>i.personaId!==bruno.id);
 e.base.prepare('UPDATE salas_online_locales SET datos=? WHERE sala_id=?').run(JSON.stringify(detalle),sala.id);
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.SALA_SOCIAL,{salaId:sala.id});
 await vista.pulsar('Sección de sala: Personas');await vista.pulsar('Personas de la sala: Ingresos');
 await vista.pulsar('Revisar ingreso de Lucía · Invitada nueva');await vista.pulsar('Persona de mi agenda');
 const asignaciones=vista.todos().filter(n=>n.type==='Pressable').map(n=>vista.texto(n));
 assert.ok(asignaciones.some(t=>t.trim()==='Ana'));
 assert.ok(!asignaciones.some(t=>t.trim()==='Bruno'||t.trim()==='Carla'));
 await vista.pulsar('Ana');await vista.pulsar('Admitir');
 assert.ok(vista.texto().includes('ya tiene acceso'),vista.texto());await vista.pulsar('Reemplazar acceso anterior');
 assert.equal((await e.obtenerSalaOnline(sala.id)).admisiones?.[0].estado,'aceptada');
 assert.ok(!vista.texto().includes('Ejemplo visual local'));
 assert.equal(presente(e.base.prepare('SELECT COUNT(*) n FROM comandos_sociales_locales').get()).n,0);
});
import { preparar } from './helpers/localDatabase.ts';
import { presente } from './helpers/assertions.ts';
import { interfazSocial } from './helpers/socialInterface.ts';

for(const tema of ['claro','oscuro'] as const)test(`las demos del deudor muestran perdón, rechazo y confirmación sin modificar saldos en ${tema}`,async prueba=>{
 const e=await preparar(prueba);await e.prepararDatosPrueba();
 const antes=e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo;
 const cantidad=e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n;
 await e.prepararDatosPrueba({vistaSocialOnline:true});const datos=await e.cargarSocial();
 const sala=presente(datos.salas.find(s=>s.nombre==='Demo · Del lado de quien debe'));
 assert.equal(sala.administrador,false);assert.equal(sala.gastos.length,5);assert.equal(sala.porPagar,'$ 3.000');
 const perdonada=presente(datos.deudas.find(d=>d.descripcion==='Demo · Me perdonaron la deuda'));
 assert.equal(perdonada.tipo,'debo');assert.equal(perdonada.perdonadoNumero,1000);assert.equal(perdonada.pendienteNumero,0);
 const vista=interfazSocial(e,tema);await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:perdonada.id});
 assert.ok(vista.texto().includes('Te perdonaron · $ 1.000'));assert.ok(vista.texto().includes('Bruno te perdonó este importe'));
 assert.deepEqual(vista.buscarBoton('Ver importe Pagaste').props.accessibilityValue,{text:'$ 0'});
 assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&vista.texto(n)==='Perdonar deuda'));
 const rechazada=presente(datos.deudas.find(d=>d.descripcion==='Demo · Rechazaron mi pago'));
 await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:rechazada.id});
 assert.ok(vista.texto().includes('Pago · $ 250'));assert.ok(vista.texto().includes('Rechazado por Bruno. La deuda no se redujo.'));
 assert.equal(rechazada.pendienteNumero,1000);
 assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&String(n.props.accessibilityLabel)==='Gestionar registro: Pago · $ 250'));
 const cache=presente((await e.leerDatosOnline<import('../src/social/online/types.ts').DeudaOnline[]>(datos.usuarioId,'deudas',[])).find(d=>d.id===rechazada.id));
 await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'pago',deudaId:rechazada.id,pagoId:cache.pagos[0].id,operacionClave:'pago:'+cache.pagos[0].id});
 assert.ok(vista.texto().includes('Este pago fue rechazado'));assert.ok(!vista.texto().includes('Seleccioná un depósito'));
 assert.ok(!vista.todos().some(n=>n.type==='Pressable'&&['Confirmar','Rechazar'].includes(vista.texto(n))));
 const confirmada=presente(datos.deudas.find(d=>d.descripcion==='Demo · Confirmaron mi pago'));
 assert.equal(confirmada.saldada,true);assert.equal(confirmada.perdonadoNumero,0);
 await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:confirmada.id});assert.ok(vista.texto().includes('Pago · $ 1.000'));assert.ok(vista.texto().includes('Confirmado por Bruno'));
 const informada=presente(datos.deudas.find(d=>d.descripcion==='Demo · Mi pago espera confirmación'));
 await vista.abrir(vista.rutas.REGISTRO_SOCIAL,{tipo:'detalleDeuda',deudaId:informada.id});assert.ok(vista.texto().includes('En espera de Bruno'));assert.equal(informada.pendienteNumero,1000);
 assert.equal(e.base.prepare('SELECT SUM(saldo_actual) saldo FROM depositos').get()!.saldo,antes);assert.equal(e.base.prepare('SELECT COUNT(*) n FROM movimientos').get()!.n,cantidad);
 await e.prepararDatosPrueba({vistaSocialOnline:true});await vista.asentar();assert.equal((await e.cargarSocial()).salas.length,datos.salas.length);
 assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(),[]);
});

test('la recurrencia de prueba muestra cinco cobros y conserva su pausa al reentrar',async prueba=>{
  const e=await preparar(prueba);await e.prepararDatosPrueba();
  const recurrencia=presente(e.base.prepare("SELECT * FROM recurrencias WHERE descripcion='Streaming · recurrencia de prueba'").get());
  const historial=await e.consultarHistorialRecurrencia(String(recurrencia.id));
  assert.equal(historial.cantidad,5);assert.equal(historial.total,47500);assert.equal(historial.ultimos.length,5);
  assert.equal(Number(recurrencia.monto),12000);assert.ok(Date.parse(String(recurrencia.proxima_ejecucion))>Date.now());
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM ejecuciones_recurrencia WHERE recurrencia_id=?').get(recurrencia.id)).n,5);
  await e.actualizarRecurrencia(String(recurrencia.id),{activa:false});
  await e.prepararDatosPrueba();
  assert.equal(presente(e.base.prepare('SELECT activa FROM recurrencias WHERE id=?').get(recurrencia.id)).activa,0);
  assert.equal((await e.consultarHistorialRecurrencia(String(recurrencia.id))).total,47500);
});

test('los ejemplos sociales muestran repartos iguales, manuales y pagos sin adelantar movimientos', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const datos = await e.cargarSocial(), sala = datos.salas[0];
  assert.equal(datos.personas.length, 3); assert.equal(sala.participantes.length, 3);
  assert.equal(sala.estado, 'abierta'); assert.equal(sala.gastos.length, 4);
  assert.equal(sala.totalGastado, '$ 29.500'); assert.equal(sala.porCobrar, '$ 9.500'); assert.equal(sala.porPagar, '$ 2.000');
  assert.equal(datos.totales.porPagar, '$ 1.800'); assert.equal(datos.totales.porCobrar, '$ 0');
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM pagos_sociales').get()).n, 0);
  for (const gasto of sala.gastos) {
    assert.equal(gasto.partes.reduce((suma, parte) => suma + Math.round(parte.montoNumero * 100), 0), Math.round(gasto.montoNumero * 100));
    assert.ok(gasto.partes.some(p => p.tipo === 'saldado'));
  }
  const manual = presente(sala.gastos.find(g => g.reparto === 'manual'));
  assert.deepEqual(Array.from(manual.partes, p => p.montoNumero).sort((a, b) => a - b), [1500, 2000, 3000, 3500]);
  assert.equal(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo, 872800);
  assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(), []);
});

test('cerrar la sala de prueba confirma seis movimientos y deudas sin duplicar el cierre', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const sala = (await e.cargarSocial()).salas[0];
  await e.cerrarSala(sala.id); await e.cerrarSala(sala.id);
  const datos = await e.cargarSocial();
  assert.equal(datos.salas[0].estado, 'cerrada'); assert.equal(datos.deudas.length, 5);
  assert.equal(datos.totales.porCobrar, '$ 9.500'); assert.equal(datos.totales.porPagar, '$ 3.800');
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length + 6);
  assert.equal(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo, 857550);
  assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(), []);
});

test('la deuda manual de ejemplo admite pago parcial, reintento y saldo completo', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const datos = await e.cargarSocial(), deuda = datos.deudas[0], depositoId = datos.depositos[0].id;
  const pago = { deudaId: deuda.id, monto: '500', claveOperacion: 'ejemplo-parcial' };
  await e.registrarPagoDeuda(pago, { depositoId }); await e.registrarPagoDeuda(pago, { depositoId });
  assert.equal((await e.cargarSocial()).deudas[0].pendienteNumero, 1300);
  await e.registrarPagoDeuda({ ...pago, monto: '1300', claveOperacion: 'ejemplo-final' }, { depositoId });
  const final = await e.cargarSocial();
  assert.equal(final.deudas[0].saldada, true); assert.equal(final.salas[0].estado, 'abierta');
  assert.equal(final.totales.porPagar, '$ 0');
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length + 2);
  assert.equal(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo, 871000);
});

test('reentrar conserva personas desactivadas, gastos editados, deudas pagadas y sala cerrada', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const inicial = await e.cargarSocial(), sala = inicial.salas[0], gasto = sala.gastos[0];
  await e.guardarGasto({ categoriaId: 'alimentacion', salaId: sala.id, gastoId: gasto.id, version: gasto.version, claveOperacion: 'edicion-ejemplo', descripcion: 'Ejemplo corregido', monto: String(gasto.montoNumero), pagadorId: gasto.pagadorId, reparto: gasto.reparto, involucradas: gasto.partes.map(p => p.personaId), pagaron: gasto.partes.filter(p => p.tipo === 'saldado').map(p => p.personaId), montosManuales: Object.fromEntries(gasto.partes.map(p => [p.personaId, p.montoNumero])) });
  await e.cambiarActividadPersona(inicial.personas[0].id, false);
  await e.registrarPagoDeuda({ deudaId: inicial.deudas[0].id, monto: '1800', claveOperacion: 'pago-ejemplo' }, { depositoId: inicial.depositos[0].id });
  await e.cerrarSala(sala.id);
  const tablas = ['personas', 'salas', 'personas_sala', 'gastos_compartidos', 'participantes_gasto', 'deudas', 'pagos_sociales', 'movimientos', 'depositos'];
  const instantanea = () => JSON.stringify(tablas.map(tabla => e.base.prepare(`SELECT * FROM ${tabla} ORDER BY id`).all()));
  const antes = instantanea(); await e.prepararDatosPrueba();
  assert.equal(instantanea(), antes);
});

test('un fallo en las partes revierte también los ejemplos financieros y permite reintentar', async prueba => {
  const e = await preparar(prueba); await e.inicializarBaseDatos();
  e.base.exec("CREATE TRIGGER fallo_social BEFORE INSERT ON participantes_gasto BEGIN SELECT RAISE(ABORT, 'fallo social'); END;");
  await assert.rejects(e.prepararDatosPrueba());
  for (const tabla of ['depositos', 'movimientos', 'personas', 'salas', 'personas_sala', 'gastos_compartidos', 'participantes_gasto', 'deudas']) assert.equal(presente(e.base.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get()).n, 0, tabla);
  e.base.exec('DROP TRIGGER fallo_social'); await e.prepararDatosPrueba();
  assert.equal((await e.cargarSocial()).salas[0].gastos.length, 4);
  assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(), []);
});

test('una cuenta de pruebas financiera existente puede sumar Social sin duplicar movimientos', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba({ incluirSocial: false });
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM salas').get()).n, 0);
  await e.prepararDatosPrueba(); await e.prepararDatosPrueba();
  assert.equal((await e.cargarSocial()).salas.length, 1);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length);
});

test('un lote válido de cien gastos conserva todos los centavos y genera trescientas deudas al cerrar', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const inicial = await e.cargarSocial(), personasIds = inicial.personas.map(p => p.id);
  const sala = await e.crearSala({ nombre: 'Cien ítems', fecha: '2026-11-01', icono: 'restaurant-outline', color: '#BED5C8', personasIds });
  const lista = Array.from({ length: 100 }, (_, i) => ({ categoriaId: 'alimentacion', id: `lote-${i}`, claveOperacion: `lote-${i}`, salaId: sala.id, descripcion: `Ítem ${i + 1}`, monto: '10,01', pagadorId: 'vos', reparto: 'iguales', involucradas: ['vos', ...personasIds], pagaron: [] }));
  const fondos = lista.map(() => ({ compra: { depositoId: inicial.depositos[0].id } }));
  await e.guardarListaGastos(lista, fondos); await e.guardarListaGastos(lista, fondos);
  const abierta = presente((await e.cargarSocial()).salas.find(s => s.id === sala.id));
  assert.equal(abierta.gastos.length, 100);
  for (const gasto of abierta.gastos) assert.equal(gasto.partes.reduce((s, p) => s + Math.round(p.montoNumero * 100), 0), 1001);
  await e.cerrarSala(sala.id);
  const final = await e.cargarSocial();
  assert.equal(final.deudas.filter(d => d.salaId === sala.id).length, 300);
  assert.equal(final.totales.porCobrar, '$ 750');
  const saldo = Number(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo);
  assert.equal(Math.round(saldo * 100), 87179900);
  assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(), []);
});

for (const tema of ['claro', 'oscuro'] as const) test(`la sala precargada permite consultar gastos y participantes en ${tema}`, async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const sala = (await e.cargarSocial()).salas[0], vista = interfazSocial(e, tema);
  await vista.abrir(vista.rutas.SALA_SOCIAL, { salaId: sala.id }); await vista.pulsar('Gastos');
  assert.ok(vista.texto().includes('Cena compartida de prueba')); assert.ok(vista.texto().includes('Compras con reparto manual'));
  await vista.pulsar('Personas');
  for (const nombre of ['Ana García', 'Bruno Pérez', 'Carla López']) assert.ok(vista.texto().includes(nombre));
});

for (const [nombre, plan] of [
  ['JSON incompleto', '{'], ['valor escalar', '3'], ['lista en lugar de objeto', '[]'],
  ['pagos sin lista', '{"pagaron":"vos"}'], ['identidad sin texto', '{"pagaron":[7]}'],
  ['asociación nula', '{"financiaciones":{"compra":null}}'], ['depósito sin texto', '{"financiaciones":{"compra":{"depositoId":7}}}'],
] as const) test(`un borrador persistido inválido se rechaza: ${nombre}`, async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const gasto = (await e.cargarSocial()).salas[0].gastos[0];
  e.base.prepare('UPDATE gastos_compartidos SET plan_pagos = ? WHERE id = ?').run(plan, gasto.id);
  await assert.rejects(e.cargarSocial(), /borrador/);
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, e.MOVIMIENTOS_PRUEBA.length);
});
