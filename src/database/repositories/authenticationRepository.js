import { ejecutarConConexion } from '../connectionQueue';
import { ErrorBaseDatos, ejecutarConManejoDeErrores } from '../errors';
import { generarIdentificador } from '../identifiers';
import { ejecutarTransaccion } from '../transactions';

function normalizarCorreo(correo) {
  return correo.trim().toLowerCase();
}

async function existeCorreoRegistrado(correo) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion(async (baseDatos) => {
    const cuenta = await baseDatos.getFirstAsync(
      'SELECT id FROM usuarios WHERE LOWER(correo_electronico) = ? LIMIT 1;',
      [normalizarCorreo(correo)],
    );
    return Boolean(cuenta);
  }));
}

async function consultarCredencialesPorCorreo(correo) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion((baseDatos) =>
    baseDatos.getFirstAsync(
      `SELECT usuarios.id, usuarios.nombre, usuarios.correo_electronico, usuarios.activo,
        credenciales_usuario.contrasena_verificador
      FROM usuarios
      INNER JOIN credenciales_usuario ON credenciales_usuario.usuario_id = usuarios.id
      WHERE LOWER(usuarios.correo_electronico) = ?
      LIMIT 1;`,
      [normalizarCorreo(correo)],
    ),
  ));
}

async function consultarUsuarioActivoPorId(usuarioId) {
  return ejecutarConManejoDeErrores('consulta', () => ejecutarConConexion((baseDatos) =>
    baseDatos.getFirstAsync(
      `SELECT id, nombre, correo_electronico, activo
      FROM usuarios
      WHERE id = ? AND activo = 1
      LIMIT 1;`,
      [usuarioId],
    ),
  ));
}

async function crearCuenta({ nombre, correo, contrasenaVerificador }) {
  const ahora = new Date().toISOString();
  const usuarioId = generarIdentificador();

  try {
    return await ejecutarTransaccion(async (baseDatos) => {
      const existente = await baseDatos.getFirstAsync(
        'SELECT id FROM usuarios WHERE LOWER(correo_electronico) = ? LIMIT 1;',
        [normalizarCorreo(correo)],
      );

      if (existente) {
        throw new ErrorBaseDatos('usuario_duplicado');
      }

      await baseDatos.runAsync(
        `INSERT INTO usuarios (id, nombre, correo_electronico, activo, fecha_creacion, fecha_actualizacion)
        VALUES (?, ?, ?, 1, ?, ?);`,
        [usuarioId, nombre.trim(), normalizarCorreo(correo), ahora, ahora],
      );
      await baseDatos.runAsync(
        `INSERT INTO credenciales_usuario
          (usuario_id, contrasena_verificador, fecha_creacion, fecha_actualizacion)
        VALUES (?, ?, ?, ?);`,
        [usuarioId, contrasenaVerificador, ahora, ahora],
      );
      await baseDatos.runAsync(
        `INSERT INTO preferencias
          (id, usuario_id, deposito_predeterminado_id, notificaciones_activas, fecha_creacion, fecha_actualizacion)
        VALUES (?, ?, NULL, 1, ?, ?);`,
        [generarIdentificador(), usuarioId, ahora, ahora],
      );

      return {
        id: usuarioId,
        nombre: nombre.trim(),
        correo_electronico: normalizarCorreo(correo),
        activo: 1,
        fecha_creacion: ahora,
        fecha_actualizacion: ahora,
      };
    });
  } catch (error) {
    if (error instanceof ErrorBaseDatos && error.codigo === 'integridad') {
      throw new ErrorBaseDatos('usuario_duplicado');
    }

    throw error;
  }
}

export const autenticacionRepositorio = Object.freeze({
  existeCorreoRegistrado,
  consultarCredencialesPorCorreo,
  consultarUsuarioActivoPorId,
  crearCuenta,
});
