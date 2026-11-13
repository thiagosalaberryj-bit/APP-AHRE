import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

test('alarmas exactas: estado real, denegación, APK antigua y Expo Go sin llamadas incompatibles',async()=>{
 const plataforma={OS:'android',Version:35},constantes={executionEnvironment:'standalone'};
 let consultas=0,aperturas=0,permitidas=false,disponible=true,fallo=false;
 const modulo={permitidas:async()=>{if(fallo)throw Error('no disponible');return permitidas;},abrirAjustes:async()=>{aperturas++;}};
 const {cargar}=crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),{
  'react-native':{Platform:plataforma},'expo-constants':{__esModule:true,default:constantes,ExecutionEnvironment:{StoreClient:'storeClient'}},
  expo:{requireOptionalNativeModule:(nombre:string)=>{consultas++;assert.equal(nombre,'AhreExactAlarms');return disponible?modulo:null;}},
 });
 const a=cargar<typeof import('../src/notifications/exactAlarmAdapter.ts')>('src/notifications/exactAlarmAdapter.ts');
 assert.equal(await a.consultarAlarmasExactas(),'desactivadas');await a.abrirAjustesAlarmasExactas();assert.equal(aperturas,1);
 permitidas=true;assert.equal(await a.consultarAlarmasExactas(),'permitidas');fallo=true;assert.equal(await a.consultarAlarmasExactas(),'no_disponible');fallo=false;
 disponible=false;assert.equal(await a.consultarAlarmasExactas(),'actualizar_apk');await assert.rejects(a.abrirAjustesAlarmasExactas(),/APK nueva/);
 const antes=consultas;constantes.executionEnvironment='storeClient';assert.equal(await a.consultarAlarmasExactas(),'expo_go');await a.abrirAjustesAlarmasExactas();assert.equal(consultas,antes);assert.equal(aperturas,1);
 plataforma.OS='ios';assert.equal(await a.consultarAlarmasExactas(),'no_requerido');plataforma.OS='android';plataforma.Version=30;assert.equal(await a.consultarAlarmasExactas(),'no_requerido');assert.equal(consultas,antes);
});
