import type { Conexion } from '../database/types';
import { TABLAS_SYNC, type CambioSync, type TablaSync } from './protocol';
const oyentes=new Set<()=>void>();
export function observarCambiosLocales(oyente:()=>void){oyentes.add(oyente);return()=>{oyentes.delete(oyente);};}
export function avisarCambiosLocales(){for(const oyente of oyentes)oyente();}

export function propietarioSql(tabla: TablaSync, alias: string) {
  if (tabla === 'usuarios') return `${alias}.id`;
  if (['movimientos', 'recurrencias', 'historial_saldos_deposito'].includes(tabla)) return `(SELECT usuario_id FROM depositos WHERE id = ${alias}.deposito_id)`;
  return `${alias}.usuario_id`;
}

export async function prepararDiario(conexion: Conexion) {
  await conexion.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_context (id INTEGER PRIMARY KEY CHECK(id=1), lote TEXT, importando INTEGER NOT NULL DEFAULT 0);
    INSERT OR IGNORE INTO sync_context(id) VALUES(1);
    CREATE TABLE IF NOT EXISTS sync_state (usuario_id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, preparada INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sync_outbox (secuencia INTEGER PRIMARY KEY AUTOINCREMENT, lote TEXT NOT NULL, usuario_id TEXT NOT NULL, cambio TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS sync_outbox_usuario ON sync_outbox(usuario_id,secuencia);
    CREATE TABLE IF NOT EXISTS sync_authorization (usuario_id TEXT PRIMARY KEY, dispositivo_id TEXT NOT NULL, generacion INTEGER NOT NULL, revocada INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS sync_batch_authorization (lote TEXT PRIMARY KEY, usuario_id TEXT NOT NULL, generacion INTEGER NOT NULL);
    CREATE TRIGGER IF NOT EXISTS sync_autorizacion_lote AFTER INSERT ON sync_outbox
    BEGIN INSERT OR IGNORE INTO sync_batch_authorization(lote,usuario_id,generacion)
      SELECT NEW.lote,NEW.usuario_id,generacion FROM sync_authorization WHERE usuario_id=NEW.usuario_id; END;
  `);
  for (const tabla of TABLAS_SYNC) {
    const columnas = await conexion.getAllAsync<{name:string}>(`PRAGMA table_info(${tabla});`);
    for (const [accion, evento, alias] of [['guardar','INSERT','NEW'], ['guardar','UPDATE','NEW'], ['eliminar','DELETE','OLD']] as const) {
      const propietario=propietarioSql(tabla,evento==='INSERT'?'NEW':'OLD');
      await conexion.execAsync(`CREATE TRIGGER IF NOT EXISTS autorizacion_${tabla}_${evento} BEFORE ${evento} ON ${tabla}
        WHEN (SELECT importando FROM sync_context WHERE id=1)=0 AND (SELECT revocada FROM sync_authorization WHERE usuario_id=${propietario})=1
        BEGIN SELECT RAISE(ABORT,'dispositivo_revocado'); END;`);
      const objeto = `json_object(${columnas.map(c => `'${c.name}',${alias}."${c.name}"`).join(',')})`;
      await conexion.execAsync(`CREATE TRIGGER IF NOT EXISTS sync_${tabla}_${evento} AFTER ${evento} ON ${tabla}
        WHEN (SELECT importando FROM sync_context WHERE id=1)=0
        BEGIN INSERT INTO sync_outbox(lote,usuario_id,cambio) VALUES (
          COALESCE((SELECT lote FROM sync_context WHERE id=1),lower(hex(randomblob(16)))),
          ${propietarioSql(tabla, alias)},json_object('tabla','${tabla}','accion','${accion}','datos',${objeto})); END;`);
    }
  }
}

export async function prepararCuentaLocal(conexion: Conexion, usuarioId: string) {
  const estado = await conexion.getFirstAsync<{preparada:number}>('SELECT preparada FROM sync_state WHERE usuario_id=?',[usuarioId]);
  if (estado?.preparada) return;
  // Bootstrap sustituye el historial previo de esta cuenta por su estado actual.
  // Los eventos posteriores se siguen agregando en orden sin compactarlos.
  await conexion.withTransactionAsync(async () => {
    await conexion.runAsync('DELETE FROM sync_outbox WHERE usuario_id=?',[usuarioId]);
    const lote = `inicial:${usuarioId}`;
    for (const tabla of TABLAS_SYNC) {
      const columnas = await conexion.getAllAsync<{name:string}>(`PRAGMA table_info(${tabla});`);
      const objeto = `json_object(${columnas.map(c=>`'${c.name}',t."${c.name}"`).join(',')})`;
      await conexion.runAsync(`INSERT INTO sync_outbox(lote,usuario_id,cambio) SELECT ?,?,json_object('tabla',?,'accion','guardar','datos',${objeto}) FROM ${tabla} t WHERE ${propietarioSql(tabla,'t')}=? ORDER BY t.id`,[lote,usuarioId,tabla,usuarioId]);
    }
    await conexion.runAsync('INSERT INTO sync_state(usuario_id,preparada) VALUES(?,1) ON CONFLICT(usuario_id) DO UPDATE SET preparada=1',[usuarioId]);
  });
}

export async function aplicarCambios(conexion: Conexion, cambios: CambioSync[]) {
  // La réplica ya representa una transacción validada. Se conservan CHECK y FK;
  // las restricciones de edición interactiva no deben impedir importar historial cerrado.
  const triggers = await conexion.getAllAsync<{name:string;sql:string}>("SELECT name,sql FROM sqlite_master WHERE type='trigger' AND name LIKE 'trg_%'");
  await conexion.runAsync('UPDATE sync_context SET importando=1 WHERE id=1');
  for (const trigger of triggers) await conexion.execAsync(`DROP TRIGGER "${trigger.name}";`);
  for (const cambio of cambios) {
    if (!TABLAS_SYNC.includes(cambio.tabla)) throw new Error('Tabla de sincronización inválida.');
    const columnas = (await conexion.getAllAsync<{name:string}>(`PRAGMA table_info(${cambio.tabla});`)).map(c=>c.name);
    const campos = Object.keys(cambio.datos);
    if (!campos.includes('id') || campos.some(c=>!columnas.includes(c))) throw new Error('Registro de sincronización inválido.');
    if (cambio.accion === 'eliminar') await conexion.runAsync(`DELETE FROM ${cambio.tabla} WHERE id=?`,[cambio.datos.id]);
    else {
      const editables=campos.filter(c=>c!=='id');
      await conexion.runAsync(`INSERT INTO ${cambio.tabla}(${campos.map(c=>`"${c}"`).join(',')}) VALUES(${campos.map(()=>'?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${editables.map(c=>`"${c}"=excluded."${c}"`).join(',')}`,campos.map(c=>cambio.datos[c]));
    }
  }
  for (const trigger of triggers) await conexion.execAsync(trigger.sql);
  await conexion.runAsync('UPDATE sync_context SET importando=0 WHERE id=1');
}
