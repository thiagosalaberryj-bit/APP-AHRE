import {conRespuestaVisual} from '../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

const completarDosDigitos = (valor: number) => String(valor).padStart(2, '0');

export default function SelectorHora({
  tema,
  estilosMovimiento,
  valor,
  alSeleccionar,
  etiquetaAccesibilidad = 'Seleccionar hora',
  deshabilitado=false,
}: {tema: import('../styles/colors').Tema; estilosMovimiento: import('../types/ui').EstilosMovimiento; valor:string; alSeleccionar:(valor:string)=>void;etiquetaAccesibilidad?:string;deshabilitado?:boolean}) {
  const [modalVisible, establecerModalVisible] = useState(false);
  const [horaElegida, establecerHoraElegida] = useState(0);
  const [minutoElegido, establecerMinutoElegido] = useState(0);

  const abrirSelector = () => {
    if(deshabilitado)return;
    const [horaActual, minutoActual] = valor.split(':').map(Number);
    establecerHoraElegida(horaActual);
    establecerMinutoElegido(minutoActual);
    establecerModalVisible(true);
  };

  const cambiarHora = (desplazamiento: number) => {
    establecerHoraElegida((horaActual) => (horaActual + desplazamiento + 24) % 24);
  };

  const cambiarMinuto = (desplazamiento: number) => {
    establecerMinutoElegido((minutoActual) => (minutoActual + desplazamiento + 60) % 60);
  };

  const confirmarHora = () => {
    alSeleccionar(`${completarDosDigitos(horaElegida)}:${completarDosDigitos(minutoElegido)}`);
    establecerModalVisible(false);
  };

  return (
    <>
      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
        accessibilityLabel={`${etiquetaAccesibilidad}, ${valor}`}
        accessibilityRole="button"
        disabled={deshabilitado}
        accessibilityState={{disabled:deshabilitado}}
        onPress={conRespuestaVisual(abrirSelector)}
        style={estilosMovimiento.filaInformacion}
      >
        <Ionicons color={tema.textoPrincipal} name="time-outline" size={22} />
        <Text style={estilosMovimiento.etiquetaInformacion}>Hora</Text>
        <Text style={estilosMovimiento.valorInformacion}>{valor}</Text>
      </Pressable>

      <Modal statusBarTranslucent navigationBarTranslucent
        animationType="fade"
        onRequestClose={() => establecerModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <Pressable android_ripple={RETROALIMENTACION_PULSACION}
          accessibilityLabel="Cerrar selector de hora"
          onPress={conRespuestaVisual(() => establecerModalVisible(false))}
          style={estilosMovimiento.fondoSuperpuesto}
        >
          <Pressable android_ripple={RETROALIMENTACION_PULSACION} onPress={conRespuestaVisual(() => {})} style={estilosMovimiento.tarjetaModalHora}>
            <View style={estilosMovimiento.encabezadoModal}>
              <Text style={estilosMovimiento.tituloModal}>Elegí una hora</Text>
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                accessibilityLabel="Cerrar selector de hora"
                accessibilityRole="button"
                hitSlop={8}
                onPress={conRespuestaVisual(() => establecerModalVisible(false))}
                style={estilosMovimiento.botonCerrarModal}
              >
                <Ionicons color={tema.textoPrincipal} name="close" size={22} />
              </Pressable>
            </View>
            <Text style={estilosMovimiento.ayudaSelectorHora}>Formato de 24 horas</Text>
            <View style={estilosMovimiento.selectoresHora}>
              <View style={estilosMovimiento.columnaHora}>
                <Text style={estilosMovimiento.etiquetaSelectorHora}>Hora</Text>
                <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                  accessibilityLabel="Sumar una hora"
                  accessibilityRole="button"
                  onPress={conRespuestaVisual(() => cambiarHora(1))}
                  style={estilosMovimiento.botonAjustarHora}
                >
                  <Ionicons color={tema.foco} name="chevron-up" size={24} />
                </Pressable>
                <Text style={estilosMovimiento.valorSelectorHora}>
                  {completarDosDigitos(horaElegida)}
                </Text>
                <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                  accessibilityLabel="Restar una hora"
                  accessibilityRole="button"
                  onPress={conRespuestaVisual(() => cambiarHora(-1))}
                  style={estilosMovimiento.botonAjustarHora}
                >
                  <Ionicons color={tema.foco} name="chevron-down" size={24} />
                </Pressable>
              </View>
              <Text style={estilosMovimiento.separadorHora}>:</Text>
              <View style={estilosMovimiento.columnaHora}>
                <Text style={estilosMovimiento.etiquetaSelectorHora}>Minuto</Text>
                <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                  accessibilityLabel="Sumar un minuto"
                  accessibilityRole="button"
                  onPress={conRespuestaVisual(() => cambiarMinuto(1))}
                  style={estilosMovimiento.botonAjustarHora}
                >
                  <Ionicons color={tema.foco} name="chevron-up" size={24} />
                </Pressable>
                <Text style={estilosMovimiento.valorSelectorHora}>
                  {completarDosDigitos(minutoElegido)}
                </Text>
                <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                  accessibilityLabel="Restar un minuto"
                  accessibilityRole="button"
                  onPress={conRespuestaVisual(() => cambiarMinuto(-1))}
                  style={estilosMovimiento.botonAjustarHora}
                >
                  <Ionicons color={tema.foco} name="chevron-down" size={24} />
                </Pressable>
              </View>
            </View>
            <View style={estilosMovimiento.accionesModal}>
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                accessibilityRole="button"
                onPress={conRespuestaVisual(() => establecerModalVisible(false))}
                style={estilosMovimiento.botonModalSecundario}
              >
                <Text style={estilosMovimiento.textoBotonModalSecundario}>Cerrar</Text>
              </Pressable>
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                accessibilityRole="button"
                onPress={conRespuestaVisual(confirmarHora)}
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
