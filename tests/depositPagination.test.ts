import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.ts';
import { presente } from './helpers/assertions.ts';

test('SQLite con 10.000 movimientos devuelve resumen pequeño y páginas estables de 50', async prueba => {
  const sql: string[] = [];
  const e = await preparar(prueba, true, { url: '', fetch: async () => { throw new Error('Sin red'); }, registrarSql: consulta => sql.push(consulta) });
  await e.prepararDatosPrueba({ volumenMovimientos: true });
  const id = String(presente(e.base.prepare("SELECT id FROM depositos WHERE id LIKE '%:deposito:volumen-v1'").get()).id);
  sql.length = 0;
  const detalle = await e.consultarDetalleDeposito(id);
  assert.equal(detalle.cantidadMovimientos, 10000); assert.ok(!('movimientos' in detalle));
  assert.equal(detalle.categoriasMovimientos.length, 26); // Transferencias comparte identificador entre tipos.
  assert.equal(detalle.comparacionMensual.disponible && detalle.comparacionMensual.saldoAnterior, 1000000);
  assert.ok(!sql.some(consulta => /SELECT (?:m\.)?\* FROM movimientos/.test(consulta)));
  const meses = await e.consultarMesesMovimientosDeposito(id, {});
  assert.equal(meses.length, 24); assert.equal(meses.reduce((total, mes) => total + mes.cantidad, 0), 10000);
  assert.ok(!sql.some(consulta => /SELECT m\.\*/.test(consulta)));
  const ahora = new Date(), desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
  const primera = await e.consultarPaginaMovimientosDeposito(id, { desde });
  assert.equal((await e.consultarMesesMovimientosDeposito(id, { desde }))[0].cantidad, 7000);
  assert.equal(primera.length, 50); assert.ok(primera.every(fila => fila.fecha_hora >= desde));
  const ids = new Set<string>(); let pagina = primera;
  while (pagina.length) {
    for (const fila of pagina) { assert.ok(!ids.has(fila.id), 'No repite filas con la misma fecha'); ids.add(fila.id); }
    const ultima = pagina.at(-1)!;
    pagina = await e.consultarPaginaMovimientosDeposito(id, { desde }, { fecha_hora: ultima.fecha_hora, id: ultima.id });
    assert.ok(pagina.length <= 50);
  }
  assert.equal(ids.size, 7000);
  const buscado = await e.consultarPaginaMovimientosDeposito(id, { busqueda: 'Volumen 00001' });
  assert.equal(buscado.length, 1); assert.equal(buscado[0].descripcion.startsWith('Volumen 00001'), true);
  assert.ok(sql.filter(consulta => /SELECT m\.\*/.test(consulta)).every(consulta => /LIMIT \?/.test(consulta)));
});

test('páginas conservan búsqueda por categoría, acentos, texto literal, importes y transferencias', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const usuario = presente((await e.obtenerSesionActual()).usuario);
  const datos = { usuario_id: usuario.id, tipo: 'banco' as const, saldo_inicial: 10000, icono: 'cash-outline', fecha_creacion: '2020-01-01T00:00:00.000Z' };
  const origen = await e.depositosRepositorio.crear({ ...datos, nombre: 'Páginas' });
  const destino = await e.depositosRepositorio.crear({ ...datos, nombre: 'Destino' });
  const instante = new Date().toISOString();
  await e.movimientosRepositorio.crear({ id: 'compra-literal', deposito_id: origen.id, tipo: 'egreso', categoria: 'alimentacion', monto: 200, descripcion: 'CAFÉ 100%_real!', fecha_hora: instante });
  await e.movimientosRepositorio.crear({ id: 'sueldo', deposito_id: origen.id, tipo: 'ingreso', categoria: 'sueldo', monto: 300, descripcion: 'Cobro', fecha_hora: instante });
  await e.transferenciasRepositorio.crearConMovimientos({ usuario_id: usuario.id, deposito_origen_id: origen.id, deposito_destino_id: destino.id, monto: 100, descripcion: 'Transferencia', fecha_hora: instante });
  assert.equal((await e.consultarMesesMovimientosDeposito(origen.id, {})).reduce((suma, mes) => suma + mes.cantidad, 0), 3);
  assert.equal((await e.cargarMesesHistorialMovimientos(usuario.id, { depositoIds: [origen.id] })).reduce((suma, mes) => suma + mes.cantidad, 0), 2);
  for (const busqueda of ['café', 'CAFÉ', '100%_real!', 'Alimentación', 'alimentacion']) {
    const filas = await e.consultarPaginaMovimientosDeposito(origen.id, { busqueda });
    assert.deepEqual(filas.map(fila => fila.id), ['compra-literal']);
  }
  assert.deepEqual((await e.consultarPaginaMovimientosDeposito(origen.id, { tipo: 'ingreso', montoMinimo: 300, montoMaximo: 300 })).map(fila => fila.id), ['sueldo']);
  assert.equal((await e.consultarPaginaMovimientosDeposito(origen.id, { tipo: 'egreso' })).length, 2);
  assert.equal((await e.consultarPaginaMovimientosDeposito(destino.id, { tipo: 'ingreso' }))[0].tipo, 'transferencia_entrada');
  const resumen = await e.consultarDetalleDeposito(origen.id);
  assert.equal(resumen.comparacionMensual.disponible && resumen.comparacionMensual.saldoAnterior, 10000);
  await e.depositosRepositorio.actualizarSaldoInformado(origen.id, 15000);
  const ajustado = await e.consultarDetalleDeposito(origen.id);
  assert.equal(ajustado.comparacionMensual.disponible && ajustado.comparacionMensual.saldoAnterior, 10000);
});

test('las páginas rechazan depósitos ajenos, inactivos y sesiones vencidas sin filtrar datos', async prueba => {
  const e = await preparar(prueba); await e.prepararDatosPrueba();
  const id = String(presente(e.base.prepare('SELECT id FROM depositos LIMIT 1').get()).id);
  await e.depositosRepositorio.eliminar(id); await assert.rejects(e.consultarPaginaMovimientosDeposito(id));
  const otro = await e.registrarUsuario({ nombre: 'Otro', correo: 'otro@example.test', contrasena: 'ClavePrueba123', confirmacion: 'ClavePrueba123' });
  const ajeno = await e.depositosRepositorio.crear({ usuario_id: otro.id, nombre: 'Ajeno', tipo: 'efectivo', saldo_inicial: 100, icono: 'cash-outline' });
  await assert.rejects(e.consultarDetalleDeposito(ajeno.id));
  await assert.rejects(e.consultarPaginaMovimientosDeposito(ajeno.id, { depositoIds: [ajeno.id] }));
  await e.cerrarSesion(); await assert.rejects(e.consultarPaginaMovimientosDeposito(id));
});
