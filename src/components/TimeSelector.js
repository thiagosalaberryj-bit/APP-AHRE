import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

const completarDosDigitos = (valor) => String(valor).padStart(2, '0');

export default function SelectorHora({
  tema,
  estilosMovimiento,
  valor,
  alSeleccionar,
}) {
  const [modalVisible, establecerModalVisible] = useState(false);
  const [horaElegida, establecerHoraElegida] = useState(0);
  const [minutoElegido, establecerMinutoElegido] = useState(0);

  const abrirSelector = () => {
    const [horaActual, minutoActual] = valor.split(':').map(Number);
    establecerHoraElegida(horaActual);
    establecerMinutoElegido(minutoActual);
    establecerModalVisible(true);
  };

  const cambiarHora = (desplazamiento) => {
    establecerHoraElegida((horaActual) => (horaActual + desplazamiento + 24) % 24);
  };

  const cambiarMinuto = (desplazamiento) => {
    establecerMinutoElegido((minutoActual) => (minutoActual + desplazamiento + 60) % 60);
  };

  const confirmarHora = () => {
    alSeleccionar(`${completarDosDigitos(horaElegida)}:${completarDosDigitos(minutoElegido)}`);
    establecerModalVisible(false);
  };

  return (
    <>
      <Pressable
        accessibilityLabel={`Seleccionar hora, ${valor}`}
        accessibilityRole="button"
        onPress={abrirSelector}
        style={estilosMovimiento.filaInformacion}
      >
        <Ionicons color={tema.textoPrincipal} name="time-outline" size={22} />
        <Text style={estilosMovimiento.etiquetaInformacion}>Hora</Text>
        <Text style={estilosMovimiento.valorInformacion}>{valor}</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => establecerModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <Pressable
          accessibilityLabel="Cerrar selector de hora"
          onPress={() => establecerModalVisible(false)}
          style={estilosMovimiento.fondoSuperpuesto}
        >
          <Pressable onPress={() => {}} style={estilosMovimiento.tarjetaModalHora}>
            <View style={estilosMovimiento.encabezadoModal}>
              <Text style={estilosMovimiento.tituloModal}>Elegí una hora</Text>
              <Pressable
                accessibilityLabel="Cerrar selector de hora"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => establecerModalVisible(false)}
                style={estilosMovimiento.botonCerrarModal}
              >
                <Ionicons color={tema.textoPrincipal} name="close" size={22} />
              </Pressable>
            </View>
            <Text style={estilosMovimiento.ayudaSelectorHora}>Formato de 24 horas</Text>
            <View style={estilosMovimiento.selectoresHora}>
              <View style={estilosMovimiento.columnaHora}>
                <Text style={estilosMovimiento.etiquetaSelectorHora}>Hora</Text>
                <Pressable
                  accessibilityLabel="Sumar una hora"
                  accessibilityRole="button"
                  onPress={() => cambiarHora(1)}
                  style={estilosMovimiento.botonAjustarHora}
                >
                  <Ionicons color={tema.foco} name="chevron-up" size={24} />
                </Pressable>
                <Text style={estilosMovimiento.valorSelectorHora}>
                  {completarDosDigitos(horaElegida)}
                </Text>
                <Pressable
                  accessibilityLabel="Restar una hora"
                  accessibilityRole="button"
                  onPress={() => cambiarHora(-1)}
                  style={estilosMovimiento.botonAjustarHora}
                >
                  <Ionicons color={tema.foco} name="chevron-down" size={24} />
                </Pressable>
              </View>
              <Text style={estilosMovimiento.separadorHora}>:</Text>
              <View style={estilosMovimiento.columnaHora}>
                <Text style={estilosMovimiento.etiquetaSelectorHora}>Minuto</Text>
                <Pressable
                  accessibilityLabel="Sumar un minuto"
                  accessibilityRole="button"
                  onPress={() => cambiarMinuto(1)}
                  style={estilosMovimiento.botonAjustarHora}
                >
                  <Ionicons color={tema.foco} name="chevron-up" size={24} />
                </Pressable>
                <Text style={estilosMovimiento.valorSelectorHora}>
                  {completarDosDigitos(minutoElegido)}
                </Text>
                <Pressable
                  accessibilityLabel="Restar un minuto"
                  accessibilityRole="button"
                  onPress={() => cambiarMinuto(-1)}
                  style={estilosMovimiento.botonAjustarHora}
                >
                  <Ionicons color={tema.foco} name="chevron-down" size={24} />
                </Pressable>
              </View>
            </View>
            <View style={estilosMovimiento.accionesModal}>
              <Pressable
                accessibilityRole="button"
                onPress={() => establecerModalVisible(false)}
                style={estilosMovimiento.botonModalSecundario}
              >
                <Text style={estilosMovimiento.textoBotonModalSecundario}>Cerrar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={confirmarHora}
                style={estilosMovimiento.botonModalPrincipal}
              >
                <Text style={estilosMovimiento.textoBotonModalPrincipal}>Listo</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
