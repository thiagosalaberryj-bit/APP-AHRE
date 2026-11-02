import type { Conexion, Movimiento, Tablas } from '../types';
import { ejecutarConManejoDeErrores, ErrorBaseDatos } from '../errors';
import { ejecutarConConexion } from '../connectionQueue';
import { ejecutarTransaccion } from '../transactions';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../../constants/movimientos';
import { ajustarSaldoActual } from './depositsRepository';
import { crearRepositorio } from './repositoryFactory';
import { prepararReversionSocial } from '../socialMovementReversal';

const TIPOS_MOVIMIENTO = Object.freeze([
  'ingreso',
  'egreso',
  'transferencia_salida',
  'transferencia_entrada',
]);

const TIPOS_INVERSOS = Object.freeze({
  ingreso: 'egreso',
  egreso: 'ingreso',
});

const CATEGORIAS_INVERSAS = Object.freeze({
  ingreso: 'otros_gastos',
  egreso: 'devoluciones',
});

const CATEGORIAS_INGRESO_VALIDAS = new Set(CATEGORIAS_INGRESO.map(({ id }) => id));
const CATEGORIAS_EGRESO_VALIDAS = new Set(CATEGORIAS_EGRESO.map(({ id }) => id));

function esCategoriaValida(tipo: string, categoria: string | null) {
  if (tipo === 'ingreso') {
    return CATEGORIAS_INGRESO_VALIDAS.has(categoria!);
  }
  if (tipo === 'egreso') {
    return CATEGORIAS_EGRESO_VALIDAS.has(categoria!);
  }
  return tipo.startsWith('transferencia_') && categoria === 'transferencias';
}

const repositorioBaseMovimientos = crearRepositorio({
  tabla: 'movimientos',
  campos: [
    'deposito_id',
    'categoria',
    'recurrencia_id',
    'transferencia_id',
    'tipo',
    'monto',
    'descripcion',
    'fecha_hora',
    'anulado',
    'reversion_de_id',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['categoria', 'descripcion'],
  camposFiltrables: [
    'deposito_id',
    'categoria',
    'recurrencia_id',
    'transferencia_id',
    'tipo',
    'anulado',
    'reversion_de_id',
  ],
  camposOrdenables: ['fecha_hora', 'tipo', 'categoria', 'monto', 'fecha_creacion'],
  ordenPredeterminado: 'fecha_hora',
});

const EXPRESION_HORA_ISO = /^\d{4}-\d{2}-\d{2}T/;
const LIMITE_HISTORIAL = 50;

function validarListaIdentificadores(valor: unknown) {
  return Array.isArray(valor)
    && valor.every((identificador: unknown) => typeof identificador === 'string' && identificador.length > 0);
}

function validarMarcaTemporal(valor: unknown) {
  return typeof valor === 'string'
    && EXPRESION_HORA_ISO.test(valor)
    && Number.isFinite(Date.parse(valor));
}

function construirConsultaHistorial(usuarioId: string, filtros: import('../../types/forms').FiltrosHistorial, opciones: {limite?:number; cursor?:{fecha_hora:string;id:string}|null}) {
  if (
    typeof usuarioId !== 'string'
    || !usuarioId
    || !filtros
    || typeof filtros !== 'object'
    || Array.isArray(filtros)
    || !opciones
    || typeof opciones !== 'object'
    || Array.isArray(opciones)
  ) {
    throw new ErrorBaseDatos('integridad');
  }

  const clausulas = [
    'd.usuario_id = ?',
    "m.tipo IN ('ingreso', 'egreso')",
    'm.anulado = 0',
  ];
  const parametros: import('expo-sqlite').SQLiteBindValue[] = [usuarioId];

  if (filtros.tipo !== undefined && filtros.tipo !== null && filtros.tipo !== 'todos') {
    if (!['ingreso', 'egreso'].includes(filtros.tipo)) {
      throw new ErrorBaseDatos('integridad');
    }
    clausulas.push('m.tipo = ?');
    parametros.push(filtros.tipo);
  }

  if (filtros.categoriaIds !== undefined && filtros.categoriaIds !== null) {
    if (!validarListaIdentificadores(filtros.categoriaIds)) {
      throw new ErrorBaseDatos('integridad');
    }
    if (filtros.categoriaIds.length === 0) {
      clausulas.push('0 = 1');
    } else {
      clausulas.push(`m.categoria IN (${filtros.categoriaIds.map(() => '?').join(', ')})`);
      parametros.push(...filtros.categoriaIds);
    }
  }

  if (filtros.depositoIds !== undefined && filtros.depositoIds !== null) {
    if (!validarListaIdentificadores(filtros.depositoIds)) {
      throw new ErrorBaseDatos('integridad');
    }
    if (filtros.depositoIds.length === 0) {
      clausulas.push('0 = 1');
    } else {
      clausulas.push(`m.deposito_id IN (${filtros.depositoIds.map(() => '?').join(', ')})`);
      parametros.push(...filtros.depositoIds);
    }
  }

  if (filtros.desde !== undefined && filtros.desde !== null) {
    if (!validarMarcaTemporal(filtros.desde)) throw new ErrorBaseDatos('integridad');
    clausulas.push('m.fecha_hora >= ?');
    parametros.push(filtros.desde);
  }

  if (filtros.hasta !== undefined && filtros.hasta !== null) {
    if (!validarMarcaTemporal(filtros.hasta)) throw new ErrorBaseDatos('integridad');
    clausulas.push('m.fecha_hora < ?');
    parametros.push(filtros.hasta);
  }

  if (
    filtros.desde !== undefined
    && filtros.desde !== null
    && filtros.hasta !== undefined
    && filtros.hasta !== null
    && Date.parse(filtros.desde) >= Date.parse(filtros.hasta)
  ) {
    throw new ErrorBaseDatos('integridad');
  }

  if (filtros.montoMinimo !== undefined && filtros.montoMinimo !== null) {
    const minimo = Number(filtros.montoMinimo);
    if (!Number.isFinite(minimo) || minimo < 0) throw new ErrorBaseDatos('integridad');
    clausulas.push('m.monto >= ?');
    parametros.push(minimo);
  }

  if (filtros.montoMaximo !== undefined && filtros.montoMaximo !== null) {
    const maximo = Number(filtros.montoMaximo);
    if (!Number.isFinite(maximo) || maximo < 0) throw new ErrorBaseDatos('integridad');
    clausulas.push('m.monto <= ?');
    parametros.push(maximo);
  }

  if (
    filtros.montoMinimo !== undefined
    && filtros.montoMinimo !== null
    && filtros.montoMaximo !== undefined
    && filtros.montoMaximo !== null
    && Number(filtros.montoMinimo) > Number(filtros.montoMaximo)
  ) {
    throw new ErrorBaseDatos('integridad');
  }

  if (filtros.busqueda !== undefined && filtros.busqueda !== null) {
    if (typeof filtros.busqueda !== 'string') throw new ErrorBaseDatos('integridad');
    const termino = filtros.busqueda.trim();
    if (termino) {
      clausulas.push("LOWER(m.descripcion) LIKE ? ESCAPE '!'");
      const terminoEscapado = termino
        .toLocaleLowerCase()
        .replace(/!/g, '!!')
        .replace(/%/g, '!%')
        .replace(/_/g, '!_');
      parametros.push(`%${terminoEscapado}%`);
    }
  }

  const limite = opciones.limite === undefined ? LIMITE_HISTORIAL : Number(opciones.limite);
  if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
    throw new ErrorBaseDatos('consulta');
  }

  const cursor = opciones.cursor;
  if (cursor !== undefined && cursor !== null) {
    if (
      !cursor
      || typeof cursor !== 'object'
      || !validarMarcaTemporal(cursor.fecha_hora)
      || typeof cursor.id !== 'string'
      || !cursor.id
    ) {
      throw new ErrorBaseDatos('integridad');
    }
    clausulas.push('(m.fecha_hora < ? OR (m.fecha_hora = ? AND m.id < ?))');
    parametros.push(cursor.fecha_hora, cursor.fecha_hora, cursor.id);
  }

  parametros.push(limite);
  return {
    sql: `SELECT m.*, d.nombre AS deposito_nombre, d.tipo AS deposito_tipo,
                 d.icono AS deposito_icono, d.color AS deposito_color,
                 r.frecuencia AS frecuencia,
                 CASE WHEN r.id IS NULL THEN 0 ELSE 1 END AS recurrente
          FROM movimientos m
          INNER JOIN depositos d ON d.id = m.deposito_id
          LEFT JOIN recurrencias r ON r.id = m.recurrencia_id
          WHERE ${clausulas.join(' AND ')}
          ORDER BY m.fecha_hora DESC, m.id DESC
          LIMIT ?;`,
    parametros,
  };
}

async function consultarHistorial(usuarioId: string, filtros: import('../../types/forms').FiltrosHistorial = {}, opciones: {limite?:number; cursor?:{fecha_hora:string;id:string}|null} = {}, conexion: Conexion | null = null) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion((baseDatos) => {
    const consulta = construirConsultaHistorial(usuarioId, filtros, opciones);
    return baseDatos.getAllAsync<Tablas['movimientos'] & { deposito_nombre: string }>(consulta.sql, consulta.parametros);
  }, conexion));
}

async function consultarOpcionesHistorial(usuarioId: string, conexion: Conexion | null = null) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion(async (baseDatos) => {
    if (typeof usuarioId !== 'string' || !usuarioId) {
      throw new ErrorBaseDatos('integridad');
    }

    const cantidad = await baseDatos.getFirstAsync<{cantidad:number}>(
      `SELECT COUNT(*) AS cantidad
       FROM movimientos m
       INNER JOIN depositos d ON d.id = m.deposito_id
       WHERE d.usuario_id = ?
         AND m.tipo IN ('ingreso', 'egreso')
         AND m.anulado = 0;`,
      [usuarioId],
    );
    const categorias = await baseDatos.getAllAsync<Pick<Tablas['movimientos'], 'tipo'|'categoria'>>(
      `SELECT DISTINCT m.tipo, m.categoria
       FROM movimientos m
       INNER JOIN depositos d ON d.id = m.deposito_id
       WHERE d.usuario_id = ?
         AND m.tipo IN ('ingreso', 'egreso')
         AND m.anulado = 0
       ORDER BY m.tipo ASC, m.categoria ASC;`,
      [usuarioId],
    );
    const depositos = await baseDatos.getAllAsync<Pick<Tablas['depositos'], 'id' | 'nombre' | 'tipo' | 'icono' | 'color'>>(
      `SELECT DISTINCT d.id, d.nombre, d.tipo, d.icono, d.color
       FROM depositos d
       INNER JOIN movimientos m ON m.deposito_id = d.id
       WHERE d.usuario_id = ?
         AND m.tipo IN ('ingreso', 'egreso')
         AND m.anulado = 0
       ORDER BY d.nombre COLLATE NOCASE ASC, d.id ASC;`,
      [usuarioId],
    );

    return {
      cantidad: Number(cantidad?.cantidad || 0),
      categorias,
      depositos,
    };
  }, conexion));
}

async function consultarHistorialPorId(usuarioId: string, movimientoId: string, conexion: Conexion | null = null) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion((baseDatos) => {
    if (
      typeof usuarioId !== 'string'
      || !usuarioId
      || typeof movimientoId !== 'string'
      || !movimientoId
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    return baseDatos.getFirstAsync<import('../types').MovimientoHistorial>(
      `SELECT m.*, d.nombre AS deposito_nombre, d.tipo AS deposito_tipo,
              d.icono AS deposito_icono, d.color AS deposito_color,
              r.frecuencia AS frecuencia,
              CASE WHEN r.id IS NULL THEN 0 ELSE 1 END AS recurrente
       FROM movimientos m
       INNER JOIN depositos d ON d.id = m.deposito_id
       LEFT JOIN recurrencias r ON r.id = m.recurrencia_id
       WHERE m.id = ?
         AND d.usuario_id = ?
         AND m.tipo IN ('ingreso', 'egreso')
         AND m.anulado = 0
       LIMIT 1;`,
      [movimientoId, usuarioId],
    );
  }, conexion));
}

function construirFiltrosEstadistica(usuarioId: string, tipo: string, desde: string, hasta: string, categoria: string | null = null) {
  if (
    typeof usuarioId !== 'string'
    || !usuarioId
    || !['ingreso', 'egreso'].includes(tipo)
    || !validarMarcaTemporal(desde)
    || !validarMarcaTemporal(hasta)
    || Date.parse(desde) >= Date.parse(hasta)
    || (categoria !== null && (typeof categoria !== 'string' || !categoria))
  ) {
    throw new ErrorBaseDatos('integridad');
  }

  return {
    clausula: `d.usuario_id = ? AND m.tipo = ? AND m.anulado = 0
      AND m.fecha_hora >= ? AND m.fecha_hora < ?${categoria === null ? '' : ' AND m.categoria = ?'}`,
    parametros: categoria === null
      ? [usuarioId, tipo, desde, hasta]
      : [usuarioId, tipo, desde, hasta, categoria],
  };
}

async function consultarResumenPorCategoria(usuarioId: string, tipo: string, desde: string, hasta: string, conexion: Conexion | null = null) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion((baseDatos) => {
    const filtros = construirFiltrosEstadistica(usuarioId, tipo, desde, hasta);
    return baseDatos.getAllAsync<{categoria:string;total:number;cantidad:number}>(
      `SELECT m.categoria AS categoria,
              ROUND(SUM(m.monto), 2) AS total,
              COUNT(m.id) AS cantidad
       FROM movimientos m
       INNER JOIN depositos d ON d.id = m.deposito_id
       WHERE ${filtros.clausula}
       GROUP BY m.categoria
       ORDER BY total DESC, m.categoria ASC;`,
      filtros.parametros,
    );
  }, conexion));
}

async function consultarAgrupacionPorPeriodo(
  usuarioId: string,
  tipo: string,
  desde: string,
  hasta: string,
  agrupacion: string,
  categoria: string | null = null,
  conexion: Conexion | null = null,
) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion((baseDatos) => {
    if (!['dia', 'mes'].includes(agrupacion)) throw new ErrorBaseDatos('integridad');
    const filtros = construirFiltrosEstadistica(usuarioId, tipo, desde, hasta, categoria);
    const expresionPeriodo = agrupacion === 'dia'
      ? "strftime('%Y-%m-%d', m.fecha_hora, 'localtime')"
      : "strftime('%Y-%m', m.fecha_hora, 'localtime')";

    return baseDatos.getAllAsync<{periodo:string;categoria:string;total:number}>(
      `SELECT ${expresionPeriodo} AS periodo,
              m.categoria AS categoria,
              ROUND(SUM(m.monto), 2) AS total
       FROM movimientos m
       INNER JOIN depositos d ON d.id = m.deposito_id
       WHERE ${filtros.clausula}
       GROUP BY periodo, m.categoria
       ORDER BY periodo ASC, m.categoria ASC;`,
      filtros.parametros,
    );
  }, conexion));
}

async function consultarDetalleMesCategoria(
  usuarioId: string,
  tipo: string,
  categoria: string | null,
  desde: string,
  hasta: string,
  conexion: Conexion | null = null,
) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion(async (baseDatos) => {
    const filtros = construirFiltrosEstadistica(usuarioId, tipo, desde, hasta, categoria);
    const resumen = await baseDatos.getFirstAsync<{total:number;cantidad:number}>(
      `SELECT ROUND(COALESCE(SUM(m.monto), 0), 2) AS total,
              COUNT(m.id) AS cantidad
       FROM movimientos m
       INNER JOIN depositos d ON d.id = m.deposito_id
       WHERE ${filtros.clausula};`,
      filtros.parametros,
    );
    const movimientos = await baseDatos.getAllAsync<import('../types').MovimientoHistorial>(
      `SELECT m.*, d.nombre AS deposito_nombre, d.tipo AS deposito_tipo,
              d.icono AS deposito_icono, d.color AS deposito_color,
              r.frecuencia AS frecuencia,
              CASE WHEN r.id IS NULL THEN 0 ELSE 1 END AS recurrente
       FROM movimientos m
       INNER JOIN depositos d ON d.id = m.deposito_id
       LEFT JOIN recurrencias r ON r.id = m.recurrencia_id
       WHERE ${filtros.clausula}
       ORDER BY m.fecha_hora DESC, m.id DESC;`,
      filtros.parametros,
    );

    return { resumen, movimientos };
  }, conexion));
}

function obtenerMarcaTemporal(fecha: string | Date | undefined) {
  const marcaTemporal = typeof fecha === 'string' ? Date.parse(fecha) : NaN;
  if (!Number.isFinite(marcaTemporal)) {
    throw new ErrorBaseDatos('integridad');
  }
  return marcaTemporal;
}

async function consultarFechaCreacionDeposito(depositoId: string, conexion: Conexion) {
  const deposito = await conexion.getFirstAsync<Pick<Tablas['depositos'], 'fecha_creacion'>>(
    'SELECT fecha_creacion FROM depositos WHERE id = ?;',
    [depositoId],
  );
  if (!deposito) {
    throw new ErrorBaseDatos('integridad');
  }
  obtenerMarcaTemporal(deposito.fecha_creacion);
  return deposito.fecha_creacion;
}

async function consultarFechaMovimientoEfectiva(movimiento: import('../types').Movimiento, conexion: Conexion) {
  if (movimiento.reversion_de_id) {
    const movimientoOriginal = await conexion.getFirstAsync<Pick<Tablas['movimientos'], 'fecha_hora'>>(
      'SELECT fecha_hora FROM movimientos WHERE id = ?;',
      [movimiento.reversion_de_id],
    );
    if (!movimientoOriginal) {
      throw new ErrorBaseDatos('integridad');
    }
    return movimientoOriginal.fecha_hora;
  }

  if (movimiento.transferencia_id) {
    const transferencia = await conexion.getFirstAsync<Pick<Tablas['transferencias'], 'reversion_de_id'>>(
      'SELECT reversion_de_id FROM transferencias WHERE id = ?;',
      [movimiento.transferencia_id],
    );
    if (!transferencia) {
      throw new ErrorBaseDatos('integridad');
    }
    if (transferencia.reversion_de_id) {
      const transferenciaOriginal = await conexion.getFirstAsync<Pick<Tablas['transferencias'], 'fecha_hora'>>(
        'SELECT fecha_hora FROM transferencias WHERE id = ?;',
        [transferencia.reversion_de_id],
      );
      if (!transferenciaOriginal) {
        throw new ErrorBaseDatos('integridad');
      }
      return transferenciaOriginal.fecha_hora;
    }
  }

  return movimiento.fecha_hora;
}

function calcularImpactoSaldo(
  movimiento: import('../types').Movimiento,
  fechaCreacionDeposito: string | undefined,
  fechaMovimientoEfectiva: string | undefined,
) {
  if (Number(movimiento.anulado) === 1) {
    return 0;
  }

  const monto = Number(movimiento.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new ErrorBaseDatos('integridad');
  }

  if (
    obtenerMarcaTemporal(fechaMovimientoEfectiva) <
    obtenerMarcaTemporal(fechaCreacionDeposito)
  ) {
    return 0;
  }

  if (movimiento.tipo === 'ingreso' || movimiento.tipo === 'transferencia_entrada') {
    return monto;
  }
  if (movimiento.tipo === 'egreso' || movimiento.tipo === 'transferencia_salida') {
    return -monto;
  }

  throw new ErrorBaseDatos('integridad');
}

function ejecutarEnTransaccion<Resultado>(operacion: (conexion: Conexion) => Promise<Resultado>, conexion: Conexion | null): Promise<Resultado> {
  return conexion ? operacion(conexion) : ejecutarTransaccion(operacion);
}

async function crearEnTransaccion(datos: Partial<import('../types').Movimiento>, conexion: Conexion) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    throw new ErrorBaseDatos('integridad');
  }

  const monto = Number(datos.monto);
  if (
    !Number.isFinite(monto) ||
    monto <= 0 ||
    !TIPOS_MOVIMIENTO.includes(datos.tipo!) ||
    !esCategoriaValida(datos.tipo!, datos.categoria!)
  ) {
    throw new ErrorBaseDatos('integridad');
  }

  const movimiento = await repositorioBaseMovimientos.crear({ ...datos, monto }, conexion);
  const fechaCreacionDeposito = await consultarFechaCreacionDeposito(
    movimiento.deposito_id,
    conexion,
  );
  const fechaMovimientoEfectiva = await consultarFechaMovimientoEfectiva(
    movimiento,
    conexion,
  );
  await ajustarSaldoActual(
    movimiento.deposito_id,
    calcularImpactoSaldo(movimiento, fechaCreacionDeposito, fechaMovimientoEfectiva),
    conexion,
  );
  return movimiento;
}

async function crear(datos: Partial<import('../types').Movimiento>, conexion: Conexion | null = null) {
  return ejecutarConManejoDeErrores('escritura', () =>
    ejecutarEnTransaccion((baseDatos) => crearEnTransaccion(datos, baseDatos), conexion),
  );
}

async function actualizar(id: string, cambios: Partial<import('../types').Movimiento>, conexion: Conexion | null = null) {
  return ejecutarConManejoDeErrores('escritura', async () => {
    if (!cambios || typeof cambios !== 'object' || Array.isArray(cambios)) {
      throw new ErrorBaseDatos('integridad');
    }
    if (
      Object.prototype.hasOwnProperty.call(cambios, 'anulado') ||
      Object.prototype.hasOwnProperty.call(cambios, 'transferencia_id') ||
      Object.prototype.hasOwnProperty.call(cambios, 'reversion_de_id')
    ) {
      throw new ErrorBaseDatos('integridad');
    }

    return ejecutarEnTransaccion(async (baseDatos) => {
      const movimientoAnterior = await repositorioBaseMovimientos.consultarPorId(id, baseDatos);
      if (!movimientoAnterior) {
        return null;
      }
      if (movimientoAnterior.transferencia_id || movimientoAnterior.reversion_de_id) {
        throw new ErrorBaseDatos('integridad');
      }

      const reversoExistente = await baseDatos.getFirstAsync<Pick<Tablas['movimientos'], 'id'>>(
        'SELECT id FROM movimientos WHERE reversion_de_id = ?;',
        [id],
      );
      if (reversoExistente) {
        throw new ErrorBaseDatos('integridad');
      }

      const datosActualizados = { ...cambios };
      if (datosActualizados.monto !== undefined) {
        datosActualizados.monto = Number(datosActualizados.monto);
        if (!Number.isFinite(datosActualizados.monto) || datosActualizados.monto <= 0) {
          throw new ErrorBaseDatos('integridad');
        }
      }
      if (datosActualizados.tipo !== undefined && !TIPOS_MOVIMIENTO.includes(datosActualizados.tipo)) {
        throw new ErrorBaseDatos('integridad');
      }
      if (datosActualizados.tipo?.startsWith('transferencia_')) {
        throw new ErrorBaseDatos('integridad');
      }
      const tipoNuevo = datosActualizados.tipo === undefined
        ? movimientoAnterior.tipo
        : datosActualizados.tipo;
      const categoriaNueva = datosActualizados.categoria === undefined
        ? movimientoAnterior.categoria
        : datosActualizados.categoria;
      if (!esCategoriaValida(tipoNuevo, categoriaNueva)) {
        throw new ErrorBaseDatos('integridad');
      }

      const movimientoActualizado = await repositorioBaseMovimientos.actualizar(
        id,
        datosActualizados,
        baseDatos,
      );
      if (!movimientoActualizado) {
        return null;
      }

      const fechaCreacionDepositoAnterior = await consultarFechaCreacionDeposito(
        movimientoAnterior.deposito_id,
        baseDatos,
      );
      const fechaCreacionDepositoActualizado = await consultarFechaCreacionDeposito(
        movimientoActualizado.deposito_id,
        baseDatos,
      );

      await ajustarSaldoActual(
        movimientoAnterior.deposito_id,
        -calcularImpactoSaldo(
          movimientoAnterior,
          fechaCreacionDepositoAnterior,
          movimientoAnterior.fecha_hora,
        ),
        baseDatos,
      );
      await ajustarSaldoActual(
        movimientoActualizado.deposito_id,
        calcularImpactoSaldo(
          movimientoActualizado,
          fechaCreacionDepositoActualizado,
          movimientoActualizado.fecha_hora,
        ),
        baseDatos,
      );
      return movimientoActualizado;
    }, conexion);
  });
}

async function eliminar(id: string, conexion: Conexion | null = null) {
  return ejecutarConManejoDeErrores('escritura', async () =>
    ejecutarEnTransaccion(async (baseDatos) => {
      const movimiento = await repositorioBaseMovimientos.consultarPorId(id, baseDatos);
      if (!movimiento) {
        return false;
      }
      if (movimiento.transferencia_id || Number(movimiento.anulado) === 1) {
        throw new ErrorBaseDatos('integridad');
      }

      const reversoExistente = await baseDatos.getFirstAsync<Pick<Tablas['movimientos'], 'id'>>(
        'SELECT id FROM movimientos WHERE reversion_de_id = ?;',
        [id],
      );
      if (reversoExistente) {
        return false;
      }

      await prepararReversionSocial(id, baseDatos);

      const tipoInverso = TIPOS_INVERSOS[movimiento.tipo as keyof typeof TIPOS_INVERSOS];
      if (!tipoInverso) {
        throw new ErrorBaseDatos('integridad');
      }

      await crearEnTransaccion({
        deposito_id: movimiento.deposito_id,
        categoria: CATEGORIAS_INVERSAS[movimiento.tipo as keyof typeof CATEGORIAS_INVERSAS],
        tipo: tipoInverso,
        monto: movimiento.monto,
        descripcion: `Reversión de movimiento: ${movimiento.descripcion || movimiento.id}`,
        fecha_hora: new Date().toISOString(),
        reversion_de_id: movimiento.id,
      }, baseDatos);

      return true;
    }, conexion),
  );
}

export const movimientosRepositorio = Object.freeze({
  ...repositorioBaseMovimientos,
  consultarHistorial,
  consultarOpcionesHistorial,
  consultarHistorialPorId,
  consultarResumenPorCategoria,
  consultarAgrupacionPorPeriodo,
  consultarDetalleMesCategoria,
  crear,
  actualizar,
  eliminar,
});
