import { Button, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import { COLORES_MARCA, TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import MainHeader from '../components/MainHeader';

export default function NuevoScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);
  const abrirPantalla = (route) => navigation.getParent()?.navigate(route);

  return (
    <SafeAreaView edges={['top']} style={styles.areaSegura}>
      <View style={styles.pantalla}>
      <MainHeader
        title="Nuevo"
        description="Registra ingresos, egresos o crea un depósito."
        onNotifications={() => abrirPantalla(ROUTES.NOTIFICACIONES)}
        onProfile={() => abrirPantalla(ROUTES.PERFIL)}
      />
      <View style={styles.contenido}>
        <Text style={styles.subtitulo}>Nuevo</Text>
        <Text style={styles.textoSecundario}>Acciones nuevas de AHRE.</Text>
        <Button color={COLORES_MARCA.verdeMedio} title="Registrar ingreso" onPress={() => abrirPantalla(ROUTES.INGRESO)} />
        <Button color={COLORES_MARCA.verdeMedio} title="Registrar egreso" onPress={() => abrirPantalla(ROUTES.EGRESO)} />
        <Button color={COLORES_MARCA.verdeMedio} title="Crear depósito" onPress={() => abrirPantalla(ROUTES.DEPOSITO)} />
      </View>
      </View>
    </SafeAreaView>
  );
}
