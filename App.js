import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as InterfazSistema from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NavegadorAplicacion from './src/navigation/AppNavigator';
import { TEMAS } from './src/styles/colors';

export default function Aplicacion() {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;

  useEffect(() => {
    InterfazSistema.setBackgroundColorAsync(tema.fondo);

    if (Platform.OS === 'android') {
      // `light` usa controles claros para fondos oscuros; `dark`, controles
      // oscuros para fondos claros.
      NavigationBar.setStyle(tema.nombre === 'oscuro' ? 'light' : 'dark');
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
