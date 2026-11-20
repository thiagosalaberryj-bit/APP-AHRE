import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { crearCargadorComponentes } from './helpers/componentInterface.ts';

test('Inicio muestra los datos locales aunque Mercado Pago esté pendiente o falle', async () => {
  type ResumenMp = Awaited<ReturnType<typeof import('../src/mercadoPago/mercadoPagoService.ts').consultarResumenMp>>;
  const cierre = Promise.withResolvers<number>();
  const consultasMp: PromiseWithResolvers<ResumenMp>[] = [];
  const estados: unknown[] = [];
  const avisos: string[] = [];
  let indice = 0;
  let enfocar = () => () => {};
  let avisarIntegraciones = () => {};

  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { cargar } = crearCargadorComponentes(raiz, {
    react: {
      useState(inicial: unknown) {
        const posicion = indice++;
        if (!(posicion in estados)) estados[posicion] = inicial;
        return [estados[posicion], (valor: unknown) => { estados[posicion] = valor; }];
      },
      useRef(inicial: unknown) {
        const posicion = indice++;
        return estados[posicion] ??= { current: inicial };
      },
      useCallback: (funcion: unknown) => funcion,
      useContext: () => ({ tema: {}, mostrarAviso: (mensaje: string) => avisos.push(mensaje) }),
    },
    '@react-navigation/native': { useFocusEffect: (efecto: typeof enfocar) => { enfocar = efecto; } },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../contexts/AppearanceContext': { ContextoApariencia: {} },
    '../contexts/ToastContext': { ContextoAvisos: {} },
    '../navigation/useSafeGoBack': { useRegresoProtegido: () => {} },
    '../components/HeaderScrollView': { DesplazamientoEncabezado: 'ScrollView' },
    '../components/ScreenHeaderFrame': { __esModule: true, default: 'MarcoEncabezado' },
    '../components/MainHeader': { __esModule: true, default: 'EncabezadoPrincipal' },
    '../components/MovementCard': { __esModule: true, default: 'TarjetaMovimiento' },
    '../authentication/sessionService': { obtenerSesionActual: async () => ({ usuario: { id: 'usuario' } }) },
    '../profile/balanceVisibilityService': { consultarSaldoOculto: async () => false },
    '../database/repositories': {
      depositosRepositorio: { consultar: async () => [{ id: 'caja', nombre: 'Caja', tipo: 'efectivo', saldo_actual: 1200 }] },
      movimientosRepositorio: {
        consultar: async () => [{ id: 'movimiento', deposito_id: 'caja', descripcion: 'Ingreso de prueba' }],
        consultarSaldoCierreAnterior: () => cierre.promise,
      },
    },
    '../integrations/integrationStore': {
      observarIntegraciones: (avisar: () => void) => {
        avisarIntegraciones = avisar;
        return () => { avisarIntegraciones = () => {}; };
      },
    },
    '../mercadoPago/mercadoPagoService': {
      consultarResumenMp: () => {
        const consulta = Promise.withResolvers<ResumenMp>();
        consultasMp.push(consulta);
        return consulta.promise;
      },
    },
  });
  const Pantalla = cargar<typeof import('../src/screens/DashboardScreen.tsx')>('src/screens/DashboardScreen.tsx').default;
  const renderizar = () => {
    indice = 0;
    return JSON.stringify(Pantalla({ navigation: {} } as never));
  };

  renderizar();
  const desenfocar = enfocar();
  avisarIntegraciones();
  assert.equal(consultasMp.length, 0);
  cierre.resolve(1000);
  await setImmediate();
  assert.equal(consultasMp.length, 1);
  const pendiente = renderizar();
  assert.match(pendiente, /"children":"\$ 1\.200"/);
  assert.match(pendiente, /Ingreso de prueba/);

  consultasMp[0].reject(new Error('No se pudo consultar Mercado Pago'));
  await setImmediate();
  assert.deepEqual(avisos, []);
  assert.doesNotMatch(renderizar(), /Reintentar/);

  avisarIntegraciones();
  avisarIntegraciones();
  consultasMp[2].resolve({ depositoId: 'caja', obtenidos: 3, pendientes: 3 });
  consultasMp[1].resolve({ depositoId: 'caja', obtenidos: 1, pendientes: 1 });
  await setImmediate();
  assert.match(renderizar(), /Mercado Pago, 3 por revisar/);
  desenfocar();
});
