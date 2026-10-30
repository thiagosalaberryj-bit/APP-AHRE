import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.js';

async function escenario(prueba) {
  const entorno = await preparar(prueba);
  const usuario = await entorno.registrarUsuario({ nombre: 'Prueba Social', correo: 'social@example.test', contrasena: 'SocialPrueba123', confirmacion: 'SocialPrueba123' });
  await entorno.crearSesion(usuario.id, false);
  const deposito = await entorno.depositosRepositorio.crear({ usuario_id: usuario.id, nombre: 'Efectivo', tipo: 'efectivo', saldo_inicial: 100000,
    icono: 'cash-outline', fecha_creacion: '2020-01-01T00:00:00.000Z' });
  const lucia = await entorno.guardarPersona({ nombre: 'Lucía', apellido: 'Gómez', apodo: 'Lu' });
  const tomas = await entorno.guardarPersona({ nombre: 'Tomás', apellido: 'Pérez', apodo: 'Tomi' });
  const nuevaSala = (id = 's') => entorno.crearSala({ id, nombre: 'Cena', descripcion: 'Entre amigos', fecha: '2026-10-30',
    categoriaId: 'alimentacion', icono: 'restaurant-outline', color: '#BED5C8', personasIds: [lucia.id, tomas.id] });
  await nuevaSala();
  const gasto = (cambios = {}) => ({ id: 'g', claveOperacion: 'operacion-g', salaId: 's', descripcion: 'Pizzas', monto: '12000', reparto: 'iguales',
    pagadorId: 'vos', involucradas: ['vos', lucia.id, tomas.id], pagaron: [], montosManuales: {}, ...cambios });
  const saldo = () => entorno.base.prepare('SELECT saldo_actual FROM depositos WHERE id = ?').get(deposito.id).saldo_actual;
  const movimientos = () => entorno.base.prepare('SELECT COUNT(*) AS n FROM movimientos').get().n;
  return { ...entorno, usuario, deposito, lucia, tomas, nuevaSala, gasto, saldo, movimientos };
}

test('personas normalizadas, duplicados, baja lógica y reactivación conservan su identidad', async prueba => {
  const e = await escenario(prueba);
  await assert.rejects(e.guardarPersona({ nombre: ' lucia ', apellido: 'GÓMEZ', apodo: 'Otro' }), /Ya existe/);
  await e.cambiarActividadPersona(e.lucia.id, false);
  await assert.rejects(e.guardarPersona({ nombre: 'Otra', apellido: 'Persona', apodo: ' lU ' }), /Ya existe/);
  await e.guardarPersona({ nombre: 'Lucía', apellido: 'Gómez', apodo: 'Lucita' }, e.lucia.id);
  await e.cambiarActividadPersona(e.lucia.id, true);
  const datos = await e.cargarSocial();
  assert.equal(datos.personas.find(p => p.id === e.lucia.id).apodo, 'Lucita');
  assert.equal(datos.personas.length, 2);
});

test('crear sala es idempotente y el cuarto cupo solo se libera al cerrar una sala', async prueba => {
  const e = await escenario(prueba);
  await e.nuevaSala('s'); await e.nuevaSala('s2'); await e.nuevaSala('s3');
  await assert.rejects(e.nuevaSala('s4'), /tres salas/);
  await e.cerrarSala('s'); await e.cerrarSala('s');
  await e.nuevaSala('s4');
  assert.equal((await e.cargarSocial()).salas.length, 4);
  assert.equal(e.movimientos(), 0);
});

test('compra propia, cierre, cobros parciales y cancelación no duplican movimientos', async prueba => {
  const e = await escenario(prueba);
  const solicitud = e.gasto();
  assert.equal((await e.previsualizarGasto(solicitud)).operaciones.length, 1);
  await e.guardarGasto(solicitud, { compra: { depositoId: e.deposito.id } });
  await e.guardarGasto(solicitud, { compra: { depositoId: e.deposito.id } });
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  assert.equal((await e.cargarSocial()).deudas.length, 0);
  await e.cerrarSala('s'); await e.cerrarSala('s');
  let datos = await e.cargarSocial();
  assert.equal(datos.deudas.length, 2); assert.equal(datos.totales.porCobrar, '$ 8.000');
  const deuda = datos.deudas.find(d => d.personaId === e.lucia.id);
  const pago = { deudaId: deuda.id, monto: '1000', claveOperacion: 'pago-parcial' };
  await e.registrarPagoDeuda(pago, { depositoId: e.deposito.id });
  await e.registrarPagoDeuda(pago, { depositoId: e.deposito.id });
  assert.equal(e.saldo(), 89000); assert.equal(e.movimientos(), 2);
  datos = await e.cargarSocial();
  assert.equal(datos.deudas.find(d => d.id === deuda.id).pendienteNumero, 3000);
  await e.registrarPagoDeuda({ ...pago, monto: '3000', claveOperacion: 'pago-final' }, { depositoId: e.deposito.id });
  assert.equal(e.saldo(), 92000);
  datos = await e.cargarSocial();
  assert.ok(datos.deudas.find(d => d.id === deuda.id).saldada);
  const otra = datos.deudas.find(d => d.id !== deuda.id);
  await e.cancelarDeuda(otra.id); await e.cancelarDeuda(otra.id);
  assert.equal((await e.cargarSocial()).totales.porCobrar, '$ 0');
  assert.equal(e.saldo(), 92000);
});

test('compra ajena, partes propias y terceros pagadas al inicio cierran sin deudas', async prueba => {
  const e = await escenario(prueba);
  const datos = e.gasto({ pagadorId: e.lucia.id, pagaron: ['vos', e.tomas.id, e.lucia.id] });
  const plan = await e.previsualizarGasto(datos);
  assert.equal(plan.operaciones.length, 1); assert.equal(plan.operaciones[0].monto, 4000);
  await e.guardarGasto(datos, { [plan.operaciones[0].clave]: { depositoId: e.deposito.id } });
  await e.cerrarSala('s');
  const vista = await e.cargarSocial();
  assert.equal(vista.deudas.length, 0); assert.equal(e.saldo(), 96000); assert.equal(e.movimientos(), 1);
  assert.ok(vista.salas[0].gastos[0].partes.every(p => p.tipo === 'saldado'));
});

test('deudas entre terceros quedan en la sala y personas desactivadas siguen en tus obligaciones', async prueba => {
  const e = await escenario(prueba);
  await e.guardarGasto(e.gasto({ pagadorId: e.lucia.id }));
  await e.cambiarPersonasSala('s', []);
  await e.cambiarActividadPersona(e.lucia.id, false);
  await e.cerrarSala('s');
  const datos = await e.cargarSocial();
  assert.equal(datos.deudas.length, 1); assert.equal(datos.deudas[0].tipo, 'debo'); assert.equal(datos.deudas[0].personaId, e.lucia.id);
  assert.equal(datos.salas[0].gastos[0].partes.find(p => p.personaId === e.tomas.id).pendienteNumero, 4000);
  await e.registrarPagoDeuda({ deudaId: datos.deudas[0].id, monto: '4000', claveOperacion: 'inactiva-pago' }, { depositoId: e.deposito.id });
  assert.equal(e.saldo(), 96000);
  await assert.rejects(e.crearDeudaPersonal({ personaId: e.lucia.id, direccion: 'debo', monto: '20', descripcion: 'Nueva' }), /activa/);
});

test('reparto estable de centavos y manual incorrecto no deja compras ni partes parciales', async prueba => {
  const e = await escenario(prueba);
  await assert.rejects(e.guardarGasto(e.gasto({ reparto: 'manual', montosManuales: { vos: '1', [e.lucia.id]: '1', [e.tomas.id]: '1' } })), /sumar exactamente/);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM gastos_compartidos').get().n, 0);
  await e.guardarGasto(e.gasto({ monto: '100' }), { compra: { depositoId: e.deposito.id } });
  assert.deepEqual(Array.from((await e.cargarSocial()).salas[0].gastos[0].partes, p => p.montoNumero), [33.34, 33.33, 33.33]);
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  await e.cerrarSala('s');
  assert.equal(e.saldo(), 99900);
});

test('vincular un movimiento existente no altera el saldo y no permite reutilizarlo', async prueba => {
  const e = await escenario(prueba);
  const deuda = await e.crearDeudaPersonal({ id: 'manual', personaId: e.lucia.id, direccion: 'debo', monto: '500', descripcion: 'Compra anterior' });
  const movimiento = await e.movimientosRepositorio.crear({ deposito_id: e.deposito.id, tipo: 'egreso', monto: 500, categoria: 'deudas', descripcion: 'Pago ya registrado', fecha_hora: new Date().toISOString() });
  const saldo = e.saldo();
  assert.equal((await e.consultarMovimientosCompatibles('egreso', 500)).length, 1);
  await e.registrarPagoDeuda({ deudaId: deuda.id, monto: '500', claveOperacion: 'vinculo' }, { movimientoId: movimiento.id });
  assert.equal(e.saldo(), saldo); assert.equal(e.movimientos(), 1);
  assert.equal((await e.consultarMovimientosCompatibles('egreso', 500)).length, 0);
  const otra = await e.crearDeudaPersonal({ personaId: e.tomas.id, direccion: 'debo', monto: '500', descripcion: 'Otro pago' });
  await assert.rejects(e.registrarPagoDeuda({ deudaId: otra.id, monto: '500', claveOperacion: 'reuso' }, { movimientoId: movimiento.id }), /vinculado/);
});

test('anular el movimiento de un pago compensa el saldo y reabre su deuda en la misma transacción', async prueba => {
  const e = await escenario(prueba);
  const deuda = await e.crearDeudaPersonal({ personaId: e.lucia.id, direccion: 'me_deben', monto: '800', descripcion: 'Préstamo' }, { depositoId: e.deposito.id });
  const pago = await e.registrarPagoDeuda({ deudaId: deuda.id, monto: '800', claveOperacion: 'cobro' }, { depositoId: e.deposito.id });
  assert.equal(e.saldo(), 100000);
  await e.movimientosRepositorio.eliminar(pago.movimiento_id);
  assert.equal(e.saldo(), 99200);
  assert.equal((await e.cargarSocial()).deudas[0].pendienteNumero, 800);
  assert.equal(e.base.prepare('SELECT estado FROM pagos_sociales WHERE id = ?').get(pago.id).estado, 'anulado');
  assert.equal((await e.consultarMovimientosCompatibles('ingreso', 800)).length, 0);
});

test('editar borrador no mueve dinero, conserva depósito y exige la versión actual', async prueba => {
  const e = await escenario(prueba);
  await e.guardarGasto(e.gasto({ monto: '100' }), { compra: { depositoId: e.deposito.id } });
  const edicion = e.gasto({ gastoId: 'g', version: 1, monto: '200', claveOperacion: 'editar' });
  assert.ok((await e.previsualizarGasto(edicion)).diferido);
  await e.guardarGasto(edicion, { compra: { depositoId: e.deposito.id } });
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  assert.equal((await e.cargarSocial()).salas[0].gastos[0].version, 2);
  await assert.rejects(e.guardarGasto({ ...edicion, descripcion: 'Edición vieja' }, { compra: { depositoId: e.deposito.id } }), /cambió/);
  assert.equal(e.saldo(), 100000);
  await e.cerrarSala('s');
  assert.equal(e.saldo(), 99800); assert.equal(e.movimientos(), 1);
});

test('editar descripción y reparto con partes marcadas como pagadas no confirma movimientos', async prueba => {
  const e = await escenario(prueba);
  const datos = e.gasto({ pagaron: [e.lucia.id] });
  const plan = await e.previsualizarGasto(datos);
  const fondos = Object.fromEntries(Array.from(plan.operaciones, o => [o.clave, { depositoId: e.deposito.id }]));
  await e.guardarGasto(datos, fondos);
  const saldo = e.saldo(), movimientos = e.movimientos();
  await e.guardarGasto({ ...datos, gastoId: 'g', version: 1, descripcion: 'Cena de pizzas', claveOperacion: 'descripcion' });
  assert.equal(e.saldo(), saldo); assert.equal(e.movimientos(), movimientos);
  await e.guardarGasto({ ...datos, gastoId: 'g', version: 2, monto: '15000', claveOperacion: 'reparto-nuevo' }, fondos);
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  await e.cerrarSala('s');
  assert.equal(e.saldo(), 90000); assert.equal(e.movimientos(), 2);
  assert.equal((await e.cargarSocial()).deudas.length, 1);
});

test('salas cerradas y registros de otra cuenta no admiten modificaciones', async prueba => {
  const e = await escenario(prueba);
  await e.cerrarSala('s');
  await assert.rejects(e.guardarGasto(e.gasto()), /cerrada/);
  await assert.rejects(e.cambiarPersonasSala('s', []), /cerrada/);
  const usuario = await e.registrarUsuario({ nombre: 'Otra cuenta', correo: 'otra@example.test', contrasena: 'OtraClave123', confirmacion: 'OtraClave123' });
  await e.crearSesion(usuario.id, false);
  await assert.rejects(e.guardarPersona({ nombre: 'Cambio', apellido: 'Ajeno', apodo: 'No' }, e.lucia.id), /esta cuenta/);
  await assert.rejects(e.cerrarSala('s'), /esta cuenta/);
  await assert.rejects(e.crearDeudaPersonal({ personaId: e.lucia.id, direccion: 'debo', monto: '1', descripcion: 'Cruce' }), /esta cuenta/);
  assert.equal((await e.cargarSocial()).personas.length, 0);
});

test('un fallo al cerrar revierte movimientos y saldos conservando los borradores para reintentar', async prueba => {
  const e = await escenario(prueba);
  e.base.exec("CREATE TRIGGER fallo_social BEFORE INSERT ON pagos_sociales BEGIN SELECT RAISE(ABORT, 'fallo'); END;");
  await e.guardarGasto(e.gasto(), { compra: { depositoId: e.deposito.id } });
  await assert.rejects(e.cerrarSala('s'));
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM gastos_compartidos').get().n, 1);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM participantes_gasto').get().n, 3);
  e.base.exec('DROP TRIGGER fallo_social');
  await e.cerrarSala('s');
  assert.equal(e.saldo(), 88000);
  assert.deepEqual(e.base.prepare('PRAGMA foreign_key_check').all(), []);
});

test('pagador fuera del reparto y montos manuales generan únicamente las partes ajenas', async prueba => {
  const e = await escenario(prueba);
  await e.guardarGasto(e.gasto({ involucradas: [e.lucia.id, e.tomas.id], reparto: 'manual', montosManuales: { [e.lucia.id]: '7000,25', [e.tomas.id]: '4999,75' } }), { compra: { depositoId: e.deposito.id } });
  await e.cerrarSala('s');
  const datos = await e.cargarSocial();
  assert.equal(datos.deudas.length, 2);
  assert.equal(datos.salas[0].gastos[0].partes.length, 2);
  assert.equal(datos.totales.porCobrar, '$ 12.000');
});

test('una compra propia cerrada no se puede anular desde Movimientos', async prueba => {
  const e = await escenario(prueba);
  await e.guardarGasto(e.gasto(), { compra: { depositoId: e.deposito.id } }); await e.cerrarSala('s');
  const compra = e.base.prepare("SELECT movimiento_id FROM pagos_sociales WHERE clase = 'compra'").get();
  await assert.rejects(e.movimientosRepositorio.eliminar(compra.movimiento_id));
  assert.equal(e.saldo(), 88000); assert.equal(e.movimientos(), 1);
});

test('editar el pagador del borrador retira la asociación propia sin crear compensaciones', async prueba => {
  const e = await escenario(prueba);
  await e.guardarGasto(e.gasto(), { compra: { depositoId: e.deposito.id } });
  await e.guardarGasto(e.gasto({ gastoId: 'g', version: 1, pagadorId: e.lucia.id }));
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM participantes_gasto').get().n, 3);
  await e.cerrarSala('s'); assert.equal((await e.cargarSocial()).deudas.length, 1);
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
});

test('no se admiten sobrepagos, pagos en depósitos ajenos ni movimientos incompatibles', async prueba => {
  const e = await escenario(prueba);
  const deuda = await e.crearDeudaPersonal({ personaId: e.lucia.id, direccion: 'debo', monto: '10,50', descripcion: 'Pendiente' });
  await assert.rejects(e.registrarPagoDeuda({ deudaId: deuda.id, monto: '10,51', claveOperacion: 'exceso' }, { depositoId: e.deposito.id }), /supera/);
  const otra = await e.registrarUsuario({ nombre: 'Otra', correo: 'mas@example.test', contrasena: 'Clave12345', confirmacion: 'Clave12345' });
  const ajeno = await e.depositosRepositorio.crear({ usuario_id: otra.id, nombre: 'Ajeno', tipo: 'efectivo', saldo_inicial: 5, icono: 'cash-outline' });
  await assert.rejects(e.registrarPagoDeuda({ deudaId: deuda.id, monto: '10,50', claveOperacion: 'ajeno' }, { depositoId: ajeno.id }), /esta cuenta/);
  const incompatible = await e.movimientosRepositorio.crear({ deposito_id: e.deposito.id, tipo: 'ingreso', monto: 10.5, categoria: 'devoluciones', descripcion: 'Inverso', fecha_hora: new Date().toISOString() });
  await assert.rejects(e.registrarPagoDeuda({ deudaId: deuda.id, monto: '10,50', claveOperacion: 'inverso' }, { movimientoId: incompatible.id }), /dirección/);
  assert.equal(e.saldo(), 100010.5); assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM pagos_sociales').get().n, 0);
});

test('un fallo de cierre revierte todas las deudas y permite cerrar después sin duplicarlas', async prueba => {
  const e = await escenario(prueba);
  await e.guardarGasto(e.gasto(), { compra: { depositoId: e.deposito.id } });
  e.base.exec("CREATE TRIGGER fallo_cierre BEFORE UPDATE OF estado ON salas WHEN NEW.estado = 'cerrada' BEGIN SELECT RAISE(ABORT, 'fallo'); END;");
  await assert.rejects(e.cerrarSala('s'));
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM deudas').get().n, 0);
  assert.equal((await e.cargarSocial()).salas[0].estado, 'abierta');
  e.base.exec('DROP TRIGGER fallo_cierre');
  await e.cerrarSala('s'); await e.cerrarSala('s');
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM deudas').get().n, 2); assert.equal(e.movimientos(), 1);
});

test('deuda a cobrar registra el adelanto una vez y la devolución recupera ese dinero', async prueba => {
  const e = await escenario(prueba);
  const datos = { id: 'adelanto', personaId: e.lucia.id, direccion: 'me_deben', monto: '800,50', descripcion: 'Almuerzo', categoriaId: 'alimentacion' };
  const plan = await e.previsualizarDeudaPersonal(datos);
  assert.equal(plan.operaciones[0].tipo, 'egreso'); assert.equal(plan.operaciones[0].monto, 800.5);
  const deuda = await e.crearDeudaPersonal(datos, { depositoId: e.deposito.id });
  await e.crearDeudaPersonal(datos, { depositoId: e.deposito.id });
  assert.equal(e.saldo(), 99199.5); assert.equal(e.movimientos(), 1);
  let vista = (await e.cargarSocial()).deudas[0];
  assert.equal(vista.pendienteNumero, 800.5); assert.equal(vista.saldada, false);
  assert.equal(vista.movimientoOrigen.deposito, 'Efectivo');
  assert.equal(e.base.prepare('SELECT categoria FROM movimientos WHERE id = ?').get(vista.movimientoOrigen.id).categoria, 'deudas');
  await assert.rejects(e.crearDeudaPersonal({ ...datos, monto: '900' }, { depositoId: e.deposito.id }), /otra deuda/);
  await e.registrarPagoDeuda({ deudaId: deuda.id, monto: '300', claveOperacion: 'reintegro-parcial' }, { depositoId: e.deposito.id });
  vista = (await e.cargarSocial()).deudas[0];
  assert.equal(vista.pendienteNumero, 500.5); assert.equal(e.saldo(), 99499.5);
  await e.registrarPagoDeuda({ deudaId: deuda.id, monto: '500,50', claveOperacion: 'reintegro-final' }, { depositoId: e.deposito.id });
  assert.ok((await e.cargarSocial()).deudas[0].saldada); assert.equal(e.saldo(), 100000);
  await assert.rejects(e.cancelarDeuda(deuda.id), /saldada/); assert.equal(e.saldo(), 100000);
});

test('el origen puede vincular un egreso existente sin volver a descontarlo ni reutilizarlo', async prueba => {
  const e = await escenario(prueba), fecha = '2026-09-10T15:00:00.000Z';
  const movimiento = await e.movimientosRepositorio.crear({ deposito_id: e.deposito.id, tipo: 'egreso', monto: 700, categoria: 'alimentacion', descripcion: 'Adelanto previo', fecha_hora: fecha });
  const datos = { id: 'vinculada', personaId: e.lucia.id, direccion: 'me_deben', monto: '700', descripcion: 'Adelanto previo' };
  const deuda = await e.crearDeudaPersonal(datos, { movimientoId: movimiento.id });
  assert.equal(deuda.fecha, fecha); assert.equal(e.saldo(), 99300); assert.equal(e.movimientos(), 1);
  assert.equal((await e.cargarSocial()).deudas[0].movimientoOrigen.id, movimiento.id);
  await assert.rejects(e.crearDeudaPersonal({ ...datos, id: 'otra' }, { movimientoId: movimiento.id }), /vinculado/);
  await assert.rejects(e.registrarPagoDeuda({ deudaId: deuda.id, monto: '700', claveOperacion: 'pago-inverso' }, { movimientoId: movimiento.id }), /dirección/);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM deudas').get().n, 1);
});

test('Le debo no crea ingreso y solo descuenta dinero al registrar pagos', async prueba => {
  const e = await escenario(prueba);
  const datos = { id: 'prestamo', personaId: e.lucia.id, direccion: 'debo', monto: '1000', descripcion: 'Dinero prestado' };
  assert.equal((await e.previsualizarDeudaPersonal(datos)).operaciones.length, 0);
  await assert.rejects(e.crearDeudaPersonal(datos, { depositoId: e.deposito.id }), /no genera un ingreso/);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM deudas').get().n, 0);
  const deuda = await e.crearDeudaPersonal(datos);
  await e.crearDeudaPersonal(datos);
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  assert.equal((await e.cargarSocial()).deudas[0].pendienteNumero, 1000);
  await e.registrarPagoDeuda({ deudaId: deuda.id, monto: '400', claveOperacion: 'pago-parcial' }, { depositoId: e.deposito.id });
  assert.equal(e.saldo(), 99600); assert.equal((await e.cargarSocial()).deudas[0].pendienteNumero, 600);
  await e.registrarPagoDeuda({ deudaId: deuda.id, monto: '600', claveOperacion: 'pago-final' }, { depositoId: e.deposito.id });
  assert.equal(e.saldo(), 99000); assert.equal(e.movimientos(), 2);
  assert.ok((await e.cargarSocial()).deudas[0].saldada);
  assert.equal(e.base.prepare("SELECT COUNT(*) AS n FROM movimientos WHERE tipo = 'ingreso'").get().n, 0);
});

test('no guarda deudas a cobrar sin depósito, con depósito ajeno o desactivado, ni con movimiento inverso', async prueba => {
  const e = await escenario(prueba);
  const datos = { id: 'invalida', personaId: e.lucia.id, direccion: 'me_deben', monto: '500', descripcion: 'Adelanto' };
  await assert.rejects(e.crearDeudaPersonal(datos), /depósito/);
  const usuario = await e.registrarUsuario({ nombre: 'Otra', correo: 'origen@example.test', contrasena: 'Clave12345', confirmacion: 'Clave12345' });
  const ajeno = await e.depositosRepositorio.crear({ usuario_id: usuario.id, nombre: 'Ajeno', tipo: 'efectivo', saldo_inicial: 0, icono: 'cash-outline' });
  await assert.rejects(e.crearDeudaPersonal(datos, { depositoId: ajeno.id }), /esta cuenta/);
  await e.depositosRepositorio.actualizar(e.deposito.id, { activo: 0 });
  await assert.rejects(e.crearDeudaPersonal(datos, { depositoId: e.deposito.id }), /desactivado/);
  await e.depositosRepositorio.actualizar(e.deposito.id, { activo: 1 });
  const inverso = await e.movimientosRepositorio.crear({ deposito_id: e.deposito.id, tipo: 'ingreso', monto: 500, categoria: 'otros_ingresos', descripcion: 'Inverso', fecha_hora: new Date().toISOString() });
  await assert.rejects(e.crearDeudaPersonal(datos, { movimientoId: inverso.id }), /dirección/);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM deudas').get().n, 0);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM pagos_sociales').get().n, 0);
});

test('fallo al vincular el origen revierte deuda, movimiento y saldo, y permite reintentar', async prueba => {
  const e = await escenario(prueba);
  const datos = { id: 'fallo-origen', personaId: e.lucia.id, direccion: 'me_deben', monto: '500', descripcion: 'Adelanto' };
  e.base.exec("CREATE TRIGGER fallo_origen BEFORE INSERT ON pagos_sociales WHEN NEW.clase = 'origen_deuda' BEGIN SELECT RAISE(ABORT, 'fallo'); END;");
  await assert.rejects(e.crearDeudaPersonal(datos, { depositoId: e.deposito.id }));
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM deudas').get().n, 0);
  e.base.exec('DROP TRIGGER fallo_origen');
  await e.crearDeudaPersonal(datos, { depositoId: e.deposito.id });
  assert.equal(e.saldo(), 99500); assert.equal(e.movimientos(), 1);
});

test('revertir origen exige corregir devoluciones primero y cancela la deuda sin borrar historial', async prueba => {
  const e = await escenario(prueba);
  const deuda = await e.crearDeudaPersonal({ personaId: e.lucia.id, direccion: 'me_deben', monto: '500', descripcion: 'Adelanto' }, { depositoId: e.deposito.id });
  const origen = (await e.cargarSocial()).deudas[0].movimientoOrigen;
  const pago = await e.registrarPagoDeuda({ deudaId: deuda.id, monto: '200', claveOperacion: 'parcial' }, { depositoId: e.deposito.id });
  await assert.rejects(e.movimientosRepositorio.eliminar(origen.id), /pagos registrados/);
  assert.equal(e.saldo(), 99700);
  await e.movimientosRepositorio.eliminar(pago.movimiento_id);
  assert.equal((await e.cargarSocial()).deudas[0].pendienteNumero, 500);
  await e.movimientosRepositorio.eliminar(origen.id);
  assert.equal(e.saldo(), 100000); assert.equal((await e.cargarSocial()).deudas.length, 0);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM pagos_sociales').get().n, 2);
  assert.equal(e.base.prepare('SELECT estado FROM deudas WHERE id = ?').get(deuda.id).estado, 'cancelada');
});

test('la asociación persiste y el cierre valida nuevamente depósitos sin dejar movimientos parciales', async prueba => {
  const e = await escenario(prueba);
  await e.guardarGasto(e.gasto(), { compra: { depositoId: e.deposito.id } });
  assert.equal((await e.cargarSocial()).salas[0].gastos[0].depositosAsociados, 'Efectivo');
  const guardado = JSON.parse(e.base.prepare("SELECT plan_pagos FROM gastos_compartidos WHERE id = 'g'").get().plan_pagos);
  assert.equal(guardado.financiaciones.compra.depositoId, e.deposito.id);
  await e.depositosRepositorio.actualizar(e.deposito.id, { activo: 0 });
  await assert.rejects(e.cerrarSala('s'), /desactivado/);
  assert.equal(e.saldo(), 100000); assert.equal(e.movimientos(), 0);
  assert.equal((await e.cargarSocial()).salas[0].estado, 'abierta');
  await e.depositosRepositorio.actualizar(e.deposito.id, { activo: 1 });
  await e.cerrarSala('s'); await e.cerrarSala('s');
  assert.equal(e.saldo(), 88000); assert.equal(e.movimientos(), 1);
});

test('un movimiento asociado queda reservado y al cerrar se vincula sin duplicarlo', async prueba => {
  const e = await escenario(prueba);
  const movimiento = await e.movimientosRepositorio.crear({ deposito_id: e.deposito.id, tipo: 'egreso', monto: 12000, categoria: 'alimentacion', descripcion: 'Compra anterior', fecha_hora: new Date().toISOString() });
  await e.guardarGasto(e.gasto(), { compra: { movimientoId: movimiento.id } });
  assert.equal(e.saldo(), 88000); assert.equal(e.movimientos(), 1);
  assert.equal((await e.consultarMovimientosCompatibles('egreso', 12000)).length, 0);
  await assert.rejects(e.guardarGasto(e.gasto({ id: 'otro', claveOperacion: 'otro' }), { compra: { movimientoId: movimiento.id } }), /asociado/);
  const deuda = await e.crearDeudaPersonal({ personaId: e.lucia.id, direccion: 'debo', monto: '12000', descripcion: 'Otra' });
  await assert.rejects(e.registrarPagoDeuda({ deudaId: deuda.id, monto: '12000', claveOperacion: 'reutilizo' }, { movimientoId: movimiento.id }), /asociado/);
  await e.cerrarSala('s');
  assert.equal(e.saldo(), 88000); assert.equal(e.movimientos(), 1);
  assert.equal(e.base.prepare("SELECT movimiento_id FROM pagos_sociales WHERE clase = 'compra'").get().movimiento_id, movimiento.id);
});
