import { requireOptionalNativeModule } from 'expo';
export default requireOptionalNativeModule<{registrar(): Promise<void>}>('AhreRecurrenceWorker');
