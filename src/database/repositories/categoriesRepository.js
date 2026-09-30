import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../../constants/movimientos';
import { ErrorBaseDatos } from '../errors';

const CATEGORIAS_POR_TIPO = Object.freeze({
  ingreso: CATEGORIAS_INGRESO,
  egreso: CATEGORIAS_EGRESO,
});

function consultar(tipo = null) {
  if (tipo === null || tipo === undefined) {
    return [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO];
  }

  if (!CATEGORIAS_POR_TIPO[tipo]) {
    throw new ErrorBaseDatos('integridad');
  }

  return [...CATEGORIAS_POR_TIPO[tipo]];
}

function buscar(texto, tipo = null) {
  if (typeof texto !== 'string') {
    throw new ErrorBaseDatos('integridad');
  }

  const termino = texto.trim().toLowerCase();
  const categorias = consultar(tipo);
  if (!termino) {
    return categorias;
  }

  return categorias.filter((categoria) =>
    `${categoria.id} ${categoria.nombre}`.toLowerCase().includes(termino),
  );
}

export const categoriasRepositorio = Object.freeze({
  consultar,
  buscar,
  filtrar: consultar,
});
