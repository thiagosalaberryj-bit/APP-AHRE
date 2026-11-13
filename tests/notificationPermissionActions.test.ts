import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

test('activar avisos usa el permiso actual, abre Ajustes al estar bloqueado y no solicita de nuevo si ya fue concedido',async()=>{
 let granted=false,canAskAgain=false,ajustes=0,solicitudes=0;
 const plataforma={OS:'android',Version:35};
 const {cargar}=crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),{
  'react-native':{Platform:plataforma,Linking:{openSettings:async()=>{ajustes++;}}},
  'expo-constants':{__esModule:true,default:{executionEnvironment:'standalone'},ExecutionEnvironment:{StoreClient:'expoGo'}},
  expo:{requireOptionalNativeModule:()=>null},
  'expo-notifications':{setNotificationHandler:()=>{},AndroidImportance:{DEFAULT:3},AndroidNotificationVisibility:{PRIVATE:0},setNotificationChannelAsync:async()=>{},getPermissionsAsync:async()=>({granted,canAskAgain}),requestPermissionsAsync:async()=>{solicitudes++;granted=true;}},
 });
 const a=cargar<typeof import('../src/notifications/nativeAdapter.ts')>('src/notifications/nativeAdapter.ts');
 assert.equal(await a.consultarPermisoAvisos(),'Desactivadas en Ajustes');await a.activarAvisosTelefono();assert.equal(ajustes,1);assert.equal(solicitudes,0);
 canAskAgain=true;await a.activarAvisosTelefono();assert.equal(solicitudes,1);assert.equal(await a.consultarPermisoAvisos(),'Permitidas');
 await a.activarAvisosTelefono();assert.equal(solicitudes,1);assert.equal(ajustes,1);
 granted=false;plataforma.Version=32;await a.activarAvisosTelefono();assert.equal(ajustes,2);assert.equal(solicitudes,1);
});
