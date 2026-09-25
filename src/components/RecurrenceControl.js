import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import Conmutador from './Toggle';

export default function ControlRecurrencia({
  tema,
  estilosMovimiento,
  valor,
  alCambiar,
  frecuencias,
  frecuenciaSeleccionada,
  alCambiarFrecuencia,
}) {
  return (
    <View style={estilosMovimiento.grupoRecurrencia}>
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
      {valor ? (
        <View style={estilosMovimiento.contenedorFrecuencias}>
          <Text style={estilosMovimiento.etiquetaFrecuencias}>Frecuencia</Text>
          <View style={estilosMovimiento.filaFrecuencias}>
            {frecuencias.map((opcion) => {
              const seleccionada = opcion.id === frecuenciaSeleccionada;
              return (
                <Pressable
                  key={opcion.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionada }}
                  onPress={() => alCambiarFrecuencia(opcion.id)}
                  style={[
                    estilosMovimiento.botonFrecuencia,
                    seleccionada ? estilosMovimiento.botonFrecuenciaSeleccionado : null,
                  ]}
                >
                  <Text
                    style={[
                      estilosMovimiento.textoFrecuencia,
                      seleccionada ? estilosMovimiento.textoFrecuenciaSeleccionado : null,
                    ]}
                  >
                    {opcion.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
