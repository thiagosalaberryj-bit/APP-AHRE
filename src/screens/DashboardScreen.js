import { Button, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '../constants/routes';
import { COLORES_MARCA, TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import MainHeader from '../components/MainHeader';

export default function DashboardScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);
  const abrirPantallaSecundaria = (route) => navigation.getParent()?.navigate(route);

  return (
    <SafeAreaView edges={['top']} style={styles.areaSegura}>
      <View style={styles.pantalla}>
      <MainHeader
        onNotifications={() => abrirPantallaSecundaria(ROUTES.NOTIFICACIONES)}
        onProfile={() => abrirPantallaSecundaria(ROUTES.PERFIL)}
      />
      <View style={styles.contenido}>
        <Text style={styles.subtitulo}>Inicio</Text>
        <Text style={styles.textoSecundario}>Funcionalidades principales de AHRE.</Text>
        <Button color={COLORES_MARCA.verdeMedio} title="Perfil" onPress={() => abrirPantallaSecundaria(ROUTES.PERFIL)} />
        <Button color={COLORES_MARCA.verdeMedio} title="Notificaciones" onPress={() => abrirPantallaSecundaria(ROUTES.NOTIFICACIONES)} />
        <Button color={COLORES_MARCA.verdeMedio} title="Ingreso" onPress={() => abrirPantallaSecundaria(ROUTES.INGRESO)} />
        <Button color={COLORES_MARCA.verdeMedio} title="Egreso" onPress={() => abrirPantallaSecundaria(ROUTES.EGRESO)} />
        <Button color={COLORES_MARCA.verdeMedio} title="Nuevo depósito" onPress={() => abrirPantallaSecundaria(ROUTES.DEPOSITO)} />
        <Button color={COLORES_MARCA.verdeMedio} title="Detalle de depósito" onPress={() => abrirPantallaSecundaria(ROUTES.DETALLE_DEPOSITO)} />
        <Button color={COLORES_MARCA.verdeMedio} title="OCR" onPress={() => abrirPantallaSecundaria(ROUTES.OCR)} />
      </View>
      </View>
    </SafeAreaView>
  );
}
