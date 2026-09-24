import { Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RUTAS } from '../constants/routes';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import EncabezadoPrincipal from '../components/MainHeader';

export default function PantallaEstadisticas({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosGlobales(tema);
  const abrirPantallaSecundaria = (ruta) => navegacion.getParent()?.navigate(ruta);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
      <EncabezadoPrincipal
        tema={tema}
        titulo="Estadísticas"
        descripcion="Analiza cómo distribuyes tus ingresos y gastos."
        alAbrirNotificaciones={() => abrirPantallaSecundaria(RUTAS.NOTIFICACIONES)}
        alAbrirPerfil={() => abrirPantallaSecundaria(RUTAS.PERFIL)}
      />
      <View style={estilos.contenido}>
        <Text style={estilos.textoSecundario}>Los gráficos y filtros se implementarán posteriormente.</Text>
      </View>
      </View>
    </SafeAreaView>
  );
}
