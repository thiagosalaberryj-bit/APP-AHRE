import { Button, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import { COLORES_MARCA, TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function LoginScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <StatusBar style="dark" backgroundColor={TEMAS.claro.fondo} />
      <View style={styles.pantalla}>
        <View style={styles.contenido}>
          <Text style={styles.titulo}>Login</Text>
          <Button
            color={COLORES_MARCA.verdeMedio}
            title="Ir a Registro"
            onPress={() => navigation.navigate(ROUTES.REGISTRO)}
          />
          <Button
            color={COLORES_MARCA.verdeOscuro}
            title="Entrar a Dashboard (prueba)"
            onPress={() => navigation.replace(ROUTES.PRINCIPAL)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
