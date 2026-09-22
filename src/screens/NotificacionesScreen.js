import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionHeader from '../components/SectionHeader';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function NotificacionesScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);

  return (
    <SafeAreaView edges={['top']} style={styles.areaSegura}>
      <View style={styles.pantalla}>
        <SectionHeader
          title="Notificaciones"
          description="Consulta los avisos importantes de AHRE."
          onBack={() => navigation.goBack()}
        />
        <View style={styles.contenido}>
          <Text style={styles.subtitulo}>Notificaciones</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
