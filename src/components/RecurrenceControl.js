import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import Conmutador from './Toggle';

export default function ControlRecurrencia({
  tema,
  estilosMovimiento,
  valor,
  alCambiar,
}) {
  return (
    <View style={estilosMovimiento.filaInformacion}>
      <Ionicons color={tema.textoPrincipal} name="timer-outline" size={22} />
      <Text style={estilosMovimiento.etiquetaInformacion}>Recurrente</Text>
      <Text style={estilosMovimiento.valorInformacion}>{valor ? 'Sí' : 'No'}</Text>
      <Conmutador
        tema={tema}
        valor={valor}
        alCambiar={alCambiar}
        etiquetaAccesibilidad="Recurrente"
      />
    </View>
  );
}
