// Familias visuales; no cambian los identificadores ni la clasificación guardada.
export const FAMILIAS_CATEGORIAS = Object.freeze([
  { tipo: 'egreso', id: 'cotidiano', nombre: 'Día a día',
    categorias: ["alimentacion","compras","hogar"],
    claro: ["#E4AB70","#ECC393","#F4DAB8"], oscuro: ["#D98D35","#F0B967","#FFE2AF"] },
  { tipo: 'egreso', id: 'servicios', nombre: 'Servicios y obligaciones',
    categorias: ["servicios","suscripciones","impuestos"],
    claro: ["#7EA8D3","#A4C3E2","#CADDEE"], oscuro: ["#4E83CE","#89B7EF","#D0E5FF"] },
  { tipo: 'egreso', id: 'bienestar', nombre: 'Bienestar y formación',
    categorias: ["salud","educacion","mascotas"],
    claro: ["#88B99A","#ACCEB6","#D0E3D4"], oscuro: ["#438D68","#7BC99E","#C7EED8"] },
  { tipo: 'egreso', id: 'movilidad', nombre: 'Movilidad y salidas',
    categorias: ["transporte","viajes","entretenimiento"],
    claro: ["#7FB7BD","#A6CFD3","#CCE5E7"], oscuro: ["#358E9B","#73CCD6","#C9F1F5"] },
  { tipo: 'egreso', id: 'finanzas_trabajo', nombre: 'Finanzas y trabajo',
    categorias: ["deudas","transferencias","trabajo"],
    claro: ["#A092C6","#BFB4DC","#DED7ED"], oscuro: ["#8B6CC4","#B79AE4","#E7D9FF"] },
  { tipo: 'egreso', id: 'regalos', nombre: 'Regalos',
    categorias: ["regalos"],
    claro: ["#D5A0BA"], oscuro: ["#E6BAD0"] },
  { tipo: 'egreso', id: 'otros', nombre: 'Otros',
    categorias: ["otros_gastos"],
    claro: ["#AFBAC1"], oscuro: ["#C6D0D6"] },
  { tipo: 'ingreso', id: 'actividad', nombre: 'Trabajo y ventas',
    categorias: ["sueldo","trabajo_independiente","ventas"],
    claro: ["#CCB875","#DFCF9C","#EFE5C7"], oscuro: ["#AF913F","#DBC477","#F9EABE"] },
  { tipo: 'ingreso', id: 'finanzas', nombre: 'Finanzas',
    categorias: ["inversiones","prestamos_recibidos","transferencias_recibidas"],
    claro: ["#A092C6","#BFB4DC","#DED7ED"], oscuro: ["#8B6CC4","#B79AE4","#E7D9FF"] },
  { tipo: 'ingreso', id: 'ayudas', nombre: 'Ayudas y reintegros',
    categorias: ["becas_ayudas","regalos","devoluciones"],
    claro: ["#CE94B0","#E0B7CB","#F0D9E4"], oscuro: ["#B96D92","#E0A1C0","#F8DDEB"] },
  { tipo: 'ingreso', id: 'otros', nombre: 'Otros',
    categorias: ["otros_ingresos"],
    claro: ["#AFBAC1"], oscuro: ["#C6D0D6"] },
]);

export function obtenerFamiliaCategoria(id: string, tipo?: string) {
  return FAMILIAS_CATEGORIAS.find(familia => familia.categorias.includes(id) && (!tipo || familia.tipo === tipo)) || FAMILIAS_CATEGORIAS.find(familia => familia.id === 'otros' && familia.tipo === (tipo || 'egreso'))!;
}

/** Estable por ID: filtrar, ordenar o cambiar de pantalla no altera el color. */
export function obtenerColorCategoria(id: string, tema: { nombre: string }, tipo?: string) {
  const familia = obtenerFamiliaCategoria(id, tipo);
  const indice = Math.max(0, familia.categorias.indexOf(id));
  return (tema.nombre === 'oscuro' ? familia.oscuro : familia.claro)[indice];
}

/** La tinta del icono conserva el matiz, con más contraste que el relleno pastel. */
export function obtenerColorIconoCategoria(id: string, tema: { nombre: string }, tipo?: string) {
  const color = obtenerColorCategoria(id, tema, tipo);
  if (tema.nombre === 'oscuro') return color;
  const canales = color.slice(1).match(/.{2}/g)!;
  return '#' + canales.map(canal => Math.round(parseInt(canal, 16) * 0.6).toString(16).padStart(2, '0')).join('');
}

/** Agrupa por familia y recorre cada escala del tono más intenso al más claro. */
export function ordenarCategoriasPorColor<T extends { id: string }>(categorias: readonly T[], tema: { nombre: string }, tipo?: string): T[] {
  const luminosidad = (id: string) => {
    const canales = obtenerColorCategoria(id, tema, tipo).slice(1).match(/.{2}/g)!.map(canal => {
      const valor = parseInt(canal, 16) / 255;
      return valor <= 0.04045 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4;
    });
    return canales[0] * 0.2126 + canales[1] * 0.7152 + canales[2] * 0.0722;
  };
  return [...categorias].sort((a, b) => {
    const diferenciaFamilia = FAMILIAS_CATEGORIAS.indexOf(obtenerFamiliaCategoria(a.id, tipo)) - FAMILIAS_CATEGORIAS.indexOf(obtenerFamiliaCategoria(b.id, tipo));
    return diferenciaFamilia || luminosidad(a.id) - luminosidad(b.id);
  });
}
