import { Fragment } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatearMonto, formatearPorcentaje, type obtenerDetalleColumna } from '../statistics/statisticsPresentation';
import { obtenerColorIconoCategoria, obtenerFamiliaCategoria } from '../styles/categoryColors';
import type { crearEstilosEstadisticas } from '../styles/StatisticsScreenStyles';
import type { Tema } from '../styles/colors';

export default function ResumenColumna({ barra, segmentos, total, tipo, tema, estilos }: {
  barra: ReturnType<typeof obtenerDetalleColumna>['barraSeleccionada'];
  segmentos: ReturnType<typeof obtenerDetalleColumna>['filasDetalleColumna'];
  total: number; tipo: string; tema: Tema; estilos: ReturnType<typeof crearEstilosEstadisticas>;
}) {
  return <>
    <View style={estilos.resumenColumna}>
      <Text style={estilos.periodoDetalleColumna}>{barra.tituloDetalle}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={estilos.totalColumna}>{formatearMonto(total)}</Text>
      <Text style={estilos.textoDetalleSeleccion}>Total de {tipo === 'egreso' ? 'egresos' : 'ingresos'} visibles</Text>
    </View>
    {segmentos.length ? <View style={estilos.listaDetalleColumna}>
      {segmentos.map((segmento, indice) => {
        const familia = obtenerFamiliaCategoria(segmento.id, tipo);
        const iniciaFamilia = indice === 0 || obtenerFamiliaCategoria(segmentos[indice - 1].id, tipo).id !== familia.id;
        return <Fragment key={segmento.id}>
          {iniciaFamilia ? <Text accessibilityRole="header" style={estilos.tituloFamilia}>{familia.nombre}</Text> : null}
          <View style={[estilos.filaCategoria, estilos.filaDetalleColumna]}>
            <View style={[estilos.muestraColor, { backgroundColor: segmento.color }]} />
            <Ionicons color={obtenerColorIconoCategoria(segmento.id, tema, tipo)} name={segmento.icono} size={20} />
            <View style={estilos.nombreCategoriaContenedor}>
              <Text numberOfLines={2} style={estilos.nombreCategoria}>{segmento.nombre}</Text>
            </View>
            <View style={estilos.importesDetalleColumna}>
              <Text style={estilos.montoCategoria}>{formatearMonto(segmento.monto)}</Text>
              <Text style={estilos.porcentajeCategoria}>{formatearPorcentaje(segmento.monto / total * 100)}</Text>
            </View>
          </View>
        </Fragment>;
      })}
    </View> : <Text style={estilos.textoDetalleSeleccion}>
      {barra.totalGeneral > 0 ? 'El período tiene movimientos en categorías ocultas.' : 'Este día o mes no tuvo movimientos.'}
    </Text>}
  </>;
}
