import type { Conexion, Tablas } from './types';
import { ErrorBaseDatos } from './errors';

// Se llama dentro de la transacción financiera existente. Nunca abre otra cola.
export async function prepararReversionSocial(movimientoId: string, conexion: Conexion) {
  const pago = await conexion.getFirstAsync<Tablas['pagos_sociales']>("SELECT * FROM pagos_sociales WHERE movimiento_id = ? AND estado = 'vigente';", [movimientoId]);
  if (!pago) return;
  const ahora = new Date().toISOString();
  if (pago.clase === 'origen_deuda') {
    const entregas = await conexion.getFirstAsync<Pick<Tablas['pagos_sociales'], 'id'>>("SELECT id FROM pagos_sociales WHERE deuda_id = ? AND clase = 'deuda' AND estado = 'vigente' LIMIT 1;", [pago.deuda_id]);
    if (entregas) {
      const error = new ErrorBaseDatos('integridad');
      error.message = 'Esta deuda tiene pagos registrados. Corregí esos movimientos antes de anular el movimiento que la originó.';
      throw error;
    }
  }
  if (pago.clase === 'compra') {
    const gasto = await conexion.getFirstAsync<Tablas['gastos_compartidos'] & { estado_sala: string }>('SELECT g.*, s.estado AS estado_sala FROM gastos_compartidos g JOIN salas s ON s.id = g.sala_id WHERE g.id = ?;', [pago.gasto_compartido_id]);
    const entregas = await conexion.getFirstAsync<Pick<Tablas['pagos_sociales'], 'id'>>(`SELECT p.id FROM pagos_sociales p JOIN participantes_gasto pg ON pg.id = p.participante_gasto_id
      WHERE pg.gasto_compartido_id = ? AND p.estado = 'vigente' LIMIT 1;`, [gasto!.id]);
    if (gasto?.estado_sala !== 'abierta' || entregas) throw new ErrorBaseDatos('integridad');
  }
  await conexion.runAsync("UPDATE pagos_sociales SET estado = 'anulado', fecha_anulacion = ?, fecha_actualizacion = ? WHERE id = ?;", [ahora, ahora, pago.id]);
  if (pago.clase === 'compra') await conexion.runAsync("UPDATE gastos_compartidos SET estado = 'cancelado', version = version + 1, fecha_actualizacion = ? WHERE id = ?;", [ahora, pago.gasto_compartido_id]);
  if (pago.clase === 'origen_deuda') {
    await conexion.runAsync("UPDATE deudas SET estado = 'cancelada', fecha_cancelacion = ?, motivo_cancelacion = ?, fecha_actualizacion = ? WHERE id = ? AND estado <> 'cancelada';", [ahora, 'Movimiento de origen anulado', ahora, pago.deuda_id]);
  } else if (pago.deuda_id) {
    await conexion.runAsync(`UPDATE deudas SET estado = CASE
      WHEN (SELECT COALESCE(SUM(ROUND(monto * 100)), 0) FROM pagos_sociales WHERE deuda_id = deudas.id AND clase <> 'origen_deuda' AND estado = 'vigente') = 0 THEN 'pendiente'
      WHEN (SELECT COALESCE(SUM(ROUND(monto * 100)), 0) FROM pagos_sociales WHERE deuda_id = deudas.id AND clase <> 'origen_deuda' AND estado = 'vigente') >= ROUND(deudas.monto * 100) THEN 'pagada'
      ELSE 'parcial' END, fecha_actualizacion = ? WHERE id = ? AND estado <> 'cancelada';`, [ahora, pago.deuda_id]);
  }
}
