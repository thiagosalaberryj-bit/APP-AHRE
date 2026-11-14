import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {crearCargadorComponentes} from './helpers/componentInterface.ts';

test('abrir Sincronización lee una vez y agrupa avisos recibidos durante la lectura', async () => {
  let enfoque: () => (() => void) = () => () => {};
  let avisar: (vista: unknown) => void = () => {};
  let avisarSocial = () => {};
  let consultas = 0;
  const resolver: (() => void)[] = [];
  const adaptadores: Record<string, unknown> = {
    '../contexts/ToastContext':{ContextoAvisos:{}},
    react: {
      useEffect:()=>{},
      useContext: () => ({tema:{},mostrarAviso:()=>{}}), useState: (v: unknown) => [typeof v === 'function' ? v() : v, () => {}],
      useRef: (current: unknown) => ({current}), useCallback: (v: unknown) => v, useMemo: (f: () => unknown) => f(),
    },
    '@react-navigation/native': {useFocusEffect: (f: typeof enfoque) => {enfoque = f;}},
    'react-native-safe-area-context': {SafeAreaView:'SafeAreaView',useSafeAreaInsets:()=>({bottom:0})},
    '../navigation/useSafeGoBack': {useRegresoProtegido:()=>()=>{}},
    '../components/SyncStatus': {TEXTOS_SYNC:{}},
    '../contexts/AppearanceContext': {ContextoApariencia:{}},
    '../styles/globalStyles': {crearEstilosGlobales:()=>({})},
    '../styles/SyncScreenStyles': {crearEstilosSincronizacion:()=>({})},
    '../profile/balanceVisibilityService': {consultarSaldoOculto:async()=>true},
    '../authentication/sessionService': {obtenerSesionActual:async()=>({usuario:null})},
    '../social/online/onlineStore': {observarSocialOnline:(f:()=>void)=>{avisarSocial=f;return()=>{};}},
    '../social/online/onlineService': {},
    '../sync/syncService': {
      obtenerVistaSincronizacion:()=>({estado:'online',pendientes:0}),
      observarSincronizacion:(f:typeof avisar)=>{avisar=f;f({estado:'online',pendientes:0});return()=>{};},
      consultarReparacionPerfil:async()=>null,
    },
    '../sync/pendingService': {consultarPendientes:()=>{consultas++;return new Promise(r=>resolver.push(()=>r({total:0,registros:[],soloLocal:false,ultimaSincronizacion:null})));}},
  };
  for(const nombre of ['ScreenHeaderFrame','SectionHeader','CollapsibleSectionHeader']) adaptadores['../components/'+nombre]={__esModule:true,default:nombre};
  adaptadores['../components/HeaderScrollView']={SeccionesEncabezado:'SectionList'};
  const {cargar}=crearCargadorComponentes(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),adaptadores);
  const Pantalla=cargar<typeof import('../src/screens/SyncScreen.tsx')>('src/screens/SyncScreen.tsx').default;
  Pantalla({navigation:{},route:{}} as never);
  const desenfocar=enfoque();
  assert.equal(consultas,1);
  for(let i=0;i<10;i++){avisar({estado:'sincronizando',pendientes:1});avisarSocial();}
  assert.equal(consultas,1);
  resolver.shift()!();await new Promise(r=>setImmediate(r));
  assert.equal(consultas,2);
  resolver.shift()!();await new Promise(r=>setImmediate(r));
  assert.equal(consultas,2);
  desenfocar();
});
