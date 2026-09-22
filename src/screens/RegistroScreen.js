import { Button, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORES_MARCA, TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function RegistroScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <StatusBar style="dark" backgroundColor={TEMAS.claro.fondo} />
      <View style={styles.pantalla}>
        <View style={styles.contenido}>
          <Text style={styles.titulo}>Registro</Text>
          <Button
            color={COLORES_MARCA.verdeMedio}
            title="Volver a Login"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
