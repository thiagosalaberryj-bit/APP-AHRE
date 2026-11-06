export type RangoMontoEstadistica = { minimo?: number; maximo?: number };
export type FiltrosDatosEstadistica = RangoMontoEstadistica & { busqueda?: string; depositos?: readonly string[] };

export const PREAJUSTES_CATEGORIAS = Object.freeze({
  egreso: [
    { id: 'cotidiano', nombre: 'Día a día', categorias: ['alimentacion', 'compras', 'hogar'] },
    { id: 'obligaciones', nombre: 'Servicios y obligaciones', categorias: ['servicios', 'suscripciones', 'impuestos'] },
    { id: 'bienestar', nombre: 'Bienestar y formación', categorias: ['salud', 'educacion', 'mascotas'] },
    { id: 'ocio', nombre: 'Movilidad y salidas', categorias: ['transporte', 'viajes', 'entretenimiento'] },
    { id: 'finanzas', nombre: 'Finanzas y trabajo', categorias: ['deudas', 'transferencias', 'trabajo'] },
  ],
  ingreso: [
    { id: 'actividad', nombre: 'Trabajo y ventas', categorias: ['sueldo', 'trabajo_independiente', 'ventas'] },
    { id: 'finanzas', nombre: 'Finanzas', categorias: ['inversiones', 'prestamos_recibidos', 'transferencias_recibidas'] },
    { id: 'ayudas', nombre: 'Ayudas y reintegros', categorias: ['becas_ayudas', 'regalos', 'devoluciones'] },
  ],
});

export const PREAJUSTES_MONTOS: readonly { id: string; nombre: string; rango: RangoMontoEstadistica }[] = Object.freeze([
  { id: 'todos', nombre: 'Cualquier monto', rango: {} },
  { id: 'pequenos', nombre: 'Hasta $1.000', rango: { maximo: 1000 } },
  { id: 'medios', nombre: '$1.000–$5.000', rango: { minimo: 1000, maximo: 5000 } },
  { id: 'grandes', nombre: '$5.000 o más', rango: { minimo: 5000 } },
]);

export function coincidenCategorias(actuales: readonly string[], esperadas: readonly string[]) {
  return actuales.length === esperadas.length && esperadas.every(id => actuales.includes(id));
}

export function alternarGrupoCategorias(actuales: readonly string[], grupo: readonly string[], todas?: readonly string[]) {
  if (grupo.length === 0) return [...actuales];
  if (todas && coincidenCategorias(actuales, todas)) return [...grupo];
  return grupo.every(id => actuales.includes(id))
    ? actuales.filter(id => !grupo.includes(id))
    : [...new Set([...actuales, ...grupo])];
}

export function agruparCategoriasSeleccionadas(
  seleccionadas: readonly string[],
  preajustes: readonly { id: string; nombre: string; categorias: readonly string[] }[],
  categorias: readonly { id: string; nombre: string }[],
) {
  const pendientes = new Set(seleccionadas);
  const grupos: { id: string; nombre: string; categorias: readonly string[] }[] = [];
  for (const preajuste of preajustes) {
    if (preajuste.categorias.length && preajuste.categorias.every(id => pendientes.has(id))) {
      grupos.push(preajuste);
      preajuste.categorias.forEach(id => pendientes.delete(id));
    }
  }
  for (const id of pendientes) {
    grupos.push({ id: `categoria-${id}`, nombre: categorias.find(categoria => categoria.id === id)?.nombre ?? id, categorias: [id] });
  }
  return grupos;
}

export function obtenerPreajustesMovimientos(tipo: string, categorias: readonly { id: string; tipo: string }[]) {
  const tipos: ('egreso' | 'ingreso')[] = tipo === 'todos' ? ['egreso', 'ingreso'] : [tipo === 'ingreso' ? 'ingreso' : 'egreso'];
  return tipos.flatMap(tipoPreajuste => PREAJUSTES_CATEGORIAS[tipoPreajuste].map(preajuste => ({
    ...preajuste,
    tipo: tipoPreajuste,
    categorias: preajuste.categorias.filter(id => categorias.some(categoria => categoria.id === id && categoria.tipo === tipoPreajuste)),
  })));
}

export function validarRangoMontoEstadistica(rango: RangoMontoEstadistica) {
  for (const limite of [rango.minimo, rango.maximo]) {
    if (limite !== undefined && (!Number.isFinite(limite) || limite < 0)) return false;
  }
  return rango.minimo === undefined || rango.maximo === undefined || rango.minimo <= rango.maximo;
}
