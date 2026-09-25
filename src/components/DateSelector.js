import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal, Pressable, Text, View } from 'react-native';

const DIAS_SEMANA = Object.freeze(['D', 'L', 'M', 'X', 'J', 'V', 'S']);
const MESES = Object.freeze([
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]);

export default function SelectorFecha({
  tema,
  estilosMovimiento,
  valor,
  alSeleccionar,
}) {
  const [modalVisible, establecerModalVisible] = useState(false);
  const [mesVisible, establecerMesVisible] = useState(valor);
  const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1).getDay();
  const cantidadDias = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate();
  const diasCalendario = Array.from({ length: 42 }, (_, indice) => {
    const dia = indice - primerDia + 1;
    return dia > 0 && dia <= cantidadDias ? dia : null;
  });
  const textoFecha = isSameDay(valor, new Date())
    ? `Hoy, ${format(valor, 'd MMM yyyy', { locale: es })}`
    : format(valor, 'EEE d MMM yyyy', { locale: es });

  const abrirCalendario = () => {
    establecerMesVisible(new Date(valor.getFullYear(), valor.getMonth(), 1));
    establecerModalVisible(true);
  };

  const cambiarMes = (desplazamiento) => {
    establecerMesVisible((mesActual) => new Date(
      mesActual.getFullYear(),
      mesActual.getMonth() + desplazamiento,
      1,
    ));
  };

  const elegirFecha = (dia) => {
    alSeleccionar(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), dia));
    establecerModalVisible(false);
  };

  const elegirHoy = () => {
    const hoy = new Date();
    alSeleccionar(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));
    establecerMesVisible(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    establecerModalVisible(false);
  };

  return (
    <>
      <Pressable
        accessibilityLabel={`Seleccionar fecha, ${textoFecha}`}
        accessibilityRole="button"
        onPress={abrirCalendario}
        style={estilosMovimiento.filaInformacion}
      >
        <Ionicons color={tema.textoPrincipal} name="calendar-outline" size={22} />
        <Text style={estilosMovimiento.etiquetaInformacion}>Fecha</Text>
        <Text style={estilosMovimiento.valorInformacion}>{textoFecha}</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => establecerModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <Pressable
          accessibilityLabel="Cerrar calendario"
          onPress={() => establecerModalVisible(false)}
          style={estilosMovimiento.fondoSuperpuesto}
        >
          <Pressable onPress={() => {}} style={estilosMovimiento.tarjetaModalFecha}>
            <View style={estilosMovimiento.encabezadoModal}>
              <Text style={estilosMovimiento.tituloModal}>Elegí una fecha</Text>
              <Pressable
                accessibilityLabel="Cerrar calendario"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => establecerModalVisible(false)}
                style={estilosMovimiento.botonCerrarModal}
              >
                <Ionicons color={tema.textoPrincipal} name="close" size={22} />
              </Pressable>
            </View>
            <View style={estilosMovimiento.encabezadoCalendario}>
              <Pressable
                accessibilityLabel="Mes anterior"
                accessibilityRole="button"
                onPress={() => cambiarMes(-1)}
                style={estilosMovimiento.botonMes}
              >
                <Ionicons color={tema.textoPrincipal} name="chevron-back" size={20} />
              </Pressable>
              <Text style={estilosMovimiento.mesCalendario}>
                {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
              </Text>
              <Pressable
                accessibilityLabel="Mes siguiente"
                accessibilityRole="button"
                onPress={() => cambiarMes(1)}
                style={estilosMovimiento.botonMes}
              >
                <Ionicons color={tema.textoPrincipal} name="chevron-forward" size={20} />
              </Pressable>
            </View>
            <View style={estilosMovimiento.filaDiasSemana}>
              {DIAS_SEMANA.map((dia, indice) => (
                <Text key={`${dia}-${indice}`} style={estilosMovimiento.nombreDiaSemana}>
                  {dia}
                </Text>
              ))}
            </View>
            <View style={estilosMovimiento.calendario}>
              {diasCalendario.map((dia, indice) => {
                if (!dia) {
                  return <View key={`vacio-${indice}`} style={estilosMovimiento.celdaCalendario} />;
                }

                const fechaDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), dia);
                const seleccionada = isSameDay(fechaDia, valor);
                const esHoy = isSameDay(fechaDia, new Date());

                return (
                  <View key={dia} style={estilosMovimiento.celdaCalendario}>
                    <Pressable
                      accessibilityLabel={format(fechaDia, 'd MMMM yyyy', { locale: es })}
                      accessibilityRole="button"
                      accessibilityState={{ selected: seleccionada }}
                      onPress={() => elegirFecha(dia)}
                      style={[
                        estilosMovimiento.diaCalendario,
                        esHoy ? estilosMovimiento.diaCalendarioHoy : null,
                        seleccionada ? estilosMovimiento.diaCalendarioSeleccionado : null,
                      ]}
                    >
                      <Text
                        style={[
                          estilosMovimiento.textoDiaCalendario,
                          seleccionada ? estilosMovimiento.textoDiaCalendarioSeleccionado : null,
                        ]}
                      >
                        {dia}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={elegirHoy}
              style={estilosMovimiento.botonHoy}
            >
              <Text style={estilosMovimiento.textoBotonHoy}>Ir a hoy</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
