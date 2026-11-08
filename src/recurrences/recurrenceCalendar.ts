import type { Recurrencia } from '../database/types';

export function partesCalendario(fecha: string, zona: string) {
  const formato = new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const partes = Object.fromEntries(formato.formatToParts(new Date(fecha)).map(p => [p.type, p.value]));
  return { anio: Number(partes.year), mes: Number(partes.month), dia: Number(partes.day), hora: Number(partes.hour), minuto: Number(partes.minute), segundo: Number(partes.second) };
}

export function instanteCalendario(partes: ReturnType<typeof partesCalendario>, zona: string) {
  const civil = Date.UTC(partes.anio, partes.mes - 1, partes.dia, partes.hora, partes.minuto, partes.segundo);
  let instante = civil;
  // Resolver el desfase con Intl; no depender del huso horario actual del dispositivo.
  for (let intento = 0; intento < 4; intento++) {
    const local = partesCalendario(new Date(instante).toISOString(), zona);
    const representado = Date.UTC(local.anio, local.mes - 1, local.dia, local.hora, local.minuto, local.segundo);
    const diferencia = civil - representado;
    if (!diferencia) break;
    instante += diferencia;
  }
  return new Date(instante).toISOString();
}

export function siguienteEjecucion(recurrencia: Pick<Recurrencia, 'frecuencia' | 'zona_horaria' | 'dia_ancla'>, desde: string) {
  const partes = partesCalendario(desde, recurrencia.zona_horaria);
  if (recurrencia.frecuencia === 'mensual' || recurrencia.frecuencia === 'anual') {
    const calendario = new Date(Date.UTC(partes.anio, partes.mes - 1 + (recurrencia.frecuencia === 'mensual' ? 1 : 12), 1));
    partes.anio = calendario.getUTCFullYear(); partes.mes = calendario.getUTCMonth() + 1;
    partes.dia = Math.min(recurrencia.dia_ancla, new Date(Date.UTC(partes.anio, partes.mes, 0)).getUTCDate());
  } else {
    const calendario = new Date(Date.UTC(partes.anio, partes.mes - 1, partes.dia + (recurrencia.frecuencia === 'semanal' ? 7 : 1)));
    partes.anio = calendario.getUTCFullYear(); partes.mes = calendario.getUTCMonth() + 1; partes.dia = calendario.getUTCDate();
  }
  return instanteCalendario(partes, recurrencia.zona_horaria);
}
