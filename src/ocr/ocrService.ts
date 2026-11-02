import { Platform } from 'react-native';

import moduloOcr from '../../modules/receipt-ocr';
import { interpretarComprobante } from './receiptParser';

export const OCR_DISPONIBLE = Platform.OS === 'android' && Boolean(moduloOcr);

export async function reconocerComprobante(uri: string) {
  if (!OCR_DISPONIBLE) {
    throw new Error('El reconocimiento necesita un APK Android que incluya ML Kit. No funciona dentro de Expo Go.');
  }
  try {
    const resultado = await moduloOcr!.reconocer(uri, 'mlkit');
    if (!resultado.texto?.trim()) throw new Error('texto_vacio');
    return {
      texto: resultado.texto || '',
      duracionMs: resultado.duracionMs,
      ancho: resultado.ancho,
      alto: resultado.alto,
      ...interpretarComprobante(resultado),
    };
  } catch {
    throw new Error('No pudimos leer el comprobante. Probá con otra foto, mejor luz y el texto enfocado.');
  }
}

export async function eliminarImagenTemporal(uri: string | null | undefined) {
  if (!moduloOcr || !uri) return;
  try {
    await moduloOcr.eliminarTemporal(uri);
  } catch {
    // La foto sigue siendo temporal y queda sujeta a la limpieza de caché de Android.
  }
}
