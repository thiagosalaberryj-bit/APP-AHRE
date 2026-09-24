import { Button, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EncabezadoPrincipal from '../components/MainHeader';
import { RUTAS } from '../constants/routes';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PantallaNuevo({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosGlobales(tema);
  const abrirPantalla = (ruta) => navegacion.getParent()?.navigate(ruta);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
        <EncabezadoPrincipal
          alAbrirNotificaciones={() => abrirPantalla(RUTAS.NOTIFICACIONES)}
          alAbrirPerfil={() => abrirPantalla(RUTAS.PERFIL)}
          altura={136}
          tema={tema}
          titulo="Nuevo"
        />
        <View style={estilos.contenido}>
          <Text style={estilos.textoSecundario}>Acciones nuevas de AHRE.</Text>
          <Button color={tema.botonSecundario} title="Registrar ingreso" onPress={() => abrirPantalla(RUTAS.INGRESO)} />
          <Button color={tema.botonSecundario} title="Registrar egreso" onPress={() => abrirPantalla(RUTAS.EGRESO)} />
          <Button color={tema.botonSecundario} title="Crear depósito" onPress={() => abrirPantalla(RUTAS.DEPOSITO)} />
        </View>
      </View>
    </SafeAreaView>
  );
}
