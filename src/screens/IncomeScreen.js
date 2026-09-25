import { useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SelectorCategoria from '../components/CategorySelector';
import EncabezadoSeccion from '../components/SectionHeader';
import { CATEGORIAS_INGRESO } from '../constants/movimientos';
import { TEMAS } from '../styles/colors';
import { crearEstilosEgreso } from '../styles/expenseStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PantallaIngreso({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilos = crearEstilosGlobales(tema);
  const estilosMovimiento = crearEstilosEgreso(tema);
  const [categoriaId, establecerCategoriaId] = useState(null);

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
          <SelectorCategoria
            tema={tema}
            estilosGlobales={estilos}
            estilosMovimiento={estilosMovimiento}
            categorias={CATEGORIAS_INGRESO}
            seleccionadaId={categoriaId}
            alSeleccionar={establecerCategoriaId}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
