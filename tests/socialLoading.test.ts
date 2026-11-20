import assert from 'node:assert/strict';
import test from 'node:test';
import type { ComandoOnline, GastoOnline, RespuestaSala } from '../src/social/online/types.ts';
import { presente } from './helpers/assertions.ts';
import { preparar } from './helpers/localDatabase.ts';
import { interfazSocial } from './helpers/socialInterface.ts';

const fecha = '2026-10-30';

async function prepararCuenta(prueba: import('node:test').TestContext) {
  const consultas: string[] = [];
  const entorno = await preparar(prueba, true, {
    url: '/', // Se normaliza a una URL vacía para mantener la sesión de prueba local.
    fetch: async () => { throw new Error('Sin conexión'); },
    registrarSql: sql => consultas.push(sql),
  });
  const usuario = await entorno.registrarUsuario({
    nombre: 'Titular', correo: 'salas@example.test', contrasena: 'ClavePrueba123', confirmacion: 'ClavePrueba123',
  });
  await entorno.crearSesion(usuario.id, false);
  return { ...entorno, usuario, consultas };
}

test('Social trae categorías y totales locales antes de consultar el reparto de una sala', async prueba => {
  const e = await prepararCuenta(prueba);
  const persona = presente(await e.guardarPersona({ nombre: 'Ana', apellido: 'García', apodo: 'Ani' }));
  for (const [id, nombre, descripcion, categoriaId] of [
    ['cena', 'Cena', 'Pizza del viernes', 'alimentacion'],
    ['viaje', 'Viaje', 'Pasajes', 'viajes'],
  ]) {
    await e.crearSala({ id, nombre, fecha, icono: 'restaurant-outline', color: '#BED5C8', personasIds: [persona.id] });
    await e.guardarGasto({
      salaId: id, id: 'gasto-' + id, claveOperacion: 'crear-' + id, descripcion, categoriaId,
      monto: 125.21, pagadorId: persona.id, reparto: 'iguales', involucradas: ['vos', persona.id], pagaron: [],
    });
  }

  e.consultas.length = 0;
  const resumen = await e.cargarResumenSocial();
  const consultasDetalle = () => e.consultas.filter(sql => /SELECT (?:g|p|ps|d)\.\* FROM gastos_compartidos/.test(sql));
  assert.equal(consultasDetalle().length, 0);
  assert.equal(resumen.sala, undefined);
  const cena = presente(resumen.salas.find(sala => sala.id === 'cena'));
  assert.equal('gastos' in cena, false);
  assert.equal(cena.totalGastado, '$ 125,21');
  assert.equal(cena.categorias.join(), 'alimentacion');
  assert.equal(cena.participantes.join(), persona.id);

  const vista = interfazSocial(e, 'claro');
  await vista.abrir(vista.rutas.SALA_SOCIAL);
  await vista.llenar('Buscar salas', 'alimentacion');
  assert.ok(vista.buscarBoton('Abrir Cena'));
  assert.ok(!vista.todos().some(nodo => nodo.props.accessibilityLabel === 'Abrir Viaje'));

  e.consultas.length = 0;
  const abierta = presente((await e.cargarResumenSocial('cena')).sala);
  assert.equal(abierta.id, 'cena');
  assert.equal(abierta.gastos.length, 1);
  assert.equal(abierta.gastos[0].descripcion, 'Pizza del viernes');
  assert.equal(abierta.gastos[0].partes.length, 2);
  assert.equal(consultasDetalle().length, 4);
  assert.ok(consultasDetalle().every(sql => sql.includes('g.sala_id = ?')));
  assert.equal((await e.cargarResumenSocial('sala-ajena')).sala, undefined);
});

test('las tarjetas compartidas reflejan gastos pendientes y el detalle muestra solo la sala seleccionada', async prueba => {
  const e = await prepararCuenta(prueba);
  const gasto: GastoOnline = {
    id: 'gasto', pagadorId: 'yo', categoriaId: 'alimentacion', descripcion: 'Cena única', monto: 100, fecha, version: 1,
    reparto: 'iguales', estado: 'vigente', partes: [{ personaId: 'yo', monto: 50, orden: 0 }, { personaId: 'ana', monto: 50, orden: 1 }], pagaron: [],
  };
  const respuesta: RespuestaSala = {
    personaPropiaId: 'yo', administrador: true, solicitudes: [],
    sala: {
      id: 'compartida', nombre: 'Cena compartida', descripcion: 'Sala de prueba', icono: 'restaurant-outline', color: '#BED5C8',
      fecha, estado: 'abierta', revision: 1,
      participantes: [{ id: 'yo', nombre: 'Titular', activa: true }, { id: 'ana', nombre: 'Ana', activa: true }],
      gastos: [gasto],
    },
    misFinanzas: [{
      clave: 'compra:compartida:gasto', gastoId: gasto.id, salaId: 'compartida', tipo: 'egreso', monto: 100,
      categoria: 'alimentacion', descripcion: 'Compra', fecha,
    }],
  };
  const guardarSala = e.base.prepare('INSERT INTO salas_online_locales(usuario_id,sala_id,datos,administrador,persona_propia_id,fecha_actualizacion) VALUES(?,?,?,1,?,?)');
  guardarSala.run(e.usuario.id, respuesta.sala.id, JSON.stringify(respuesta), 'yo', fecha);
  const otra = { ...respuesta, sala: { ...respuesta.sala, id: 'otra', gastos: [{ ...gasto, descripcion: 'Detalle de otra sala' }] }, misFinanzas: [] };
  guardarSala.run(e.usuario.id, otra.sala.id, JSON.stringify(otra), 'yo', fecha);
  const comando: ComandoOnline = {
    tipo: 'guardar_gasto', idOperacion: 'edicion', versionBase: 1,
    gasto: { ...gasto, descripcion: 'Cena editada sin conexión', monto: 160, categoriaId: 'viajes' },
  };
  e.base.prepare('INSERT INTO comandos_sociales_locales(id,usuario_id,sala_id,datos,fecha_creacion) VALUES(?,?,?,?,?)')
    .run('edicion', e.usuario.id, respuesta.sala.id, JSON.stringify(comando), fecha);

  const panel = await e.cargarResumenSocial();
  const tarjeta = presente(panel.salas.find(sala => sala.id === respuesta.sala.id));
  assert.equal(tarjeta.totalGastado, '$ 160,00');
  assert.equal(tarjeta.categorias.join(), 'viajes');
  assert.equal(tarjeta.movimientosPorRegistrar, 1);
  assert.equal('gastos' in tarjeta, false);
  assert.equal(panel.sala, undefined);
  const consultaCache = presente(e.consultas.find(sql => sql.includes('WITH salas AS (')));
  const fila = presente(e.base.prepare(consultaCache).get(0, '', e.usuario.id));
  assert.equal(fila.completa, 0);
  const resumido = JSON.parse(String(fila.datos));
  assert.equal('partes' in resumido.sala.gastos[0], false);

  const sala = presente((await e.cargarResumenSocial(respuesta.sala.id)).sala);
  assert.equal(sala.pendientesOnline, 1);
  assert.equal(sala.gastos[0].descripcion, 'Cena editada sin conexión');
  assert.equal(sala.gastos[0].version, 2);
  assert.equal(sala.gastos[0].partes[1].personaId, 'ana');
  assert.equal(presente((await e.cargarResumenSocial(otra.sala.id)).sala).gastos[0].descripcion, 'Detalle de otra sala');
});
