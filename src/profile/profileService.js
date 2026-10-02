import { obtenerSesionActual } from '../authentication/sessionService';
import { verificarContrasena } from '../authentication/passwordSecurity';
import { autenticacionRepositorio, preferenciasRepositorio, usuariosRepositorio } from '../database/repositories';
import { ErrorBaseDatos } from '../database/errors';
import {
  APARIENCIA_PREDETERMINADA,
  APARIENCIAS_PERMITIDAS,
  IDIOMA_PREDETERMINADO,
  IDIOMAS_PERMITIDOS,
} from '../constants/profile';
import { normalizarCorreo, validarDatosPerfil } from '../utils/authenticationValidation';

const MENSAJES_ERROR = Object.freeze({
  datos_invalidos: 'Revisá los datos marcados antes de guardar los cambios.',
  sesion_no_disponible: 'No se encontró una sesión local activa. Iniciá sesión e intentá nuevamente.',
  correo_duplicado: 'Ya existe una cuenta con ese correo electrónico.',
  preferencia_invalida: 'La preferencia seleccionada no es válida.',
  operacion_no_disponible: 'No se pudo actualizar el perfil. Intentá nuevamente.',
});

export class ErrorPerfil extends Error {
  constructor(codigo, errores = null) {
    super(MENSAJES_ERROR[codigo] || MENSAJES_ERROR.operacion_no_disponible);
    this.name = 'ErrorPerfil';
    this.codigo = codigo;
    this.errores = errores;
  }
}

async function obtenerUsuarioActual() {
  const { usuario } = await obtenerSesionActual();
  if (!usuario) {
    throw new ErrorPerfil('sesion_no_disponible');
  }

  return usuario;
}

async function consultarPreferencias(usuarioId) {
  const filas = await preferenciasRepositorio.consultar(
    { usuario_id: usuarioId },
    { ordenarPor: 'fecha_creacion', direccion: 'ASC', limite: 1 },
  );
  const preferencias = filas[0];

  if (!preferencias) {
    throw new ErrorPerfil('operacion_no_disponible');
  }

  return {
    ...preferencias,
    idioma: preferencias.idioma || IDIOMA_PREDETERMINADO,
    apariencia: preferencias.apariencia || APARIENCIA_PREDETERMINADA,
    notificaciones_activas: Number(preferencias.notificaciones_activas) === 1,
  };
}

export async function cargarPerfil() {
  const usuario = await obtenerUsuarioActual();
  const preferencias = await consultarPreferencias(usuario.id);
  return { usuario, preferencias };
}

export async function cargarPreferenciasActuales() {
  const usuario = await obtenerUsuarioActual();
  return consultarPreferencias(usuario.id);
}

export async function verificarContrasenaPerfil(contrasena) {
  const usuario = await obtenerUsuarioActual();
  const credenciales = await autenticacionRepositorio.consultarCredencialesPorCorreo(
    usuario.correo_electronico,
  );

  return Boolean(
    credenciales && await verificarContrasena(contrasena, credenciales.contrasena_verificador),
  );
}

export async function actualizarPerfil(datos) {
  const errores = validarDatosPerfil(datos);
  if (Object.keys(errores).length > 0) {
    throw new ErrorPerfil('datos_invalidos', errores);
  }

  const usuario = await obtenerUsuarioActual();
  const nombre = datos.nombre.trim();
  const correo = normalizarCorreo(datos.correo);
  const cuentasConCorreo = await usuariosRepositorio.consultar(
    { correo_electronico: correo },
    { ordenarPor: 'id', direccion: 'ASC' },
  );

  if (cuentasConCorreo.some((cuenta) => cuenta.id !== usuario.id)) {
    throw new ErrorPerfil('correo_duplicado', { correo: 'Ya existe una cuenta con ese correo electrónico.' });
  }

  try {
    const usuarioActualizado = await usuariosRepositorio.actualizar(usuario.id, {
      nombre,
      correo_electronico: correo,
    });

    if (!usuarioActualizado) {
      throw new ErrorPerfil('operacion_no_disponible');
    }

    return usuarioActualizado;
  } catch (error) {
    if (error instanceof ErrorPerfil) throw error;
    if (error instanceof ErrorBaseDatos && error.codigo === 'integridad') {
      throw new ErrorPerfil('correo_duplicado', { correo: 'Ya existe una cuenta con ese correo electrónico.' });
    }
    throw new ErrorPerfil('operacion_no_disponible');
  }
}

export async function actualizarPreferencias(cambios) {
  const usuario = await obtenerUsuarioActual();
  const preferenciasActuales = await consultarPreferencias(usuario.id);
  const datos = {};

  if (cambios.idioma !== undefined) {
    if (!IDIOMAS_PERMITIDOS.includes(cambios.idioma)) {
      throw new ErrorPerfil('preferencia_invalida');
    }
    datos.idioma = cambios.idioma;
  }

  if (cambios.apariencia !== undefined) {
    if (!APARIENCIAS_PERMITIDAS.includes(cambios.apariencia)) {
      throw new ErrorPerfil('preferencia_invalida');
    }
    datos.apariencia = cambios.apariencia;
  }

  if (cambios.notificaciones_activas !== undefined) {
    if (typeof cambios.notificaciones_activas !== 'boolean') {
      throw new ErrorPerfil('preferencia_invalida');
    }
    datos.notificaciones_activas = cambios.notificaciones_activas ? 1 : 0;
  }

  if (Object.keys(datos).length === 0) {
    throw new ErrorPerfil('preferencia_invalida');
  }

  const preferenciasActualizadas = await preferenciasRepositorio.actualizar(
    preferenciasActuales.id,
    datos,
  );

  if (!preferenciasActualizadas) {
    throw new ErrorPerfil('operacion_no_disponible');
  }

  return {
    ...preferenciasActualizadas,
    idioma: preferenciasActualizadas.idioma || IDIOMA_PREDETERMINADO,
    apariencia: preferenciasActualizadas.apariencia || APARIENCIA_PREDETERMINADA,
    notificaciones_activas: Number(preferenciasActualizadas.notificaciones_activas) === 1,
  };
}
