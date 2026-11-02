import * as SecureStore from 'expo-secure-store';

import { autenticacionRepositorio } from '../database/repositories/authenticationRepository';
import { ErrorAutenticacion } from './errors';
import { quitarSesionRemota,URL_SERVIDOR } from '../sync/remote';
import {consultarAutorizacion,autorizacionVigenteLocal} from '../sync/deviceAuthorization';

const CLAVE_SESION = 'ahre.sesion.usuario_id';
let usuarioIdEnMemoria: string | null = null;

async function limpiarAlmacenamientoSeguro() {
  try {
    await SecureStore.deleteItemAsync(CLAVE_SESION);
    return true;
  } catch (_error) {
    return false;
  }
}

export async function crearSesion(usuarioId: string, recordar = true) {
  const usuario = await autenticacionRepositorio.consultarUsuarioActivoPorId(usuarioId);
  if (!usuario) {
    throw new ErrorAutenticacion('credenciales_invalidas');
  }
  if(URL_SERVIDOR){
    const autorizacion=await consultarAutorizacion(usuario.id);
    if(!await autorizacionVigenteLocal(autorizacion,usuario.correo_electronico))throw new ErrorAutenticacion('conexion_requerida');
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

export async function obtenerIdentificadorSesionGuardado() {
  try {
    return await SecureStore.getItemAsync(CLAVE_SESION);
  } catch (_error) {
    throw new ErrorAutenticacion('sesion_no_disponible');
  }
}

export async function obtenerSesionActual() {
  let usuarioId = usuarioIdEnMemoria;

  if (!usuarioId) {
    usuarioId = await obtenerIdentificadorSesionGuardado();
  }

  if (!usuarioId) {
    return { usuario: null, inconsistente: false };
  }

  const usuario = await autenticacionRepositorio.consultarUsuarioActivoPorId(usuarioId);
  if(usuario&&URL_SERVIDOR){
    const autorizacion=await consultarAutorizacion(usuario.id);
    if(!await autorizacionVigenteLocal(autorizacion,usuario.correo_electronico)){
      usuarioIdEnMemoria=null;await limpiarAlmacenamientoSeguro();return {usuario:null,inconsistente:false};
    }
  }
  if (!usuario) {
    usuarioIdEnMemoria = null;
    const sesionLimpiada = await limpiarAlmacenamientoSeguro();
    if (!sesionLimpiada) {
      throw new ErrorAutenticacion('sesion_no_disponible');
    }

    return { usuario: null, inconsistente: true };
  }

  usuarioIdEnMemoria = usuario.id;
  return { usuario, inconsistente: false };
}

export async function comprobarSesion() {
  const { usuario } = await obtenerSesionActual();
  return Boolean(usuario);
}

export async function cerrarSesion() {
  const anterior=usuarioIdEnMemoria||await obtenerIdentificadorSesionGuardado();
  usuarioIdEnMemoria = null;
  try {
    await SecureStore.deleteItemAsync(CLAVE_SESION);
    if(anterior)await quitarSesionRemota(anterior);
  } catch (_error) {
    throw new ErrorAutenticacion('sesion_no_disponible');
  }
}
