import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MESES } from '../constants/statistics';
import { normalizarFecha, formatearFecha } from '../statistics/statisticsPresentation';
import type { crearEstilosEstadisticas } from '../styles/StatisticsScreenStyles';

export function SelectorDesplegable({
  visible,
  titulo,
  opciones,
  valorSeleccionado,
  tema,
  estilos,
  alSeleccionar,
  altoMaximo = 224,
}: {altoMaximo?:number;visible:boolean;titulo:string;opciones:readonly {id:string|number;nombre:string}[];valorSeleccionado:string|number|null;tema:import('../styles/colors').Tema;estilos:ReturnType<typeof crearEstilosEstadisticas>;alCerrar:()=>void;alSeleccionar:(id:string|number)=>void}) {
  if (!visible) return null;
  return (
          <ScrollView style={[estilos.listaDesplegableFecha, { maxHeight:Math.min(184, altoMaximo) }]} nestedScrollEnabled keyboardShouldPersistTaps="handled" contentContainerStyle={estilos.contenidoOpcionesFecha} showsVerticalScrollIndicator>
            {opciones.map((opcion) => {
              const seleccionada = opcion.id === valorSeleccionado;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={titulo + ': ' + opcion.nombre}
                  accessibilityState={{ selected: seleccionada }}
                  key={opcion.id}
                  onPress={() => alSeleccionar(opcion.id)}
                  style={[
                    estilos.opcionFechaCompacta,
                    seleccionada && { backgroundColor: tema.nombre === 'oscuro' ? '#1B443C' : '#EDF5E8' },
                  ]}
                >
                  <Text numberOfLines={1} adjustsFontSizeToFit style={estilos.textoOpcionFechaCompacta}>
                    {opcion.nombre}
                  </Text>
                  <Ionicons
                    color={seleccionada ? tema.foco : tema.borde}
                    name="checkmark"
                    size={16}
                    style={{ opacity: seleccionada ? 1 : 0 }}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
  );
}

export function CalendarioDesplegable({ visible, fecha, tema, estilos, alCerrar, alSeleccionar }: {visible:boolean;fecha:Date;tema:import('../styles/colors').Tema;estilos:ReturnType<typeof crearEstilosEstadisticas>;alCerrar:()=>void;alSeleccionar:(fecha:Date)=>void}) {
  const [mesVisible, establecerMesVisible] = useState(
    () => new Date(fecha.getFullYear(), fecha.getMonth(), 1),
  );
  const primerDia = (new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1).getDay() + 6) % 7;
  const cantidadDias = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate();
  const diasCalendario = Array.from({ length: Math.ceil((primerDia + cantidadDias) / 7) * 7 }, (_, indice) => {
    const dia = indice - primerDia + 1;
    return dia > 0 && dia <= cantidadDias ? dia : null;
  });

  useEffect(() => {
    if (visible) establecerMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
  }, [fecha, visible]);

  const cambiarMes = (desplazamiento: number) => {
    establecerMesVisible((mesActual) => new Date(
      mesActual.getFullYear(),
      mesActual.getMonth() + desplazamiento,
      1,
    ));
  };

  if (!visible) return null;
  return (
        <View style={estilos.contenidoCalendarioFecha}>
          <View style={estilos.encabezadoModal}>
            <Text style={[estilos.tituloModal, { color: tema.textoPrincipal }]}>Elegí una fecha</Text>
            <Pressable accessibilityLabel="Cerrar calendario" accessibilityRole="button" onPress={alCerrar} style={estilos.botonCerrarModal}>
              <Ionicons color={tema.textoPrincipal} name="close" size={22} />
            </Pressable>
          </View>
          <View style={estilos.encabezadoCalendario}>
            <Pressable accessibilityLabel="Mes anterior" accessibilityRole="button" onPress={() => cambiarMes(-1)} style={estilos.botonMesCalendario}>
              <Ionicons color={tema.textoPrincipal} name="chevron-back" size={20} />
            </Pressable>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.mesCalendario, estilos.nombreMesCompacto, { color: tema.textoPrincipal }]}>
              {MESES[mesVisible.getMonth()].nombre} {mesVisible.getFullYear()}
            </Text>
            <Pressable accessibilityLabel="Mes siguiente" accessibilityRole="button" onPress={() => cambiarMes(1)} style={estilos.botonMesCalendario}>
              <Ionicons color={tema.textoPrincipal} name="chevron-forward" size={20} />
            </Pressable>
          </View>
          <View style={estilos.cuadriculaCalendario}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dia, indice) => (
              <Text key={`${dia}-${indice}`} style={[estilos.nombreDiaCalendario, { color: tema.textoSecundario }]}>
                {dia}
              </Text>
            ))}
            {diasCalendario.map((dia, indice) => {
              if (!dia) return <View key={`vacio-${indice}`} style={estilos.celdaCalendario} />;

              const fechaDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), dia);
              const seleccionada = fechaDia.getTime() === normalizarFecha(fecha).getTime();
              const esHoy = fechaDia.getTime() === normalizarFecha(new Date()).getTime();
              return (
                <View key={dia} style={estilos.celdaCalendario}>
                  <Pressable
                    accessibilityLabel={formatearFecha(fechaDia, { day: 'numeric', month: 'long', year: 'numeric' })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seleccionada }}
                    onPress={() => alSeleccionar(fechaDia)}
                    style={[
                      estilos.diaCalendario,
                      esHoy && estilos.diaCalendarioHoy,
                      seleccionada && estilos.diaCalendarioSeleccionado,
                    ]}
                  >
                    <Text style={[
                      estilos.textoDiaCalendario,
                      { color: tema.textoPrincipal },
                      seleccionada && { color: tema.nombre === 'oscuro' ? tema.encabezado : tema.encabezadoTexto },
                      seleccionada && estilos.textoDiaCalendarioSeleccionado,
                    ]}>
                      {dia}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => alSeleccionar(normalizarFecha(new Date()))}
            style={estilos.botonHoyCalendario}
          >
            <Text style={[estilos.textoBotonHoyCalendario, { color: tema.foco }]}>Ir a hoy</Text>
          </Pressable>
        </View>
  );
}
