import type { OperacionMp } from './types';

export function ordenarMovimientosMp(operaciones: OperacionMp[]) {
  return [...operaciones].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha) || a.id.localeCompare(b.id));
}
export function agruparMovimientosMp(operaciones: OperacionMp[], limite: number) {
  const ordenadas = ordenarMovimientosMp(operaciones);
  const grupos: { dia: string; titulo: string; operaciones: OperacionMp[] }[] = [];
  for (const op of ordenadas.slice(0, limite)) {
    const fecha = new Date(op.fecha);
    const dia = [fecha.getFullYear(), fecha.getMonth(), fecha.getDate()].join('-');
    let grupo = grupos.at(-1);
    if (grupo?.dia !== dia) {
      grupo = { dia, titulo: fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }), operaciones: [] };
      grupos.push(grupo);
    }
    grupo!.operaciones.push(op);
  }
  return grupos;
}

export function alternarSeleccionMp(visibles: OperacionMp[], seleccionadas: string[]) {
  const elegibles = visibles.filter(op => !op.revisionPendiente).slice(0, 500).map(op => op.id);
  return elegibles.length && elegibles.every(id => seleccionadas.includes(id)) ? [] : elegibles;
}
