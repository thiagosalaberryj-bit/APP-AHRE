import { Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EncabezadoSeccion from '../components/SectionHeader';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PantallaDetalleDeposito({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosGlobales(tema);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Detalle de depósito"
          descripcion="Consulta el saldo y los movimientos del depósito."
          alVolver={() => navegacion.goBack()}
        />
        <View style={estilos.contenido}>
          <Text style={estilos.subtitulo}>Detalle de depósito</Text>
          <Text style={estilos.textoSecundario}>El depósito seleccionado se cargará dinámicamente más adelante.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
