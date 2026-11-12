import { instanteCalendario, partesCalendario, siguienteEjecucion } from '../recurrences/recurrenceCalendar';
import type { Recurrencia } from '../database/types';
import type { AjustesAvisos, Aviso, TipoAviso, DestinoAviso } from './types';
export interface Recordatorio extends Aviso { clave: string; }
export interface DatosRecordatorios {
  registros: string[];
  deudas: { id: string; tipo: 'debo' | 'me_deben'; vencimiento: string | null }[];
  recurrencias: Recurrencia[];
  mercadoPago: { pendientes: number; depositoId: string } | null;
  salas: { id: string; pendientes: number }[];
}
export function planificarRecordatorios(datos: DatosRecordatorios, ajustes: AjustesAvisos, ahora = new Date()): Recordatorio[] {
  const salida: Recordatorio[] = [], zona = ajustes.zona, hoy = partesCalendario(ahora.toISOString(), zona);
  const dia = (fecha: string) => { const p = partesCalendario(fecha, zona); return `${p.anio}-${p.mes}-${p.dia}`; };
  const aHora = (fecha: Date, hora: string) => { const p = partesCalendario(fecha.toISOString(), zona), [h, m] = hora.split(':').map(Number); return instanteCalendario({ ...p, hora: h, minuto: m, segundo: 0 }, zona); };
  const agregar = (tipo: TipoAviso, clave: string, fecha: string, titulo: string, mensaje: string, destino: DestinoAviso, resuelta = false) => {
    if (!ajustes.tipos[tipo].activo || Date.parse(fecha) <= ahora.getTime()) return;
    salida.push({ id: 'local:' + clave, clave, tipo, fecha, titulo, mensaje, destino, vista: false, resuelta });
  };
  const registrados = new Set(datos.registros.map(dia));
  // Fechas explícitas respetan el huso configurado incluso si cambia el horario de verano.
  for (let i = 0; i < 60; i++) {
    const civil = new Date(Date.UTC(hoy.anio, hoy.mes - 1, hoy.dia + i, 12));
    const p = { anio: civil.getUTCFullYear(), mes: civil.getUTCMonth() + 1, dia: civil.getUTCDate(), hora: 12, minuto: 0, segundo: 0 };
    const fecha = new Date(instanteCalendario(p, zona)), claveDia = dia(fecha.toISOString());
    if (!registrados.has(claveDia)) agregar('registro', 'registro:' + claveDia, aHora(fecha, ajustes.tipos.registro.hora), 'Registrá tus movimientos', 'Recordá registrar tus movimientos de hoy.', { tipo: 'movimientos' }, true);
    if (datos.mercadoPago?.pendientes) agregar('mercado_pago', 'mp:' + datos.mercadoPago.depositoId + ':' + claveDia, aHora(fecha, ajustes.tipos.mercado_pago.hora), 'Mercado Pago pendiente', `Tenés ${datos.mercadoPago.pendientes} movimientos por revisar.`, { tipo: 'mercado_pago', depositoId: datos.mercadoPago.depositoId });
    if (p.dia === 1) agregar('mensual', 'mensual:' + claveDia, aHora(fecha, ajustes.tipos.mensual.hora), 'Revisá el cierre del mes', 'Consultá tu balance y comparalo con el mes anterior.', { tipo: 'estadisticas' }, true);
  }
  for (const deuda of datos.deudas) {
    const tipo = deuda.tipo;
    const soloDia = deuda.vencimiento?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const base = soloDia ? new Date(instanteCalendario({ anio: Number(soloDia[1]), mes: Number(soloDia[2]), dia: Number(soloDia[3]), hora: 12, minuto: 0, segundo: 0 }, zona)) : deuda.vencimiento ? new Date(deuda.vencimiento) : ahora;
    const fechas = deuda.vencimiento ? [new Date(base.getTime() - ajustes.tipos[tipo].anticipacion * 86400000), base] : [ahora];
    for (let fecha of fechas) {
      let programada = aHora(fecha, ajustes.tipos[tipo].hora);
      if (Date.parse(programada) <= ahora.getTime()) { fecha = new Date(ahora.getTime() + 86400000); programada = aHora(fecha, ajustes.tipos[tipo].hora); }
      agregar(tipo, tipo + ':' + deuda.id + ':' + programada, programada, tipo === 'debo' ? 'Tenés una deuda pendiente' : 'Tenés una deuda a cobrar', deuda.vencimiento ? 'Revisá el vencimiento y el saldo pendiente.' : 'Revisá el saldo pendiente de esta deuda.', { tipo: 'deuda', id: deuda.id });
    }
  }
  const fin = ahora.getTime() + 60 * 86400000;
  for (const r of datos.recurrencias) {
    if (!r.activa) continue;
    let fecha = r.proxima_ejecucion;
    if (Date.parse(fecha) < ahora.getTime()) {
      const manana = aHora(new Date(ahora.getTime() + 86400000), ajustes.tipos.recurrencias.hora);
      agregar('recurrencias', 'recurrente-pendiente:' + r.id, manana, 'Movimiento recurrente pendiente', 'Revisá y confirmá el movimiento de tu depósito.', { tipo: 'recurrencia', id: r.id, depositoId: r.deposito_id }); continue;
    }
    for (let n = 0; n < 60 && Date.parse(fecha) < fin && (!r.fecha_fin || fecha <= r.fecha_fin); n++) {
      const previa = new Date(Date.parse(fecha) - ajustes.tipos.recurrencias.anticipacion * 86400000);
      agregar('recurrencias', 'recurrente-previo:' + r.id + ':' + fecha, aHora(previa, ajustes.tipos.recurrencias.hora), 'Se acerca un movimiento recurrente', 'Revisá la próxima ocurrencia de tu depósito.', { tipo: 'recurrencia', id: r.id, depositoId: r.deposito_id });
      agregar('recurrencias', 'recurrente:' + r.id + ':' + fecha, fecha, 'Movimiento recurrente para revisar', 'Confirmalo desde las recurrencias del depósito.', { tipo: 'recurrencia', id: r.id, depositoId: r.deposito_id });
      fecha = siguienteEjecucion(r, fecha);
    }
  }
  for (const sala of datos.salas.filter(f => f.pendientes)) agregar('salas', 'sala:' + sala.id, aHora(new Date(ahora.getTime() + 86400000), ajustes.tipos.salas.hora), 'Movimientos de sala pendientes', `Tenés ${sala.pendientes} movimientos para incorporar a un depósito.`, { tipo: 'sala', id: sala.id });
  return [...new Map(salida.map(f => [f.clave, f])).values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
