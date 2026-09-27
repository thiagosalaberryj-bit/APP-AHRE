import { useContext, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as BarraNavegacion from 'expo-navigation-bar';
import * as InterfazSistema from 'expo-system-ui';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ContextoApariencia, ProveedorApariencia } from './src/contexts/AppearanceContext';
import NavegadorAplicacion from './src/navigation/AppNavigator';

function ContenidoAplicacion() {
  const { tema } = useContext(ContextoApariencia);

  useEffect(() => {
    InterfazSistema.setBackgroundColorAsync(tema.fondo);
    if (Platform.OS === 'android') {
      BarraNavegacion.setStyle(tema.nombre === 'oscuro' ? 'light' : 'dark');
    }
  }, [tema]);

  return (
    <SafeAreaProvider>
      <StatusBar
        style="light"
        backgroundColor={tema.encabezado}
      />
      <NavegadorAplicacion />
    </SafeAreaProvider>
  );
}

export default function Aplicacion() {
  return (
    <ProveedorApariencia>
      <ContenidoAplicacion />
    </ProveedorApariencia>
  );
}
