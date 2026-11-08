import assert from 'node:assert/strict';
import test, {type TestContext} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {unlinkSync} from 'node:fs';
import {preparar} from './helpers/localDatabase.ts';
import {enTransaccionSQLite} from '../src/database/sqliteTransaction.ts';
import type {Conexion} from '../src/database/types.ts';

async function escenario(prueba:TestContext) {
  const archivo=join(tmpdir(),'ahre-concurrencia-'+randomUUID()+'.db');
  const base=new DatabaseSync(archivo),otra=new DatabaseSync(archivo);
  prueba.after(()=>{
    if(otra.isTransaction)otra.exec('ROLLBACK');
    otra.close();base.close();
    unlinkSync(archivo);
  });
  const sql:string[]=[];
  const e=await preparar(prueba,true,{base,url:'https://ahre.test',fetch,registrarSql:sentencia=>sql.push(sentencia)});
  await e.prepararDatosPrueba({incluirSocial:false});
  const {usuario}=await e.obtenerSesionActual();assert.ok(usuario);
  const deposito=await e.depositosRepositorio.crear({usuario_id:usuario.id,nombre:'Concurrencia',tipo:'efectivo',icono:'cash-outline',saldo_inicial:1000,fecha_creacion:'2020-01-01T00:00:00.000Z'});
  const mover=()=>e.crearMovimiento({deposito_id:deposito.id,monto:'100',categoria:'alimentacion',descripcion:'Una sola vez',fecha:new Date(),hora:'12:00',recurrente:false},'egreso');
  base.exec('PRAGMA busy_timeout=0');
  sql.length=0;
  return {...e,otra,sql,deposito,mover};
}

test('la revisión de recurrencias sin vencimientos no escribe ni reserva una transacción',async prueba=>{
  const e=await preparar(prueba);await e.inicializarBaseDatos();
  const sql:string[]=[];
  const reinicio=await preparar(prueba,true,{base:e.base,url:'https://ahre.test',fetch,registrarSql:sentencia=>sql.push(sentencia)});
  await reinicio.inicializarBaseDatos();sql.length=0;
  for(let i=0;i<3;i++)assert.equal(await reinicio.procesarRecurrencias(),0);
  assert.ok(sql.length>0);
  assert.ok(sql.every(sentencia=>/^SELECT/i.test(sentencia)));
});

test('espera a otra escritora antes de tocar el lote y registra un único movimiento',async prueba=>{
  const e=await escenario(prueba);
  e.otra.exec('BEGIN IMMEDIATE');
  const liberacion=setTimeout(()=>e.otra.exec('COMMIT'),40);
  try {
    const movimiento=await e.mover();
    assert.equal(e.base.prepare('SELECT COUNT(*) AS n FROM movimientos WHERE id=?').get(movimiento.id)?.n,1);
    assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(e.deposito.id)?.saldo_actual,900);
    const reserva=e.sql.findIndex(sql=>sql==='BEGIN IMMEDIATE;');
    assert.ok(reserva>=0);
    assert.ok(e.sql.findIndex(sql=>sql.startsWith('UPDATE sync_context SET lote=?'))>reserva);
    assert.equal(e.sql.filter(sql=>sql.startsWith('INSERT INTO "movimientos"')).length,1);
    assert.equal(e.base.prepare('SELECT lote FROM sync_context WHERE id=1').get()?.lote,null);
  } finally {clearTimeout(liberacion);}
});

test('WAL permite confirmar un movimiento mientras otra conexión mantiene una lectura',async prueba=>{
  const e=await escenario(prueba);
  assert.equal(e.base.prepare('PRAGMA journal_mode').get()?.journal_mode,'wal');
  e.otra.exec('BEGIN');
  assert.equal(e.otra.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(e.deposito.id)?.saldo_actual,1000);
  await e.mover();
  assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(e.deposito.id)?.saldo_actual,900);
  assert.equal(e.otra.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(e.deposito.id)?.saldo_actual,1000);
  e.otra.exec('COMMIT');
  assert.equal(e.otra.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(e.deposito.id)?.saldo_actual,900);
});

test('si COMMIT se bloquea, reintenta confirmar sin repetir el movimiento ni avisar antes',async prueba=>{
  const e=await escenario(prueba);
  e.base.exec('PRAGMA journal_mode=DELETE');
  e.otra.exec('BEGIN');
  e.otra.prepare('SELECT * FROM depositos').all();
  let avisos=0;
  const dejar=e.observarCambiosLocales(()=>{avisos++;});
  const liberacion=setTimeout(()=>{assert.equal(avisos,0);e.otra.exec('COMMIT');},40);
  try {
    await e.mover();
    assert.ok(e.sql.filter(sql=>sql==='COMMIT;').length>=2);
    assert.equal(e.sql.filter(sql=>sql.startsWith('INSERT INTO "movimientos"')).length,1);
    assert.equal(avisos,1);
    assert.equal(e.base.prepare('SELECT saldo_actual FROM depositos WHERE id=?').get(e.deposito.id)?.saldo_actual,900);
  } finally {clearTimeout(liberacion);dejar();}
});

test('el error original se conserva aunque falle la reversión; no se repite el callback',async()=>{
  const original=Object.assign(new Error('fallo original'),{code:'ERR_INTERNAL_SQLITE_ERROR'});
  let llamadas=0;
  const conexion={execAsync:async(sql:string)=>{if(sql==='ROLLBACK;')throw new Error('fallo al revertir');}} as unknown as Conexion;
  await assert.rejects(enTransaccionSQLite(conexion,async()=>{llamadas++;throw original;}),error=>error===original);
  assert.equal(llamadas,1);
});

test('si no se puede reservar la escritura no ejecuta el callback ni revierte otra transacción',async()=>{
  const sentencias:string[]=[];
  const conexion={execAsync:async(sql:string)=>{sentencias.push(sql);throw new Error('database is locked');}} as unknown as Conexion;
  let ejecutada=false;
  await assert.rejects(enTransaccionSQLite(conexion,async()=>{ejecutada=true;}),/database is locked/);
  assert.equal(ejecutada,false);
  assert.deepEqual(sentencias,Array(4).fill('BEGIN IMMEDIATE;'));
});
