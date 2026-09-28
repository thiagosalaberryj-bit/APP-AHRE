import { ejecutarConManejoDeErrores } from '../errors';
import { ejecutarConConexion } from '../connectionQueue';
import { crearRepositorio } from './repositoryFactory';

const repositorioDepositos = crearRepositorio({
  tabla: 'depositos',
  campos: [
    'usuario_id',
    'nombre',
    'tipo',
    'saldo_inicial',
    'icono',
    'color',
    'descripcion',
    'activo',
    'fecha_creacion',
    'fecha_actualizacion',
  ],
  camposBusqueda: ['nombre', 'descripcion'],
  camposFiltrables: ['usuario_id', 'tipo', 'activo'],
  camposOrdenables: ['nombre', 'tipo', 'fecha_creacion', 'fecha_actualizacion'],
  ordenPredeterminado: 'fecha_creacion',
  eliminacion: { campo: 'activo', valor: 0 },
});

async function consultarSaldoActual(depositoId, conexion = null) {
  return ejecutarConManejoDeErrores('consulta', () =>
    ejecutarConConexion(async (baseDatos) => {
      const resultado = await baseDatos.getFirstAsync(
      `SELECT
        depositos.saldo_inicial + COALESCE(SUM(
          CASE
            WHEN movimientos.tipo IN ('ingreso', 'transferencia_entrada') THEN movimientos.monto
            WHEN movimientos.tipo IN ('egreso', 'transferencia_salida') THEN -movimientos.monto
            ELSE 0
          END
        ), 0) AS saldo_actual
      FROM depositos
      LEFT JOIN movimientos
        ON movimientos.deposito_id = depositos.id
        AND movimientos.anulado = 0
      WHERE depositos.id = ?
      GROUP BY depositos.id;`,
        [depositoId],
      );

      return resultado ? Number(resultado.saldo_actual) : null;
    }, conexion),
  );
}

export const depositosRepositorio = Object.freeze({
  ...repositorioDepositos,
  consultarSaldoActual,
});
