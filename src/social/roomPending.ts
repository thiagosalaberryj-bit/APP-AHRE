import type { OperacionPersonal, RespuestaSala } from './online/types';

export function pendientesSala(detalle: RespuestaSala, operaciones: OperacionPersonal[], incorporadas: ReadonlySet<string>): OperacionPersonal[] {
  const abierta = detalle.sala.estado === 'abierta';
  const candidatas = abierta ? detalle.misFinanzas || [] : operaciones.filter(o => o.salaId === detalle.sala.id);
  const claves = new Set<string>();
  return candidatas.filter(o => {
    if (o.incorporada || incorporadas.has(o.clave) || claves.has(o.clave)) return false;
    if (abierta) {
      const gasto = detalle.sala.gastos.find(g => g.id === o.gastoId && g.estado === 'vigente');
      if (!gasto || o.seleccion && !o.necesitaRevision) return false;
      if (!o.clave.startsWith('compra:') && o.tipo !== 'ingreso' && !gasto.pagaron.includes(detalle.personaPropiaId)) return false;
    }
    claves.add(o.clave); return true;
  });
}
