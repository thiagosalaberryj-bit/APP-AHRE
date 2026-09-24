import { Fragment, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Text as TextoSvg } from 'react-native-svg';

import EncabezadoPrincipal from '../components/MainHeader';
import { RUTAS } from '../constants/routes';
import { COLORES_GRAFICOS, TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosEstadisticas } from '../styles/StatisticsScreenStyles';

const CATEGORIAS_MENSUALES = Object.freeze([
  { id: 'comida', nombre: 'Comida', icono: 'restaurant-outline', porcentaje: 25, monto: '$ 416.667', color: COLORES_GRAFICOS[0], etiquetaX: 278, etiquetaY: 82 },
  { id: 'transporte', nombre: 'Transporte', icono: 'car-outline', porcentaje: 30, monto: '$ 500.000', color: COLORES_GRAFICOS[4], etiquetaX: 228, etiquetaY: 296 },
  { id: 'servicios', nombre: 'Servicios', icono: 'flash-outline', porcentaje: 20, monto: '$ 333.333', color: COLORES_GRAFICOS[3], etiquetaX: 70, etiquetaY: 271 },
  { id: 'salud', nombre: 'Salud', icono: 'medkit-outline', porcentaje: 10, monto: '$ 166.667', color: COLORES_GRAFICOS[2], etiquetaX: 42, etiquetaY: 136 },
  { id: 'entretenimiento', nombre: 'Entretenimiento', icono: 'game-controller-outline', porcentaje: 15, monto: '$ 250.000', color: COLORES_GRAFICOS[1], etiquetaX: 118, etiquetaY: 54 },
]);

const COLORES_CATEGORIAS = Object.freeze({
  comida: COLORES_GRAFICOS[0],
  entretenimiento: COLORES_GRAFICOS[1],
  salud: COLORES_GRAFICOS[2],
  servicios: COLORES_GRAFICOS[3],
  transporte: COLORES_GRAFICOS[4],
});

const RESUMENES_CATEGORIAS = Object.freeze([
  { id: 'categoria-comida', categoriaId: 'comida', nombre: 'Comida', subtitulo: 'Categoría · 2026', monto: '−$ 416.667' },
  { id: 'categoria-transporte', categoriaId: 'transporte', nombre: 'Transporte', subtitulo: 'Categoría · 2026', monto: '−$ 500.000' },
  { id: 'categoria-servicios', categoriaId: 'servicios', nombre: 'Servicios', subtitulo: 'Categoría · 2026', monto: '−$ 333.333' },
  { id: 'categoria-salud', categoriaId: 'salud', nombre: 'Salud', subtitulo: 'Categoría · 2026', monto: '−$ 166.667' },
  { id: 'categoria-entretenimiento', categoriaId: 'entretenimiento', nombre: 'Entretenimiento', subtitulo: 'Categoría · 2026', monto: '−$ 250.000' },
]);

const BARRAS_ANUALES = Object.freeze([
  {
    mes: 'Ene',
    segmentos: [
      { categoriaId: 'comida', altura: 58 },
      { categoriaId: 'entretenimiento', altura: 48 },
    ],
  },
  {
    mes: 'Feb',
    segmentos: [
      { categoriaId: 'salud', altura: 24 },
      { categoriaId: 'entretenimiento', altura: 28 },
    ],
  },
  {
    mes: 'Mar',
    segmentos: [
      { categoriaId: 'comida', altura: 78 },
      { categoriaId: 'salud', altura: 46 },
      { categoriaId: 'transporte', altura: 36 },
    ],
  },
  {
    mes: 'Abr',
    segmentos: [
      { categoriaId: 'servicios', altura: 96 },
      { categoriaId: 'comida', altura: 70 },
      { categoriaId: 'entretenimiento', altura: 46 },
    ],
  },
  {
    mes: 'May',
    segmentos: [
      { categoriaId: 'transporte', altura: 28 },
      { categoriaId: 'salud', altura: 24 },
    ],
  },
  {
    mes: 'Jun',
    segmentos: [
      { categoriaId: 'comida', altura: 40 },
      { categoriaId: 'servicios', altura: 36 },
      { categoriaId: 'entretenimiento', altura: 30 },
    ],
  },
  {
    mes: 'Jul',
    segmentos: [
      { categoriaId: 'transporte', altura: 24 },
      { categoriaId: 'comida', altura: 28 },
    ],
  },
  {
    mes: 'Ago',
    segmentos: [
      { categoriaId: 'salud', altura: 20 },
      { categoriaId: 'transporte', altura: 22 },
    ],
  },
  {
    mes: 'Sep',
    segmentos: [
      { categoriaId: 'comida', altura: 54 },
      { categoriaId: 'servicios', altura: 48 },
      { categoriaId: 'entretenimiento', altura: 36 },
    ],
  },
  {
    mes: 'Oct',
    segmentos: [
      { categoriaId: 'transporte', altura: 16 },
      { categoriaId: 'salud', altura: 14 },
    ],
  },
  {
    mes: 'Nov',
    segmentos: [
      { categoriaId: 'entretenimiento', altura: 22 },
      { categoriaId: 'salud', altura: 20 },
    ],
  },
  {
    mes: 'Dic',
    segmentos: [
      { categoriaId: 'transporte', altura: 32 },
      { categoriaId: 'comida', altura: 30 },
    ],
  },
]);
const ANIOS_DISPONIBLES = Object.freeze([2024, 2023, 2022, 2021]);

function crearRutaSector(inicio, fin) {
  const centro = 180;
  const radio = 135;
  const punto = (angulo) => ({
    x: centro + radio * Math.cos((angulo * Math.PI) / 180),
    y: centro + radio * Math.sin((angulo * Math.PI) / 180),
  });
  const primero = punto(inicio);
  const segundo = punto(fin);
  const arcoGrande = fin - inicio > 180 ? 1 : 0;
  return `M ${centro} ${centro} L ${primero.x} ${primero.y} A ${radio} ${radio} 0 ${arcoGrande} 1 ${segundo.x} ${segundo.y} Z`;
}

function GraficoCircular({ alSeleccionarCategoria, tamano, tema }) {
  let angulo = -90;
  const sectores = CATEGORIAS_MENSUALES.map((categoria) => {
    const amplitud = categoria.porcentaje * 3.6;
    const sector = {
      ...categoria,
      ruta: crearRutaSector(angulo, angulo + amplitud),
    };
    angulo += amplitud;
    return sector;
  });

  return (
    <Svg height={tamano} width={tamano} viewBox="0 0 360 360">
      <Circle
        cx={180}
        cy={180}
        fill={tema.fondo}
        onPress={() => alSeleccionarCategoria(null)}
        r={180}
      />
      {sectores.map((sector) => (
        <Path
          accessibilityLabel={`${sector.nombre}, ${sector.porcentaje}%`}
          accessibilityRole="button"
          d={sector.ruta}
          fill={sector.color}
          key={sector.id}
          onPress={() => alSeleccionarCategoria(sector)}
        />
      ))}
      {sectores.map((sector) => (
        <Fragment key={`${sector.id}-porcentaje`}>
          <Circle
            accessibilityLabel={`${sector.nombre}, ${sector.porcentaje}%`}
            accessibilityRole="button"
            cx={sector.etiquetaX}
            cy={sector.etiquetaY}
            fill="#000000"
            onPress={() => alSeleccionarCategoria(sector)}
            r={24}
          />
          <TextoSvg
            accessibilityLabel={`${sector.nombre}, ${sector.porcentaje}%`}
            fill={tema.encabezadoTexto}
            fontSize="14"
            onPress={() => alSeleccionarCategoria(sector)}
            textAnchor="middle"
            x={sector.etiquetaX}
            y={sector.etiquetaY + 5}
          >
            {`${sector.porcentaje}%`}
          </TextoSvg>
        </Fragment>
      ))}
    </Svg>
  );
}

function GraficoBarrasAnual({ ancho, estilos, tema }) {
  return (
    <>
      <View style={[estilos.contenedorBarras, { left: 16, right: 16 }]}>
        {BARRAS_ANUALES.map((mes) => {
          const alturaTotal = mes.segmentos.reduce((total, segmento) => total + segmento.altura, 0);
          return (
            <View key={mes.mes} style={estilos.columnaBarra}>
              <View
                style={[
                  estilos.barraAnual,
                  {
                    height: alturaTotal,
                    width: Math.max(14, (ancho - 40) / 12 - 4),
                  },
                ]}
              >
                {mes.segmentos.map((segmento) => (
                  <View
                    key={`${mes.mes}-${segmento.categoriaId}`}
                    style={[
                      estilos.segmentoBarra,
                      {
                        backgroundColor: COLORES_CATEGORIAS[segmento.categoriaId],
                        height: segmento.altura,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>
      <View style={[estilos.etiquetasMeses, { left: 16, right: 16 }]}>
        {BARRAS_ANUALES.map((mes) => (
          <Text key={mes.mes} style={[estilos.etiquetaMes, { color: tema.textoPrincipal }]}>
            {mes.mes}
          </Text>
        ))}
      </View>
    </>
  );
}

export default function PantallaEstadisticas({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const anchoPantalla = useWindowDimensions().width;
  const tamanoGrafico = Math.min(360, anchoPantalla);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosEstadisticas(tema);
  const referenciaGraficos = useRef(null);
  const [categoriaSeleccionada, establecerCategoriaSeleccionada] = useState(null);
  const [indiceGrafico, establecerIndiceGrafico] = useState(0);
  const [anioSeleccionado, establecerAnioSeleccionado] = useState(2025);
  const [menuAnioAbierto, establecerMenuAnioAbierto] = useState(false);
  const abrirPantallaPrincipal = (ruta) => {
    const navegadorSuperior = navegacion.getParent();
    const navegadorRaiz = navegadorSuperior?.getParent() || navegadorSuperior;
    navegadorRaiz?.navigate(ruta);
  };

  const cambiarGrafico = (indice) => {
    referenciaGraficos.current?.scrollTo({ x: indice * anchoPantalla, y: 0, animated: true });
    establecerIndiceGrafico(indice);
    if (indice !== 0) establecerCategoriaSeleccionada(null);
    if (indice === 0) establecerMenuAnioAbierto(false);
  };

  const accesorioAnio = indiceGrafico === 1 ? (
    <Pressable
      accessibilityLabel={`Año seleccionado ${anioSeleccionado}`}
      accessibilityRole="button"
      accessibilityState={{ expanded: menuAnioAbierto }}
      onPress={() => establecerMenuAnioAbierto((abierto) => !abierto)}
      style={estilos.botonAnio}
    >
      <Text style={estilos.textoAnio}>{anioSeleccionado}</Text>
      <Ionicons color={tema.encabezadoTexto} name="arrow-down" size={20} />
    </Pressable>
  ) : null;

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoPrincipal
          accesorioDerecho={accesorioAnio}
          alAbrirNotificaciones={() => abrirPantallaPrincipal(RUTAS.NOTIFICACIONES)}
          alAbrirPerfil={() => abrirPantallaPrincipal(RUTAS.PERFIL)}
          altura={136}
          tema={tema}
          titulo="Estadísticas"
        />

        <ScrollView
          contentContainerStyle={estilos.contenidoDesplazable}
          showsVerticalScrollIndicator
          style={estilos.desplazamiento}
        >
          <View style={[estilos.contenedorGrafico, { height: tamanoGrafico }]}>
            {indiceGrafico === 0 && categoriaSeleccionada ? (
              <Pressable
                accessibilityLabel={`Ver detalle de ${categoriaSeleccionada.nombre}: ${categoriaSeleccionada.monto}`}
                accessibilityRole="button"
                onPress={() => navegacion.navigate(RUTAS.DETALLE_CATEGORIA, { categoria: categoriaSeleccionada })}
                style={[estilos.importeSeleccionado, { backgroundColor: categoriaSeleccionada.color }]}
              >
                <Text style={estilos.textoImporteSeleccionado}>{categoriaSeleccionada.monto}</Text>
              </Pressable>
            ) : null}
            <ScrollView
              decelerationRate="fast"
              horizontal
              nestedScrollEnabled
              onMomentumScrollEnd={({ nativeEvent }) => {
                const indice = Math.round(nativeEvent.contentOffset.x / anchoPantalla);
                establecerIndiceGrafico(indice);
                if (indice !== 0) establecerCategoriaSeleccionada(null);
              }}
              pagingEnabled
              ref={referenciaGraficos}
              showsHorizontalScrollIndicator={false}
              style={estilos.deslizadorGraficos}
            >
              <View style={[estilos.paginaGrafico, { height: tamanoGrafico, width: anchoPantalla }]}>
                <Pressable
                  accessible={false}
                  onPress={() => establecerCategoriaSeleccionada(null)}
                  style={estilos.fondoGraficoTocable}
                />
                <GraficoCircular
                  alSeleccionarCategoria={establecerCategoriaSeleccionada}
                  tamano={tamanoGrafico}
                  tema={tema}
                />
              </View>
              <View style={[estilos.paginaGrafico, { height: tamanoGrafico, width: anchoPantalla }]}>
                <GraficoBarrasAnual ancho={anchoPantalla} estilos={estilos} tema={tema} />
              </View>
            </ScrollView>
            <View
              style={[
                estilos.indicadoresGrafico,
                indiceGrafico === 1 && estilos.indicadoresGraficoAnual,
              ]}
            >
              {[0, 1].map((indice) => (
                <Pressable
                  accessibilityLabel={indice === 0 ? 'Ver gráfico mensual' : 'Ver gráfico anual'}
                  accessibilityRole="button"
                  accessibilityState={{ selected: indiceGrafico === indice }}
                  key={`indicador-${indice}`}
                  onPress={() => cambiarGrafico(indice)}
                  style={estilos.zonaIndicador}
                >
                  <View
                    style={[
                      estilos.puntoIndicador,
                      indiceGrafico === indice && estilos.puntoIndicadorActivo,
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View
            onTouchStart={() => establecerCategoriaSeleccionada(null)}
            style={estilos.listaMovimientos}
          >
            {RESUMENES_CATEGORIAS.map((resumen) => {
              const categoria = CATEGORIAS_MENSUALES.find((item) => item.id === resumen.categoriaId);

              return (
                <Pressable
                  accessibilityLabel={`Ver detalle de ${resumen.nombre}`}
                  accessibilityRole="button"
                  key={resumen.id}
                  onPress={() => navegacion.navigate(RUTAS.DETALLE_CATEGORIA, { categoria })}
                  style={estilos.filaMovimiento}
                >
                  <View
                    style={[
                      estilos.iconoMovimiento,
                      { backgroundColor: COLORES_CATEGORIAS[resumen.categoriaId] },
                    ]}
                  >
                    <Ionicons color={tema.encabezado} name={categoria.icono} size={20} />
                  </View>
                  <View style={estilos.detalleMovimiento}>
                    <Text numberOfLines={1} style={estilos.nombreMovimiento}>{resumen.nombre}</Text>
                    <Text numberOfLines={1} style={estilos.subtituloMovimiento}>
                      {resumen.subtitulo}
                    </Text>
                  </View>
                  <Text style={estilos.montoMovimiento}>{resumen.monto}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        {menuAnioAbierto ? (
          <>
            <Pressable
              accessibilityLabel="Cerrar selector de año"
              onPress={() => establecerMenuAnioAbierto(false)}
              style={estilos.fondoMenuAnio}
            />
            <View style={estilos.menuAnio}>
              {ANIOS_DISPONIBLES.map((anio) => (
                <Pressable
                  accessibilityRole="button"
                  key={anio}
                  onPress={() => {
                    establecerAnioSeleccionado(anio);
                    establecerMenuAnioAbierto(false);
                  }}
                  style={estilos.opcionAnio}
                >
                  <Text style={estilos.textoOpcionAnio}>{anio}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
