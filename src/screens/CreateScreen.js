import { useContext } from 'react';
import { Button, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { RUTAS } from '../constants/routes';

import { crearEstilosGlobales } from '../styles/globalStyles';
import EncabezadoPrincipal from '../components/MainHeader';

export default function PantallaNuevo({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const estilos = crearEstilosGlobales(tema);
  const abrirPantalla = (ruta) => navegacion.getParent()?.navigate(ruta);

  return (
    <SafeAreaView edges={['top']} style={estilos.areaSegura}>
      <View style={estilos.pantalla}>
      <EncabezadoPrincipal
        tema={tema}
        titulo="Nuevo"
        descripcion="Registra ingresos, egresos o crea un depósito."
        alAbrirNotificaciones={() => abrirPantalla(RUTAS.NOTIFICACIONES)}
        alAbrirPerfil={() => abrirPantalla(RUTAS.PERFIL)}
      />
      <View style={estilos.contenido}>
        <Text style={estilos.subtitulo}>Nuevo</Text>
        <Text style={estilos.textoSecundario}>Acciones nuevas de AHRE.</Text>
        <Button color={tema.botonSecundario} title="Registrar ingreso" onPress={() => abrirPantalla(RUTAS.INGRESO)} />
        <Button color={tema.botonSecundario} title="Registrar egreso" onPress={() => abrirPantalla(RUTAS.EGRESO)} />
        <Button color={tema.botonSecundario} title="Crear depósito" onPress={() => abrirPantalla(RUTAS.DEPOSITO)} />
      </View>
      </View>
    </SafeAreaView>
  );
}
