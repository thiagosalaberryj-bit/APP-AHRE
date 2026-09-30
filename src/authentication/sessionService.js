import * as SecureStore from 'expo-secure-store';

import { autenticacionRepositorio } from '../database/repositories/authenticationRepository';
import { ErrorAutenticacion } from './errors';

const CLAVE_SESION = 'ahre.sesion.usuario_id';
let usuarioIdEnMemoria = null;

async function limpiarAlmacenamientoSeguro() {
  try {
    await SecureStore.deleteItemAsync(CLAVE_SESION);
  } catch (_error) {
    // Una sesión inválida no debe impedir que la aplicación llegue a Login.
  }
}

export async function crearSesion(usuarioId, recordar = true) {
  const usuario = await autenticacionRepositorio.consultarUsuarioActivoPorId(usuarioId);
  if (!usuario) {
    throw new ErrorAutenticacion('credenciales_invalidas');
  }

  try {
    if (recordar) {
      await SecureStore.setItemAsync(CLAVE_SESION, usuario.id);
    } else {
      await SecureStore.deleteItemAsync(CLAVE_SESION);
    }
  } catch (_error) {
    usuarioIdEnMemoria = null;
    await limpiarAlmacenamientoSeguro();
    throw new ErrorAutenticacion('sesion_no_disponible');
  }

  usuarioIdEnMemoria = usuario.id;
  return usuario;
}

export async function obtenerSesionActual() {
  let usuarioId = usuarioIdEnMemoria;

  if (!usuarioId) {
    try {
      usuarioId = await SecureStore.getItemAsync(CLAVE_SESION);
    } catch (_error) {
      await limpiarAlmacenamientoSeguro();
      return { usuario: null, inconsistente: true };
    }
  }

  if (!usuarioId) {
    return { usuario: null, inconsistente: false };
  }

  try {
    const usuario = await autenticacionRepositorio.consultarUsuarioActivoPorId(usuarioId);
    if (!usuario) {
      usuarioIdEnMemoria = null;
      await limpiarAlmacenamientoSeguro();
      return { usuario: null, inconsistente: true };
    }

    usuarioIdEnMemoria = usuario.id;
    return { usuario, inconsistente: false };
  } catch (_error) {
    usuarioIdEnMemoria = null;
    await limpiarAlmacenamientoSeguro();
    return { usuario: null, inconsistente: true };
  }
}

export async function comprobarSesion() {
  const { usuario } = await obtenerSesionActual();
  return Boolean(usuario);
}

export async function cerrarSesion() {
  usuarioIdEnMemoria = null;
  try {
    await SecureStore.deleteItemAsync(CLAVE_SESION);
  } catch (_error) {
    throw new ErrorAutenticacion('sesion_no_disponible');
  }
}
