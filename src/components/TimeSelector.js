import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

export default function SelectorHora({
  tema,
  estilosMovimiento,
  valor,
  alPresionar,
}) {
  return (
    <Pressable
      accessibilityLabel="Hora"
      accessibilityRole="button"
      onPress={alPresionar}
      style={estilosMovimiento.filaInformacion}
    >
      <Ionicons color={tema.textoPrincipal} name="time-outline" size={22} />
      <Text style={estilosMovimiento.etiquetaInformacion}>Hora</Text>
      <Text style={estilosMovimiento.valorInformacion}>{valor}</Text>
    </Pressable>
  );
}
