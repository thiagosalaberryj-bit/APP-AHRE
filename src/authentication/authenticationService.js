import { autenticacionRepositorio } from '../database/repositories/authenticationRepository';
import { validarInicioSesion, validarRegistro, normalizarCorreo } from '../utils/authenticationValidation';
import { ErrorBaseDatos } from '../database/errors';
import { ErrorAutenticacion } from './errors';
import { crearVerificadorContrasena, verificarContrasena } from './passwordSecurity';
import { crearSesion } from './sessionService';

function validarDatos(errores) {
  return Object.keys(errores).length === 0;
}

function obtenerUsuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo_electronico: usuario.correo_electronico,
    activo: usuario.activo,
  };
}

export async function registrarUsuario(datos) {
  const errores = validarRegistro(datos);
  if (!validarDatos(errores)) {
    throw new ErrorAutenticacion('datos_invalidos', errores);
  }

  try {
    if (await autenticacionRepositorio.existeCorreoRegistrado(normalizarCorreo(datos.correo))) {
      throw new ErrorAutenticacion('usuario_duplicado');
    }

    const contrasenaVerificador = await crearVerificadorContrasena(datos.contrasena);
    const usuario = await autenticacionRepositorio.crearCuenta({
      nombre: datos.nombre.trim(),
      correo: normalizarCorreo(datos.correo),
      contrasenaVerificador,
    });

    return obtenerUsuarioPublico(usuario);
  } catch (error) {
    if (error instanceof ErrorAutenticacion) throw error;
    if (error instanceof ErrorBaseDatos && error.codigo === 'usuario_duplicado') {
      throw new ErrorAutenticacion('usuario_duplicado');
    }
    throw new ErrorAutenticacion('operacion_no_disponible');
  }
}

export async function iniciarSesion({ correo, contrasena, recordar = true }) {
  const errores = validarInicioSesion({ correo, contrasena });
  if (!validarDatos(errores)) {
    throw new ErrorAutenticacion('datos_invalidos', errores);
  }

  try {
    const cuenta = await autenticacionRepositorio.consultarCredencialesPorCorreo(
      normalizarCorreo(correo),
    );

    if (
      !cuenta ||
      !cuenta.activo ||
      !(await verificarContrasena(contrasena, cuenta.contrasena_verificador))
    ) {
      throw new ErrorAutenticacion('credenciales_invalidas');
    }

    const usuario = await crearSesion(cuenta.id, recordar);
    return obtenerUsuarioPublico(usuario);
  } catch (error) {
    if (error instanceof ErrorAutenticacion) throw error;
    throw new ErrorAutenticacion('operacion_no_disponible');
  }
}
