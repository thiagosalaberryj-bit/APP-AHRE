import { ejecutarConManejoDeErrores, ErrorBaseDatos } from '../errors';
import { ejecutarConConexion } from '../connectionQueue';
import { generarIdentificador } from '../identifiers';
import { ejecutarTransaccion } from '../transactions';
import { crearRepositorio } from './repositoryFactory';

const repositorioBaseDepositos = crearRepositorio({
  tabla: 'depositos',
  campos: [
    'usuario_id',
    'nombre',
    'tipo',
    'saldo_inicial',
    'saldo_actual',
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

function convertirSaldo(valor) {
  const esNumero = typeof valor === 'number' && Number.isFinite(valor);
  const esTextoNumerico =
    typeof valor === 'string' && valor.trim() !== '' && Number.isFinite(Number(valor));
  if (!esNumero && !esTextoNumerico) {
    throw new ErrorBaseDatos('integridad');
  }
  return Number(valor);
}

export async function ajustarSaldoActual(depositoId, variacion, conexion) {
  const variacionNumerica = Number(variacion);
  if (!Number.isFinite(variacionNumerica) || !conexion) {
    throw new ErrorBaseDatos('integridad');
  }
  if (variacionNumerica === 0) {
    return;
  }

  const resultado = await conexion.runAsync(
    `UPDATE depositos
     SET saldo_actual = saldo_actual + ?, fecha_actualizacion = ?
     WHERE id = ?;`,
    [variacionNumerica, new Date().toISOString(), depositoId],
  );
  if (resultado.changes !== 1) {
    throw new ErrorBaseDatos('integridad');
  }
}

async function crear(datos, conexion = null) {
  return ejecutarConManejoDeErrores('escritura', async () => {
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new ErrorBaseDatos('integridad');
    }

    const saldoInicial = convertirSaldo(datos.saldo_inicial);

    const registrar = (baseDatos) => repositorioBaseDepositos.crear({
      ...datos,
      saldo_actual: saldoInicial,
    }, baseDatos);

    return conexion ? registrar(conexion) : ejecutarTransaccion(registrar);
  });
}

async function actualizar(id, cambios, conexion = null) {
  return ejecutarConManejoDeErrores('escritura', async () => {
    if (!cambios || typeof cambios !== 'object' || Array.isArray(cambios)) {
      throw new ErrorBaseDatos('integridad');
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'saldo_actual')) {
      throw new ErrorBaseDatos('integridad');
    }

    const actualizarDentroDeTransaccion = async (baseDatos) => {
      const depositoAnterior = await repositorioBaseDepositos.consultarPorId(id, baseDatos);
      if (!depositoAnterior) {
        return null;
      }

      const resultado = await repositorioBaseDepositos.actualizar(id, cambios, baseDatos);
      if (!resultado) {
        return null;
      }

      if (cambios.saldo_inicial !== undefined) {
        const saldoInicialNuevo = convertirSaldo(cambios.saldo_inicial);
        await ajustarSaldoActual(
          id,
          saldoInicialNuevo - Number(depositoAnterior.saldo_inicial),
          baseDatos,
        );
      }

      return repositorioBaseDepositos.consultarPorId(id, baseDatos);
    };

    return conexion
      ? actualizarDentroDeTransaccion(conexion)
      : ejecutarTransaccion(actualizarDentroDeTransaccion);
  });
}

async function consultarSaldoActual(depositoId, conexion = null) {
  return ejecutarConManejoDeErrores('consulta', () =>
    ejecutarConConexion(async (baseDatos) => {
      const resultado = await baseDatos.getFirstAsync(
        'SELECT saldo_actual FROM depositos WHERE id = ?;',
        [depositoId],
      );
      return resultado ? Number(resultado.saldo_actual) : null;
    }, conexion),
  );
}

async function actualizarSaldoInformado(
  depositoId,
  saldoInformado,
  descripcion = null,
  conexion = null,
) {
  return ejecutarConManejoDeErrores('escritura', async () => {
    if (
      !depositoId ||
      (descripcion !== null && typeof descripcion !== 'string')
    ) {
      throw new ErrorBaseDatos('integridad');
    }
    const saldoNuevo = convertirSaldo(saldoInformado);

    const actualizarDentroDeTransaccion = async (baseDatos) => {
      const deposito = await repositorioBaseDepositos.consultarPorId(depositoId, baseDatos);
      if (!deposito) {
        return null;
      }

      const ahora = new Date().toISOString();
      await baseDatos.runAsync(
        `INSERT INTO historial_saldos_deposito (
          id, deposito_id, saldo_anterior, saldo_informado, descripcion, fecha_hora
        ) VALUES (?, ?, ?, ?, ?, ?);`,
        [
          generarIdentificador(),
          depositoId,
          Number(deposito.saldo_actual),
          saldoNuevo,
          descripcion,
          ahora,
        ],
      );

      const resultado = await baseDatos.runAsync(
        `UPDATE depositos
         SET saldo_actual = ?, fecha_actualizacion = ?
         WHERE id = ?;`,
        [saldoNuevo, ahora, depositoId],
      );
      if (resultado.changes !== 1) {
        throw new ErrorBaseDatos('integridad');
      }

      return repositorioBaseDepositos.consultarPorId(depositoId, baseDatos);
    };

    return conexion
      ? actualizarDentroDeTransaccion(conexion)
      : ejecutarTransaccion(actualizarDentroDeTransaccion);
  });
}

async function consultarHistorialSaldos(depositoId, conexion = null) {
  return ejecutarConManejoDeErrores('consulta', () =>
    ejecutarConConexion((baseDatos) =>
      baseDatos.getAllAsync(
        `SELECT * FROM historial_saldos_deposito
         WHERE deposito_id = ?
         ORDER BY fecha_hora DESC, id DESC;`,
        [depositoId],
      ),
      conexion,
    ),
  );
}

export const depositosRepositorio = Object.freeze({
  ...repositorioBaseDepositos,
  crear,
  actualizar,
  consultarSaldoActual,
  actualizarSaldoInformado,
  consultarHistorialSaldos,
});
