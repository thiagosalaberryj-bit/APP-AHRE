import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.ts';
import { presente } from './helpers/assertions.ts';
import { interfazSocial } from './helpers/socialInterface.ts';

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
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, 12);
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
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, 8);
  assert.equal(presente(e.base.prepare('SELECT SUM(saldo_actual) AS saldo FROM depositos').get()).saldo, 871000);
});

test('reentrar conserva personas desactivadas, gastos editados, deudas pagadas y sala cerrada', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const inicial = await e.cargarSocial(), sala = inicial.salas[0], gasto = sala.gastos[0];
  await e.guardarGasto({ salaId: sala.id, gastoId: gasto.id, version: gasto.version, claveOperacion: 'edicion-ejemplo', descripcion: 'Ejemplo corregido', monto: String(gasto.montoNumero), pagadorId: gasto.pagadorId, reparto: gasto.reparto, involucradas: gasto.partes.map(p => p.personaId), pagaron: gasto.partes.filter(p => p.tipo === 'saldado').map(p => p.personaId), montosManuales: Object.fromEntries(gasto.partes.map(p => [p.personaId, p.montoNumero])) });
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
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, 6);
});

test('un lote válido de cien gastos conserva todos los centavos y genera trescientas deudas al cerrar', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const inicial = await e.cargarSocial(), personasIds = inicial.personas.map(p => p.id);
  const sala = await e.crearSala({ nombre: 'Cien ítems', fecha: '2026-11-01', categoriaId: 'alimentacion', icono: 'restaurant-outline', color: '#BED5C8', personasIds });
  const lista = Array.from({ length: 100 }, (_, i) => ({ id: `lote-${i}`, claveOperacion: `lote-${i}`, salaId: sala.id, descripcion: `Ítem ${i + 1}`, monto: '10,01', pagadorId: 'vos', reparto: 'iguales', involucradas: ['vos', ...personasIds], pagaron: [] }));
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
  assert.equal(presente(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, 6);
});
