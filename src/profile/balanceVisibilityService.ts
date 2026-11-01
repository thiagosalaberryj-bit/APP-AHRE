import * as SecureStore from 'expo-secure-store';

function obtenerClaveSaldoOculto(usuarioId: string) {
  if (typeof usuarioId !== 'string' || !usuarioId.trim()) {
    throw new Error('No se pudo identificar al usuario para guardar la privacidad del saldo.');
  }

  return `ahre.saldos_ocultos.${usuarioId}`;
}

export async function consultarSaldoOculto(usuarioId: string) {
  return (await SecureStore.getItemAsync(obtenerClaveSaldoOculto(usuarioId))) === '1';
}

export async function guardarSaldoOculto(usuarioId: string, oculto: boolean) {
  if (typeof oculto !== 'boolean') {
    throw new Error('La preferencia de privacidad del saldo no es válida.');
  }

  await SecureStore.setItemAsync(obtenerClaveSaldoOculto(usuarioId), oculto ? '1' : '0');
}
