import { forwardRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, View } from 'react-native';

export default forwardRef(function CampoAutenticacion(
  {
    estilosAutenticacion,
    estilosGlobales,
    tema,
    etiqueta,
    valor,
    alCambiarTexto,
    error,
    icono,
    accesorioDerecho,
    deshabilitado = false,
    ...propiedadesEntrada
  },
  ref,
) {
  const [enfocado, establecerEnfocado] = useState(false);
  const completado = Boolean(valor?.trim());
  const estiloEstadoCampo = deshabilitado
    ? estilosGlobales.campoDeshabilitado
    : error
      ? estilosGlobales.campoError
      : enfocado
        ? estilosGlobales.campoEnfocado
        : completado
          ? estilosGlobales.campoCompletado
          : null;

  return (
    <View style={estilosAutenticacion.campoGrupo}>
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
      <View style={[estilosGlobales.campo, estilosAutenticacion.campo, estiloEstadoCampo]}>
        {icono ? (
          <Ionicons
            color={deshabilitado ? tema.deshabilitado : tema.textoSecundario}
            name={icono}
            size={20}
            style={estilosAutenticacion.iconoCampo}
          />
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={etiqueta}
          accessibilityHint={error || undefined}
          accessibilityState={{ disabled: deshabilitado }}
          autoCorrect={false}
          editable={!deshabilitado}
          onBlur={() => establecerEnfocado(false)}
          onChangeText={alCambiarTexto}
          onFocus={() => establecerEnfocado(true)}
          placeholderTextColor={tema.textoSecundario}
          selectionColor={tema.foco}
          style={[estilosAutenticacion.campoTexto, deshabilitado && estilosAutenticacion.campoTextoDeshabilitado]}
          value={valor}
          {...propiedadesEntrada}
        />
        {accesorioDerecho || (completado && !deshabilitado ? (
          <Ionicons color={tema.exito} name="checkmark-circle" size={20} />
        ) : null)}
      </View>
      {error ? <Text style={[estilosGlobales.textoError, estilosAutenticacion.errorCampo]}>{error}</Text> : null}
    </View>
  );
});
