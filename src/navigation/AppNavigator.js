import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RUTAS } from '../constants/routes';
import BarraPestanasInferior from './BottomTabBar';
import { TEMAS } from '../styles/colors';
import PantallaPanel from '../screens/DashboardScreen';
import PantallaDeposito from '../screens/DepositScreen';
import PantallaDetalleDeposito from '../screens/DepositDetailScreen';
import PantallaEgreso from '../screens/ExpenseScreen';
import PantallaEstadisticas from '../screens/StatisticsScreen';
import PantallaIngreso from '../screens/IncomeScreen';
import PantallaInicio from '../screens/HomeScreen';
import PantallaInicioSesion from '../screens/LoginScreen';
import PantallaMovimientos from '../screens/MovementsScreen';
import PantallaNotificaciones from '../screens/NotificationsScreen';
import PantallaOCR from '../screens/OcrScreen';
import PantallaPerfil from '../screens/ProfileScreen';
import PantallaRegistro from '../screens/RegistrationScreen';
import PantallaSocial from '../screens/SocialScreen';
import PantallaNuevo from '../screens/CreateScreen';

const PilaNavegacion = createNativeStackNavigator();
const PestanasNavegacion = createBottomTabNavigator();

function PestanasPrincipales() {
  return (
    <PestanasNavegacion.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(propiedades) => <BarraPestanasInferior {...propiedades} />}
    >
      <PestanasNavegacion.Screen
        name={RUTAS.PANEL}
        component={PantallaPanel}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color: colorIcono, size: tamano, focused: seleccionada }) => (
            <Ionicons name={seleccionada ? 'home' : 'home-outline'} color={colorIcono} size={tamano} />
          ),
        }}
      />
      <PestanasNavegacion.Screen
        name={RUTAS.MOVIMIENTOS}
        component={PantallaMovimientos}
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ color: colorIcono, size: tamano, focused: seleccionada }) => (
            <Ionicons name={seleccionada ? 'list' : 'list-outline'} color={colorIcono} size={tamano} />
          ),
        }}
      />
      <PestanasNavegacion.Screen
        name={RUTAS.NUEVO}
        component={PantallaNuevo}
        options={{
          title: 'Nuevo',
          tabBarIcon: ({ color: colorIcono, size: tamano }) => <Ionicons name="add" color={colorIcono} size={tamano} />,
        }}
      />
      <PestanasNavegacion.Screen
        name={RUTAS.ESTADISTICAS}
        component={PantallaEstadisticas}
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color: colorIcono, size: tamano, focused: seleccionada }) => (
            <Ionicons name={seleccionada ? 'bar-chart' : 'bar-chart-outline'} color={colorIcono} size={tamano} />
          ),
        }}
      />
      <PestanasNavegacion.Screen
        name={RUTAS.SOCIAL}
        component={PantallaSocial}
        options={{
          title: 'Social',
          tabBarIcon: ({ color: colorIcono, size: tamano, focused: seleccionada }) => (
            <Ionicons name={seleccionada ? 'people' : 'people-outline'} color={colorIcono} size={tamano} />
          ),
        }}
      />
    </PestanasNavegacion.Navigator>
  );
}

export default function NavegadorAplicacion() {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const margenesSeguros = useSafeAreaInsets();
  const [tieneBarraInferior, establecerBarraInferior] = useState(false);
  const colorZonaNavegacion = tieneBarraInferior ? tema.superficie : tema.fondo;

  return (
    <View style={{ flex: 1, backgroundColor: tema.fondo }}>
      <NavigationContainer
        onStateChange={(estadoNavegacion) => {
          establecerBarraInferior(estadoNavegacion?.routes?.[estadoNavegacion.index]?.name === RUTAS.PRINCIPAL);
        }}
      >
        <PilaNavegacion.Navigator
          initialRouteName={RUTAS.INICIO}
          screenOptions={{
            contentStyle: { backgroundColor: tema.fondo },
            headerStyle: { backgroundColor: tema.encabezado },
            headerTintColor: tema.encabezadoTexto,
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <PilaNavegacion.Screen name={RUTAS.INICIO} component={PantallaInicio} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.INICIO_SESION} component={PantallaInicioSesion} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.REGISTRO} component={PantallaRegistro} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.PRINCIPAL} component={PestanasPrincipales} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.PERFIL} component={PantallaPerfil} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.NOTIFICACIONES} component={PantallaNotificaciones} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.INGRESO} component={PantallaIngreso} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.EGRESO} component={PantallaEgreso} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.DEPOSITO} component={PantallaDeposito} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.DETALLE_DEPOSITO} component={PantallaDetalleDeposito} options={{ headerShown: false }} />
          <PilaNavegacion.Screen name={RUTAS.OCR} component={PantallaOCR} options={{ headerShown: false }} />
        </PilaNavegacion.Navigator>
      </NavigationContainer>
      {Platform.OS === 'android' && margenesSeguros.bottom > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            left: 0,
            height: margenesSeguros.bottom,
            backgroundColor: colorZonaNavegacion,
          }}
        />
      ) : null}
    </View>
  );
}
