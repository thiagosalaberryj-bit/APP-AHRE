import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionHeader from '../components/SectionHeader';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function OcrScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);

  return (
    <SafeAreaView edges={['top']} style={styles.areaSegura}>
      <View style={styles.pantalla}>
        <SectionHeader
          title="OCR"
          description="Escanea comprobantes para registrar operaciones."
          onBack={() => navigation.goBack()}
        />
        <View style={styles.contenido}>
          <Text style={styles.subtitulo}>OCR</Text>
          <Text style={styles.textoSecundario}>La cámara y el reconocimiento se implementarán posteriormente.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
