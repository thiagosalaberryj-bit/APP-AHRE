import type { DatosResumenSalaOnline } from './online/onlineStore';

export function pendientesSala(detalle: DatosResumenSalaOnline, incorporadas: ReadonlySet<string>) {
  if (detalle.sala.estado === 'cerrada' || !detalle.misFinanzas?.length) return [];
  const gastos = new Map(detalle.sala.gastos.filter(g => g.estado === 'vigente').map(g => [g.id, g]));
  const claves = new Set<string>();
  return detalle.misFinanzas.filter(o => {
    if (o.incorporada || incorporadas.has(o.clave) || claves.has(o.clave)) return false;
    const gasto = o.gastoId ? gastos.get(o.gastoId) : undefined;
    if (!gasto || o.seleccion && !o.necesitaRevision) return false;
    if (!o.clave.startsWith('compra:') && o.tipo !== 'ingreso' && !gasto.pagaron.includes(detalle.personaPropiaId)) return false;
    claves.add(o.clave); return true;
  });
}
