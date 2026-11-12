import { instanteCalendario, partesCalendario } from '../recurrences/recurrenceCalendar';
import type { Recurrencia } from '../database/types';
import type { AjustesAvisos, Aviso, TipoAviso, DestinoAviso } from './types';
export interface Recordatorio extends Aviso { clave: string; }
export interface DatosRecordatorios {
  registros: string[];
  deudas: { id: string; tipo: 'debo' | 'me_deben'; origenLocalId?: string }[];
  recurrencias: Recurrencia[];
  mercadoPago: { pendientes: number; depositoId: string } | null;
  salas: { id: string; pendientes: number }[];
}
export function planificarRecordatorios(datos: DatosRecordatorios, ajustes: AjustesAvisos, ahora = new Date()): Recordatorio[] {
  const salida: Recordatorio[] = [], zona = ajustes.zona, hoy = partesCalendario(ahora.toISOString(), zona);
  const dia = (fecha: string) => { const p = partesCalendario(fecha, zona); return `${p.anio}-${p.mes}-${p.dia}`; };
  const aHora = (fecha: Date, hora: string) => { const p = partesCalendario(fecha.toISOString(), zona), [h, m] = hora.split(':').map(Number); return instanteCalendario({ ...p, hora: h, minuto: m, segundo: 0 }, zona); };
  const agregar = (tipo: TipoAviso, clave: string, fecha: string, titulo: string, mensaje: string, destino: DestinoAviso, resuelta = false, ocurrencia?: string) => {
    if (!ajustes.tipos[tipo].activo || Date.parse(fecha) <= ahora.getTime()) return;
    salida.push({ id: 'local:' + clave, clave, tipo, fecha, titulo, mensaje, destino, vista: false, resuelta, ...(ocurrencia?{ocurrencia}:{}) });
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
    for (const deuda of datos.deudas) agregar(deuda.tipo,deuda.tipo+':'+deuda.id+':'+claveDia,aHora(fecha,ajustes.tipos[deuda.tipo].hora),deuda.tipo==='debo'?'Tenés una deuda pendiente':'Tenés una deuda a cobrar','Revisá el saldo pendiente de esta deuda.',{tipo:'deuda',id:deuda.id});
    for (const sala of datos.salas.filter(s=>s.pendientes)) agregar('salas','sala:'+sala.id+':'+claveDia,aHora(fecha,ajustes.tipos.salas.hora),'Movimientos de sala pendientes',`Tenés ${sala.pendientes} movimientos para incorporar a un depósito.`,{tipo:'sala',id:sala.id});
    for (const r of datos.recurrencias.filter(r=>r.activa&&claveDia!==dia(r.proxima_ejecucion)&&Date.parse(aHora(fecha,ajustes.tipos.recurrencias.hora))>Date.parse(r.proxima_ejecucion))) agregar('recurrencias','recurrente-pendiente:'+r.id+':'+r.proxima_ejecucion+':'+claveDia,aHora(fecha,ajustes.tipos.recurrencias.hora),'Movimiento recurrente pendiente','Revisá y confirmá el movimiento de tu depósito.',{tipo:'recurrencia',id:r.id,depositoId:r.deposito_id},false,r.proxima_ejecucion);
  }
  const fin = ahora.getTime() + 60 * 86400000;
  for (const r of datos.recurrencias) {
    if (!r.activa) continue;
    const fecha = r.proxima_ejecucion;
    if (Date.parse(fecha) < ahora.getTime()) {
      continue;
    }
    if (Date.parse(fecha) < fin && (!r.fecha_fin || fecha <= r.fecha_fin)) {
      const previa = new Date(Date.parse(fecha) - ajustes.tipos.recurrencias.anticipacion * 86400000);
      agregar('recurrencias', 'recurrente-previo:' + r.id + ':' + fecha, aHora(previa, ajustes.tipos.recurrencias.hora), 'Se acerca un movimiento recurrente', 'Revisá la próxima ocurrencia de tu depósito.', { tipo: 'recurrencia', id: r.id, depositoId: r.deposito_id },false,fecha);
      agregar('recurrencias', 'recurrente:' + r.id + ':' + fecha, fecha, 'Movimiento recurrente para revisar', 'Confirmalo desde las recurrencias del depósito.', { tipo: 'recurrencia', id: r.id, depositoId: r.deposito_id },false,fecha);
    }
  }
  return [...new Map(salida.map(f => [f.clave, f])).values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function avisoLocalResuelto(aviso: Aviso, datos: DatosRecordatorios): boolean {
  const destino=aviso.destino;
  if(destino.tipo==='deuda')return !datos.deudas.some(d=>d.id===destino.id||d.origenLocalId===destino.id);
  if(destino.tipo==='mercado_pago')return !datos.mercadoPago?.pendientes;
  if(destino.tipo==='sala')return !datos.salas.some(s=>s.id===destino.id&&s.pendientes>0);
  if(destino.tipo==='recurrencia'){
    const r=datos.recurrencias.find(r=>r.id===destino.id&&r.activa);
    if(!r)return true;
    const ocurrencia=aviso.ocurrencia||aviso.id.match(/:(\d{4}-\d{2}-\d{2}T[^:]+:\d{2}:\d{2}(?:\.\d+)?Z)$/)?.[1];
    if(ocurrencia)return Date.parse(r.proxima_ejecucion)>Date.parse(ocurrencia);
    // Compatibilidad con recordatorios antiguos de ocurrencias ya pendientes.
    return aviso.id.startsWith('local:recurrente-pendiente:')&&Date.parse(r.proxima_ejecucion)>Date.parse(aviso.fecha);
  }
  return aviso.tipo==='registro'||aviso.tipo==='mensual';
}
