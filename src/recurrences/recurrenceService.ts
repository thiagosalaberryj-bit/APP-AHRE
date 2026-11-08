import { obtenerSesionActual } from '../authentication/sessionService';
import { ejecutarLecturaConConexion } from '../database/connectionQueue';
import { ejecutarTransaccion } from '../database/transactions';
import { movimientosRepositorio, recurrenciasRepositorio } from '../database/repositories';
import type { Recurrencia, Conexion } from '../database/types';
import { siguienteEjecucion, partesCalendario } from './recurrenceCalendar';
import {convertirMontoMovimiento} from '../utils/movementValidation';

export async function registrarEjecucion(conexion: Conexion, usuarioId: string, recurrenciaId: string, movimientoId: string, fecha: string) {
  await conexion.runAsync('INSERT INTO ejecuciones_recurrencia(id,usuario_id,recurrencia_id,movimiento_id,fecha_programada) VALUES(?,?,?,?,?)',
    [`ejecucion:${recurrenciaId}:${fecha}`, usuarioId, recurrenciaId, movimientoId, fecha]);
}

async function consultarSiguienteRecurrencia(conexion:Conexion, fecha:string) {
  return conexion.getFirstAsync<Recurrencia & {usuario_id:string}>(`SELECT r.*,d.usuario_id FROM recurrencias r
    JOIN depositos d ON d.id=r.deposito_id JOIN usuarios u ON u.id=d.usuario_id
    JOIN sync_authorization a ON a.usuario_id=d.usuario_id
    WHERE r.activa=1 AND d.activo=1 AND u.activo=1 AND a.revocada=0
      AND r.proxima_ejecucion<=? ORDER BY r.proxima_ejecucion,r.id LIMIT 1`,[fecha]);
}

export async function procesarRecurrencias(ahora = new Date(), limite = 100) {
  if (!Number.isFinite(ahora.getTime())) throw new Error('Fecha de ejecución inválida.');
  const fechaRevision=ahora.toISOString();
  // La revisión periódica no debe escribir sync_context ni abrir una transacción
  // de escritura cuando no hay trabajo. Se revalida dentro de la transacción.
  const vencida=await ejecutarLecturaConConexion(c=>consultarSiguienteRecurrencia(c,fechaRevision));
  if(!vencida)return 0;
  let generadas = 0;
  for (let indice = 0; indice < Math.min(100, Math.max(1, limite)); indice++) {
    const procesada = await ejecutarTransaccion(async conexion => {
      const recurrencia = await consultarSiguienteRecurrencia(conexion,fechaRevision);
      if (!recurrencia) return false;
      const fecha = recurrencia.proxima_ejecucion;
      if (recurrencia.fecha_fin && Date.parse(fecha) > Date.parse(recurrencia.fecha_fin)) {
        await recurrenciasRepositorio.actualizar(recurrencia.id, {activa: 0}, conexion); return true;
      }
      const existente = await conexion.getFirstAsync('SELECT id FROM ejecuciones_recurrencia WHERE recurrencia_id=? AND fecha_programada=?', [recurrencia.id, fecha]);
      if (!existente) {
        const movimiento = await movimientosRepositorio.crear({id: `recurrente:${recurrencia.id}:${fecha}`, deposito_id: recurrencia.deposito_id, categoria: recurrencia.categoria,
          recurrencia_id: recurrencia.id, tipo: recurrencia.tipo, monto: recurrencia.monto, descripcion: recurrencia.descripcion, fecha_hora: fecha}, conexion);
        await registrarEjecucion(conexion, recurrencia.usuario_id, recurrencia.id, movimiento.id, fecha);
        generadas++;
      }
      await recurrenciasRepositorio.actualizar(recurrencia.id, {proxima_ejecucion: siguienteEjecucion(recurrencia, fecha)}, conexion);
      return true;
    }, 'procesar-recurrencias');
    if (!procesada) break;
  }
  return generadas;
}

export async function consultarRecurrenciasDeposito(depositoId: string) {
  const {usuario} = await obtenerSesionActual();
  if (!usuario) throw new Error('Iniciá sesión para consultar las recurrencias.');
  return ejecutarLecturaConConexion(conexion => conexion.getAllAsync<Recurrencia>(`SELECT r.* FROM recurrencias r JOIN depositos d ON d.id=r.deposito_id
    WHERE d.id=? AND d.usuario_id=? ORDER BY r.activa DESC,r.proxima_ejecucion,r.id`, [depositoId, usuario.id]));
}

export async function actualizarRecurrencia(id: string, cambios: {activa: boolean; proximaEjecucion?: string; frecuencia?: Recurrencia['frecuencia'];monto?:string}) {
  const {usuario} = await obtenerSesionActual();
  if (!usuario) throw new Error('Iniciá sesión para modificar la recurrencia.');
  const importe=cambios.monto===undefined?undefined:convertirMontoMovimiento(cambios.monto);
  if(cambios.monto!==undefined&&(!importe||importe<=0||!Number.isFinite(importe)))throw new Error('Ingresá un importe válido mayor que cero.');
  return ejecutarTransaccion(async conexion => {
    const fila = await conexion.getFirstAsync<Recurrencia>(`SELECT r.* FROM recurrencias r JOIN depositos d ON d.id=r.deposito_id WHERE r.id=? AND d.usuario_id=? AND d.activo=1`, [id, usuario.id]);
    if (!fila) throw new Error('La recurrencia o su depósito no están disponibles.');
    const proxima = cambios.proximaEjecucion || fila.proxima_ejecucion;
    if (cambios.activa && (!Number.isFinite(Date.parse(proxima)) || Date.parse(proxima) <= Date.now())) throw new Error('Elegí una próxima fecha futura.');
    if (cambios.frecuencia && !['diaria','semanal','mensual','anual'].includes(cambios.frecuencia)) throw new Error('Frecuencia inválida.');
    return recurrenciasRepositorio.actualizar(id, {activa: cambios.activa ? 1 : 0,...(importe===undefined?{}:{monto:importe!}), proxima_ejecucion: proxima, dia_ancla: cambios.proximaEjecucion ? partesCalendario(proxima,fila.zona_horaria).dia : fila.dia_ancla, frecuencia: cambios.frecuencia || fila.frecuencia}, conexion);
  });
}

export async function consultarHistorialRecurrencia(id:string){
  const {usuario}=await obtenerSesionActual();if(!usuario)throw new Error('Iniciá sesión para consultar el historial.');
  return ejecutarLecturaConConexion(async c=>{
    const propia=await c.getFirstAsync('SELECT r.id FROM recurrencias r JOIN depositos d ON d.id=r.deposito_id WHERE r.id=? AND d.usuario_id=?',[id,usuario.id]);
    if(!propia)throw new Error('La recurrencia no está disponible.');
    const resumen=await c.getFirstAsync<{total_centavos:number;cantidad:number}>(`SELECT COALESCE(SUM(ROUND(m.monto*100)),0) AS total_centavos,COUNT(*) AS cantidad FROM movimientos m
      WHERE m.recurrencia_id=? AND m.anulado=0 AND m.fecha_eliminacion IS NULL AND m.reversion_de_id IS NULL
      AND NOT EXISTS(SELECT 1 FROM movimientos correccion WHERE correccion.reversion_de_id=m.id)`,[id]);
    const ultimos=await c.getAllAsync<{id:string;monto:number;fecha_hora:string;anulado:number;fecha_eliminacion:string|null;corregido:number}>(`SELECT m.id,m.monto,m.fecha_hora,m.anulado,m.fecha_eliminacion,
      EXISTS(SELECT 1 FROM movimientos correccion WHERE correccion.reversion_de_id=m.id) AS corregido
      FROM movimientos m WHERE m.recurrencia_id=? ORDER BY m.fecha_hora DESC,m.id DESC LIMIT 5`,[id]);
    // Las ejecuciones conservan el primer importe aunque se corrija o elimine
    // su movimiento; el total financiero sigue contando solo registros vigentes.
    const ejecuciones=await c.getFirstAsync<{cantidad:number}>('SELECT COUNT(*) AS cantidad FROM ejecuciones_recurrencia WHERE recurrencia_id=?',[id]);
    const primera=await c.getFirstAsync<{monto:number}>(`SELECT m.monto FROM ejecuciones_recurrencia e JOIN movimientos m ON m.id=e.movimiento_id WHERE e.recurrencia_id=? ORDER BY e.fecha_programada,e.id LIMIT 1`,[id]);
    return {total:Number(resumen?.total_centavos||0)/100,cantidad:Number(resumen?.cantidad||0),ultimos,repeticiones:Number(ejecuciones?.cantidad||0),montoInicial:primera?Number(primera.monto):null};
  });
}
