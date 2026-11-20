import test from 'node:test';
import assert from 'node:assert/strict';
import {crearProgramadorSincronizacion} from '../src/sync/syncScheduler.ts';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';
const vuelta=()=>new Promise<void>(resolver=>setTimeout(resolver,20));

test('un cambio recibido durante una comprobación se envía al terminar sin abrir pantallas',async t=>{
  let terminar=()=>{};
  const bloqueo=new Promise<void>(resolver=>{terminar=resolver;});
  const llamadas:boolean[]=[];
  const programador=crearProgramadorSincronizacion({estaActiva:()=>true,obtenerVista:()=>({estado:'local',pendientes:0}),sincronizar:async silenciosa=>{
    llamadas.push(silenciosa);if(llamadas.length===1)await bloqueo;
  }});
  t.after(()=>programador.cerrar());
  programador.activar();await vuelta();assert.equal(llamadas.length,1);
  programador.solicitar(false,0);programador.solicitar(false,0);await vuelta();
  assert.equal(llamadas.length,1);
  terminar();await vuelta();
  assert.deepEqual(llamadas,[true,false]);
});

test('los cambios guardados en segundo plano siguen pendientes hasta volver a la app',async t=>{
  let activa=false;const llamadas:boolean[]=[];
  const programador=crearProgramadorSincronizacion({estaActiva:()=>activa,obtenerVista:()=>({estado:'local',pendientes:0}),sincronizar:async s=>{llamadas.push(s);}});
  t.after(()=>programador.cerrar());
  programador.solicitar(false,0);await vuelta();assert.equal(llamadas.length,0);
  activa=true;programador.activar();await vuelta();
  assert.deepEqual(llamadas,[false]);
});

test('una nueva escritura después de terminar también inicia el envío automáticamente',async t=>{
  let llamadas=0;
  const programador=crearProgramadorSincronizacion({estaActiva:()=>true,obtenerVista:()=>({estado:'online',pendientes:0}),sincronizar:async()=>{llamadas++;}});
  t.after(()=>programador.cerrar());
  programador.activar();await vuelta();assert.equal(llamadas,1);
  programador.solicitar(false,0);await vuelta();assert.equal(llamadas,2);
  programador.cerrar();programador.solicitar(false,0);await vuelta();assert.equal(llamadas,2);
});

test('el controlador retira la tarea antigua y cada cinco segundos solo comprueba la conexión', async t => {
  t.mock.timers.enable({apis:['setInterval']});
  let limpiezas = 0, revisiones = 0, comprobaciones = 0;
  const tareasRetiradas: string[] = [];
  const sinSuscripcion = () => () => {};
  const {cargar} = crearCargadorComponentes(process.cwd(), {
    react: {
      useContext: () => ({mostrarAviso: () => {}}),
      useEffect: (efecto: () => () => void) => t.after(efecto()),
    },
    'react-native': {
      AppState: {currentState: 'active', addEventListener: () => ({remove: () => {}})},
      StyleSheet: {create: (estilos: unknown) => estilos},
    },
    '@react-navigation/native': {},
    '../styles/globalStyles': {BORDES: {radios: {}}, TIPOGRAFIA: {tamanos: {}, pesos: {}}},
    '../hooks/useActionInProgress': {},
    '../social/online/onlineStore': {},
    '../contexts/AppearanceContext': {},
    '../contexts/ToastContext': {},
    '../sync/syncService': {
      observarSincronizacion: sinSuscripcion,
      comprobarConexionServidor: async () => { comprobaciones++; return false; },
    },
    '../sync/pendingService': {},
    '../sync/journal': {observarCambiosLocales: sinSuscripcion},
    '../sync/syncScheduler': {crearProgramadorSincronizacion: () => ({activar: () => {}, cerrar: () => {}})},
    '../social/online/onlineController': {__esModule: true, default: 'ControladorSocialOnline'},
    '../recurrences/recurrenceService': {procesarRecurrencias: async () => { revisiones++; }},
    './recurrenceService': {},
    'expo-task-manager': {
      defineTask: () => {},
      isAvailableAsync: async () => true,
      isTaskRegisteredAsync: async (nombre: string) => { limpiezas++; return nombre === 'ahre-recurrences'; },
      unregisterTaskAsync: async (nombre: string) => { tareasRetiradas.push(nombre); },
    },
  });
  const {ControladorSincronizacion} = cargar<typeof import('../src/components/SyncStatus.tsx')>('src/components/SyncStatus.tsx');
  ControladorSincronizacion({alRevocar: () => {}});
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(limpiezas, 1);
  assert.deepEqual(tareasRetiradas, ['ahre-recurrences']);
  assert.equal(revisiones, 1);
  assert.equal(comprobaciones, 0);

  for (let control = 0; control < 3; control++) {
    t.mock.timers.tick(5000);
    await Promise.resolve();
  }
  assert.equal(comprobaciones, 3);
  assert.equal(revisiones, 1);
});
