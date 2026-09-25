import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

export default function SelectorFecha({
  tema,
  estilosMovimiento,
  valor,
  alPresionar,
}) {
  return (
    <Pressable
      accessibilityLabel="Fecha"
      accessibilityRole="button"
      onPress={alPresionar}
      style={estilosMovimiento.filaInformacion}
    >
      <Ionicons color={tema.textoPrincipal} name="calendar-outline" size={22} />
      <Text style={estilosMovimiento.etiquetaInformacion}>Fecha</Text>
      <Text style={estilosMovimiento.valorInformacion}>{valor}</Text>
    </Pressable>
  );
}
