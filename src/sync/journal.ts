import { prepararEsquemaSincronizacion } from '../database/migrations/001_initialSchema';
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
  await prepararEsquemaSincronizacion(conexion);
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

export async function consultarReparacion(conexion: Conexion, usuarioId: string): Promise<import('./protocol').ReparacionPerfil|null> {
  const rechazo=await conexion.getFirstAsync<{lote:string;base:number;generacion:number;contenido:string}>('SELECT * FROM sync_profile_rejection WHERE usuario_id=?',[usuarioId]);
  if(!rechazo)return null;
  const filas=await conexion.getAllAsync<{secuencia:number;lote:string;cambio:string;generacion:number|null}>(`SELECT o.secuencia,o.lote,o.cambio,a.generacion FROM sync_outbox o LEFT JOIN sync_batch_authorization a ON a.lote=o.lote AND a.usuario_id=o.usuario_id WHERE o.usuario_id=? ORDER BY o.secuencia`,[usuarioId]);
  const autorizacion=await conexion.getFirstAsync<{generacion:number;revocada:number}>('SELECT generacion,revocada FROM sync_authorization WHERE usuario_id=?',[usuarioId]);
  if(!filas.length||filas[0].lote!==rechazo.lote||!autorizacion||autorizacion.revocada||autorizacion.generacion!==rechazo.generacion||filas.some(f=>f.generacion!==rechazo.generacion))return null;
  const cambios=filas.filter(f=>f.lote===rechazo.lote).map(f=>JSON.parse(f.cambio) as CambioSync);
  if(JSON.stringify(cambios)!==rechazo.contenido||cambios.some(c=>c.tabla!=='usuarios'||c.accion!=='guardar'||c.datos.id!==usuarioId))return null;
  const usuario=await conexion.getFirstAsync<{correo_electronico:string}>('SELECT correo_electronico FROM usuarios WHERE id=? AND activo=1',[usuarioId]);
  if(!usuario)return null;
  return {usuarioId,lote:rechazo.lote,correoAnterior:String(cambios[0].datos.correo_electronico),correoNuevo:usuario.correo_electronico,huella:JSON.stringify({rechazo,filas,correo:usuario.correo_electronico})};
}

export async function aplicarReparacion(conexion:Conexion,vista:import('./protocol').ReparacionPerfil){
  const actual=await consultarReparacion(conexion,vista.usuarioId);
  if(!actual||actual.huella!==vista.huella||actual.correoNuevo===actual.correoAnterior)throw new Error('La cola o el perfil cambiaron. Revisá la corrección nuevamente.');
  const filas=await conexion.getAllAsync<{secuencia:number;lote:string;cambio:string}>('SELECT secuencia,lote,cambio FROM sync_outbox WHERE usuario_id=? ORDER BY secuencia',[vista.usuarioId]);
  for(const fila of filas){
    const cambio=JSON.parse(fila.cambio) as CambioSync;
    if(cambio.tabla!=='usuarios'||cambio.accion!=='guardar'||cambio.datos.id!==vista.usuarioId)continue;
    if(cambio.datos.correo_electronico===actual.correoNuevo)continue;
    await conexion.runAsync('INSERT OR IGNORE INTO sync_profile_backup(usuario_id,secuencia,lote,cambio) VALUES(?,?,?,?)',[vista.usuarioId,fila.secuencia,fila.lote,fila.cambio]);
    cambio.datos.correo_electronico=actual.correoNuevo;
    await conexion.runAsync('UPDATE sync_outbox SET cambio=? WHERE usuario_id=? AND secuencia=?',[JSON.stringify(cambio),vista.usuarioId,fila.secuencia]);
  }
  await conexion.runAsync('DELETE FROM sync_profile_rejection WHERE usuario_id=?',[vista.usuarioId]);
}

export async function restaurarReparacion(conexion:Conexion,usuarioId:string,lote:string){
  const filas=await conexion.getAllAsync<{secuencia:number;cambio:string;actual:string}>(`SELECT b.secuencia,b.cambio,o.cambio AS actual FROM sync_profile_backup b JOIN sync_outbox o ON o.usuario_id=b.usuario_id AND o.secuencia=b.secuencia WHERE b.usuario_id=? AND b.lote=?`,[usuarioId,lote]);
  if(!filas.some(f=>f.cambio!==f.actual))return false;
  // Restaurar también las copias de perfil posteriores que todavía sigan pendientes.
  await conexion.runAsync(`UPDATE sync_outbox SET cambio=(SELECT b.cambio FROM sync_profile_backup b WHERE b.usuario_id=sync_outbox.usuario_id AND b.secuencia=sync_outbox.secuencia) WHERE usuario_id=? AND EXISTS(SELECT 1 FROM sync_profile_backup b WHERE b.usuario_id=sync_outbox.usuario_id AND b.secuencia=sync_outbox.secuencia)`,[usuarioId]);
  await conexion.runAsync('DELETE FROM sync_profile_rejection WHERE usuario_id=?',[usuarioId]);
  return true;
}
