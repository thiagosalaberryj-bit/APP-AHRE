export function generarIdentificador() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hexadecimal = bytes.map((byte) => byte.toString(16).padStart(2, '0'));
  return [
    hexadecimal.slice(0, 4).join(''),
    hexadecimal.slice(4, 6).join(''),
    hexadecimal.slice(6, 8).join(''),
    hexadecimal.slice(8, 10).join(''),
    hexadecimal.slice(10, 16).join(''),
  ].join('-');
}
