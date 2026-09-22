import { Button, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import StructureStatus from '../components/StructureStatus';
import { COLORES_MARCA, TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { runStructureSmokeTest } from '../utils/structureSmokeTest';

export default function InicioScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <StatusBar style="dark" backgroundColor={TEMAS.claro.fondo} />
      <View style={styles.pantalla}>
        <View style={styles.contenido}>
          <Text style={styles.titulo}>AHRE</Text>
          <Text style={styles.subtitulo}>Pantalla de inicio</Text>
          <Text style={styles.textoSecundario}>Administración de recursos económicos.</Text>
          <StructureStatus ready={runStructureSmokeTest()} />
          <Button
            color={COLORES_MARCA.verdeMedio}
            title="Ir a Login"
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
