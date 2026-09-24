import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export default function MensajeError({ estilosAutenticacion, tema, children: contenido }) {
  if (!contenido) return null;

  return (
    <View accessibilityRole="alert" style={estilosAutenticacion.mensajeError}>
      <Ionicons color={tema.error} name="alert-circle" size={20} />
      <Text style={estilosAutenticacion.textoMensajeError}>{contenido}</Text>
    </View>
  );
}
