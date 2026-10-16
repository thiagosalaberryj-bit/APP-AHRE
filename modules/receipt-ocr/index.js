import { requireOptionalNativeModule } from 'expo';

// Expo Go y otras plataformas pueden abrir AHRE sin incluir el laboratorio nativo.
export default requireOptionalNativeModule('AhreReceiptOcr');
