import { Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EncabezadoSeccion from '../components/SectionHeader';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PantallaIngreso({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosGlobales(tema);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Nuevo ingreso"
          descripcion="Registra el dinero que recibes."
          alVolver={() => navegacion.goBack()}
        />
        <View style={estilos.contenido}>
          <Text style={estilos.subtitulo}>Ingreso</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
