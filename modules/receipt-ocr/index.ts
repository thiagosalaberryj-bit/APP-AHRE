import { requireOptionalNativeModule } from 'expo';

export interface LineaOcr {
  texto: string;
  x: number;
  y: number;
  ancho?: number;
  alto: number;
}

export interface LecturaOcr {
  texto: string;
  lineas?: LineaOcr[];
  ancho?: number;
  alto?: number;
  duracionMs?: number;
}

interface ModuloOcr {
  reconocer(uri: string, motor: 'mlkit'): Promise<LecturaOcr>;
  eliminarTemporal(uri: string): Promise<boolean>;
}

// Expo Go y otras plataformas pueden abrir AHRE sin incluir el laboratorio nativo.
export default requireOptionalNativeModule<ModuloOcr>('AhreReceiptOcr');
