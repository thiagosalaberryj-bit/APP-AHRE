import type {Conexion} from '../../database/types';
import {ejecutarLecturaConConexion} from '../../database/connectionQueue';
import {ejecutarTransaccion} from '../../database/transactions';
import type {RespuestaSala,ComandoOnline,GastoOnline,PendienteOnline,SalaOnline} from './types';

const oyentes=new Set<()=>void>();
export function observarSocialOnline(oyente:()=>void){oyentes.add(oyente);return()=>{oyentes.delete(oyente);};}
export function avisarSocialOnline(){for(const oyente of oyentes)oyente();}
export async function guardarCacheSala(usuarioId:string,respuesta:RespuestaSala){
  if(!respuesta?.sala?.id||!Array.isArray(respuesta.sala.gastos)||!Array.isArray(respuesta.sala.participantes)||!Number.isSafeInteger(respuesta.sala.revision)||typeof respuesta.personaPropiaId!=='string')throw new Error('Respuesta de sala inválida.');
  await ejecutarTransaccion(async c=>{
    const previa=await c.getFirstAsync<{datos:string}>('SELECT datos FROM salas_online_locales WHERE usuario_id=? AND sala_id=?',[usuarioId,respuesta.sala.id]);
    if(previa&&(JSON.parse(previa.datos) as RespuestaSala).sala.revision>respuesta.sala.revision)return;
    await c.runAsync('INSERT INTO salas_online_locales(usuario_id,sala_id,datos,administrador,persona_propia_id,fecha_actualizacion) VALUES(?,?,?,?,?,?) ON CONFLICT(usuario_id,sala_id) DO UPDATE SET datos=excluded.datos,administrador=excluded.administrador,persona_propia_id=excluded.persona_propia_id,fecha_actualizacion=excluded.fecha_actualizacion',[usuarioId,respuesta.sala.id,JSON.stringify(respuesta),respuesta.administrador?1:0,respuesta.personaPropiaId,new Date().toISOString()]);
    if(respuesta.administrador)await c.runAsync('UPDATE salas SET publicada=1,fecha_actualizacion=? WHERE id=? AND usuario_id=? AND publicada=0',[new Date().toISOString(),respuesta.sala.id,usuarioId]);
  });avisarSocialOnline();
}
export async function confirmarComandoOnline(usuarioId:string,pendiente:PendienteOnline,sala:SalaOnline){
  await ejecutarTransaccion(async c=>{
    const fila=await c.getFirstAsync<{datos:string}>('SELECT datos FROM salas_online_locales WHERE usuario_id=? AND sala_id=?',[usuarioId,pendiente.sala_id]);
    if(!fila)throw new Error('La sala dejó de estar disponible. Conservamos el envío.');
    const respuesta=JSON.parse(fila.datos) as RespuestaSala;
    if(sala.id!==pendiente.sala_id||!Number.isSafeInteger(sala.revision))throw new Error('Confirmación de sala inválida.');
    if(sala.revision>=respuesta.sala.revision)await c.runAsync('UPDATE salas_online_locales SET datos=?,fecha_actualizacion=? WHERE usuario_id=? AND sala_id=?',[JSON.stringify({...respuesta,sala}),new Date().toISOString(),usuarioId,sala.id]);
    await c.runAsync('DELETE FROM comandos_sociales_locales WHERE id=? AND usuario_id=?',[pendiente.id,usuarioId]);
  });avisarSocialOnline();
}
type FilaSala = { sala_id: string; datos: string; fecha_actualizacion: string };

export type DatosResumenSalaOnline = Pick<RespuestaSala, 'administrador' | 'personaPropiaId' | 'misFinanzas'> & {
  sala: Pick<SalaOnline, 'id' | 'nombre' | 'icono' | 'color' | 'fecha' | 'estado' | 'archivadaPorReinicio' | 'participantes' | 'revision'> & {
    gastos: Pick<GastoOnline, 'id' | 'categoriaId' | 'monto' | 'estado' | 'pagaron' | 'version'>[];
  };
};

function aplicarComandosSala(sala: DatosResumenSalaOnline['sala'], pendientes: PendienteOnline[]) {
  let cierrePendiente = false;
  const indices = new Map(sala.gastos.map((gasto, indice) => [gasto.id, indice]));
  const guardarGasto = (gasto: GastoOnline, deLista: boolean) => {
    const indice = indices.get(gasto.id);
    if (indice === undefined) {
      indices.set(gasto.id, sala.gastos.length);
      sala.gastos.push(deLista ? gasto : { ...gasto, version: 1 });
    } else {
      const version = deLista ? gasto.version : sala.gastos[indice].version;
      sala.gastos[indice] = { ...gasto, version: version + 1 };
    }
  };
  for (const pendiente of pendientes) {
    const comando = JSON.parse(pendiente.datos) as ComandoOnline;
    if (comando.tipo === 'guardar_lista' && comando.gastos) {
      for (const gasto of comando.gastos) guardarGasto(gasto, true);
      sala.revision++;
    } else if (comando.tipo === 'guardar_gasto' && comando.gasto) {
      guardarGasto(comando.gasto, false);
      sala.revision++;
    } else if (comando.tipo === 'parte_pagada') {
      const indice = comando.gastoId === undefined ? undefined : indices.get(comando.gastoId);
      if (indice === undefined) continue;
      const gasto = sala.gastos[indice];
      gasto.pagaron = gasto.pagaron.filter(id => id !== comando.personaId);
      if (comando.pagada && comando.personaId) gasto.pagaron.push(comando.personaId);
      gasto.version++;
      sala.revision++;
    } else if (comando.tipo === 'integrantes' && comando.personas) {
      const ids = new Set(comando.personas.map(p => p.id));
      const anteriores = new Set(sala.participantes.map(p => p.id));
      for (const persona of sala.participantes) persona.activa = ids.has(persona.id);
      for (const persona of comando.personas) {
        if (anteriores.has(persona.id)) continue;
        sala.participantes.push({ ...persona, activa: true });
        anteriores.add(persona.id);
      }
      sala.revision++;
    } else if (comando.tipo === 'cerrar') {
      cierrePendiente = true;
    }
  }
  return cierrePendiente;
}

function reconstruirSalaOnline(fila: FilaSala, propios: PendienteOnline[]) {
  const respuesta = JSON.parse(fila.datos) as RespuestaSala;
  const cierrePendiente = propios.length > 0 && aplicarComandosSala(respuesta.sala, propios);
  return { ...respuesta, pendientes: propios, ultimaActualizacion: fila.fecha_actualizacion, cierrePendiente };
}

async function leerComandosPorSala(conexion: Conexion, usuarioId: string, salaId?: string) {
  const comandos = await conexion.getAllAsync<PendienteOnline>(
    'SELECT id,sala_id,datos,error FROM comandos_sociales_locales WHERE usuario_id=?' + (salaId ? ' AND sala_id=?' : '') + ' ORDER BY secuencia',
    salaId ? [usuarioId, salaId] : [usuarioId],
  );
  const porSala = new Map<string, PendienteOnline[]>();
  for (const comando of comandos) {
    const propios = porSala.get(comando.sala_id);
    if (propios) propios.push(comando);
    else porSala.set(comando.sala_id, [comando]);
  }
  return porSala;
}

export async function leerSalasOnline(usuarioId:string,conexion?:Conexion,salaId?:string){
  const leer=async(c:Conexion)=>{
    const parametros=salaId?[usuarioId,salaId]:[usuarioId],filtro=salaId?' AND sala_id=?':'';
    const filas=await c.getAllAsync<FilaSala>('SELECT sala_id,datos,fecha_actualizacion FROM salas_online_locales WHERE usuario_id=?'+filtro+' ORDER BY sala_id',parametros);
    const comandos = await leerComandosPorSala(c, usuarioId, salaId);
    return filas.map(fila => reconstruirSalaOnline(fila, comandos.get(fila.sala_id) || []));
  };
  return conexion?leer(conexion):ejecutarLecturaConConexion(leer);
}

export type DetalleSalaOnlineGuardado = ReturnType<typeof reconstruirSalaOnline>;

export async function leerSalasOnlineParaVista(usuarioId: string, conexion: Conexion, demo: boolean, salaId?: string) {
  // La simulación recalcula elecciones y pendientes desde el reparto original.
  const filas = await conexion.getAllAsync<FilaSala & { completa: number }>(`
    WITH salas AS (
      SELECT sala_id, datos, fecha_actualizacion,
        (? OR sala_id = ? OR substr(sala_id, 1, 12) = 'demo-social:') AS completa
      FROM salas_online_locales WHERE usuario_id = ?
    )
    SELECT sala_id, fecha_actualizacion, completa, CASE WHEN completa THEN datos ELSE json_object(
      'administrador', json_extract(datos, '$.administrador'),
      'personaPropiaId', json_extract(datos, '$.personaPropiaId'),
      'misFinanzas', json_extract(datos, '$.misFinanzas'),
      'sala', json_object(
        'id', sala_id,
        'nombre', json_extract(datos, '$.sala.nombre'),
        'icono', json_extract(datos, '$.sala.icono'),
        'color', json_extract(datos, '$.sala.color'),
        'fecha', json_extract(datos, '$.sala.fecha'),
        'estado', json_extract(datos, '$.sala.estado'),
        'revision', json_extract(datos, '$.sala.revision'),
        'archivadaPorReinicio', json_extract(datos, '$.sala.archivadaPorReinicio'),
        'participantes', json_extract(datos, '$.sala.participantes'),
        'gastos', json((
          SELECT json_group_array(json_object(
            'id', json_extract(value, '$.id'),
            'categoriaId', json_extract(value, '$.categoriaId'),
            'monto', json_extract(value, '$.monto'),
            'pagaron', json_extract(value, '$.pagaron'),
            'version', json_extract(value, '$.version'),
            'estado', 'vigente'
          ))
          FROM json_each(datos, '$.sala.gastos') WHERE json_extract(value, '$.estado') = 'vigente'
        ))
      )
    ) END AS datos
    FROM salas ORDER BY sala_id`, [Number(demo), salaId || '', usuarioId]);
  const comandos = await leerComandosPorSala(conexion, usuarioId);
  return filas.map(fila => {
    const propios = comandos.get(fila.sala_id) || [];
    const completa = fila.completa ? reconstruirSalaOnline(fila, propios) : undefined;
    const respaldo = completa && (demo || fila.sala_id.startsWith('demo-social:')) ? completa : undefined;
    const resumen: DatosResumenSalaOnline = completa || JSON.parse(fila.datos);
    if (!completa && propios.length) aplicarComandosSala(resumen.sala, propios);
    return { resumen, detalle: fila.sala_id === salaId ? completa : undefined, respaldo };
  });
}

export async function leerIdsSalasOnline(usuarioId: string) {
  const filas = await ejecutarLecturaConConexion(conexion => conexion.getAllAsync<{sala_id: string}>(
    'SELECT sala_id FROM salas_online_locales WHERE usuario_id = ? ORDER BY sala_id', [usuarioId],
  ));
  return filas.map(fila => fila.sala_id);
}
export async function guardarDatosOnline(usuarioId:string,clave:string,datos:unknown){await ejecutarTransaccion(c=>c.runAsync('INSERT INTO datos_sociales_online(usuario_id,clave,datos) VALUES(?,?,?) ON CONFLICT(usuario_id,clave) DO UPDATE SET datos=excluded.datos',[usuarioId,clave,JSON.stringify(datos)]));avisarSocialOnline();}
export async function leerDatosOnline<T>(usuarioId:string,clave:string,defecto:T){return ejecutarLecturaConConexion(async c=>{const fila=await c.getFirstAsync<{datos:string}>('SELECT datos FROM datos_sociales_online WHERE usuario_id=? AND clave=?',[usuarioId,clave]);return fila?JSON.parse(fila.datos) as T:defecto;});}
