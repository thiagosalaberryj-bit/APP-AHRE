import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

export default function EntradaMonto({
  tema,
  estilosGlobales,
  estilosMovimiento,
  etiqueta = 'Monto',
  valor,
  alCambiarTexto,
  alLimpiar,
  error,
}) {
  const [enfocado, establecerEnfocado] = useState(false);
  const estiloEstado = error
    ? estilosGlobales.campoError
    : enfocado
      ? estilosGlobales.campoEnfocado
      : null;

  return (
    <View style={estilosMovimiento.grupo}>
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
      <View style={[estilosGlobales.campo, estilosMovimiento.filaMonto, estiloEstado]}>
        <Text style={estilosMovimiento.simboloMonto}>$</Text>
        <TextInput
          accessibilityLabel={etiqueta}
          accessibilityHint={error || undefined}
          keyboardType="numeric"
          onBlur={() => establecerEnfocado(false)}
          onChangeText={alCambiarTexto}
          onFocus={() => establecerEnfocado(true)}
          placeholder="0"
          placeholderTextColor={tema.textoSecundario}
          selectionColor={tema.foco}
          style={estilosMovimiento.entradaMonto}
          value={valor}
        />
        {valor ? (
          <Pressable
            accessibilityLabel="Limpiar monto"
            accessibilityRole="button"
            onPress={alLimpiar}
            style={estilosMovimiento.accionLimpiar}
          >
            <Ionicons color={tema.textoSecundario} name="close-circle-outline" size={24} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={[estilosGlobales.textoError, estilosMovimiento.errorCampo]}>{error}</Text>
      ) : null}
    </View>
  );
}
