import type { Tema } from '../styles/colors';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { DIAS_SEMANA, MESES } from '../constants/statistics';
import { ordenarCategoriasPorColor, obtenerColorCategoria } from '../styles/categoryColors';

export function normalizarFecha(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

export function obtenerInicioSemana(fecha: Date) {
  const inicio = normalizarFecha(fecha);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  return inicio;
}

export function formatearFecha(fecha: Date, opciones?: Intl.DateTimeFormatOptions) {
  return fecha.toLocaleDateString('es-AR', opciones);
}

export function formatearRangoSemana(fecha: Date) {
  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  const mesInicio = MESES[inicio.getMonth()].nombre.toLowerCase();
  const mesFin = MESES[fin.getMonth()].nombre.toLowerCase();
  const anioInicio = inicio.getFullYear();
  const anioFin = fin.getFullYear();

  if (inicio.getMonth() === fin.getMonth() && anioInicio === anioFin) {
    return `${inicio.getDate()}–${fin.getDate()} de ${mesFin} ${anioFin}`;
  }

  if (anioInicio === anioFin) {
    return `${inicio.getDate()} de ${mesInicio}–${fin.getDate()} de ${mesFin} ${anioFin}`;
  }

  return `${inicio.getDate()} de ${mesInicio} ${anioInicio}–${fin.getDate()} de ${mesFin} ${anioFin}`;
}

export function formatearDiaSeleccionado(fecha: Date) {
  const hoy = normalizarFecha(new Date());
  const seleccion = normalizarFecha(fecha);
  const fechaVisible = formatearFecha(fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return hoy.getTime() === seleccion.getTime()
    ? `Hoy · ${fechaVisible}`
    : fechaVisible;
}

export function formatearDiaSelector(fecha: Date) {
  const hoy = normalizarFecha(new Date());
  const seleccion = normalizarFecha(fecha);

  return hoy.getTime() === seleccion.getTime()
    ? `Hoy · ${fecha.getFullYear()}`
    : `${fecha.getDate()} ${MESES[fecha.getMonth()].corto.toLowerCase()} ${fecha.getFullYear()}`;
}

export function formatearSemanaSelector(fecha: Date) {
  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);

  if (inicio.getMonth() === fin.getMonth()) {
    return `${inicio.getDate()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
  }

  if (inicio.getFullYear() === fin.getFullYear()) {
    return `${inicio.getDate()} ${MESES[inicio.getMonth()].corto.toLowerCase()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
  }

  return `${inicio.getDate()} ${MESES[inicio.getMonth()].corto.toLowerCase()} ${inicio.getFullYear()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
}

export function obtenerCategorias(tipoMovimiento: string, tema: Tema) {
  const catalogo = tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

  return ordenarCategoriasPorColor(catalogo, tema, tipoMovimiento).map((categoria, indice) => ({
    ...categoria,
    indiceCategoria: indice,
    color: obtenerColorCategoria(categoria.id, tema, tipoMovimiento),
  }));
}

export function formatearMonto(monto: number) {
  return `$ ${new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 2,
  }).format(Number(monto) || 0)}`;
}

export function formatearPorcentaje(porcentaje: number) {
  const valor = Math.round((Number(porcentaje) + Number.EPSILON) * 10) / 10;
  return `${valor.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`;
}

export function crearRutaSector(inicio: number, fin: number, radio = 140) {
  const centro = 180;
  const punto = (angulo: number) => ({
    x: centro + radio * Math.cos((angulo * Math.PI) / 180),
    y: centro + radio * Math.sin((angulo * Math.PI) / 180),
  });
  const primero = punto(inicio);
  const segundo = punto(fin);
  const arcoGrande = fin - inicio > 180 ? 1 : 0;

  return `M ${centro} ${centro} L ${primero.x} ${primero.y} A ${radio} ${radio} 0 ${arcoGrande} 1 ${segundo.x} ${segundo.y} Z`;
}

export function obtenerRangoPeriodo(periodo: string, fechaDia: Date, fechaSemana: Date, mes: number, anio: number) {
  if (periodo === 'dia') {
    const inicio = normalizarFecha(fechaDia);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    return { inicio, fin };
  }
  if (periodo === 'semana') {
    const inicio = obtenerInicioSemana(fechaSemana);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    return { inicio, fin };
  }
  if (periodo === 'mes') {
    return { inicio: new Date(anio, mes, 1), fin: new Date(anio, mes + 1, 1) };
  }
  return { inicio: new Date(anio, 0, 1), fin: new Date(anio + 1, 0, 1) };
}

export function crearDatosResumen(categorias: (import('../constants/movimientos').Categoria & {color:string})[], filas: { categoria: string; total: number; cantidad: number }[], totalGeneral: number) {
  const agregados = new Map(filas.map((fila) => [fila.categoria, fila]));
  return categorias.flatMap((categoria) => {
    const fila = agregados.get(categoria.id);
    if (!fila) return [];
    return [{
      ...categoria,
      monto: Number(fila.total) || 0,
      cantidad: Number(fila.cantidad) || 0,
      participacion: totalGeneral > 0 ? (Number(fila.total) / totalGeneral) * 100 : 0,
    }];
  });
}

export function formatearClaveDia(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function crearDatosColumnas(categorias: (import('../constants/movimientos').Categoria & {color:string})[], modo: string, filas: {periodo:string;categoria:string;total:number}[], fechaSemana: Date, anio: number) {
  const periodos = modo === 'semana'
    ? DIAS_SEMANA.map((etiqueta, indice) => {
      const inicio = obtenerInicioSemana(fechaSemana);
      inicio.setDate(inicio.getDate() + indice);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 1);
      return { id: `dia-${indice}`, etiqueta, inicio, fin };
    })
    : MESES.map((mes) => ({
      id: `mes-${mes.id}`,
      etiqueta: mes.corto,
      inicio: new Date(anio, mes.id, 1),
      fin: new Date(anio, mes.id + 1, 1),
    }));

  const agrupados = new Map(filas.map((fila) => [
    `${fila.periodo}:${fila.categoria}`,
    Number(fila.total) || 0,
  ]));
  const totalesGenerales = new Map<string, number>();
  filas.forEach((fila) => {
    if (!categorias.some(categoria => categoria.id === fila.categoria)) return;
    totalesGenerales.set(
      fila.periodo,
      (totalesGenerales.get(fila.periodo) || 0) + (Number(fila.total) || 0),
    );
  });

  return periodos.map((periodo) => {
    const clavePeriodo = modo === 'semana'
      ? formatearClaveDia(periodo.inicio)
      : `${periodo.inicio.getFullYear()}-${String(periodo.inicio.getMonth() + 1).padStart(2, '0')}`;
    return {
      id: periodo.id,
      etiqueta: periodo.etiqueta,
      tituloDetalle: periodo.inicio.toLocaleDateString('es-AR', modo === 'semana'
        ? { weekday: 'long', day: 'numeric', month: 'long' }
        : { month: 'long', year: 'numeric' }),
      totalGeneral: totalesGenerales.get(clavePeriodo) || 0,
      segmentos: categorias.map((categoria) => ({
        ...categoria,
        monto: agrupados.get(`${clavePeriodo}:${categoria.id}`) || 0,
      })),
    };
  });
}

export function calcularResumenVisible(
  filas: { categoria: string; total: number; cantidad: number }[],
  categoriasSeleccionadas: string[],
) {
  const filasResumenVisibles = filas.filter(fila => categoriasSeleccionadas.includes(fila.categoria));
  const totalResumen = Math.round((filasResumenVisibles.reduce((total, fila) => total + fila.total, 0) + Number.EPSILON) * 100) / 100;
  const hayMovimientosResumen = filasResumenVisibles.some(fila => fila.cantidad > 0);
  const hayDatosResumen = Boolean(hayMovimientosResumen && totalResumen > 0);
  return { filasResumenVisibles, totalResumen, hayMovimientosResumen, hayDatosResumen };
}

export function obtenerDetalleColumna(datosColumnas: ReturnType<typeof crearDatosColumnas>, indiceColumnaSeleccionada: number) {
  const barraSeleccionada = datosColumnas[Math.min(indiceColumnaSeleccionada, datosColumnas.length - 1)];
  const indiceColumnaVisible = Math.min(indiceColumnaSeleccionada, datosColumnas.length - 1);
  const filasDetalleColumna = barraSeleccionada?.segmentos.filter((segmento) => segmento.monto > 0) || [];
  const totalBarraSeleccionada = filasDetalleColumna.reduce((suma, segmento) => suma + segmento.monto, 0);
  const hayDatosColumnasVisibles = datosColumnas.some((barra) => (
    barra.segmentos.some((segmento) => segmento.monto > 0)
  ));
  return { barraSeleccionada, indiceColumnaVisible, filasDetalleColumna, totalBarraSeleccionada, hayDatosColumnasVisibles };
}
