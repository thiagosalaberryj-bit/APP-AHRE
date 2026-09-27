import { useContext } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import EncabezadoSeccion from '../components/SectionHeader';

import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PantallaOCR({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const estilos = crearEstilosGlobales(tema);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="OCR"
          descripcion="Escanea comprobantes para registrar operaciones."
          alVolver={() => navegacion.goBack()}
        />
        <View style={estilos.contenido}>
          <Text style={estilos.subtitulo}>OCR</Text>
          <Text style={estilos.textoSecundario}>La cámara y el reconocimiento se implementarán posteriormente.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
