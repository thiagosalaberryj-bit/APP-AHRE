import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { preparar } from './helpers/localDatabase.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import { compilarFuente } from './helpers/typescript.ts';

async function prepararInicializacion(fallo: 'apertura' | 'version' | 'esquema' | 'diario', bloqueosDiario = 0, desarrollo = true) {
  const registros: Record<string, unknown>[] = [];
  const estado = { fallo: true, aperturas: 0, cierres: 0, intentosDiario: 0, intentosReserva:0, archivos: [] as string[] };
  const sentencias: string[] = [], esperas: number[] = [];
  const contexto = createContext({ __DEV__: desarrollo,
    setTimeout: (resolver: () => void, demora: number) => { esperas.push(demora); queueMicrotask(resolver); },
    console: { error: (_titulo: string, datos: Record<string, unknown>) => registros.push(datos) } });
  const errorNativo = Object.assign(new Error('SQLite: detalle nativo de prueba'), { code: 'ERR_INTERNAL_SQLITE_ERROR' });
  const conexion = {
    execAsync: async (sql: string) => {
      sentencias.push(sql);
      if(sql==='BEGIN IMMEDIATE;' && ++estado.intentosReserva<=bloqueosDiario)
        throw Object.assign(new Error('database is locked'),{code:'ERR_INTERNAL_SQLITE_ERROR'});
    },
    runAsync: async () => ({}),
    getFirstAsync: async (sql: string) => {
      if (sql.includes('foreign_keys')) return { foreign_keys: 1 };
      if (estado.fallo && fallo === 'version' && sql.includes('user_version')) throw errorNativo;
      return { user_version: fallo === 'esquema' ? 0 : 1 };
    },
    withTransactionAsync: async (operacion: () => Promise<void>) => operacion(),
    closeAsync: async () => { estado.cierres++; },
  };
  const sintetico = (nombre: string, valores: Record<string, unknown>) => new SyntheticModule(Object.keys(valores), function () {
    for (const [clave, valor] of Object.entries(valores)) this.setExport(clave, valor);
  }, { context: contexto, identifier: nombre });
  const control = new SourceTextModule(compilarFuente(await readFile(new URL('../src/database/sqliteTransaction.ts', import.meta.url), 'utf8'), 'sqliteTransaction.ts'), {context:contexto});
  await control.link(()=>{throw new Error('Import inesperado');});
  const errores = new SourceTextModule(compilarFuente(await readFile(new URL('../src/database/errors.ts', import.meta.url), 'utf8'), 'errors.ts'), { context: contexto });
  await errores.link(() => { throw new Error('Import inesperado'); });
  const dependencias = {
    'expo-sqlite': sintetico('sqlite', { openDatabaseAsync: async (nombre:string) => { estado.archivos.push(nombre);estado.aperturas++; if (estado.fallo && fallo === 'apertura') throw errorNativo; return conexion; } }),
    '../sync/journal': sintetico('diario', { estaPreparadoDiario:async()=>false, prepararDiario: async () => {
      estado.intentosDiario++;
      if (estado.fallo && fallo === 'diario') throw errorNativo;
    } }),
    './migrations/001_initialSchema': sintetico('esquema', { VERSION_ESQUEMA_INICIAL: 1, aplicarEsquemaInicial: async () => { if (estado.fallo && fallo === 'esquema') throw errorNativo; } }),
    './errors': errores,
    './sqliteTransaction': control,
  };
  const fuente = compilarFuente(await readFile(new URL('../src/database/initialization.ts', import.meta.url), 'utf8'), 'initialization.ts');
  const cargar = async () => {
  const modulo = new SourceTextModule(fuente, { context: contexto });
  await modulo.link(nombre => {
    const dependencia = dependencias[nombre as keyof typeof dependencias];
    if (!dependencia) throw new Error(nombre);
    return dependencia;
  });
  await modulo.evaluate();
  return modulo;
  };
  const modulo = await cargar();
  const cargarCola = async () => {
    const cola = new SourceTextModule(compilarFuente(await readFile(new URL('../src/database/connectionQueue.ts', import.meta.url), 'utf8'), 'connectionQueue.ts'), {context:contexto});
    await cola.link(nombre=>{
      if(nombre==='./initialization')return modulo;
      if(nombre==='./sqliteTransaction')return control;
      if(nombre==='./identifiers')return sintetico('identificadores',{generarIdentificador:()=> 'lote-prueba'});
      if(nombre==='../sync/journal')return sintetico('avisos',{avisarCambiosLocales:()=>{}});
      throw new Error(nombre);
    });
    await cola.evaluate();
    return cola.namespace as unknown as {ejecutarLecturaConConexion:<T>(accion:()=>Promise<T>)=>Promise<T>};
  };
  return { estado, registros, sentencias, esperas, recargar: cargar, cargarCola, inicializar: (modulo.namespace as unknown as { inicializarBaseDatos: () => Promise<unknown> }).inicializarBaseDatos };
}

for (const [fallo, operacion] of [
  ['apertura', 'abrir-base'], ['version', 'leer-version'],
  ['esquema', 'aplicar-esquema-inicial'], ['diario', 'preparar-diario-sincronizacion'],
] as const) test(`identifica un error nativo en ${fallo}, conserva el detalle y permite reintentar`, async () => {
  const e = await prepararInicializacion(fallo);
  const primera = e.inicializar();
  const concurrente = e.inicializar();
  const resultados = await Promise.allSettled([primera, concurrente]);
  assert.ok(resultados.every(resultado => resultado.status === 'rejected'));
  assert.equal(e.estado.aperturas, 1);
  assert.equal(e.registros.length, 1);
  assert.equal(e.registros[0].operacion, operacion);
  assert.equal(e.registros[0].codigoTecnico, 'ERR_INTERNAL_SQLITE_ERROR');
  assert.equal(e.registros[0].mensajeTecnico, 'SQLite: detalle nativo de prueba');
  assert.equal(e.estado.cierres, fallo === 'apertura' ? 0 : 1);
  e.estado.fallo = false;
  await e.inicializar();
  await e.inicializar();
  assert.equal(e.estado.aperturas, 2);
});

test('espera y reintenta el bloqueo nativo del diario sin cerrar ni reabrir la base', async () => {
  const e = await prepararInicializacion('diario', 2);
  e.estado.fallo = false;
  await Promise.all([e.inicializar(), e.inicializar()]);
  assert.equal(e.sentencias[0], 'PRAGMA busy_timeout = 2000;');
  assert.equal(e.estado.intentosDiario, 1);
  assert.equal(e.estado.intentosReserva, 3);
  assert.equal(e.estado.aperturas, 1);
  assert.equal(e.estado.cierres, 0);
  assert.deepEqual(e.esperas, [100, 200]);
  assert.equal(e.registros.length, 0);
});

test('un bloqueo persistente termina los reintentos y mantiene el diagnóstico original', async () => {
  const e = await prepararInicializacion('diario', 10);
  await assert.rejects(e.inicializar(), /No se pudo/);
  assert.equal(e.estado.intentosDiario, 0);
  assert.equal(e.estado.intentosReserva, 4);
  assert.equal(e.estado.cierres, 1);
  assert.equal(e.registros.length, 1);
  assert.match(String(e.registros[0].mensajeTecnico), /database is locked/);
});

for(const desarrollo of [true,false])test('la inicialización conserva separados los archivos de desarrollo y release: '+desarrollo,async()=>{
  const e=await prepararInicializacion('diario',0,desarrollo);e.estado.fallo=false;
  await e.inicializar();
  assert.deepEqual(e.estado.archivos,[desarrollo?'ahre-desarrollo-social-v3.db':'ahre.db']);
  assert.ok(e.sentencias.every(sql=>!/^DROP TABLE|^DELETE FROM/i.test(sql)));
});


test('la recarga de Expo comparte la apertura pendiente y conserva la conexión y su cola', async () => {
  const e = await prepararInicializacion('diario');e.estado.fallo=false;
  const primera = e.inicializar();
  const recarga = await e.recargar();
  const modulo = recarga.namespace as unknown as { inicializarBaseDatos:()=>Promise<unknown>; estadoConexion:{colaOperaciones:Promise<void>} };
  const [conexion, otra] = await Promise.all([primera, modulo.inicializarBaseDatos()]);
  assert.equal(conexion, otra);assert.equal(e.estado.aperturas, 1);
  const cola = modulo.estadoConexion.colaOperaciones;
  const segundaRecarga = await e.recargar();
  const segundo = segundaRecarga.namespace as unknown as typeof modulo;
  assert.equal(await segundo.inicializarBaseDatos(), conexion);
  assert.equal(segundo.estadoConexion.colaOperaciones, cola);
  assert.equal(e.estado.intentosDiario, 1);
});

test('el diario espera la reserva sin repetir su preparación ni revertir transacciones ajenas', async () => {
  const e = await prepararInicializacion('diario', 2);e.estado.fallo=false;
  await e.inicializar();
  assert.deepEqual(e.sentencias.filter(sql=>/^(BEGIN|ROLLBACK|COMMIT)/.test(sql)),[
    'BEGIN IMMEDIATE;','BEGIN IMMEDIATE;','BEGIN IMMEDIATE;','COMMIT;'
  ]);
});


test('una cola recargada espera la operación que ya estaba ejecutándose antes de Fast Refresh', async () => {
  const e = await prepararInicializacion('diario');e.estado.fallo=false;
  const cola = await e.cargarCola(), orden:string[]=[];
  let liberar!:()=>void, avisarInicio!:()=>void;
  const espera = new Promise<void>(resolver=>{liberar=resolver;});
  const inicio = new Promise<void>(resolver=>{avisarInicio=resolver;});
  const anterior = cola.ejecutarLecturaConConexion(async()=>{orden.push('inicio');avisarInicio();await espera;orden.push('fin');});
  await inicio;
  const nuevaCola = await e.cargarCola();
  const nueva = nuevaCola.ejecutarLecturaConConexion(async()=>{orden.push('nueva');});
  await Promise.resolve();assert.deepEqual(orden,['inicio']);
  liberar();await Promise.all([anterior,nueva]);
  assert.deepEqual(orden,['inicio','fin','nueva']);assert.equal(e.estado.aperturas,1);
});


test('una base preparada inicia sin escrituras aunque otra conexión mantenga un bloqueo real', async prueba => {
  const archivo = join(tmpdir(),'ahre-bloqueo-'+randomUUID()+'.db');
  const base = new DatabaseSync(archivo), escritora = new DatabaseSync(archivo);
  try {
    const primera = await preparar(prueba,true,{base,url:'https://ahre.test',fetch});
    await primera.inicializarBaseDatos();
    base.prepare('INSERT INTO sync_state(usuario_id,revision,preparada) VALUES(?,?,?)').run('conservar',42,1);
    escritora.exec('BEGIN IMMEDIATE');
    // Control: SQLite realmente impide escribir desde la conexión de la app.
    base.exec('PRAGMA busy_timeout=0');
    assert.throws(()=>base.exec("INSERT INTO sync_state(usuario_id) VALUES('bloqueada')"),/locked/);
    const sentencias:string[]=[];
    const reinicio = await preparar(prueba,true,{base,url:'https://ahre.test',fetch,registrarSql:sql=>sentencias.push(sql)});
    await reinicio.inicializarBaseDatos();
    assert.ok(!sentencias.some(sql=>/\b(BEGIN|INSERT|CREATE|UPDATE|DELETE)\b/i.test(sql)));
    assert.equal(base.prepare('SELECT revision FROM sync_state WHERE usuario_id=?').get('conservar')?.revision,42);
  } finally {
    if(escritora.isTransaction)escritora.exec('ROLLBACK');
    escritora.close();base.close();unlinkSync(archivo);
  }
});

test('si falta un trigger del diario, el inicio lo repone sin reemplazar datos ni duplicar eventos',async prueba=>{
  const e=await preparar(prueba);await e.inicializarBaseDatos();
  e.base.exec('DROP TRIGGER sync_movimientos_UPDATE');
  e.base.prepare('INSERT INTO sync_state(usuario_id,revision,preparada) VALUES(?,?,?)').run('conservar',42,1);
  const reinicio=await preparar(prueba,true,{base:e.base,url:'https://ahre.test',fetch});
  await reinicio.inicializarBaseDatos();
  assert.equal(e.base.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='trigger' AND name='sync_movimientos_UPDATE'").get()?.n,1);
  assert.equal(e.base.prepare('SELECT revision FROM sync_state WHERE usuario_id=?').get('conservar')?.revision,42);
  assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM sync_outbox').get()?.n,0);
});
