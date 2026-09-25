import { Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUTAS } from '../constants/routes';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import EncabezadoPrincipal from '../components/MainHeader';

export default function PantallaSocial({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosGlobales(tema);
  const abrirPantallaSecundaria = (ruta) => navegacion.getParent()?.navigate(ruta);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
      <EncabezadoPrincipal
        tema={tema}
        titulo="Social"
        descripcion="Comparte y consulta actividades con tu entorno."
        alAbrirNotificaciones={() => abrirPantallaSecundaria(RUTAS.NOTIFICACIONES)}
        alAbrirPerfil={() => abrirPantallaSecundaria(RUTAS.PERFIL)}
      />
      <View style={estilos.contenido}>
        <Text style={estilos.textoSecundario}>El módulo social se definirá posteriormente.</Text>
      </View>
      </View>
    </SafeAreaView>
  );
}
