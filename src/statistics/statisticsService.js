import { obtenerSesionActual } from '../authentication/sessionService';
import { ErrorBaseDatos } from '../database/errors';
import { movimientosRepositorio } from '../database/repositories';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';

const TIPOS_ESTADISTICA = Object.freeze(['ingreso', 'egreso']);

function redondearMonto(monto) {
  const numero = Number(monto);
  if (!Number.isFinite(numero)) return 0;
  return Math.round((numero + Number.EPSILON) * 100) / 100;
}

function convertirRango(rango) {
  if (!rango || !(rango.inicio instanceof Date) || !(rango.fin instanceof Date)) {
    throw new ErrorBaseDatos('integridad');
  }
  if (
    !Number.isFinite(rango.inicio.getTime())
    || !Number.isFinite(rango.fin.getTime())
    || rango.inicio >= rango.fin
  ) {
    throw new ErrorBaseDatos('integridad');
  }
  return { desde: rango.inicio.toISOString(), hasta: rango.fin.toISOString() };
}

function normalizarCategorias(filas) {
  return filas.map((fila) => ({
    categoria: fila.categoria,
    total: redondearMonto(fila.total),
    cantidad: Number(fila.cantidad) || 0,
  }));
}

function validarTipo(tipo) {
  if (!TIPOS_ESTADISTICA.includes(tipo)) throw new ErrorBaseDatos('integridad');
}

async function obtenerUsuarioEstadisticas() {
  const { usuario } = await obtenerSesionActual();
  if (!usuario) throw new ErrorBaseDatos('consulta');
  return usuario;
}

export async function cargarEstadisticas({
  tipo,
  rangoResumen,
  rangoColumnas,
  agrupacionColumnas,
}) {
  validarTipo(tipo);
  if (!['dia', 'mes'].includes(agrupacionColumnas)) throw new ErrorBaseDatos('integridad');
  const rangoResumenISO = convertirRango(rangoResumen);
  const rangoColumnasISO = convertirRango(rangoColumnas);
  const usuario = await obtenerUsuarioEstadisticas();

  const [filasResumen, filasColumnas] = await Promise.all([
    movimientosRepositorio.consultarResumenPorCategoria(
      usuario.id,
      tipo,
      rangoResumenISO.desde,
      rangoResumenISO.hasta,
    ),
    movimientosRepositorio.consultarAgrupacionPorPeriodo(
      usuario.id,
      tipo,
      rangoColumnasISO.desde,
      rangoColumnasISO.hasta,
      agrupacionColumnas,
    ),
  ]);
  const categorias = normalizarCategorias(filasResumen);

  return {
    resumen: {
      categorias,
      total: redondearMonto(categorias.reduce((suma, fila) => suma + fila.total, 0)),
      cantidad: categorias.reduce((suma, fila) => suma + fila.cantidad, 0),
    },
    columnas: filasColumnas.map((fila) => ({
      periodo: fila.periodo,
      categoria: fila.categoria,
      total: redondearMonto(fila.total),
    })),
  };
}

export async function cargarDetalleCategoriaEstadistica({ categoria, tipo, anio, mes }) {
  validarTipo(tipo);
  const catalogo = tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  if (
    typeof categoria !== 'string'
    || !catalogo.some((item) => item.id === categoria)
    || !Number.isInteger(anio)
    || anio < 1000
    || anio > 9999
    || !Number.isInteger(mes)
    || mes < 0
    || mes > 11
  ) {
    throw new ErrorBaseDatos('integridad');
  }

  const usuario = await obtenerUsuarioEstadisticas();
  const anioActual = new Date().getFullYear();
  const fechaCreacion = new Date(usuario.fecha_creacion);
  const anioCreacion = Number.isFinite(fechaCreacion.getTime())
    ? Math.min(fechaCreacion.getFullYear(), anioActual)
    : anioActual;
  const anioMinimoDisponible = Math.min(anioCreacion, anioActual - 1);
  const anioConsultado = Math.max(anioMinimoDisponible, Math.min(anio, anioActual));
  const inicioAnio = new Date(anioConsultado, 0, 1);
  const finAnio = new Date(anioConsultado + 1, 0, 1);
  const inicioMes = new Date(anioConsultado, mes, 1);
  const finMes = new Date(anioConsultado, mes + 1, 1);
  const [filasEvolucion, detalleMes] = await Promise.all([
    movimientosRepositorio.consultarAgrupacionPorPeriodo(
      usuario.id,
      tipo,
      inicioAnio.toISOString(),
      finAnio.toISOString(),
      'mes',
      categoria,
    ),
    movimientosRepositorio.consultarDetalleMesCategoria(
      usuario.id,
      tipo,
      categoria,
      inicioMes.toISOString(),
      finMes.toISOString(),
    ),
  ]);
  const totalesMes = new Map(filasEvolucion.map((fila) => [
    Number(fila.periodo.slice(5, 7)) - 1,
    redondearMonto(fila.total),
  ]));
  const evolucion = Array.from({ length: 12 }, (_, indice) => ({
    mes: indice,
    total: totalesMes.get(indice) || 0,
  }));

  return {
    anio: anioConsultado,
    anioMinimoDisponible,
    evolucion,
    resumenMes: {
      total: redondearMonto(detalleMes.resumen?.total),
      cantidad: Number(detalleMes.resumen?.cantidad) || 0,
    },
    movimientos: detalleMes.movimientos || [],
  };
}
