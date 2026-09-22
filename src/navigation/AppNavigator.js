import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../constants/routes';
import BottomTabBar from './BottomTabBar';
import { TEMAS } from '../styles/colors';
import DashboardScreen from '../screens/DashboardScreen';
import DepositoScreen from '../screens/DepositoScreen';
import DetalleDepositoScreen from '../screens/DetalleDepositoScreen';
import EgresoScreen from '../screens/EgresoScreen';
import EstadisticasScreen from '../screens/EstadisticasScreen';
import IngresoScreen from '../screens/IngresoScreen';
import InicioScreen from '../screens/InicioScreen';
import LoginScreen from '../screens/LoginScreen';
import MovimientosScreen from '../screens/MovimientosScreen';
import NotificacionesScreen from '../screens/NotificacionesScreen';
import OcrScreen from '../screens/OcrScreen';
import PerfilScreen from '../screens/PerfilScreen';
import RegistroScreen from '../screens/RegistroScreen';
import SocialScreen from '../screens/SocialScreen';
import NuevoScreen from '../screens/NuevoScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const tema = TEMAS.claro;

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen
        name={ROUTES.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name={ROUTES.MOVIMIENTOS}
        component={MovimientosScreen}
        options={{
          title: 'Movimientos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name={ROUTES.NUEVO}
        component={NuevoScreen}
        options={{
          title: 'Nuevo',
          tabBarIcon: ({ color, size }) => <Ionicons name="add" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name={ROUTES.ESTADISTICAS}
        component={EstadisticasScreen}
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name={ROUTES.SOCIAL}
        component={SocialScreen}
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={ROUTES.INICIO}
        screenOptions={{
          headerStyle: { backgroundColor: tema.encabezado },
          headerTintColor: tema.encabezadoTexto,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name={ROUTES.INICIO} component={InicioScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.REGISTRO} component={RegistroScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.PRINCIPAL} component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.PERFIL} component={PerfilScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.NOTIFICACIONES} component={NotificacionesScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.INGRESO} component={IngresoScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.EGRESO} component={EgresoScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.DEPOSITO} component={DepositoScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.DETALLE_DEPOSITO} component={DetalleDepositoScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ROUTES.OCR} component={OcrScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
