import { ActivityIndicator, Pressable, Text } from 'react-native';

export default function BotonPrincipal({
  estilosGlobales,
  estilosAutenticacion,
  titulo,
  cargando = false,
  deshabilitado = false,
  alPresionar,
}) {
  const noDisponible = deshabilitado || cargando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: cargando, disabled: noDisponible }}
      disabled={noDisponible}
      onPress={alPresionar}
      style={({ pressed: presionado }) => [
        noDisponible ? estilosGlobales.botonDeshabilitado : estilosGlobales.botonPrincipal,
        !noDisponible && estilosAutenticacion.botonPrincipal,
        presionado && !noDisponible && estilosAutenticacion.botonPresionado,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={estilosAutenticacion.colorIndicador} />
      ) : (
        <Text style={noDisponible ? estilosGlobales.textoDeshabilitado : [estilosGlobales.textoBotonPrincipal, estilosAutenticacion.textoBoton]}>
          {titulo}
        </Text>
      )}
      {cargando ? <Text style={[estilosGlobales.textoDeshabilitado, estilosAutenticacion.textoProcesando]}>Procesando…</Text> : null}
    </Pressable>
  );
}
