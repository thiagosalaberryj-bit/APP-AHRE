import { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { COLORES_MARCA, COLORES_NEUTROS } from './src/styles/colors';

export default function App() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(COLORES_NEUTROS.fondoClaro);

    if (Platform.OS === 'android') {
      NavigationBar.setStyle('light');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORES_MARCA.verdeOscuro} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
