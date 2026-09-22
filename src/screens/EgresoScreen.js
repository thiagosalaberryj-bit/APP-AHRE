import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionHeader from '../components/SectionHeader';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function EgresoScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);

  return (
    <SafeAreaView edges={['top']} style={styles.areaSegura}>
      <View style={styles.pantalla}>
        <SectionHeader
          title="Nuevo egreso"
          description="Registra el dinero que gastas."
          onBack={() => navigation.goBack()}
        />
        <View style={styles.contenido}>
          <Text style={styles.subtitulo}>Egreso</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
