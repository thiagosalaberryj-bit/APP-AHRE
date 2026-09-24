import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RUTAS } from '../constants/routes';
import PantallaDetalleCategoria from '../screens/CategoryDetailScreen';
import PantallaEstadisticas from '../screens/StatisticsScreen';

const PilaEstadisticas = createNativeStackNavigator();

export default function NavegadorEstadisticas() {
  return (
    <PilaEstadisticas.Navigator
      initialRouteName={RUTAS.RESUMEN_ESTADISTICAS}
      screenOptions={{ headerShown: false }}
    >
      <PilaEstadisticas.Screen
        component={PantallaEstadisticas}
        name={RUTAS.RESUMEN_ESTADISTICAS}
      />
      <PilaEstadisticas.Screen
        component={PantallaDetalleCategoria}
        name={RUTAS.DETALLE_CATEGORIA}
      />
    </PilaEstadisticas.Navigator>
  );
}
