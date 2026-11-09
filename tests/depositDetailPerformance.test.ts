import assert from 'node:assert/strict';
import test from 'node:test';
import type { Movimiento } from '../src/database/types.ts';
import { interfazDetalleDeposito } from './helpers/depositDetailInterface.ts';

function movimiento(id: string, fecha: Date, cambios: Partial<Movimiento> = {}): Movimiento {
  return { id, deposito_id: 'deposito', tipo: 'egreso', categoria: 'alimentacion', monto: 100, descripcion: 'Compra',
    fecha_hora: fecha.toISOString(), recurrencia_id: null, transferencia_id: null, anulado: 0,
    fecha_eliminacion: null, reversion_de_id: null, fecha_creacion: fecha.toISOString(), fecha_actualizacion: fecha.toISOString(), ...cambios,
  };
}
const datos = [
  movimiento('viejo', new Date(2025, 0, 1, 12)),
  movimiento('nuevo', new Date(2025, 1, 2, 20), { descripcion: 'Cena', monto: 200 }),
  movimiento('ingreso', new Date(2025, 1, 2, 10), { tipo: 'ingreso', categoria: 'sueldo', descripcion: 'Sueldo', monto: 1000 }),
  movimiento('igual', new Date(2025, 1, 2, 20), { categoria: 'hogar', descripcion: 'Hogar', monto: 300 }),
];
type Interfaz = ReturnType<typeof interfazDetalleDeposito>;
function tarjetas(e: Interfaz) {
  return e.nodos().filter(n => n.type === 'MovementCard').map(n => (n.props.movimiento as Movimiento).id);
}
function abrirMeses(e: Interfaz) {
  for (const nodo of e.nodos().filter(n => n.type === 'CollapsibleSectionHeader')) if (!nodo.props.expandido) e.invocar(nodo, 'alAlternar');
}

test('renders de presentación reutilizan filtrado, orden y meses sin recorrer nuevamente la colección', async prueba => {
  const e = interfazDetalleDeposito(datos);
  prueba.after(e.desmontar);
  e.renderizar(); await e.asentar(); abrirMeses(e);
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso', 'viejo']);
  const inicial = { ...e.recuentos };
  assert.deepEqual(inicial, { filtros: 1, ordenamientos: 1 });
  for (let i = 0; i < 5; i++) e.renderizar();
  e.cambiarTema();
  e.invocar(e.buscar('MovementSearchFilters'), 'alAbrirFiltros');
  e.invocar(e.buscar('MovementFiltersPanel'), 'alCerrar');
  e.invocar(e.buscar('CollapsibleSectionHeader'), 'alAlternar');
  e.invocar(e.buscar('CollapsibleSectionHeader'), 'alAlternar');
  const opciones = e.nodos().find(n => n.props.accessibilityLabel === 'Opciones del depósito')!;
  e.invocar(opciones, 'onPress');
  assert.deepEqual(e.recuentos, inicial);
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso', 'viejo']);
  assert.deepEqual(datos.map(fila => fila.id), ['viejo', 'nuevo', 'ingreso', 'igual']);
});

test('búsqueda, tipo, categorías y montos recalculan los resultados y conservan límites inclusivos', async prueba => {
  prueba.mock.timers.enable({ apis: ['setTimeout'] });
  const e = interfazDetalleDeposito(datos);
  prueba.after(e.desmontar);
  e.renderizar(); await e.asentar();
  let anteriores = e.recuentos.filtros;
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', ' CENA ');
  prueba.mock.timers.tick(250); e.renderizar();
  assert.deepEqual(tarjetas(e), ['nuevo']); assert.equal(e.recuentos.filtros, ++anteriores);
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar');
  e.invocar(e.buscar('FiltroTipoMovimientos'), 'cambiarTipoFiltro', 'ingreso');
  assert.deepEqual(tarjetas(e), ['ingreso']);
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar');
  e.invocar(e.buscar('FiltroCategoriasMovimientos'), 'establecerCategoriaFiltroIds', ['hogar']);
  assert.deepEqual(tarjetas(e), ['igual']);
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar');
  e.invocar(e.buscar('FiltroMontoMovimientos'), 'establecerMontoMinimo', '200');
  e.invocar(e.buscar('FiltroMontoMovimientos'), 'establecerMontoMaximo', '300');
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual']);
  e.invocar(e.buscar('FiltroMontoMovimientos'), 'establecerMontoMaximo', '100');
  assert.deepEqual(tarjetas(e), []);
  e.invocar(e.buscar('FiltroMontoMovimientos'), 'establecerMontoMaximo', '300');
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual']);
  const final = { ...e.recuentos }; e.renderizar(); e.cambiarTema(); assert.deepEqual(e.recuentos, final);
});

test('día, mes y rango personalizado invalidan el resultado sin perder la validación de extremos', async prueba => {
  const e = interfazDetalleDeposito(datos);
  prueba.after(e.desmontar);
  e.renderizar(); await e.asentar();
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'dia');
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'establecerFechaDia', new Date(2025, 0, 1));
  assert.deepEqual(tarjetas(e), ['viejo']);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'mes');
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'establecerMesSeleccionado', new Date(2025, 1, 1));
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso']);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'personalizado');
  assert.deepEqual(tarjetas(e), []);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'seleccionarFechaPersonalizada', new Date(2025, 1, 2));
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'seleccionarFechaPersonalizada', new Date(2025, 0, 1));
  assert.deepEqual(tarjetas(e), []); assert.ok(e.buscar('FiltroFechaMovimientos').props.errorFechaFiltro);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'seleccionarFechaPersonalizada', new Date(2025, 0, 1));
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'seleccionarFechaPersonalizada', new Date(2025, 1, 2));
  abrirMeses(e); assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso', 'viejo']);
});

test('recargar datos invalida la lista y los grupos, y recurrencias conserva el filtro por próxima ejecución', async prueba => {
  const e = interfazDetalleDeposito(datos);
  prueba.after(e.desmontar);
  e.renderizar(); await e.asentar();
  const antes = e.recuentos.filtros;
  const agregado = movimiento('agregado', new Date(2025, 2, 1));
  await e.recargar([...datos, agregado]);
  assert.equal(e.recuentos.filtros, antes + 1); assert.equal(e.recuentos.ordenamientos, antes + 1);
  abrirMeses(e); assert.deepEqual(tarjetas(e), ['agregado', 'nuevo', 'igual', 'ingreso', 'viejo']);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'dia');
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'establecerFechaDia', new Date(2025, 2, 1));
  e.invocar(e.buscar('SegmentedSelector'), 'alSeleccionar', 'recurrentes');
  const filtrar = e.buscar('RecurrencePanel').props.filtrar as (fila: Record<string, unknown>) => boolean;
  assert.equal(filtrar({ ...datos[0], proxima_ejecucion: agregado.fecha_hora }), true);
  assert.equal(filtrar({ ...agregado, proxima_ejecucion: datos[0].fecha_hora }), false);
});

test('debounce espera 250 ms desde la última tecla y limpiar cancela la búsqueda pendiente', async prueba => {
  prueba.mock.timers.enable({ apis: ['setTimeout'] });
  const e = interfazDetalleDeposito(datos);
  prueba.after(e.desmontar);
  e.renderizar(); await e.asentar(); abrirMeses(e);
  const inicial = e.recuentos.filtros;
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'C');
  assert.equal(e.buscar('MovementSearchFilters').props.busqueda, 'C');
  prueba.mock.timers.tick(200);
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'Cena');
  prueba.mock.timers.tick(249); e.renderizar();
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso', 'viejo']);
  assert.equal(e.recuentos.filtros, inicial);
  prueba.mock.timers.tick(1); e.renderizar();
  assert.deepEqual(tarjetas(e), ['nuevo']);
  assert.equal(e.recuentos.filtros, inicial + 1);
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'Hogar');
  prueba.mock.timers.tick(100);
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', '');
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso', 'viejo']);
  prueba.mock.timers.tick(500); e.renderizar();
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso', 'viejo']);
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'Sueldo');
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar');
  prueba.mock.timers.tick(500); e.renderizar();
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso', 'viejo']);
  assert.equal(e.buscar('MovementSearchFilters').props.busqueda, '');
});

test('el debounce se aplica a recurrencias y el desmontaje cancela el temporizador', async prueba => {
  prueba.mock.timers.enable({ apis: ['setTimeout'] });
  const e = interfazDetalleDeposito(datos);
  prueba.after(e.desmontar);
  e.renderizar(); await e.asentar();
  e.invocar(e.buscar('SegmentedSelector'), 'alSeleccionar', 'recurrentes');
  const fila = { ...datos[0], proxima_ejecucion: datos[0].fecha_hora };
  const acepta = () => (e.buscar('RecurrencePanel').props.filtrar as (fila: Record<string, unknown>) => boolean)(fila);
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'Cena');
  assert.equal(acepta(), true);
  prueba.mock.timers.tick(250); e.renderizar(); assert.equal(acepta(), false);
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'Compra');
  e.desmontar(); prueba.mock.timers.tick(500);
  // Ejecutar el render de diagnóstico revela si quedó un callback cambiando estado tras salir.
  e.renderizar(); assert.equal(acepta(), false);
});

test('10.000 movimientos conservan orden y búsqueda sin repetir cálculos en renders ajenos a los filtros', async prueba => {
  prueba.mock.timers.enable({ apis: ['setTimeout'] });
  const volumen = Array.from({ length: 10_000 }, (_, indice) => movimiento(String(indice), new Date(2025, 10, 1, 0, 0, indice), {
    descripcion: indice % 997 === 0 ? 'Objetivo de volumen' : 'Movimiento de volumen',
  }));
  const e = interfazDetalleDeposito(volumen);
  prueba.after(e.desmontar);
  e.renderizar(); await e.asentar();
  const ids = tarjetas(e);
  assert.equal(ids.length, 10_000); assert.equal(ids[0], '9999'); assert.equal(ids.at(-1), '0');
  for (let i = 0; i < 15; i++) e.renderizar();
  e.cambiarTema();
  assert.deepEqual(e.recuentos, { filtros: 1, ordenamientos: 1 });
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'Objetivo');
  prueba.mock.timers.tick(250); e.renderizar();
  assert.deepEqual(tarjetas(e), volumen.filter(fila => fila.descripcion.startsWith('Objetivo')).reverse().map(fila => fila.id));
  assert.deepEqual(e.recuentos, { filtros: 2, ordenamientos: 2 });
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar');
  assert.equal(tarjetas(e).length, 10_000);
  assert.deepEqual(e.recuentos, { filtros: 3, ordenamientos: 3 });
  assert.equal(volumen[0].id, '0'); assert.equal(volumen.at(-1)?.id, '9999');
});
