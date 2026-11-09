import { useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatearMonto, type crearDatosColumnas } from '../statistics/statisticsPresentation';
import type { crearEstilosEstadisticas } from '../styles/StatisticsScreenStyles';
import { ESPACIADO } from '../styles/globalStyles';

export default function GraficoColumnas({
  barras,
  tema,
  estilos,
  tamano,
  graficoActivo,
  indiceSeleccionado,
  alSeleccionar,
  alIniciarSeleccion,
  alFinalizarSeleccion,
}: {barras:ReturnType<typeof crearDatosColumnas>;tema:import('../styles/colors').Tema;estilos:ReturnType<typeof crearEstilosEstadisticas>;tamano:number;graficoActivo:boolean;indiceSeleccionado:number;alSeleccionar:(indice:number)=>void;alIniciarSeleccion:()=>void;alFinalizarSeleccion:()=>void}) {
  const referenciaGrafico = useRef<View | null>(null);
  const medidasGrafico = useRef({ x: 0, ancho: 0 });
  const inicioToqueX = useRef<number>(0);
  const arrastreIniciado = useRef(false);
  const montoMaximo = Math.max(0, ...barras.map((barra) => (
    barra.segmentos.reduce((suma, segmento) => suma + segmento.monto, 0)
  )));
  const altoContenedor = Math.max(288, tamano + (ESPACIADO.pequeno * 2));
  const altoMaximoBarra = altoContenedor - ESPACIADO.grande - ESPACIADO.minimo - 20;

  const medirGrafico = useCallback(() => {
    referenciaGrafico.current?.measureInWindow((x, _y, ancho) => {
      medidasGrafico.current = { x, ancho };
    });
  }, []);

  useEffect(() => {
    if (!graficoActivo) return undefined;

    const marco = requestAnimationFrame(medirGrafico);
    return () => cancelAnimationFrame(marco);
  }, [graficoActivo, medirGrafico]);

  const seleccionarDesdeToque = (evento: import('react-native').GestureResponderEvent) => {
    const { pageX } = evento.nativeEvent;
    const { x, ancho } = medidasGrafico.current;
    if (!ancho || !barras.length) return;
    const indice = Math.min(
      barras.length - 1,
      Math.max(0, Math.floor(((pageX - x) / ancho) * barras.length)),
    );
    alSeleccionar(indice);
  };

  const actualizarSeleccionDuranteArrastre = (evento: import('react-native').GestureResponderEvent) => {
    const { pageX } = evento.nativeEvent;
    if (!arrastreIniciado.current) {
      if (Math.abs(pageX - inicioToqueX.current) < 8) return;
      arrastreIniciado.current = true;
    }

    seleccionarDesdeToque(evento);
  };

  const terminarSeleccion = () => {
    alFinalizarSeleccion();
  };

  return (
    <View
      ref={referenciaGrafico}
      onLayout={(evento) => {
        medidasGrafico.current.ancho = evento.nativeEvent.layout.width;
        medirGrafico();
      }}
      onTouchCancel={terminarSeleccion}
      onTouchEnd={terminarSeleccion}
      onTouchMove={actualizarSeleccionDuranteArrastre}
      onTouchStart={(evento) => {
        alIniciarSeleccion();
        medirGrafico();
        inicioToqueX.current = evento.nativeEvent.pageX;
        arrastreIniciado.current = false;
      }}
      style={[estilos.contenedorColumnas, { height: altoContenedor }]}
    >
      {barras.map((barra, indice) => {
        const total = barra.segmentos.reduce((suma, segmento) => suma + segmento.monto, 0);
        const altura = montoMaximo ? Math.max(2, (total / montoMaximo) * altoMaximoBarra) : 2;

        return (
          <Pressable
            accessibilityLabel={`${barra.etiqueta}, ${formatearMonto(total)}`}
            accessibilityRole="button"
            accessibilityState={{ selected: indice === indiceSeleccionado }}
            key={barra.id}
            onPress={() => {
              if (arrastreIniciado.current) {
                arrastreIniciado.current = false;
                return;
              }
              alSeleccionar(indice);
            }}
            style={estilos.columna}
          >
            <View
              style={[
                estilos.barra,
                {
                  height: altura,
                  borderColor: indice === indiceSeleccionado ? tema.foco : 'transparent',
                },
              ]}
            >
              {barra.segmentos.filter((segmento) => segmento.monto > 0).map((segmento) => (
                <View
                  key={`${barra.id}-${segmento.id}`}
                  style={[estilos.segmentoBarra, { backgroundColor: segmento.color, flex: segmento.monto || 0.01 }]}
                />
              ))}
            </View>
            <Text numberOfLines={1} style={estilos.etiquetaColumna}>{barra.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
