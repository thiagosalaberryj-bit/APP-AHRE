import { useContext } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import EncabezadoSeccion from '../components/SectionHeader';

import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PantallaNotificaciones({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const estilos = crearEstilosGlobales(tema);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Notificaciones"
          descripcion="Consulta los avisos importantes de AHRE."
          alVolver={() => navegacion.goBack()}
        />
        <View style={estilos.contenido}>
          <Text style={estilos.subtitulo}>Notificaciones</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
