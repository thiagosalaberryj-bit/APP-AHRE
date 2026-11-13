import type { OperacionPersonal, RespuestaSala } from '../social/online/types';

export function finanzasDemo<T extends RespuestaSala>(detalle: T, simulacion=false): T {
  if (!detalle.sala.id.startsWith('demo-social:')&&!simulacion) return detalle;
  const opciones: OperacionPersonal[] = [], propia = detalle.personaPropiaId;
  for (const g of detalle.sala.gastos.filter(g => g.estado === 'vigente')) {
    const agregar = (clave: string, tipo: 'ingreso'|'egreso', monto: number, descripcion: string) => {
      const anterior = detalle.misFinanzas?.find(o => o.clave === clave || o.gastoId === g.id && o.tipo === tipo && o.clave.startsWith('compra:') === clave.startsWith('compra:'));
      opciones.push({clave, tipo, monto, descripcion, categoria: tipo === 'ingreso' ? 'devoluciones' : g.categoriaId, fecha: g.fecha, gastoId: g.id, salaId: detalle.sala.id, seleccion: anterior?.seleccion});
    };
    if (g.pagadorId === propia) {
      agregar(`compra:${detalle.sala.id}:${g.id}`, 'egreso', g.monto, 'Compra: ' + g.descripcion);
      for (const p of g.partes.filter(p => p.personaId !== propia && g.pagaron.includes(p.personaId)))
        agregar(`parte:${detalle.sala.id}:${g.id}:${p.personaId}`, 'ingreso', p.monto, 'Parte recibida: ' + g.descripcion);
    } else {
      const parte = g.partes.find(p => p.personaId === propia);
      if (parte) agregar(`parte:${detalle.sala.id}:${g.id}:${propia}`, 'egreso', parte.monto, 'Mi parte: ' + g.descripcion);
    }
  }
  return {...detalle, misFinanzas: opciones};
}

