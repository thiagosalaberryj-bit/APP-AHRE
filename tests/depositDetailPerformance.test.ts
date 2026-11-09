import assert from 'node:assert/strict';
import test from 'node:test';
import type { Movimiento, MovimientoHistorial } from '../src/database/types.ts';
import { interfazDetalleDeposito } from './helpers/depositDetailInterface.ts';

const ahora = new Date();
const fecha = (dia: number, mes = ahora.getMonth()) => new Date(ahora.getFullYear(), mes, dia, 12);
function movimiento(id: string, instante: Date, cambios: Partial<Movimiento> = {}): Movimiento {
  return { id, deposito_id: 'deposito', tipo: 'egreso', categoria: 'alimentacion', monto: 100, descripcion: 'Compra',
    fecha_hora: instante.toISOString(), recurrencia_id: null, transferencia_id: null, anulado: 0,
    fecha_eliminacion: null, reversion_de_id: null, fecha_creacion: instante.toISOString(), fecha_actualizacion: instante.toISOString(), ...cambios };
}
const datos = [movimiento('viejo', fecha(1, ahora.getMonth() - 1)),
  movimiento('nuevo', fecha(2), { descripcion: 'Cena', monto: 200 }),
  movimiento('ingreso', fecha(1), { tipo: 'ingreso', categoria: 'sueldo', descripcion: 'Sueldo', monto: 1000 }),
  movimiento('igual', fecha(2), { categoria: 'hogar', descripcion: 'Hogar', monto: 300 })];
type Interfaz = ReturnType<typeof interfazDetalleDeposito>;
const tarjetas = (e: Interfaz) => e.nodos().filter(n => n.type === 'MovementCard').map(n => (n.props.movimiento as Movimiento).id);
const boton = (e: Interfaz, texto: string) => {
  const etiqueta = e.nodos().find(n => n.type === 'Pressable' && (JSON.stringify(n.props.children) || '').includes(texto));
  assert.ok(etiqueta, 'No se encontró el botón ' + texto); return etiqueta;
};
function abrirMeses(e: Interfaz) {
  for (const n of e.nodos().filter(n => n.type === 'CollapsibleSectionHeader')) if (!n.props.expandido) e.invocar(n, 'alAlternar');
}
for (const pantalla of ['deposito', 'movimientos'] as const) {
const iniciar = (prueba: import('node:test').TestContext, filas = datos, opciones: Parameters<typeof interfazDetalleDeposito>[1] = {}) => {
  const e = interfazDetalleDeposito(filas, { ...opciones, pantalla }); prueba.after(e.desmontar); e.renderizar(); return e;
};
const probar = (nombre: string, ejecutar: (prueba: import('node:test').TestContext) => Promise<void>) => test(pantalla + ': ' + nombre, ejecutar);

if (pantalla === 'movimientos') probar('no muestra vacíos transitorios entre opciones, meses y primera página ni al volver a enfocar', async prueba => {
  let liberarOpciones!: () => void, liberarMeses!: () => void, dibujar!: () => void;
  const opciones = new Promise<void>(resolver => { liberarOpciones = resolver; });
  const meses = new Promise<void>(resolver => { liberarMeses = resolver; });
  const cuadro = new Promise<void>(resolver => { dibujar = resolver; });
  const e = iniciar(prueba, datos, { esperarOpciones: () => opciones, esperarMeses: () => meses, esperarDibujo: () => cuadro });
  const sinParpadeo = () => assert.ok(e.textosRenderizados.every(texto => !/Sin resultados|Todavía no hay movimientos/.test(texto)), 'No debe presentar vacíos antes de terminar la consulta');
  await e.asentar(); sinParpadeo();
  liberarOpciones(); await e.asentar(); sinParpadeo(); assert.equal(e.consultas.length, 0);
  liberarMeses(); await e.asentar(); sinParpadeo(); assert.equal(tarjetas(e).length, 0);
  dibujar(); await e.asentar(); sinParpadeo(); assert.equal(tarjetas(e).length, 3);
  e.cambiarEnfoque(false); await e.asentar(); e.cambiarEnfoque(true); await e.asentar();
  sinParpadeo(); assert.equal(tarjetas(e).length, 3);
});

if (pantalla === 'movimientos') probar('los vacíos reales aparecen solo después de responder y desaparecen al cambiar criterios', async prueba => {
  let liberar!: () => void, espera = Promise.resolve();
  const e = iniciar(prueba, datos, { esperarMeses: () => espera }); await e.asentar();
  espera = new Promise<void>(resolver => { liberar = resolver; }); e.textosRenderizados.length = 0;
  e.invocar(e.buscar('FiltroCategoriasMovimientos'), 'establecerCategoriaFiltroIds', ['sin-coincidencias']); await e.asentar();
  assert.ok(e.textosRenderizados.every(texto => !texto.includes('Sin resultados')));
  liberar(); await e.asentar(); assert.ok(e.textosRenderizados.at(-1)?.includes('Sin resultados'));
  e.textosRenderizados.length = 0;
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar'); await e.asentar();
  assert.ok(e.textosRenderizados.every(texto => !texto.includes('Sin resultados'))); assert.equal(tarjetas(e).length, 3);
  let liberarVacia!: () => void;
  const esperaVacia = new Promise<void>(resolver => { liberarVacia = resolver; });
  const vacia = iniciar(prueba, [], { esperarMeses: () => esperaVacia }); await vacia.asentar();
  assert.ok(vacia.textosRenderizados.every(texto => !/Sin resultados|Todavía no hay movimientos/.test(texto)));
  liberarVacia(); await vacia.asentar(); assert.ok(vacia.textosRenderizados.at(-1)?.includes('Todavía no hay movimientos'));
});

probar('sin filtros iniciales, mes actual abierto y meses anteriores plegados sin consultas de filas', async prueba => {
  const e = iniciar(prueba); await e.asentar();
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso']); assert.equal(e.consultas.length, 1);
  assert.equal(e.buscar('MovementSearchFilters').props.cantidad, 0);
  assert.equal(e.buscar('FiltroFechaMovimientos').props.fechaFiltro, 'todos');
  assert.equal(e.nodos().filter(n => n.type === 'CollapsibleSectionHeader').length, 2);
  assert.equal(e.consultas[0].filtros.desde, new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString());
  for (let i = 0; i < 15; i++) e.renderizar();
  e.cambiarTema(); e.invocar(e.buscar('MovementSearchFilters'), 'alAbrirFiltros');
  e.invocar(e.buscar('MovementFiltersPanel'), 'alCerrar'); await e.asentar(); assert.equal(e.consultas.length, 1);
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar'); await e.asentar(); abrirMeses(e); await e.asentar();
  assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso', 'viejo']);
});

probar('10.000 movimientos montan 50 tarjetas y cargar más agrega otra página sin duplicados', async prueba => {
  const volumen = Array.from({ length: 10000 }, (_, i) => movimiento(String(i).padStart(5,'0'), fecha(1)));
  const e = iniciar(prueba, volumen); await e.asentar();
  assert.equal(tarjetas(e).length, 50); assert.equal(e.recuentos.filas, 50); assert.equal(tarjetas(e)[0], '09999');
  const cargar = boton(e, 'Cargar más movimientos'); e.invocar(cargar, 'onPress'); e.invocar(cargar, 'onPress'); await e.asentar();
  assert.equal(tarjetas(e).length, 100); assert.equal(new Set(tarjetas(e)).size, 100);
  assert.equal(e.consultas.length, 2); assert.equal(e.recuentos.filas, 100); assert.equal(e.consultas[1].cursor?.id, '09950');
  assert.equal(volumen[0].id, '00000');
});

probar('carga automática solo con botón visible y desplazamiento hacia abajo; muestra animación y no encadena cargas', async prueba => {
  const volumen = Array.from({ length: 10000 }, (_, i) => movimiento(String(i).padStart(5,'0'), fecha(1)));
  const e = iniciar(prueba, volumen); await e.asentar(); e.prepararScroll(550);
  const scroll = e.buscar('ScrollView');
  const evento = (y: number) => ({ nativeEvent: { contentOffset: { y } } });
  e.invocar(scroll, 'onScroll', evento(10)); await e.asentar(); assert.equal(e.consultas.length, 1);
  e.invocar(scroll, 'onScrollBeginDrag', evento(10)); e.invocar(scroll, 'onScroll', evento(20));
  assert.ok(e.nodos().some(n => n.type === 'ActivityIndicator'));
  e.invocar(scroll, 'onScroll', evento(25)); await e.asentar(); assert.equal(e.consultas.length, 2);
  assert.equal(tarjetas(e).length, 100);
  e.invocar(scroll, 'onScroll', evento(25)); e.invocar(scroll, 'onScroll', evento(20)); await e.asentar(); assert.equal(e.consultas.length, 2);
  e.prepararScroll(700); e.invocar(scroll, 'onScroll', evento(30)); await e.asentar(); assert.equal(e.consultas.length, 2);
  e.prepararScroll(550); e.invocar(scroll, 'onScroll', evento(40)); await e.asentar(); assert.equal(e.consultas.length, 3);
  e.invocar(scroll, 'onScrollEndDrag'); await e.asentar(); assert.equal(e.consultas.length, 3);
});

probar('meses anteriores con muchos movimientos solo consultan filas al desplegarlos y se reutilizan al reabrir', async prueba => {
  const volumen = Array.from({ length: 10000 }, (_, i) => movimiento(String(i).padStart(5,'0'), i < 7000 ? fecha(1) : fecha(1, ahora.getMonth() - 1)));
  const e = iniciar(prueba, volumen); await e.asentar();
  assert.equal(e.recuentos.filas, 50); assert.equal(e.nodos().filter(n => n.type === 'CollapsibleSectionHeader').length, 2);
  const anterior = e.nodos().find(n => n.type === 'CollapsibleSectionHeader' && !n.props.expandido)!;
  e.invocar(anterior, 'alAlternar'); await e.asentar(); assert.equal(e.recuentos.filas, 100); assert.equal(tarjetas(e).length, 100);
  const abierto = e.nodos().find(n => n.type === 'CollapsibleSectionHeader' && n.props.titulo === anterior.props.titulo)!;
  e.invocar(abierto, 'alAlternar'); await e.asentar(); assert.equal(tarjetas(e).length, 50);
  e.invocar(anterior, 'alAlternar'); await e.asentar(); assert.equal(e.recuentos.filas, 100); assert.equal(tarjetas(e).length, 100);
});

probar('la apertura dibuja la carga antes de consultar y reabrir 300 filas vuelve a 50', async prueba => {
  const cuadros: (() => void)[] = [];
  const volumen = Array.from({ length: 600 }, (_, i) => movimiento(String(i).padStart(5,'0'), fecha(1)));
  const e = iniciar(prueba, volumen, { esperarDibujo: () => new Promise<void>(resolver => cuadros.push(resolver)) });
  await e.asentar();
  assert.equal(e.consultas.length, 0); assert.equal(tarjetas(e).length, 0);
  assert.ok(e.nodos().some(n => n.props.accessibilityRole === 'progressbar' && String(n.props.accessibilityLabel).startsWith('Cargando movimientos de')));
  cuadros.shift()!(); await e.asentar(); assert.equal(tarjetas(e).length, 50);
  for (let i = 0; i < 5; i++) { e.invocar(boton(e, 'Cargar más movimientos'), 'onPress'); await e.asentar(); }
  assert.equal(tarjetas(e).length, 300); assert.equal(e.consultas.length, 6);
  e.invocar(e.buscar('CollapsibleSectionHeader'), 'alAlternar'); await e.asentar(); assert.equal(tarjetas(e).length, 0);
  e.invocar(e.buscar('CollapsibleSectionHeader'), 'alAlternar');
  assert.equal(tarjetas(e).length, 0); assert.ok(e.nodos().some(n => n.props.accessibilityRole === 'progressbar'));
  await e.asentar(); assert.equal(e.consultas.length, 6);
  cuadros.shift()!(); await e.asentar(); assert.equal(tarjetas(e).length, 50);
  e.invocar(boton(e, 'Cargar más movimientos'), 'onPress'); await e.asentar();
  assert.equal(tarjetas(e).length, 100); assert.equal(e.consultas.at(-1)?.cursor?.id, '00550');
});

probar('cerrar un mes descarta la página pendiente y no repone sus filas al reabrir', async prueba => {
  const volumen = Array.from({ length: 200 }, (_, i) => movimiento(String(i).padStart(5,'0'), fecha(1)));
  let completar: ((filas: MovimientoHistorial[]) => void) | undefined;
  const filas = [...volumen].reverse().map(fila => ({ ...fila, deposito_nombre: 'Cuenta' } as MovimientoHistorial));
  const e = iniciar(prueba, volumen, { consultarPagina: async (_id, _filtros, cursor) => cursor
    ? new Promise<MovimientoHistorial[]>(resolver => { completar = resolver; }) : filas.slice(0,50) });
  await e.asentar(); e.invocar(boton(e, 'Cargar más movimientos'), 'onPress'); await e.asentar();
  assert.ok(completar); e.invocar(e.buscar('CollapsibleSectionHeader'), 'alAlternar');
  e.invocar(e.buscar('CollapsibleSectionHeader'), 'alAlternar'); await e.asentar();
  assert.equal(tarjetas(e).length, 50); completar!(filas.slice(50,100)); await e.asentar();
  assert.equal(tarjetas(e).length, 50); assert.equal(e.consultas.length, 2);
});

probar('plegar y desplegar conserva la posición y detiene la carga automática anterior', async prueba => {
  const volumen = Array.from({ length: 600 }, (_, i) => movimiento(String(i).padStart(5,'0'), fecha(1)));
  const e = iniciar(prueba, volumen); await e.asentar(); e.prepararScroll(550,100);
  const scroll = e.buscar('ScrollView'), evento = (y: number) => ({ nativeEvent: { contentOffset: { y }, layoutMeasurement: { height: 600 } } });
  e.invocar(scroll, 'onScroll', evento(1200)); e.invocar(scroll, 'onScrollBeginDrag', evento(1200));
  e.invocar(e.buscar('CollapsibleSectionHeader'), 'alAlternar');
  e.invocar(scroll, 'onContentSizeChange', 360, 600); await e.asentar();
  assert.deepEqual(e.posicionesScroll.at(-1), { y: 1200, animated: false });
  e.invocar(e.buscar('CollapsibleSectionHeader'), 'alAlternar');
  e.invocar(scroll, 'onContentSizeChange', 360, 700); await e.asentar();
  e.invocar(scroll, 'onContentSizeChange', 360, 7000);
  assert.deepEqual(e.posicionesScroll.at(-1), { y: 1200, animated: false });
  e.invocar(scroll, 'onScroll', evento(1300)); await e.asentar(); assert.equal(e.consultas.length, 1);
  const restauraciones = e.posicionesScroll.length;
  e.invocar(scroll, 'onScrollBeginDrag', evento(1300)); e.invocar(scroll, 'onContentSizeChange', 360, 7000);
  assert.equal(e.posicionesScroll.length, restauraciones);
});

probar('debounce consulta coincidencias fuera de la página y limpiar cancela la búsqueda pendiente', async prueba => {
  prueba.mock.timers.enable({ apis: ['setTimeout'] });
  const filas = Array.from({ length: 120 }, (_, i) => movimiento(String(i).padStart(3,'0'), fecha(1), { descripcion: i === 0 ? 'Objetivo remoto' : 'Compra' }));
  const e = iniciar(prueba, filas); await e.asentar(); e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'Objetivo');
  prueba.mock.timers.tick(249); await e.asentar(); assert.equal(e.consultas.length, 1);
  prueba.mock.timers.tick(1); await e.asentar(); assert.deepEqual(tarjetas(e), ['000']); assert.equal(e.consultas.at(-1)?.cursor, null);
  e.invocar(e.buscar('MovementSearchFilters'), 'alBuscar', 'No existe');
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar'); await e.asentar(); prueba.mock.timers.tick(500); await e.asentar();
  assert.equal(tarjetas(e).length, 50); assert.equal(e.consultas.at(-1)?.filtros.busqueda, '');
});

probar('tipo, categorías y montos reinician la página y bloquean rangos inválidos', async prueba => {
  const e = iniciar(prueba); await e.asentar();
  e.invocar(e.buscar('FiltroTipoMovimientos'), 'cambiarTipoFiltro', 'ingreso'); await e.asentar(); assert.deepEqual(tarjetas(e), ['ingreso']);
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar'); e.invocar(e.buscar('FiltroCategoriasMovimientos'), 'establecerCategoriaFiltroIds', ['hogar']);
  await e.asentar(); assert.deepEqual(tarjetas(e), ['igual']);
  e.invocar(e.buscar('MovementSearchFilters'), 'alLimpiar');
  e.invocar(e.buscar('FiltroMontoMovimientos'), 'establecerMontoMinimo', '200'); e.invocar(e.buscar('FiltroMontoMovimientos'), 'establecerMontoMaximo', '300');
  await e.asentar(); assert.deepEqual(tarjetas(e), ['nuevo', 'igual']); const consultas = e.consultas.length;
  e.invocar(e.buscar('FiltroMontoMovimientos'), 'establecerMontoMaximo', '100'); await e.asentar();
  assert.equal(e.consultas.length, consultas); assert.deepEqual(tarjetas(e), []);
});

probar('día, semana, mes y rango personalizado consultan con extremos correctos', async prueba => {
  const e = iniciar(prueba); await e.asentar();
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'dia'); e.invocar(e.buscar('FiltroFechaMovimientos'), 'establecerFechaDia', fecha(1));
  await e.asentar(); assert.deepEqual(tarjetas(e), ['ingreso']);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'mes'); e.invocar(e.buscar('FiltroFechaMovimientos'), 'establecerMesSeleccionado', fecha(1, ahora.getMonth() - 1));
  await e.asentar(); abrirMeses(e); await e.asentar(); assert.deepEqual(tarjetas(e), ['viejo']);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'personalizado'); await e.asentar();
  if (pantalla === 'deposito') assert.deepEqual(tarjetas(e), []);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'seleccionarFechaPersonalizada', fecha(1)); e.invocar(e.buscar('FiltroFechaMovimientos'), 'seleccionarFechaPersonalizada', fecha(2));
  await e.asentar(); assert.deepEqual(tarjetas(e), ['nuevo', 'igual', 'ingreso']);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'semana');
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'establecerFechaDia', fecha(2));
  await e.asentar();
  const filtros = e.consultas.at(-1)!.filtros;
  const lunes = fecha(2); lunes.setHours(0,0,0,0); lunes.setDate(lunes.getDate() - (lunes.getDay() + 6) % 7);
  assert.ok(Date.parse(filtros.desde!) >= lunes.getTime());
  assert.ok(Date.parse(filtros.hasta!) <= new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 7).getTime());
});

probar('respuestas anteriores no reemplazan resultados al cambiar filtros o salir', async prueba => {
  const pendientes: ((filas: MovimientoHistorial[]) => void)[] = [];
  const e = iniciar(prueba, datos, { consultarPagina: () => new Promise(resolve => pendientes.push(resolve)) }); await e.asentar();
  e.invocar(e.buscar('FiltroTipoMovimientos'), 'cambiarTipoFiltro', 'ingreso'); await e.asentar();
  pendientes[1]([{ ...datos[2], deposito_nombre: 'Cuenta' } as MovimientoHistorial]); await e.asentar();
  pendientes[0]([{ ...datos[1], deposito_nombre: 'Cuenta' } as MovimientoHistorial]); await e.asentar(); assert.deepEqual(tarjetas(e), ['ingreso']);
  e.cambiarEnfoque(false); await e.asentar(); assert.deepEqual(tarjetas(e), []);
  e.cambiarEnfoque(true); await e.asentar(); pendientes.at(-1)!([]); await e.asentar(); assert.deepEqual(tarjetas(e), []);
});

probar('errores permiten reintentar y cargar más conserva las tarjetas previas', async prueba => {
  let llamadas = 0;
  const filas = Array.from({ length: 50 }, (_, i) => ({ ...movimiento(String(i), fecha(1)), deposito_nombre: 'Cuenta' } as MovimientoHistorial));
  const e = iniciar(prueba, Array.from({length:100}, (_, i) => movimiento(String(i), fecha(1))), { consultarPagina: async () => { llamadas++; if (llamadas === 1 || llamadas === 3) throw new Error('fallo'); return llamadas === 2 ? filas : []; } });
  await e.asentar(); e.invocar(boton(e, 'Reintentar'), 'onPress'); await e.asentar(); assert.equal(tarjetas(e).length, 50);
  e.invocar(boton(e, 'Cargar más movimientos'), 'onPress'); await e.asentar(); assert.equal(tarjetas(e).length, 50);
  e.invocar(boton(e, 'Reintentar cargar movimientos'), 'onPress'); await e.asentar(); assert.equal(tarjetas(e).length, 50); assert.equal(llamadas, 4);
});

if (pantalla === 'deposito') probar('recurrencias conserva el filtro por próxima ejecución y actualizar recarga la página', async prueba => {
  const e = iniciar(prueba); await e.asentar(); await e.recargar([...datos, movimiento('agregado', fecha(3))]); await e.asentar();
  assert.deepEqual(tarjetas(e), ['agregado', 'nuevo', 'igual', 'ingreso']);
  e.invocar(e.buscar('FiltroFechaMovimientos'), 'cambiarFechaFiltro', 'dia'); e.invocar(e.buscar('FiltroFechaMovimientos'), 'establecerFechaDia', fecha(1));
  e.invocar(e.buscar('SegmentedSelector'), 'alSeleccionar', 'recurrentes'); await e.asentar();
  const filtrar = e.buscar('RecurrencePanel').props.filtrar as (fila: Record<string, unknown>) => boolean;
  assert.equal(filtrar({ ...datos[1], proxima_ejecucion: fecha(1).toISOString() }), true);
  assert.equal(filtrar({ ...datos[2], proxima_ejecucion: fecha(2).toISOString() }), false);
});

}
