import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import MainHeader from '../components/MainHeader';

export default function MovimientosScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);
  const abrirPantallaSecundaria = (route) => navigation.getParent()?.navigate(route);

  return (
    <SafeAreaView edges={['top']} style={styles.areaSegura}>
      <View style={styles.pantalla}>
      <MainHeader
        title="Movimientos"
        description="Consulta el historial general de tus operaciones."
        onNotifications={() => abrirPantallaSecundaria(ROUTES.NOTIFICACIONES)}
        onProfile={() => abrirPantallaSecundaria(ROUTES.PERFIL)}
      />
      <View style={styles.contenido}>
        <Text style={styles.textoSecundario}>Aquí se mostrarán tus movimientos registrados.</Text>
      </View>
      </View>
    </SafeAreaView>
  );
}
