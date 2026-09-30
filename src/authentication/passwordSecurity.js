import * as Crypto from 'expo-crypto';

const ALGORITMO = 'sha256-salted';
const TAMANO_SAL = 16;
const TAMANO_HASH = 32;

function bytesAHexadecimal(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function esHexadecimalDeTamano(texto, tamanoBytes) {
  return typeof texto === 'string' &&
    texto.length === tamanoBytes * 2 &&
    /^[0-9a-f]+$/i.test(texto);
}

function compararHash(esperado, obtenido) {
  if (esperado.length !== obtenido.length) return false;

  let diferencia = 0;
  for (let indice = 0; indice < esperado.length; indice += 1) {
    diferencia |= esperado.charCodeAt(indice) ^ obtenido.charCodeAt(indice);
  }

  return diferencia === 0;
}

async function calcularHash(contrasena, salHexadecimal) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${ALGORITMO}:${salHexadecimal}:${contrasena}`,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
}

export async function crearVerificadorContrasena(contrasena) {
  if (typeof contrasena !== 'string') {
    throw new Error('La contraseña no tiene un formato compatible.');
  }

  const sal = await Crypto.getRandomBytesAsync(TAMANO_SAL);
  const salHexadecimal = bytesAHexadecimal(sal);

  try {
    const hash = await calcularHash(contrasena, salHexadecimal);
    return `${ALGORITMO}$${salHexadecimal}$${hash}`;
  } finally {
    sal.fill(0);
  }
}

export async function verificarContrasena(contrasena, verificadorGuardado) {
  if (typeof contrasena !== 'string' || typeof verificadorGuardado !== 'string') return false;

  const [algoritmo, salHexadecimal, hashGuardado, ...resto] = verificadorGuardado.split('$');
  if (
    algoritmo !== ALGORITMO ||
    resto.length > 0 ||
    !esHexadecimalDeTamano(salHexadecimal, TAMANO_SAL) ||
    !esHexadecimalDeTamano(hashGuardado, TAMANO_HASH)
  ) {
    return false;
  }

  try {
    const hashCalculado = await calcularHash(contrasena, salHexadecimal);
    return compararHash(hashGuardado.toLowerCase(), hashCalculado.toLowerCase());
  } catch (_error) {
    return false;
  }
}
