import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { crearRutaSector, formatearMonto, formatearPorcentaje, type crearDatosResumen } from '../statistics/statisticsPresentation';
import { estilosGraficoCircular } from '../styles/StatisticsChartsStyles';

export default function GraficoCircular({
  categorias,
  totalGeneral,
  tamano,
  tema,
  seleccionadaId,
  alSeleccionar,
}: {categorias:ReturnType<typeof crearDatosResumen>;totalGeneral:number;tamano:number;tema:import('../styles/colors').Tema;seleccionadaId:string|null;alSeleccionar:(id:string)=>void}) {
  let angulo = -90;
  const sectores = categorias.map((categoria) => {
    const amplitud = totalGeneral ? (categoria.monto / totalGeneral) * 360 : 0;
    const sector = {
      ...categoria,
      ruta: crearRutaSector(angulo, angulo + amplitud),
    };
    angulo += amplitud;
    return sector;
  });
  const sectoresDibujados = [
    ...sectores.filter((sector) => sector.id !== seleccionadaId),
    ...sectores.filter((sector) => sector.id === seleccionadaId),
  ];

  return (
    <View style={[estilosGraficoCircular.contenedor, { height: tamano, width: tamano }]}>
      <Svg height={tamano} width={tamano} viewBox="0 0 360 360">
        {sectores.length === 1 && Math.abs(sectores[0].monto - totalGeneral) < 0.005 ? (
          <Circle
            accessibilityLabel={`${sectores[0].nombre}, ${formatearMonto(sectores[0].monto)}, 100%`}
            {...{ accessibilityRole: 'button' as const }}
            cx={180}
            cy={180}
            fill={sectores[0].color}
            onPress={() => alSeleccionar(sectores[0].id)}
            r={140}
            stroke={seleccionadaId === sectores[0].id ? tema.foco : tema.superficie}
            strokeWidth={seleccionadaId === sectores[0].id ? 4 : 2}
          />
        ) : sectoresDibujados.map((sector) => (
          <Path
            accessibilityLabel={`${sector.nombre}, ${formatearPorcentaje((sector.monto / (totalGeneral || 1)) * 100)}`}
            {...{ accessibilityRole: 'button' as const }}
            d={sector.ruta}
            fill={sector.color}
            key={sector.id}
            onPress={() => alSeleccionar(sector.id)}
            stroke={seleccionadaId === sector.id ? tema.foco : tema.superficie}
            strokeLinejoin="round"
            strokeWidth={seleccionadaId === sector.id ? 4 : 2}
          />
        ))}
        <Circle cx={180} cy={180} fill={tema.superficie} r={70} />
      </Svg>
      <View pointerEvents="none" style={estilosGraficoCircular.centro}>
        <Text style={[estilosGraficoCircular.etiquetaCentro, { color: tema.textoSecundario }]}>Total</Text>
        <Text numberOfLines={1} style={[estilosGraficoCircular.totalCentro, { color: tema.textoPrincipal }]}>
          {formatearMonto(totalGeneral)}
        </Text>
      </View>
    </View>
  );
}
