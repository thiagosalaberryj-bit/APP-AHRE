import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionHeader from '../components/SectionHeader';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PerfilScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);

  return (
    <SafeAreaView edges={['top']} style={styles.areaSegura}>
      <View style={styles.pantalla}>
        <SectionHeader
          title="Perfil"
          description="Administra tu información personal y tus preferencias."
          onBack={() => navigation.goBack()}
        />
        <View style={styles.contenido}>
          <Text style={styles.subtitulo}>Perfil</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
