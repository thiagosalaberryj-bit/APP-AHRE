import { forwardRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, View } from 'react-native';
import type { ComponentProps, ReactNode } from 'react';
import type { TextInputProps } from 'react-native';
import type { Tema } from '../styles/colors';
import type { crearEstilosGlobales } from '../styles/globalStyles';
import type { crearEstilosAutenticacion } from '../styles/authStyles';

export type PropiedadesCampoAutenticacion = TextInputProps & {
  estilosAutenticacion: ReturnType<typeof crearEstilosAutenticacion>;
  estilosGlobales: ReturnType<typeof crearEstilosGlobales>;
  tema: Tema;
  etiqueta: string;
  valor: string;
  alCambiarTexto: (valor: string) => void;
  error?: string;
  icono?: ComponentProps<typeof Ionicons>['name'];
  accesorioDerecho?: ReactNode;
  deshabilitado?: boolean;
};

export default forwardRef<TextInput, PropiedadesCampoAutenticacion>(function CampoAutenticacion(
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
