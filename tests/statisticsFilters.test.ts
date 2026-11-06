import assert from 'node:assert/strict';
import test from 'node:test';
import { preparar } from './helpers/localDatabase.ts';
import { PREAJUSTES_CATEGORIAS, coincidenCategorias, validarRangoMontoEstadistica, obtenerPreajustesMovimientos, alternarGrupoCategorias, agruparCategoriasSeleccionadas } from '../src/utils/statisticsFilters.ts';

test('los accesos de Movimientos reutilizan los grupos y separan tipos y categorías disponibles', () => {
  const categorias = [{ id:'alimentacion', tipo:'egreso' }, { id:'hogar', tipo:'egreso' }, { id:'sueldo', tipo:'ingreso' }];
  const todos = obtenerPreajustesMovimientos('todos', categorias);
  assert.deepEqual(todos.find(opcion => opcion.id === 'cotidiano')?.categorias, ['alimentacion', 'hogar']);
  assert.deepEqual(todos.find(opcion => opcion.id === 'actividad')?.categorias, ['sueldo']);
  assert.deepEqual(todos.find(opcion => opcion.id === 'bienestar')?.categorias, []);
  assert.ok(obtenerPreajustesMovimientos('ingreso', categorias).every(opcion => opcion.tipo === 'ingreso'));
  assert.ok(obtenerPreajustesMovimientos('egreso', categorias).every(opcion => opcion.tipo === 'egreso'));
  assert.equal(categorias.length, 3);
});

test('Día a día selecciona exactamente hogar, alimentación y compras, sin depender del orden', () => {
  const cotidiano = PREAJUSTES_CATEGORIAS.egreso.find(opcion => opcion.id === 'cotidiano')!;
  assert.ok(coincidenCategorias(cotidiano.categorias, ['compras', 'alimentacion', 'hogar']));
  assert.ok(!coincidenCategorias([...cotidiano.categorias, 'viajes'], cotidiano.categorias));
  assert.ok(!coincidenCategorias(['compras'], cotidiano.categorias));
});

test('los grupos se acumulan y se quitan sin perder otras categorías seleccionadas', () => {
  const grupos = PREAJUSTES_CATEGORIAS.egreso;
  const cotidiano = grupos[0].categorias;
  const obligaciones = grupos[1].categorias;
  const todas = [...grupos.flatMap(grupo => grupo.categorias), 'regalos', 'otros_gastos'];
  const inicial = alternarGrupoCategorias(todas, cotidiano, todas);
  assert.deepEqual(inicial, cotidiano);
  const acumuladas = alternarGrupoCategorias(inicial, obligaciones, todas);
  assert.deepEqual(acumuladas, [...cotidiano, ...obligaciones]);
  assert.deepEqual(alternarGrupoCategorias(acumuladas, cotidiano, todas), obligaciones);
  assert.deepEqual(alternarGrupoCategorias(obligaciones, obligaciones, todas), []);
  assert.deepEqual(alternarGrupoCategorias(['alimentacion', 'viajes'], cotidiano, todas), ['alimentacion', 'viajes', 'compras', 'hogar']);
  assert.deepEqual(alternarGrupoCategorias(inicial, [], todas), inicial);
  assert.deepEqual(inicial, cotidiano);
});

test('el resumen conserva los nombres de grupos y solo desglosa categorías elegidas por separado', () => {
  const grupos = PREAJUSTES_CATEGORIAS.egreso;
  const seleccion = [...grupos[0].categorias, ...grupos[1].categorias, 'regalos'];
  const resumen = agruparCategoriasSeleccionadas(seleccion, grupos, [{ id:'regalos', nombre:'Regalos' }]);
  assert.deepEqual(resumen.map(grupo => grupo.nombre), ['Día a día', 'Servicios y obligaciones', 'Regalos']);
  const sinCotidiano = seleccion.filter(id => !resumen[0].categorias.includes(id));
  assert.deepEqual(agruparCategoriasSeleccionadas(sinCotidiano, grupos, [{ id:'regalos', nombre:'Regalos' }]).map(grupo => grupo.nombre), ['Servicios y obligaciones', 'Regalos']);
  const disponibles = obtenerPreajustesMovimientos('egreso', [{ id:'hogar', tipo:'egreso' }, { id:'alimentacion', tipo:'egreso' }]);
  assert.deepEqual(agruparCategoriasSeleccionadas(['hogar', 'alimentacion'], disponibles, []).map(grupo => grupo.nombre), ['Día a día']);
  assert.deepEqual(agruparCategoriasSeleccionadas([], disponibles, []), []);
});

test('Movimientos acumula grupos desde todas las categorías y permite quitar cada grupo', () => {
  const grupos = PREAJUSTES_CATEGORIAS.egreso;
  const cotidiano = grupos[0].categorias;
  const obligaciones = grupos[1].categorias;
  const inicial = alternarGrupoCategorias([], cotidiano);
  const acumuladas = alternarGrupoCategorias(inicial, obligaciones);
  assert.deepEqual(acumuladas, [...cotidiano, ...obligaciones]);
  assert.deepEqual(agruparCategoriasSeleccionadas(acumuladas, grupos, []).map(grupo => grupo.nombre), ['Día a día', 'Servicios y obligaciones']);
  assert.deepEqual(alternarGrupoCategorias(acumuladas, cotidiano), obligaciones);
  assert.deepEqual(alternarGrupoCategorias(acumuladas, obligaciones), cotidiano);
  assert.deepEqual(alternarGrupoCategorias(cotidiano, cotidiano), []);
  assert.deepEqual(alternarGrupoCategorias(acumuladas, []), acumuladas);
});

test('rechaza límites negativos, no finitos o invertidos y acepta límites abiertos', () => {
  for (const rango of [{ minimo: -1 }, { maximo: NaN }, { minimo: Infinity }, { minimo: 5000, maximo: 1000 }]) assert.equal(validarRangoMontoEstadistica(rango), false);
  for (const rango of [{}, { minimo: 1000 }, { maximo: 5000 }, { minimo: 1000, maximo: 5000 }]) assert.equal(validarRangoMontoEstadistica(rango), true);
});

test('el rango filtra movimientos antes de sumar y se conserva en resumen, columnas y detalle', async prueba => {
  const e = await preparar(prueba);
  await e.prepararDatosPrueba();
  const datos = await e.cargarSocial();
  const deposito = datos.depositos[0];
  const anio = new Date().getFullYear() - 1;
  for (const monto of [999.99, 1000, 2000, 5000, 5000.01]) {
    await e.movimientosRepositorio.crear({ deposito_id: deposito.id, tipo: 'egreso', categoria: 'alimentacion', monto, descripcion: 'Prueba de rango', fecha_hora: new Date(anio, 0, 15, 12).toISOString() });
  }
  const rango = { inicio: new Date(anio, 0, 1), fin: new Date(anio, 1, 1) };
  const rangoMonto = { minimo: 1000, maximo: 5000 };
  const resultado = await e.cargarEstadisticas({ tipo: 'egreso', rangoResumen: rango, rangoColumnas: rango, agrupacionColumnas: 'dia', rangoMonto });
  assert.equal(resultado.resumen.total, 8000);
  assert.equal(resultado.resumen.cantidad, 3);
  assert.equal(resultado.columnas.reduce((total, fila) => total + fila.total, 0), 8000);
  const detalle = await e.cargarDetalleCategoriaEstadistica({ categoria: 'alimentacion', tipo: 'egreso', anio, mes: 0, rangoMonto });
  assert.equal(detalle.resumenMes.total, 8000);
  assert.equal(detalle.evolucion.reduce((total, fila) => total + fila.total, 0), 8000);
  assert.equal(detalle.movimientos.length, 3);
  assert.ok(detalle.movimientos.every(movimiento => movimiento.monto >= 1000 && movimiento.monto <= 5000));
  for (const [depositoId, monto] of [[datos.depositos[0].id, 3250], [datos.depositos[1].id, 2000]] as const) {
    await e.movimientosRepositorio.crear({ deposito_id: depositoId, tipo: 'egreso', categoria: 'alimentacion', monto, descripcion: 'Café 50%_!', fecha_hora: new Date(anio, 0, 15, 13).toISOString() });
  }
  const filtros = { ...rangoMonto, busqueda: '50%_!', depositos: [datos.depositos[0].id] };
  const encontrados = await e.cargarEstadisticas({ tipo: 'egreso', rangoResumen: rango, rangoColumnas: rango, agrupacionColumnas: 'dia', rangoMonto: filtros });
  assert.equal(encontrados.resumen.total, 3250);
  assert.equal(encontrados.resumen.cantidad, 1);
  assert.equal(encontrados.columnas.reduce((total, fila) => total + fila.total, 0), 3250);
  const detalleBuscado = await e.cargarDetalleCategoriaEstadistica({ categoria: 'alimentacion', tipo: 'egreso', anio, mes: 0, rangoMonto: filtros });
  assert.equal(detalleBuscado.resumenMes.total, 3250);
  assert.equal(detalleBuscado.movimientos.length, 1);
  const sinDepositos = await e.cargarEstadisticas({ tipo: 'egreso', rangoResumen: rango, rangoColumnas: rango, agrupacionColumnas: 'dia', rangoMonto: { depositos: [] } });
  assert.equal(sinDepositos.resumen.cantidad, 0);
  await assert.rejects(e.movimientosRepositorio.consultarResumenPorCategoria(datos.usuarioId, 'egreso', rango.inicio.toISOString(), rango.fin.toISOString(), null, { minimo: 5000, maximo: 1000 }));
});
