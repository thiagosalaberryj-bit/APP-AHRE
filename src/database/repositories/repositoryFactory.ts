import type { Tablas, Conexion, Filtros, OpcionesConsulta } from '../types';
import type { SQLiteBindValue } from 'expo-sqlite';
import { ejecutarConManejoDeErrores, ErrorBaseDatos } from '../errors';
import { generarIdentificador } from '../identifiers';
import { ejecutarConConexion } from '../connectionQueue';

type ConfiguracionRepositorio<Nombre extends keyof Tablas> = {
  tabla: Nombre;
  campos: string[];
  camposBusqueda?: string[];
  camposFiltrables?: string[];
  camposOrdenables?: string[];
  ordenPredeterminado?: string;
  eliminacion?: { campo: string; valor: SQLiteBindValue } | null;
};

const EXPRESION_COLUMNA = /^[a-z_][a-z0-9_]*$/;

function citarIdentificador(identificador: string) {
  if (!EXPRESION_COLUMNA.test(identificador)) {
    throw new ErrorBaseDatos('integridad');
  }

  return `"${identificador}"`;
}

function normalizarValor(valor: unknown): SQLiteBindValue {
  if (typeof valor === 'boolean') {
    return valor ? 1 : 0;
  }

  if (
    valor === null ||
    typeof valor === 'string' ||
    (typeof valor === 'number' && Number.isFinite(valor)) ||
    valor instanceof Uint8Array
  ) {
    return valor as SQLiteBindValue;
  }

  throw new ErrorBaseDatos('integridad');
}

function validarObjeto(objeto: unknown) {
  return Boolean(objeto && typeof objeto === 'object' && !Array.isArray(objeto));
}

function crearClausulasFiltros(filtros: Filtros, camposFiltrables: Set<string>) {
  if (!validarObjeto(filtros)) {
    throw new ErrorBaseDatos('integridad');
  }

  const clausulas: string[] = [];
  const parametros: SQLiteBindValue[] = [];

  for (const [campo, valor] of Object.entries(filtros)) {
    if (!camposFiltrables.has(campo)) {
      throw new ErrorBaseDatos('integridad');
    }

    const columna = citarIdentificador(campo);

    if (valor === null) {
      clausulas.push(`${columna} IS NULL`);
      continue;
    }

    if (Array.isArray(valor)) {
      if (valor.length === 0) {
        clausulas.push('0 = 1');
        continue;
      }

      clausulas.push(`${columna} IN (${valor.map(() => '?').join(', ')})`);
      parametros.push(...valor.map(normalizarValor));
      continue;
    }

    clausulas.push(`${columna} = ?`);
    parametros.push(normalizarValor(valor));
  }

  return { clausulas, parametros };
}

function construirConsulta(filtros: Filtros, camposFiltrables: Set<string>, opciones: OpcionesConsulta, camposOrdenables: Set<string>, ordenPredeterminado: string) {
  const { clausulas, parametros } = crearClausulasFiltros(filtros, camposFiltrables);
  const ordenarPor = opciones.ordenarPor || ordenPredeterminado || 'id';

  if (!camposOrdenables.has(ordenarPor)) {
    throw new ErrorBaseDatos('consulta');
  }

  const direccion = String(opciones.direccion || 'ASC').toUpperCase();
  if (direccion !== 'ASC' && direccion !== 'DESC') {
    throw new ErrorBaseDatos('consulta');
  }

  let sql = clausulas.length ? ` WHERE ${clausulas.join(' AND ')}` : '';
  sql += ` ORDER BY ${citarIdentificador(ordenarPor)} ${direccion}`;

  if (opciones.limite !== undefined) {
    const limite = Number(opciones.limite);
    if (!Number.isInteger(limite) || limite < 0) {
      throw new ErrorBaseDatos('consulta');
    }

    sql += ' LIMIT ?';
    parametros.push(limite);
  } else if (opciones.desplazamiento !== undefined) {
    sql += ' LIMIT -1';
  }

  if (opciones.desplazamiento !== undefined) {
    const desplazamiento = Number(opciones.desplazamiento);
    if (!Number.isInteger(desplazamiento) || desplazamiento < 0) {
      throw new ErrorBaseDatos('consulta');
    }

    sql += ' OFFSET ?';
    parametros.push(desplazamiento);
  }

  return { sql, parametros };
}

export function crearRepositorio<Nombre extends keyof Tablas>({
  tabla,
  campos,
  camposBusqueda = [],
  camposFiltrables = [],
  camposOrdenables = [],
  ordenPredeterminado = 'id',
  eliminacion = null,
}: ConfiguracionRepositorio<Nombre>) {
  citarIdentificador(tabla);
  const columnas = new Set(['id', ...campos]);
  const columnasEditables = new Set(campos.filter((campo) => campo !== 'fecha_creacion'));
  const filtrosPermitidos = new Set(camposFiltrables);
  const ordenesPermitidos = new Set(['id', ...camposOrdenables]);
  const nombreTabla = citarIdentificador(tabla);

  for (const columna of columnas) {
    citarIdentificador(columna);
  }

  for (const columna of [...camposBusqueda, ...camposFiltrables, ...camposOrdenables]) {
    if (!columnas.has(columna)) {
      throw new ErrorBaseDatos('integridad');
    }
  }

  async function consultarPorId(id: string, conexion: Conexion | null = null) {
    return ejecutarConManejoDeErrores('consulta', () =>
      ejecutarConConexion((baseDatos) =>
        baseDatos.getFirstAsync<Tablas[Nombre]>(
          `SELECT * FROM ${nombreTabla} WHERE "id" = ?;`,
          [normalizarValor(id)],
        ),
      conexion),
    );
  }

  async function consultar(filtros: Filtros = {}, opciones: OpcionesConsulta = {}, conexion: Conexion | null = null) {
    return ejecutarConManejoDeErrores('consulta', async () => {
      if (!validarObjeto(opciones)) {
        throw new ErrorBaseDatos('consulta');
      }

      return ejecutarConConexion((baseDatos) => {
        const { sql, parametros } = construirConsulta(
          filtros,
          filtrosPermitidos,
          opciones,
          ordenesPermitidos,
          ordenPredeterminado,
        );
        return baseDatos.getAllAsync<Tablas[Nombre]>(`SELECT * FROM ${nombreTabla}${sql};`, parametros);
      }, conexion);
    });
  }

  async function buscar(texto: string, filtros: Filtros = {}, opciones: OpcionesConsulta = {}, conexion: Conexion | null = null) {
    return ejecutarConManejoDeErrores('consulta', async () => {
      if (typeof texto !== 'string' || !validarObjeto(opciones)) {
        throw new ErrorBaseDatos('consulta');
      }

      const termino = texto.trim();
      if (!termino || camposBusqueda.length === 0) {
        return consultar(filtros, opciones, conexion);
      }

      const { clausulas, parametros } = crearClausulasFiltros(filtros, filtrosPermitidos);
      const patron = `%${termino.toLocaleLowerCase()}%`;
      const condicionesTexto = camposBusqueda
        .map((campo) => `LOWER(${citarIdentificador(campo)}) LIKE ?`)
        .join(' OR ');
      clausulas.push(`(${condicionesTexto})`);
      parametros.push(...camposBusqueda.map(() => patron));

      const ordenarPor = opciones.ordenarPor || ordenPredeterminado || 'id';
      const direccion = String(opciones.direccion || 'ASC').toUpperCase();
      if (!ordenesPermitidos.has(ordenarPor) || !['ASC', 'DESC'].includes(direccion)) {
        throw new ErrorBaseDatos('consulta');
      }

      let sql = ` WHERE ${clausulas.join(' AND ')} ORDER BY ${citarIdentificador(ordenarPor)} ${direccion}`;
      if (opciones.limite !== undefined) {
        const limite = Number(opciones.limite);
        if (!Number.isInteger(limite) || limite < 0) {
          throw new ErrorBaseDatos('consulta');
        }
        sql += ' LIMIT ?';
        parametros.push(limite);
      } else if (opciones.desplazamiento !== undefined) {
        sql += ' LIMIT -1';
      }

      if (opciones.desplazamiento !== undefined) {
        const desplazamiento = Number(opciones.desplazamiento);
        if (!Number.isInteger(desplazamiento) || desplazamiento < 0) {
          throw new ErrorBaseDatos('consulta');
        }
        sql += ' OFFSET ?';
        parametros.push(desplazamiento);
      }

      return ejecutarConConexion(
        (baseDatos) => baseDatos.getAllAsync<Tablas[Nombre]>(`SELECT * FROM ${nombreTabla}${sql};`, parametros),
        conexion,
      );
    });
  }

  async function crear(registro: Partial<Tablas[Nombre]>, conexion: Conexion | null = null) {
    return ejecutarConManejoDeErrores('escritura', async () => {
      if (!validarObjeto(registro)) {
        throw new ErrorBaseDatos('integridad');
      }

      return ejecutarConConexion(async (baseDatos) => {
        const datos: Record<string, unknown> = { ...registro };
        for (const campo of Object.keys(datos)) {
          if (!columnas.has(campo)) {
            throw new ErrorBaseDatos('integridad');
          }
          if (datos[campo] === undefined) {
            delete datos[campo];
          }
        }

        const ahora = new Date().toISOString();
        datos.id = datos.id || generarIdentificador();
        if (columnas.has('fecha_creacion')) {
          datos.fecha_creacion = datos.fecha_creacion || ahora;
        }
        if (columnas.has('fecha_actualizacion')) {
          datos.fecha_actualizacion = ahora;
        }

        const nombres = Object.keys(datos);
        const sql = `INSERT INTO ${nombreTabla} (${nombres.map(citarIdentificador).join(', ')}) VALUES (${nombres.map(() => '?').join(', ')});`;
        await baseDatos.runAsync(sql, nombres.map((campo) => normalizarValor(datos[campo])));
        const creado = await consultarPorId(datos.id as string, baseDatos);
        if (!creado) throw new ErrorBaseDatos('integridad');
        return creado;
      }, conexion);
    });
  }

  async function actualizar(id: string, cambios: Partial<Tablas[Nombre]>, conexion: Conexion | null = null) {
    return ejecutarConManejoDeErrores('escritura', async () => {
      if (!validarObjeto(cambios)) {
        throw new ErrorBaseDatos('integridad');
      }

      return ejecutarConConexion(async (baseDatos) => {
        const datos: Record<string, unknown> = {};
        for (const [campo, valor] of Object.entries(cambios)) {
          if (!columnasEditables.has(campo)) {
            throw new ErrorBaseDatos('integridad');
          }
          if (valor !== undefined) {
            datos[campo] = valor;
          }
        }

        if (columnas.has('fecha_actualizacion')) {
          datos.fecha_actualizacion = new Date().toISOString();
        }

        const nombres = Object.keys(datos);
        if (nombres.length === 0) {
          throw new ErrorBaseDatos('integridad');
        }

        const asignaciones = nombres.map((campo) => `${citarIdentificador(campo)} = ?`).join(', ');
        const parametros = nombres.map((campo) => normalizarValor(datos[campo]));
        parametros.push(normalizarValor(id));
        const resultado = await baseDatos.runAsync(
          `UPDATE ${nombreTabla} SET ${asignaciones} WHERE "id" = ?;`,
          parametros,
        );

        return resultado.changes ? consultarPorId(id, baseDatos) : null;
      }, conexion);
    });
  }

  async function eliminar(id: string, conexion: Conexion | null = null) {
    return ejecutarConManejoDeErrores('escritura', async () => {
      if (eliminacion) {
        const registro = await consultarPorId(id, conexion);
        if (!registro) {
          return false;
        }
        const actualizado = await actualizar(id, {
          [eliminacion.campo]: eliminacion.valor,
        } as Partial<Tablas[Nombre]>, conexion);
        return Boolean(actualizado);
      }

      return ejecutarConConexion(async (baseDatos) => {
        const resultado = await baseDatos.runAsync(
          `DELETE FROM ${nombreTabla} WHERE "id" = ?;`,
          [normalizarValor(id)],
        );
        return resultado.changes > 0;
      }, conexion);
    });
  }

  return Object.freeze({
    crear,
    consultar,
    consultarPorId,
    buscar,
    filtrar: consultar,
    actualizar,
    eliminar,
  });
}
