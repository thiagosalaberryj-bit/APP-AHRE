import { Button, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUTAS } from '../constants/routes';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import EncabezadoPrincipal from '../components/MainHeader';

export default function PantallaPanel({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosGlobales(tema);
  const abrirPantallaSecundaria = (ruta) => navegacion.getParent()?.navigate(ruta);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
      <EncabezadoPrincipal
        tema={tema}
        alAbrirNotificaciones={() => abrirPantallaSecundaria(RUTAS.NOTIFICACIONES)}
        alAbrirPerfil={() => abrirPantallaSecundaria(RUTAS.PERFIL)}
      />
      <View style={estilos.contenido}>
        <Text style={estilos.subtitulo}>Inicio</Text>
        <Text style={estilos.textoSecundario}>Funcionalidades principales de AHRE.</Text>
        <Button color={tema.botonSecundario} title="Perfil" onPress={() => abrirPantallaSecundaria(RUTAS.PERFIL)} />
        <Button color={tema.botonSecundario} title="Notificaciones" onPress={() => abrirPantallaSecundaria(RUTAS.NOTIFICACIONES)} />
        <Button color={tema.botonSecundario} title="Ingreso" onPress={() => abrirPantallaSecundaria(RUTAS.INGRESO)} />
        <Button color={tema.botonSecundario} title="Egreso" onPress={() => abrirPantallaSecundaria(RUTAS.EGRESO)} />
        <Button color={tema.botonSecundario} title="Nuevo depósito" onPress={() => abrirPantallaSecundaria(RUTAS.DEPOSITO)} />
        <Button color={tema.botonSecundario} title="Detalle de depósito" onPress={() => abrirPantallaSecundaria(RUTAS.DETALLE_DEPOSITO)} />
        <Button color={tema.botonSecundario} title="OCR" onPress={() => abrirPantallaSecundaria(RUTAS.OCR)} />
      </View>
      </View>
    </SafeAreaView>
  );
}
