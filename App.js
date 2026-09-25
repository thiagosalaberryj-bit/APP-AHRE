import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as InterfazSistema from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NavegadorAplicacion from './src/navigation/AppNavigator';
import { TEMAS } from './src/styles/colors';

export default function Aplicacion() {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;

  useEffect(() => {
    InterfazSistema.setBackgroundColorAsync(tema.fondo);
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
