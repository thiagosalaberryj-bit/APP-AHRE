import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionHeader from '../components/SectionHeader';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function DetalleDepositoScreen({ navigation }) {
  const styles = crearEstilosGlobales(TEMAS.claro);

  return (
    <SafeAreaView edges={['top']} style={styles.areaSegura}>
      <View style={styles.pantalla}>
        <SectionHeader
          title="Detalle de depósito"
          description="Consulta el saldo y los movimientos del depósito."
          onBack={() => navigation.goBack()}
        />
        <View style={styles.contenido}>
          <Text style={styles.subtitulo}>Detalle de depósito</Text>
          <Text style={styles.textoSecundario}>El depósito seleccionado se cargará dinámicamente más adelante.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
