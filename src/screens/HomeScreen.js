import { Text, View } from 'react-native';

import StructureStatus from '../components/StructureStatus';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { runStructureSmokeTest } from '../utils/structureSmokeTest';

export default function HomeScreen() {
  const styles = crearEstilosGlobales();

  return (
    <View style={styles.pantalla}>
      <View style={styles.encabezado}>
        <Text style={styles.encabezadoTitulo}>AHRE</Text>
        <Text style={styles.encabezadoTexto}>Base visual preparada</Text>
      </View>
      <View style={styles.contenido}>
        <Text style={styles.subtitulo}>Estructura inicial</Text>
        <Text style={styles.textoSecundario}>
          Los estilos globales están centralizados y listos para reutilizarse en las pantallas.
        </Text>
        <StructureStatus ready={runStructureSmokeTest()} />
      </View>
    </View>
  );
}
