import { presente } from './helpers/assertions.ts';
import { URL } from 'node:url';
import type { SQLInputValue } from 'node:sqlite';
import { compilarFuente } from './helpers/typescript.ts';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { SourceTextModule, createContext } from 'node:vm';
import test from 'node:test';

const fecha = '2026-10-30T12:00:00.000Z';
const contexto = createContext({});
const inicial = new SourceTextModule(compilarFuente(await readFile(new URL('../src/database/migrations/001_initialSchema.ts', import.meta.url), 'utf8'), '001_initialSchema.ts'), { context: contexto });
await inicial.link(() => { throw new Error('El esquema inicial debe ser autocontenido.'); });
await inicial.evaluate();

async function preparar(prueba: import('node:test').TestContext) {
  const base = new DatabaseSync(':memory:');
  prueba.after(() => base.close());
  base.exec('PRAGMA foreign_keys = ON');
  const adaptador = { execAsync: async (sql: string) => base.exec(sql) };
  await (inicial.namespace as unknown as typeof import('../src/database/migrations/001_initialSchema.ts')).aplicarEsquemaInicial(adaptador);
  const insertar = (tabla: string, valores: Record<string, SQLInputValue>) => {
    const campos = Object.keys(valores);
    base.prepare(`INSERT INTO ${tabla} (${campos.join(', ')}) VALUES (${campos.map(() => '?').join(', ')})`).run(...Object.values(valores));
  };
  const marcas = { fecha_creacion: fecha, fecha_actualizacion: fecha };
  const persona = (id: string, usuario_id = 'u', propia = false, cambios: Record<string,SQLInputValue> = {}) => insertar('personas', {
    id, usuario_id, nombre: id, apellido: propia ? null : 'Pérez', apodo: propia ? null : id,
    nombre_normalizado: id, apellido_normalizado: propia ? null : 'perez', apodo_normalizado: propia ? null : id,
    es_usuario_actual: propia ? 1 : 0, ...marcas, ...cambios,
  });
  for (const id of ['u', 'ajeno']) {
    insertar('usuarios', { id, nombre: id, correo_electronico: `${id}@example.test`, ...marcas });
    persona(`${id}-vos`, id, true);
    insertar('depositos', { id: `dep-${id}`, usuario_id: id, nombre: 'Efectivo', tipo: 'efectivo', saldo_inicial: 50000, saldo_actual: 50000, icono: 'cash-outline', ...marcas });
  }
  for (const id of ['lucia', 'tomas', 'ana']) persona(id);
  const sala = (id = 's', usuario_id = 'u') => {
    insertar('salas', { id, usuario_id, nombre: 'Cena', categoria: 'alimentacion', icono: 'restaurant-outline', color: '#BED5C8', fecha: '2026-10-30', ...marcas });
    for (const persona_id of usuario_id === 'u' ? ['u-vos', 'lucia', 'tomas', 'ana'] : ['ajeno-vos']) {
      insertar('personas_sala', { id: `${id}-${persona_id}`, usuario_id, sala_id: id, persona_id, fecha_alta: fecha });
    }
  };
  sala();
  const gasto = (id = 'g', pagador_id = 'lucia', monto_total: number | string = 12000, sala_id = 's') => insertar('gastos_compartidos', {
    id, usuario_id: 'u', sala_id, pagador_id, descripcion: 'Pizzas', monto_total, reparto: 'iguales', fecha, ...marcas,
  });
  const parte = (id: string, persona_id: string, monto_correspondiente = 4000, orden = 0, gasto_compartido_id = 'g') => insertar('participantes_gasto', {
    id, usuario_id: 'u', gasto_compartido_id, persona_id, monto_correspondiente, orden,
  });
  const movimiento = (id: string, tipo: string, monto: number, cambios: Record<string,SQLInputValue> = {}) => insertar('movimientos', {
    id, deposito_id: 'dep-u', categoria: tipo === 'egreso' ? 'alimentacion' : 'devoluciones', tipo, monto,
    descripcion: id, fecha_hora: fecha, ...marcas, ...cambios,
  });
  const pago = (id: string, clase: string, monto: number, referencias: Record<string,SQLInputValue>, cambios: Record<string,SQLInputValue> = {}) => insertar('pagos_sociales', {
    id, usuario_id: 'u', clase, monto, fecha, clave_operacion: `op-${id}`, ...referencias, ...marcas, ...cambios,
  });
  const deuda = (id = 'd', cambios = {}) => insertar('deudas', {
    id, usuario_id: 'u', deudor_id: 'u-vos', acreedor_id: 'lucia', monto: 4000, descripcion: 'Pizzas', fecha, ...marcas, ...cambios,
  });
  const cerrar = () => base.prepare("UPDATE salas SET estado = 'cerrada', fecha_cierre = ? WHERE id = 's'").run(fecha);
  return { base, adaptador, insertar, marcas, persona, sala, gasto, parte, movimiento, pago, deuda, cerrar };
}

test('el esquema inicial completo crea quince tablas sin ejemplos y es repetible', async prueba => {
  const { base, adaptador } = await preparar(prueba);
  assert.equal(presente(base.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get()).n, 15);
  await (inicial.namespace as unknown as typeof import('../src/database/migrations/001_initialSchema.ts')).aplicarEsquemaInicial(adaptador);
  assert.equal(presente(base.prepare('SELECT COUNT(*) AS n FROM gastos_compartidos').get()).n, 0);
  assert.deepEqual(base.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal((inicial.namespace as unknown as typeof import('../src/database/migrations/001_initialSchema.ts')).VERSION_ESQUEMA_INICIAL, 1);
  assert.equal(presente(base.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'pagos_deuda'").get()).n, 0);
});

test('origen de deuda exige movimiento inverso al cobro, importe completo y referencia manual única', async prueba => {
  const { base, deuda, movimiento, pago } = await preparar(prueba);
  deuda('cobrar', { deudor_id: 'lucia', acreedor_id: 'u-vos' });
  movimiento('egreso-origen', 'egreso', 4000); movimiento('ingreso-incorrecto', 'ingreso', 4000);
  movimiento('egreso-incompleto', 'egreso', 1000);
  assert.throws(() => pago('sin-movimiento', 'origen_deuda', 4000, { deuda_id: 'cobrar' }));
  assert.throws(() => pago('direccion-inversa', 'origen_deuda', 4000, { deuda_id: 'cobrar', movimiento_id: 'ingreso-incorrecto' }));
  assert.throws(() => pago('incompleto', 'origen_deuda', 1000, { deuda_id: 'cobrar', movimiento_id: 'egreso-incompleto' }));
  pago('origen', 'origen_deuda', 4000, { deuda_id: 'cobrar', movimiento_id: 'egreso-origen' });
  movimiento('otro-egreso', 'egreso', 4000);
  assert.throws(() => pago('duplicado', 'origen_deuda', 4000, { deuda_id: 'cobrar', movimiento_id: 'otro-egreso' }));
  pago('devolucion', 'deuda', 4000, { deuda_id: 'cobrar', movimiento_id: 'ingreso-incorrecto' });
  assert.equal(presente(base.prepare("SELECT COUNT(*) AS n FROM pagos_sociales WHERE deuda_id = 'cobrar'").get()).n, 2);
  movimiento('sobrepago', 'ingreso', 1000);
  assert.throws(() => pago('exceso', 'deuda', 1000, { deuda_id: 'cobrar', movimiento_id: 'sobrepago' }));
  deuda('debo');
  movimiento('ingreso-debo', 'ingreso', 4000);
  assert.throws(() => pago('origen-debo-ingreso', 'origen_deuda', 4000, { deuda_id: 'debo', movimiento_id: 'ingreso-debo' }));
  assert.throws(() => pago('origen-debo-egreso', 'origen_deuda', 4000, { deuda_id: 'debo', movimiento_id: 'otro-egreso' }));
});

test('personas requieren apellido y apodo, detectan duplicados inactivos y conservan identidad', async prueba => {
  const { base, persona } = await preparar(prueba);
  assert.throws(() => persona('incompleta', 'u', false, { apellido: null }));
  assert.throws(() => persona('apodo-largo', 'u', false, { apodo: 'a'.repeat(21) }));
  assert.throws(() => persona('duplicada', 'u', false, { apodo_normalizado: 'lucia' }));
  base.exec("UPDATE personas SET activa = 0 WHERE id = 'lucia'");
  assert.throws(() => persona('otra-lucia', 'u', false, { nombre_normalizado: 'lucia', apellido_normalizado: 'perez' }));
  assert.throws(() => base.exec("DELETE FROM personas WHERE id = 'lucia'"));
  assert.throws(() => persona('otro-vos', 'u', true));
  assert.throws(() => base.exec("UPDATE personas SET activa = 0 WHERE id = 'u-vos'"));
  assert.throws(() => base.exec("UPDATE personas SET es_usuario_actual = 1 WHERE id = 'tomas'"));
  persona('ajeno-lucia', 'ajeno', false, { nombre_normalizado: 'lucia', apellido_normalizado: 'perez', apodo_normalizado: 'lucia' });
});

test('cupo por usuario, fecha válida, baja de pertenencias y cierre inmutable', async prueba => {
  const { base, sala, cerrar } = await preparar(prueba);
  assert.throws(() => base.exec("UPDATE salas SET fecha = '2026-02-30' WHERE id = 's'"));
  sala('s2'); sala('s3');
  assert.throws(() => sala('s4'), /tres salas/);
  sala('sa', 'ajeno');
  assert.throws(() => base.prepare("UPDATE personas_sala SET activa = 0, fecha_baja = ? WHERE id = 's-u-vos'").run(fecha));
  base.prepare("UPDATE personas_sala SET activa = 0, fecha_baja = ? WHERE id = 's-tomas'").run(fecha);
  base.exec("UPDATE personas_sala SET activa = 1, fecha_baja = NULL WHERE id = 's-tomas'");
  cerrar();
  sala('s4');
  assert.throws(() => base.exec("UPDATE salas SET estado = 'abierta', fecha_cierre = NULL WHERE id = 's'"));
  assert.throws(() => base.exec("UPDATE personas_sala SET fecha_alta = 'otra' WHERE id = 's-lucia'"));
});

test('referencias sociales no admiten datos de otra cuenta ni participantes repetidos', async prueba => {
  const { base, insertar, gasto, parte } = await preparar(prueba);
  assert.throws(() => insertar('personas_sala', { id: 'intruso', usuario_id: 'u', sala_id: 's', persona_id: 'ajeno-vos', fecha_alta: fecha }));
  gasto(); parte('p', 'u-vos');
  assert.throws(() => parte('duplicada', 'u-vos', 4000, 1));
  assert.throws(() => parte('ajena', 'ajeno-vos', 4000, 1));
  assert.throws(() => base.exec("UPDATE participantes_gasto SET persona_id = 'tomas' WHERE id = 'p'"));
  assert.throws(() => base.exec("UPDATE gastos_compartidos SET usuario_id = 'ajeno' WHERE id = 'g'"));
});

test('importes positivos con dos decimales y reparto que no supera el total', async prueba => {
  const { base, gasto, parte } = await preparar(prueba);
  for (const monto of [0, -1, 1.001, 'texto', 1e15, Infinity]) assert.throws(() => gasto('invalido', 'lucia', monto));
  gasto('g', 'lucia', 100);
  parte('p1', 'u-vos', 33.34, 0); parte('p2', 'tomas', 33.33, 1); parte('p3', 'lucia', 33.33, 2);
  assert.throws(() => parte('exceso', 'ana', 0.01, 3));
  assert.throws(() => base.exec("UPDATE gastos_compartidos SET monto_total = 99 WHERE id = 'g'"));
});

test('sumas de centavos y pagador fuera del reparto conservan importes exactos', async prueba => {
  const { base, gasto, parte, movimiento, pago } = await preparar(prueba);
  gasto('g', 'u-vos', 0.3); parte('p', 'tomas', 0.3);
  movimiento('m1', 'ingreso', 0.1); movimiento('m2', 'ingreso', 0.2);
  pago('p1', 'parte', 0.1, { participante_gasto_id: 'p', movimiento_id: 'm1' });
  pago('p2', 'parte', 0.2, { participante_gasto_id: 'p', movimiento_id: 'm2' });
  base.exec("UPDATE participantes_gasto SET monto_correspondiente = 0.3 WHERE id = 'p'");
  assert.equal(presente(base.prepare("SELECT COUNT(*) AS n FROM participantes_gasto WHERE persona_id = 'u-vos'").get()).n, 0);
  movimiento('m3', 'ingreso', 0.01);
  assert.throws(() => pago('exceso', 'parte', 0.01, { participante_gasto_id: 'p', movimiento_id: 'm3' }));
});

test('compra y movimientos de compensación no se pueden reutilizar como una entrega', async prueba => {
  const { gasto, parte, movimiento, pago } = await preparar(prueba);
  gasto(); parte('p', 'u-vos');
  movimiento('original', 'ingreso', 1000);
  movimiento('compensacion', 'egreso', 1000, { reversion_de_id: 'original' });
  assert.throws(() => pago('reversion', 'parte', 1000, { participante_gasto_id: 'p', movimiento_id: 'compensacion' }));
});

test('retirar o desactivar personas conserva partes y permite deudas y pagos históricos propios', async prueba => {
  const { base, gasto, parte, movimiento, pago, deuda } = await preparar(prueba);
  gasto(); parte('p', 'u-vos'); parte('pt', 'tomas', 4000, 1);
  base.prepare("UPDATE personas_sala SET activa = 0, fecha_baja = ? WHERE id = 's-lucia'").run(fecha);
  base.exec("UPDATE personas SET activa = 0 WHERE id = 'lucia'");
  base.exec("UPDATE gastos_compartidos SET descripcion = 'Pizzas anteriores' WHERE id = 'g'");
  assert.throws(() => gasto('nuevo', 'lucia'));
  assert.throws(() => deuda('manual-inactiva'));
  deuda('historica', { participante_gasto_id: 'p' });
  movimiento('m', 'egreso', 1000);
  pago('pago', 'parte', 1000, { participante_gasto_id: 'p', deuda_id: 'historica', movimiento_id: 'm' });
  assert.equal(presente(base.prepare("SELECT COUNT(*) AS n FROM participantes_gasto WHERE gasto_compartido_id = 'g'").get()).n, 2);
});

test('compra propia exige un egreso completo y ajena no toca depósitos', async prueba => {
  const { base, gasto, movimiento, pago } = await preparar(prueba);
  gasto('propio', 'u-vos');
  assert.throws(() => pago('sin-mov', 'compra', 12000, { gasto_compartido_id: 'propio' }));
  movimiento('ingreso', 'ingreso', 12000);
  assert.throws(() => pago('inverso', 'compra', 12000, { gasto_compartido_id: 'propio', movimiento_id: 'ingreso' }));
  movimiento('compra', 'egreso', 12000);
  pago('cp', 'compra', 12000, { gasto_compartido_id: 'propio', movimiento_id: 'compra' });
  gasto('ajeno', 'lucia');
  assert.throws(() => pago('compra-incompleta', 'compra', 1000, { gasto_compartido_id: 'ajeno' }));
  assert.throws(() => pago('compra-ajena-mov', 'compra', 12000, { gasto_compartido_id: 'ajeno', movimiento_id: 'ingreso' }));
  pago('ca', 'compra', 12000, { gasto_compartido_id: 'ajeno' });
  assert.equal(presente(base.prepare("SELECT saldo_actual FROM depositos WHERE id = 'dep-u'").get()).saldo_actual, 50000);
});

test('pagos propios en ambas direcciones y entregas entre terceros', async prueba => {
  const { gasto, parte, movimiento, pago, deuda } = await preparar(prueba);
  gasto(); parte('tuya', 'u-vos'); parte('tercero', 'tomas', 4000, 1); parte('pagador', 'lucia', 4000, 2);
  movimiento('salida', 'egreso', 1000);
  pago('tu-pago', 'parte', 1000, { participante_gasto_id: 'tuya', movimiento_id: 'salida' });
  pago('pago-tercero', 'parte', 1000, { participante_gasto_id: 'tercero' });
  assert.throws(() => pago('sin-egreso', 'parte', 1000, { participante_gasto_id: 'tuya' }));
  assert.throws(() => pago('autopago', 'parte', 1000, { participante_gasto_id: 'pagador' }));
  assert.throws(() => deuda('terceros', { deudor_id: 'tomas', participante_gasto_id: 'tercero' }));
  gasto('tuyo', 'u-vos'); parte('cobro', 'ana', 4000, 0, 'tuyo');
  movimiento('entrada', 'ingreso', 1000);
  pago('te-pagan', 'parte', 1000, { participante_gasto_id: 'cobro', movimiento_id: 'entrada' });
});

test('movimiento único, idempotencia y validación de movimiento ajeno o anulado', async prueba => {
  const { base, gasto, parte, movimiento, pago, deuda } = await preparar(prueba);
  gasto(); parte('p', 'u-vos'); deuda('manual');
  movimiento('m', 'egreso', 1000);
  pago('ok', 'parte', 1000, { participante_gasto_id: 'p', movimiento_id: 'm' });
  assert.throws(() => pago('reuso', 'deuda', 1000, { deuda_id: 'manual', movimiento_id: 'm' }));
  movimiento('m2', 'egreso', 1000);
  assert.throws(() => pago('otra', 'parte', 1000, { participante_gasto_id: 'p', movimiento_id: 'm2' }, { clave_operacion: 'op-ok' }));
  movimiento('ajeno', 'egreso', 1000, { deposito_id: 'dep-ajeno' });
  assert.throws(() => pago('no-ajeno', 'parte', 1000, { participante_gasto_id: 'p', movimiento_id: 'ajeno' }));
  movimiento('anulado', 'egreso', 1000, { anulado: 1 });
  assert.throws(() => pago('no-anulado', 'parte', 1000, { participante_gasto_id: 'p', movimiento_id: 'anulado' }));
  assert.throws(() => base.exec("UPDATE movimientos SET monto = 500 WHERE id = 'm'"));
});

test('cierre con pago parcial conserva la misma fila y admite pago posterior sin duplicar la compra', async prueba => {
  const { base, gasto, parte, movimiento, pago, deuda, cerrar } = await preparar(prueba);
  gasto(); parte('p', 'u-vos'); parte('tercero', 'tomas', 4000, 1); parte('pagador', 'lucia', 4000, 2);
  pago('compra', 'compra', 12000, { gasto_compartido_id: 'g' });
  movimiento('m1', 'egreso', 1000);
  pago('parcial', 'parte', 1000, { participante_gasto_id: 'p', movimiento_id: 'm1' });
  deuda('d', { participante_gasto_id: 'p' });
  base.exec("UPDATE pagos_sociales SET deuda_id = 'd' WHERE id = 'parcial'");
  cerrar();
  assert.equal(presente(base.prepare("SELECT SUM(monto) AS pagado FROM pagos_sociales WHERE deuda_id = 'd'").get()).pagado, 1000);
  movimiento('m2', 'egreso', 3000);
  pago('final', 'parte', 3000, { participante_gasto_id: 'p', deuda_id: 'd', movimiento_id: 'm2' });
  base.exec("UPDATE deudas SET estado = 'pagada' WHERE id = 'd'");
  assert.equal(presente(base.prepare("SELECT SUM(monto) AS pagado FROM pagos_sociales WHERE deuda_id = 'd'").get()).pagado, 4000);
  movimiento('m3', 'egreso', 1);
  assert.throws(() => pago('sobrepago', 'parte', 1, { participante_gasto_id: 'p', deuda_id: 'd', movimiento_id: 'm3' }));
  assert.throws(() => deuda('duplicada', { participante_gasto_id: 'p' }));
  assert.throws(() => pago('tercero-cerrado', 'parte', 1, { participante_gasto_id: 'tercero' }));
  assert.throws(() => base.exec("UPDATE gastos_compartidos SET descripcion = 'Cambio' WHERE id = 'g'"));
  assert.throws(() => base.exec("UPDATE participantes_gasto SET monto_correspondiente = 4001 WHERE id = 'p'"));
  assert.deepEqual(base.prepare('PRAGMA foreign_key_check').all(), []);
});

test('deuda no admite parte incorrecta, pagos de otra parte ni pagos directos que eludan su participación', async prueba => {
  const { base, gasto, parte, deuda, movimiento, pago } = await preparar(prueba);
  gasto('g', 'u-vos'); parte('p', 'tomas'); parte('p2', 'ana', 4000, 1);
  assert.throws(() => deuda('invertida', { participante_gasto_id: 'p' }));
  deuda('d', { deudor_id: 'tomas', acreedor_id: 'u-vos', participante_gasto_id: 'p' });
  movimiento('m', 'ingreso', 1000);
  assert.throws(() => pago('otra-parte', 'parte', 1000, { participante_gasto_id: 'p2', deuda_id: 'd', movimiento_id: 'm' }));
  assert.throws(() => pago('via-directa', 'deuda', 1000, { deuda_id: 'd', movimiento_id: 'm' }));
  assert.throws(() => base.exec("UPDATE deudas SET monto = 5000 WHERE id = 'd'"));
});

test('partes completamente pagadas no crean deudas y el historial no se borra', async prueba => {
  const { base, gasto, parte, movimiento, pago, deuda, cerrar } = await preparar(prueba);
  gasto(); parte('p', 'u-vos');
  movimiento('m', 'egreso', 4000);
  pago('pagado', 'parte', 4000, { participante_gasto_id: 'p', movimiento_id: 'm' });
  assert.throws(() => deuda('innecesaria', { participante_gasto_id: 'p' }));
  assert.throws(() => base.exec("DELETE FROM pagos_sociales WHERE id = 'pagado'"));
  assert.throws(() => base.exec("DELETE FROM participantes_gasto WHERE id = 'p'"));
  cerrar();
  assert.equal(presente(base.prepare('SELECT COUNT(*) AS n FROM deudas').get()).n, 0);
});

test('cancelar una deuda conserva pagos y movimientos; no admite reactivación ni pago nuevo', async prueba => {
  const { base, deuda, movimiento, pago } = await preparar(prueba);
  deuda(); movimiento('m', 'egreso', 1000);
  pago('p', 'deuda', 1000, { deuda_id: 'd', movimiento_id: 'm' });
  base.prepare("UPDATE deudas SET estado = 'cancelada', fecha_cancelacion = ? WHERE id = 'd'").run(fecha);
  assert.equal(presente(base.prepare("SELECT COUNT(*) AS n FROM pagos_sociales WHERE deuda_id = 'd'").get()).n, 1);
  assert.equal(presente(base.prepare("SELECT anulado FROM movimientos WHERE id = 'm'").get()).anulado, 0);
  assert.throws(() => base.exec("UPDATE deudas SET estado = 'pendiente', fecha_cancelacion = NULL WHERE id = 'd'"));
  assert.throws(() => base.exec("DELETE FROM deudas WHERE id = 'd'"));
  movimiento('m2', 'egreso', 1000);
  assert.throws(() => pago('nuevo', 'deuda', 1000, { deuda_id: 'd', movimiento_id: 'm2' }));
});

test('una deuda completamente pagada no admite cancelación desde SQLite', async prueba => {
  const { base, deuda, movimiento, pago } = await preparar(prueba);
  deuda(); movimiento('pago-completo', 'egreso', 4000);
  pago('completo', 'deuda', 4000, { deuda_id: 'd', movimiento_id: 'pago-completo' });
  assert.throws(() => base.prepare("UPDATE deudas SET estado = 'cancelada', fecha_cancelacion = ? WHERE id = 'd'").run(fecha));
});

test('pago confirmado conserva importe y origen y una anulación mantiene el registro', async prueba => {
  const { base, deuda, movimiento, pago } = await preparar(prueba);
  deuda(); movimiento('m', 'egreso', 1000);
  pago('p', 'deuda', 1000, { deuda_id: 'd', movimiento_id: 'm' });
  assert.throws(() => base.exec("UPDATE pagos_sociales SET monto = 500 WHERE id = 'p'"));
  assert.throws(() => base.exec("UPDATE pagos_sociales SET movimiento_id = NULL WHERE id = 'p'"));
  base.prepare("UPDATE pagos_sociales SET estado = 'anulado', fecha_anulacion = ? WHERE id = 'p'").run(fecha);
  assert.equal(presente(base.prepare("SELECT COUNT(*) AS n FROM pagos_sociales WHERE id = 'p'").get()).n, 1);
  assert.throws(() => base.exec("UPDATE pagos_sociales SET estado = 'vigente', fecha_anulacion = NULL WHERE id = 'p'"));
});

test('fallo intermedio permite rollback completo de filas sociales y movimiento', async prueba => {
  const { base, gasto, parte, movimiento, pago } = await preparar(prueba);
  base.exec('BEGIN');
  assert.throws(() => {
    gasto(); parte('p', 'u-vos'); movimiento('m', 'ingreso', 1000);
    pago('invalido', 'parte', 1000, { participante_gasto_id: 'p', movimiento_id: 'm' });
  });
  base.exec('ROLLBACK');
  assert.equal(presente(base.prepare('SELECT COUNT(*) AS n FROM gastos_compartidos').get()).n, 0);
  assert.equal(presente(base.prepare('SELECT COUNT(*) AS n FROM participantes_gasto').get()).n, 0);
  assert.equal(presente(base.prepare('SELECT COUNT(*) AS n FROM movimientos').get()).n, 0);
  assert.deepEqual(base.prepare('PRAGMA foreign_key_check').all(), []);
});
