import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

export type EstadoAlarmasExactas='permitidas'|'desactivadas'|'expo_go'|'actualizar_apk'|'no_requerido'|'no_disponible';
interface ModuloAlarmas {permitidas:()=>Promise<boolean>;abrirAjustes:()=>Promise<void>;}
function limitacion():EstadoAlarmasExactas|null{
 if(Platform.OS!=='android'||Number(Platform.Version)<31)return 'no_requerido';
 if(Constants.executionEnvironment===ExecutionEnvironment.StoreClient)return 'expo_go';
 return null;
}
export async function consultarAlarmasExactas():Promise<EstadoAlarmasExactas>{
 const limite=limitacion();if(limite)return limite;
 try{const modulo=requireOptionalNativeModule<ModuloAlarmas>('AhreExactAlarms');return modulo?await modulo.permitidas()?'permitidas':'desactivadas':'actualizar_apk';}catch{return 'no_disponible';}
}
export async function abrirAjustesAlarmasExactas(){
 if(limitacion())return;
 const modulo=requireOptionalNativeModule<ModuloAlarmas>('AhreExactAlarms');
 if(!modulo)throw Error('Instalá una APK nueva de AHRE para activar las alarmas exactas.');
 await modulo.abrirAjustes();
}
