import SelectorSegmentado from '../components/SegmentedSelector';
import FilaFiltrosHorizontal from '../components/HorizontalFilterRow';
import BuscadorFiltrosMovimientos from '../components/MovementSearchFilters';
import PanelFiltrosMovimientos, { SeccionFiltro } from '../components/MovementFiltersPanel';
import SelectorCategoria from '../components/CategorySelector';
import SelectorDeposito from '../components/DepositSelector';
import EntradaMonto from '../components/MoneyInput';
import { crearEstilosMovimientos } from '../styles/MovementsScreenStyles';
import { cargarOpcionesHistorialMovimientos } from '../movements/movementService';
import { convertirSaldoInicial } from '../utils/depositValidation';
import { formatearEntradaMonto } from '../utils/moneyInput';
import { PREAJUSTES_CATEGORIAS, PREAJUSTES_MONTOS, coincidenCategorias, alternarGrupoCategorias, agruparCategoriasSeleccionadas } from '../utils/statisticsFilters';
import type { Tema } from '../styles/colors';
import { Fragment, useContext, useCallback, useEffect, useMemo, useRef, useState, SetStateAction } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import EncabezadoPrincipal from '../components/MainHeader';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
} from '../constants/movimientos';
import { RUTAS } from '../constants/routes';
import { obtenerColorIconoCategoria, ordenarCategoriasPorColor, obtenerColorCategoria, obtenerFamiliaCategoria } from '../styles/categoryColors';
import { crearEstilosGlobales, ESPACIADO, TIPOGRAFIA, MARGEN_LATERAL_PANTALLA } from '../styles/globalStyles';
import { crearEstilosEstadisticas } from '../styles/StatisticsScreenStyles';
import { cargarEstadisticas } from '../statistics/statisticsService';

const PERIODOS_RESUMEN = Object.freeze([
  { id: 'dia', nombre: 'Día' },
  { id: 'semana', nombre: 'Semana' },
  { id: 'mes', nombre: 'Mes' },
  { id: 'anio', nombre: 'Año' },
]);

const MODOS_COLUMNAS = Object.freeze([
  { id: 'semana', nombre: 'Semana' },
  { id: 'anio', nombre: 'Año' },
]);

const DIAS_SEMANA = Object.freeze(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']);
const MESES = Object.freeze([
  { id: 0, corto: 'Ene', nombre: 'Enero' },
  { id: 1, corto: 'Feb', nombre: 'Febrero' },
  { id: 2, corto: 'Mar', nombre: 'Marzo' },
  { id: 3, corto: 'Abr', nombre: 'Abril' },
  { id: 4, corto: 'May', nombre: 'Mayo' },
  { id: 5, corto: 'Jun', nombre: 'Junio' },
  { id: 6, corto: 'Jul', nombre: 'Julio' },
  { id: 7, corto: 'Ago', nombre: 'Agosto' },
  { id: 8, corto: 'Sep', nombre: 'Septiembre' },
  { id: 9, corto: 'Oct', nombre: 'Octubre' },
  { id: 10, corto: 'Nov', nombre: 'Noviembre' },
  { id: 11, corto: 'Dic', nombre: 'Diciembre' },
]);
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS_DISPONIBLES = Object.freeze(Array.from({ length: 6 }, (_, indice) => ANIO_ACTUAL - indice));

function normalizarFecha(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function obtenerInicioSemana(fecha: Date) {
  const inicio = normalizarFecha(fecha);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  return inicio;
}

function formatearFecha(fecha: Date, opciones?: Intl.DateTimeFormatOptions) {
  return fecha.toLocaleDateString('es-AR', opciones);
}

function formatearRangoSemana(fecha: Date) {
  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  const mesInicio = MESES[inicio.getMonth()].nombre.toLowerCase();
  const mesFin = MESES[fin.getMonth()].nombre.toLowerCase();
  const anioInicio = inicio.getFullYear();
  const anioFin = fin.getFullYear();

  if (inicio.getMonth() === fin.getMonth() && anioInicio === anioFin) {
    return `${inicio.getDate()}–${fin.getDate()} de ${mesFin} ${anioFin}`;
  }

  if (anioInicio === anioFin) {
    return `${inicio.getDate()} de ${mesInicio}–${fin.getDate()} de ${mesFin} ${anioFin}`;
  }

  return `${inicio.getDate()} de ${mesInicio} ${anioInicio}–${fin.getDate()} de ${mesFin} ${anioFin}`;
}

function formatearDiaSeleccionado(fecha: Date) {
  const hoy = normalizarFecha(new Date());
  const seleccion = normalizarFecha(fecha);
  const fechaVisible = formatearFecha(fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return hoy.getTime() === seleccion.getTime()
    ? `Hoy · ${fechaVisible}`
    : fechaVisible;
}

function formatearDiaSelector(fecha: Date) {
  const hoy = normalizarFecha(new Date());
  const seleccion = normalizarFecha(fecha);

  return hoy.getTime() === seleccion.getTime()
    ? `Hoy · ${fecha.getFullYear()}`
    : `${fecha.getDate()} ${MESES[fecha.getMonth()].corto.toLowerCase()} ${fecha.getFullYear()}`;
}

function formatearSemanaSelector(fecha: Date) {
  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);

  if (inicio.getMonth() === fin.getMonth()) {
    return `${inicio.getDate()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
  }

  if (inicio.getFullYear() === fin.getFullYear()) {
    return `${inicio.getDate()} ${MESES[inicio.getMonth()].corto.toLowerCase()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
  }

  return `${inicio.getDate()} ${MESES[inicio.getMonth()].corto.toLowerCase()} ${inicio.getFullYear()}–${fin.getDate()} ${MESES[fin.getMonth()].corto.toLowerCase()} ${fin.getFullYear()}`;
}

function obtenerCategorias(tipoMovimiento: string, tema: Tema) {
  const catalogo = tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;

  return ordenarCategoriasPorColor(catalogo, tema, tipoMovimiento).map((categoria, indice) => ({
    ...categoria,
    indiceCategoria: indice,
    color: obtenerColorCategoria(categoria.id, tema, tipoMovimiento),
  }));
}

function formatearMonto(monto: number) {
  return `$ ${new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 2,
  }).format(Number(monto) || 0)}`;
}

function formatearPorcentaje(porcentaje: number) {
  const valor = Math.round((Number(porcentaje) + Number.EPSILON) * 10) / 10;
  return `${valor.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`;
}

function crearRutaSector(inicio: number, fin: number, radio = 140) {
  const centro = 180;
  const punto = (angulo: number) => ({
    x: centro + radio * Math.cos((angulo * Math.PI) / 180),
    y: centro + radio * Math.sin((angulo * Math.PI) / 180),
  });
  const primero = punto(inicio);
  const segundo = punto(fin);
  const arcoGrande = fin - inicio > 180 ? 1 : 0;

  return `M ${centro} ${centro} L ${primero.x} ${primero.y} A ${radio} ${radio} 0 ${arcoGrande} 1 ${segundo.x} ${segundo.y} Z`;
}

function obtenerRangoPeriodo(periodo: string, fechaDia: Date, fechaSemana: Date, mes: number, anio: number) {
  if (periodo === 'dia') {
    const inicio = normalizarFecha(fechaDia);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);
    return { inicio, fin };
  }
  if (periodo === 'semana') {
    const inicio = obtenerInicioSemana(fechaSemana);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);
    return { inicio, fin };
  }
  if (periodo === 'mes') {
    return { inicio: new Date(anio, mes, 1), fin: new Date(anio, mes + 1, 1) };
  }
  return { inicio: new Date(anio, 0, 1), fin: new Date(anio + 1, 0, 1) };
}

function crearDatosResumen(categorias: (import('../constants/movimientos').Categoria & {color:string})[], filas: { categoria: string; total: number; cantidad: number }[], totalGeneral: number) {
  const agregados = new Map(filas.map((fila) => [fila.categoria, fila]));
  return categorias.flatMap((categoria) => {
    const fila = agregados.get(categoria.id);
    if (!fila) return [];
    return [{
      ...categoria,
      monto: Number(fila.total) || 0,
      cantidad: Number(fila.cantidad) || 0,
      participacion: totalGeneral > 0 ? (Number(fila.total) / totalGeneral) * 100 : 0,
    }];
  });
}

function formatearClaveDia(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function crearDatosColumnas(categorias: (import('../constants/movimientos').Categoria & {color:string})[], modo: string, filas: {periodo:string;categoria:string;total:number}[], fechaSemana: Date, anio: number) {
  const periodos = modo === 'semana'
    ? DIAS_SEMANA.map((etiqueta, indice) => {
      const inicio = obtenerInicioSemana(fechaSemana);
      inicio.setDate(inicio.getDate() + indice);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 1);
      return { id: `dia-${indice}`, etiqueta, inicio, fin };
    })
    : MESES.map((mes) => ({
      id: `mes-${mes.id}`,
      etiqueta: mes.corto,
      inicio: new Date(anio, mes.id, 1),
      fin: new Date(anio, mes.id + 1, 1),
    }));

  const agrupados = new Map(filas.map((fila) => [
    `${fila.periodo}:${fila.categoria}`,
    Number(fila.total) || 0,
  ]));
  const totalesGenerales = new Map<string, number>();
  filas.forEach((fila) => {
    if (!categorias.some(categoria => categoria.id === fila.categoria)) return;
    totalesGenerales.set(
      fila.periodo,
      (totalesGenerales.get(fila.periodo) || 0) + (Number(fila.total) || 0),
    );
  });

  return periodos.map((periodo) => {
    const clavePeriodo = modo === 'semana'
      ? formatearClaveDia(periodo.inicio)
      : `${periodo.inicio.getFullYear()}-${String(periodo.inicio.getMonth() + 1).padStart(2, '0')}`;
    return {
      id: periodo.id,
      etiqueta: periodo.etiqueta,
      totalGeneral: totalesGenerales.get(clavePeriodo) || 0,
      segmentos: categorias.map((categoria) => ({
        ...categoria,
        monto: agrupados.get(`${clavePeriodo}:${categoria.id}`) || 0,
      })),
    };
  });
}

function SelectorDesplegable({
  visible,
  titulo,
  opciones,
  valorSeleccionado,
  tema,
  estilos,
  alCerrar,
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

function CalendarioDesplegable({ visible, fecha, tema, estilos, alCerrar, alSeleccionar }: {visible:boolean;fecha:Date;tema:import('../styles/colors').Tema;estilos:ReturnType<typeof crearEstilosEstadisticas>;alCerrar:()=>void;alSeleccionar:(fecha:Date)=>void}) {
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

function GraficoCircular({
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

const estilosGraficoCircular: Record<string, import('react-native').ViewStyle & import('react-native').TextStyle> = {
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centro: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  etiquetaCentro: {
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.auxiliar,
  },
  totalCentro: {
    fontFamily: TIPOGRAFIA.familias.principal,
    fontSize: TIPOGRAFIA.tamanos.secundario,
    fontWeight: TIPOGRAFIA.pesos.negrita,
    maxWidth: 128,
  },
};

function GraficoColumnas({
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
    referenciaGrafico.current?.measureInWindow((x, y, ancho) => {
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

export default function PantallaEstadisticas({ navigation: navegacion }: import('../navigation/types').PropiedadesPestana) {
  const raizSelectores = useRef<View>(null);
  const controlesSelectores = useRef<Record<string, View | null>>({});
  const [anclaSelector, establecerAnclaSelector] = useState<{left:number;top:number;width:number;altoMaximo:number} | null>(null);
  const { tema } = useContext(ContextoApariencia);
  const anchoPantalla = useWindowDimensions().width;
  const tamanoGrafico = Math.min(320, Math.max(248, anchoPantalla - 64));
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosEstadisticas(tema);
  const [anchoSlider, establecerAnchoSlider] = useState(0);
  const [indiceGrafico, establecerIndiceGrafico] = useState(0);
  const [barraEnInteraccion, establecerBarraEnInteraccion] = useState(false);
  const [tipoMovimiento, establecerTipoMovimiento] = useState('egreso');
  const [preajusteMontoId, establecerPreajusteMontoId] = useState('todos');
  const [montoMinimo, establecerMontoMinimo] = useState('');
  const [montoMaximo, establecerMontoMaximo] = useState('');
  const [depositos, establecerDepositos] = useState<Awaited<ReturnType<typeof cargarOpcionesHistorialMovimientos>>['depositos']>([]);
  const [depositosIds, establecerDepositosIds] = useState<string[] | null>(null);
  const [errorDepositos, establecerErrorDepositos] = useState(false);
  const [seccionesAbiertas, establecerSeccionesAbiertas] = useState(['categorias', 'monto']);
  const estilosFiltros = crearEstilosMovimientos(tema, anchoPantalla);
  const minimo = montoMinimo.trim() ? convertirSaldoInicial(montoMinimo) : undefined;
  const maximo = montoMaximo.trim() ? convertirSaldoInicial(montoMaximo) : undefined;
  const errorMonto = preajusteMontoId === 'personalizado' && (minimo === null || maximo === null || (minimo !== undefined && maximo !== undefined && minimo > maximo)) ? 'Revisá los montos: el mínimo no puede superar al máximo.' : null;
  const rangoMonto = useMemo(() => ({
    ...(preajusteMontoId === 'personalizado' ? { minimo: minimo ?? undefined, maximo: maximo ?? undefined } : PREAJUSTES_MONTOS.find(opcion => opcion.id === preajusteMontoId)!.rango),
    ...(depositosIds === null ? {} : { depositos: depositosIds }),
  }), [preajusteMontoId, minimo, maximo, depositosIds]);
  useFocusEffect(useCallback(() => {
    let vigente = true;
    cargarOpcionesHistorialMovimientos().then(datos => { if (vigente) { establecerDepositos(datos.depositos); establecerErrorDepositos(false); } }).catch(() => { if (vigente) establecerErrorDepositos(true); });
    return () => { vigente = false; };
  }, []));
  const [categoriasSeleccionadas, establecerCategoriasSeleccionadas] = useState(
    CATEGORIAS_EGRESO.map((categoria) => categoria.id),
  );
  const [periodoResumen, establecerPeriodoResumen] = useState('mes');
  const [diaResumen, establecerDiaResumen] = useState(() => normalizarFecha(new Date()));
  const [semanaResumen, establecerSemanaResumen] = useState(() => normalizarFecha(new Date()));
  const [mesResumen, establecerMesResumen] = useState(new Date().getMonth());
  const [anioResumen, establecerAnioResumen] = useState(ANIO_ACTUAL);
  const [modoColumnas, establecerModoColumnas] = useState('anio');
  const [semanaColumnas, establecerSemanaColumnas] = useState(() => normalizarFecha(new Date()));
  const [anioColumnas, establecerAnioColumnas] = useState(ANIO_ACTUAL);
  const [selectorActual, establecerSelectorActual] = useState<string | null>(null);
  const [selectorFechaActual, establecerSelectorFechaActual] = useState<string | null>(null);
  useEffect(() => {
    if (!selectorActual && !selectorFechaActual) return;
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => { establecerSelectorActual(null); establecerSelectorFechaActual(null); return true; });
    return () => suscripcion.remove();
  }, [selectorActual, selectorFechaActual]);
  useEffect(() => { establecerSelectorActual(null); establecerSelectorFechaActual(null); }, [indiceGrafico, anchoPantalla]);
  const [filtroCategoriasAbierto, establecerFiltroCategoriasAbierto] = useState(false);
  const [categoriaSeleccionada, establecerCategoriaSeleccionada] = useState<string | null>(null);
  const [indiceColumnaSeleccionada, establecerIndiceColumnaSeleccionada] = useState(0);
  const [estadisticas, establecerEstadisticas] = useState<{ resumen: { categorias: { categoria: string; total: number; cantidad: number; }[]; total: number; cantidad: number; }; columnas: { periodo: string; categoria: string; total: number; }[]; } | null>(null);
  const [estadoCarga, establecerEstadoCarga] = useState('cargando');
  const ultimaConsultaCompletada = useRef<string|null>(null);
  const [intentoCarga, establecerIntentoCarga] = useState(0);

  const catalogo = tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const categorias = useMemo(() => obtenerCategorias(tipoMovimiento, tema), [tipoMovimiento, tema]);
  const categoriasVisibles = useMemo(
    () => categorias.filter((categoria) => categoriasSeleccionadas.includes(categoria.id)),
    [categorias, categoriasSeleccionadas],
  );
  const rangoResumen = useMemo(
    () => obtenerRangoPeriodo(
      periodoResumen,
      diaResumen,
      semanaResumen,
      mesResumen,
      anioResumen,
    ),
    [periodoResumen, diaResumen, semanaResumen, mesResumen, anioResumen],
  );
  const rangoColumnas = useMemo(
    () => modoColumnas === 'semana'
      ? obtenerRangoPeriodo('semana', semanaColumnas, semanaColumnas, 0, anioColumnas)
      : obtenerRangoPeriodo('anio', semanaColumnas, semanaColumnas, 0, anioColumnas),
    [modoColumnas, semanaColumnas, anioColumnas],
  );

  useFocusEffect(useCallback(() => {
    let vigente = true;
    if (errorMonto) { establecerEstadisticas(null); establecerEstadoCarga('listo'); return; }
    const claveConsulta = JSON.stringify({tipoMovimiento,rangoResumen,rangoColumnas,modoColumnas,rangoMonto});
    if (ultimaConsultaCompletada.current !== claveConsulta) {
      establecerEstadoCarga('cargando');
      establecerEstadisticas(null);
    }
    cargarEstadisticas({
      tipo: tipoMovimiento,
      rangoResumen,
      rangoColumnas,
      agrupacionColumnas: modoColumnas === 'semana' ? 'dia' : 'mes',
      rangoMonto,
    }).then((resultado) => {
      if (!vigente) return;
      ultimaConsultaCompletada.current = claveConsulta;
      establecerEstadisticas(resultado);
      establecerEstadoCarga('listo');
    }).catch(() => {
      if (vigente) establecerEstadoCarga('error');
    });

    return () => {
      vigente = false;
    };
  }, [tipoMovimiento, rangoResumen, rangoColumnas, modoColumnas, rangoMonto, errorMonto, intentoCarga]));

  const filasResumenVisibles = (estadisticas?.resumen.categorias || []).filter(fila => categoriasSeleccionadas.includes(fila.categoria));
  const totalResumen = Math.round((filasResumenVisibles.reduce((total, fila) => total + fila.total, 0) + Number.EPSILON) * 100) / 100;
  const datosResumen = useMemo(
    () => crearDatosResumen(
      categoriasVisibles,
      estadisticas?.resumen.categorias || [],
      totalResumen,
    ),
    [categoriasVisibles, estadisticas, totalResumen],
  );
  const datosColumnas = useMemo(
    () => crearDatosColumnas(
      categoriasVisibles,
      modoColumnas,
      estadisticas?.columnas || [],
      semanaColumnas,
      anioColumnas,
    ),
    [categoriasVisibles, modoColumnas, estadisticas, semanaColumnas, anioColumnas],
  );
  const periodoResumenSeleccionado = PERIODOS_RESUMEN.find((periodo) => periodo.id === periodoResumen);
  const categoriaActiva = datosResumen.find((categoria) => categoria.id === categoriaSeleccionada);
  const barraSeleccionada = datosColumnas[Math.min(indiceColumnaSeleccionada, datosColumnas.length - 1)];
  const indiceColumnaVisible = Math.min(indiceColumnaSeleccionada, datosColumnas.length - 1);
  const filasDetalleColumna = barraSeleccionada?.segmentos.filter((segmento) => segmento.monto > 0) || [];
  const totalBarraSeleccionada = filasDetalleColumna.reduce((suma, segmento) => suma + segmento.monto, 0);
  const hayMovimientosResumen = filasResumenVisibles.some(fila => fila.cantidad > 0);
  const hayDatosResumen = Boolean(hayMovimientosResumen && totalResumen > 0);
  const hayDatosColumnas = Boolean(estadisticas?.columnas.length);
  const hayDatosColumnasVisibles = datosColumnas.some((barra) => (
    barra.segmentos.some((segmento) => segmento.monto > 0)
  ));

  const abrirPantallaRaiz = (ruta: string, parametros: import('../navigation/types').ParametrosPantalla | undefined = undefined) => {
    const navegadorSuperior = navegacion.getParent();
    const navegadorRaiz = navegadorSuperior?.getParent() || navegadorSuperior;
    navegadorRaiz?.navigate(ruta, parametros);
  };

  const abrirDetalleCategoria = (categoria: Pick<ReturnType<typeof obtenerCategorias>[number], 'id'|'nombre'|'icono'|'color'>) => {
    const fechaReferencia = periodoResumen === 'dia'
      ? diaResumen
      : periodoResumen === 'semana'
        ? semanaResumen
        : new Date(anioResumen, mesResumen, 1);
    const anioDetalle = periodoResumen === 'anio' || periodoResumen === 'mes'
      ? anioResumen
      : fechaReferencia.getFullYear();
    const mesDetalle = periodoResumen === 'mes'
      ? mesResumen
      : periodoResumen === 'anio'
        ? (anioResumen === ANIO_ACTUAL ? new Date().getMonth() : 0)
        : fechaReferencia.getMonth();
    const categoriaDetalle = {
      id: categoria.id,
      nombre: categoria.nombre,
      icono: categoria.icono,
      color: categoria.color,
    };
    abrirPantallaRaiz(RUTAS.DETALLE_CATEGORIA, {
      categoria: categoriaDetalle,
      tipoMovimiento,
      anio: anioDetalle,
      mes: mesDetalle,
      rangoMontoEstadistica: rangoMonto,
    });
  };

  const cambiarTipoMovimiento = (nuevoTipo: SetStateAction<string>) => {
    const nuevoCatalogo = nuevoTipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
    establecerTipoMovimiento(nuevoTipo);
    establecerPreajusteMontoId('todos');
    establecerMontoMinimo(''); establecerMontoMaximo('');
    establecerCategoriasSeleccionadas(nuevoCatalogo.map((categoria) => categoria.id));
    establecerCategoriaSeleccionada(null);
    establecerIndiceColumnaSeleccionada(0);
  };

  const obtenerOpcionesSelector = () => {
    if (selectorActual === 'periodoResumen') return PERIODOS_RESUMEN;
    if (selectorActual === 'modoColumnas') return MODOS_COLUMNAS;
    if (selectorActual === 'mesResumen') {
      return MESES.map((mes) => ({ id: mes.id, nombre: mes.nombre }));
    }
    if (selectorActual === 'anioResumen' || selectorActual === 'anioColumnas') {
      return ANIOS_DISPONIBLES.map((anio) => ({ id: anio, nombre: String(anio) }));
    }
    return [];
  };

  const obtenerValorSelector = () => {
    if (selectorActual === 'periodoResumen') return periodoResumen;
    if (selectorActual === 'modoColumnas') return modoColumnas;
    if (selectorActual === 'mesResumen') return mesResumen;
    if (selectorActual === 'anioResumen') return anioResumen;
    if (selectorActual === 'anioColumnas') return anioColumnas;
    return null;
  };

  const aplicarOpcionSelector = (valor: string|number) => {
    if (selectorActual === 'periodoResumen') establecerPeriodoResumen(String(valor));
    else if (selectorActual === 'modoColumnas') {
      establecerModoColumnas(String(valor));
      establecerIndiceColumnaSeleccionada(0);
    }
    else if (selectorActual === 'mesResumen') establecerMesResumen(Number(valor));
    else if (selectorActual === 'anioResumen') establecerAnioResumen(Number(valor));
    else if (selectorActual === 'anioColumnas') establecerAnioColumnas(Number(valor));

    establecerSelectorActual(null);
  };

  const obtenerEtiquetaRangoResumen = () => {
    if (periodoResumen === 'dia') return formatearDiaSeleccionado(diaResumen);
    if (periodoResumen === 'semana') return formatearRangoSemana(semanaResumen);
    if (periodoResumen === 'mes') return `${MESES[mesResumen].nombre} ${anioResumen}`;
    return String(anioResumen);
  };

  const obtenerEtiquetaRangoColumnas = () => (
    modoColumnas === 'semana'
      ? formatearRangoSemana(semanaColumnas)
      : String(anioColumnas)
  );

  const obtenerTituloSelector = () => {
    if (selectorActual === 'periodoResumen') return 'Período del resumen';
    if (selectorActual === 'modoColumnas') return 'Período de columnas';
    if (selectorActual === 'mesResumen') return 'Elegir mes';
    return 'Elegir año';
  };

  const opcionesSelector = obtenerOpcionesSelector();
  const fechaCalendario = selectorFechaActual === 'diaResumen'
    ? diaResumen
    : selectorFechaActual === 'semanaResumen'
      ? semanaResumen
      : semanaColumnas;

  const seleccionarFechaCalendario = (fecha: Date) => {
    if (selectorFechaActual === 'diaResumen') establecerDiaResumen(fecha);
    else if (selectorFechaActual === 'semanaResumen') establecerSemanaResumen(fecha);
    else if (selectorFechaActual === 'semanaColumnas') establecerSemanaColumnas(fecha);
    establecerSelectorFechaActual(null);
  };

  const seccionesGrafico = [
    { id: 0, titulo: 'Distribución por categoría' },
    { id: 1, titulo: `${tipoMovimiento === 'ingreso' ? 'Ingresos' : 'Egresos'} por período` },
  ];

  const tituloResumen = obtenerEtiquetaRangoResumen();
  const tituloColumnas = obtenerEtiquetaRangoColumnas();
  const selectoresResumen = [
    { id: 'periodoResumen', texto: periodoResumenSeleccionado?.nombre, etiqueta: periodoResumenSeleccionado?.nombre, calendario: false },
    ...(periodoResumen === 'dia'
      ? [{ id: 'diaResumen', texto: formatearDiaSelector(diaResumen), etiqueta: `Seleccionar día: ${formatearDiaSeleccionado(diaResumen)}`, calendario: true }]
      : periodoResumen === 'semana'
        ? [{ id: 'semanaResumen', texto: formatearSemanaSelector(semanaResumen), etiqueta: `Seleccionar semana: ${tituloResumen}`, calendario: true }]
        : periodoResumen === 'mes'
          ? [
            { id: 'mesResumen', texto: MESES[mesResumen].corto, etiqueta: MESES[mesResumen].nombre, calendario: false },
            { id: 'anioResumen', texto: String(anioResumen), etiqueta: `Año ${anioResumen}`, calendario: false },
          ]
          : [{ id: 'anioResumen', texto: String(anioResumen), etiqueta: `Año ${anioResumen}`, calendario: false }]),
  ];
  const selectoresColumnas = [
    { id: 'modoColumnas', texto: modoColumnas === 'semana' ? 'Semana' : 'Año', etiqueta: modoColumnas === 'semana' ? 'Semana' : 'Año', calendario: false },
    ...(modoColumnas === 'semana'
      ? [{ id: 'semanaColumnas', texto: formatearSemanaSelector(semanaColumnas), etiqueta: `Seleccionar semana: ${tituloColumnas}`, calendario: true }]
      : [{ id: 'anioColumnas', texto: String(anioColumnas), etiqueta: `Año ${anioColumnas}`, calendario: false }]),
  ];
  const selectoresActuales = indiceGrafico === 0 ? selectoresResumen : selectoresColumnas;
  const preajustesCategorias = [
    { id: 'todos', nombre: 'Todas', categorias: catalogo.map(categoria => categoria.id) },
    ...PREAJUSTES_CATEGORIAS[tipoMovimiento === 'ingreso' ? 'ingreso' : 'egreso'],
  ];
  const todasLasCategorias = catalogo.map(categoria => categoria.id);
  const todasSeleccionadas = coincidenCategorias(categoriasSeleccionadas, todasLasCategorias);
  const gruposCategoriasActivos = todasSeleccionadas ? [] : agruparCategoriasSeleccionadas(categoriasSeleccionadas, preajustesCategorias.filter(opcion => opcion.id !== 'todos'), categorias);
  const esPreajusteActivo = (opcion: typeof preajustesCategorias[number]) => opcion.id === 'todos'
    ? todasSeleccionadas
    : !todasSeleccionadas && opcion.categorias.every(id => categoriasSeleccionadas.includes(id));
  const textoCategoriasActivas = todasSeleccionadas
    ? 'Todas las categorías'
    : categorias.filter(categoria => categoriasSeleccionadas.includes(categoria.id)).map(categoria => categoria.nombre).join(' · ') || 'Sin categorías seleccionadas';

  const textoMontoActivo = (rangoMonto.minimo === undefined ? 'Sin mínimo' : '$ ' + formatearEntradaMonto(String(rangoMonto.minimo).replace('.', ','))) + ' – ' + (rangoMonto.maximo === undefined ? 'Sin máximo' : '$ ' + formatearEntradaMonto(String(rangoMonto.maximo).replace('.', ',')));
  const elegirRango = (id:string) => {
    const opcion = PREAJUSTES_MONTOS.find(opcion => opcion.id === id)!;
    establecerMontoMinimo(opcion.rango.minimo === undefined ? '' : String(opcion.rango.minimo).replace('.', ','));
    establecerMontoMaximo(opcion.rango.maximo === undefined ? '' : String(opcion.rango.maximo).replace('.', ','));
    establecerPreajusteMontoId(id);
    establecerCategoriaSeleccionada(null);
  };
  const limpiarFiltrosEstadistica = () => { establecerCategoriasSeleccionadas(catalogo.map(categoria => categoria.id)); elegirRango('todos'); establecerDepositosIds(null); };
  const alternarSeccion = (id:string) => establecerSeccionesAbiertas(actuales => actuales.includes(id) ? actuales.filter(actual => actual !== id) : [...actuales, id]);

  const filtrosActivosEstadistica = [
    ...gruposCategoriasActivos.map(grupo => ({ id:'categorias-' + grupo.id, etiqueta:grupo.nombre, alQuitar:() => {
      establecerCategoriasSeleccionadas(actuales => actuales.filter(id => !grupo.categorias.includes(id)));
      establecerCategoriaSeleccionada(null);
    } })),
    ...(!todasSeleccionadas && !categoriasSeleccionadas.length ? [{ id:'sin-categorias', etiqueta:'Sin categorías', alQuitar:() => establecerCategoriasSeleccionadas(todasLasCategorias) }] : []),
    ...(rangoMonto.minimo !== undefined || rangoMonto.maximo !== undefined ? [{ id:'monto', etiqueta:textoMontoActivo, alQuitar:() => elegirRango('todos') }] : []),
    ...(depositosIds !== null ? [{ id:'depositos', etiqueta:depositos.filter(deposito => depositosIds.includes(deposito.id)).map(deposito => deposito.nombre).join(' · ') || 'Depósitos seleccionados', alQuitar:() => establecerDepositosIds(null) }] : []),
  ];

  const cantidadFiltrosActivos = filtrosActivosEstadistica.length;

  const cerrarSelectores = () => { establecerSelectorActual(null); establecerSelectorFechaActual(null); };
  const abrirSelectorAnclado = (id:string, calendario:boolean) => {
    if (selectorActual === id || selectorFechaActual === id) { cerrarSelectores(); return; }
    controlesSelectores.current[id]?.measureInWindow((x, y, ancho, alto) => {
      raizSelectores.current?.measureInWindow((raizX, raizY, anchoRaiz, altoRaiz) => {
        const anchoMenu = Math.min(calendario ? 304 : Math.max(132, ancho), calendario ? 304 : 224, anchoRaiz - 24);
        const posicionX = Math.max(12, Math.min(x - raizX, anchoRaiz - anchoMenu - 12));
        const debajo = y - raizY + alto + 4;
        const espacioDebajo = altoRaiz - debajo - 12;
        const abrirArriba = espacioDebajo < 160 && y - raizY > espacioDebajo;
        const altoMaximo = Math.min(calendario ? 360 : 240, abrirArriba ? y - raizY - 16 : espacioDebajo);
        establecerAnclaSelector({ left:posicionX, top:abrirArriba ? Math.max(12, y - raizY - altoMaximo - 4) : debajo, width:anchoMenu, altoMaximo:Math.max(80, altoMaximo) });
        if (calendario) { establecerSelectorActual(null); establecerSelectorFechaActual(id); }
        else { establecerSelectorFechaActual(null); establecerSelectorActual(id); }
      });
    });
  };

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View ref={raizSelectores} collapsable={false} style={estilosGlobales.pantalla}>
        <EncabezadoPrincipal
          alAbrirNotificaciones={() => abrirPantallaRaiz(RUTAS.NOTIFICACIONES)}
          alAbrirPerfil={() => abrirPantallaRaiz(RUTAS.PERFIL)}
          descripcion="Analiza tus ingresos y gastos."
          tema={tema}
          titulo="Estadísticas"
        />

        <ScrollView
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          contentContainerStyle={estilos.contenidoDesplazable}
          showsVerticalScrollIndicator={false}
          style={estilos.desplazamiento}
        >
          <View style={estilos.controles}>
            <SelectorSegmentado tema={tema} etiqueta="Tipo de movimiento" opciones={[{ id:'egreso', nombre:'Egresos' }, { id:'ingreso', nombre:'Ingresos' }]} valor={tipoMovimiento} alSeleccionar={cambiarTipoMovimiento}/>


            <FilaFiltrosHorizontal tema={tema} estiloContenido={estilos.filaSelectores}>
              {selectoresActuales.map((selector) => (
                <Pressable
                  accessibilityLabel={selector.etiqueta || selector.texto}
                  accessibilityRole="button"
                  key={selector.id}
                  accessibilityState={{ expanded: selectorActual === selector.id || selectorFechaActual === selector.id }}
                  ref={elemento => { controlesSelectores.current[selector.id] = elemento; }}
                  onPress={() => abrirSelectorAnclado(selector.id, selector.calendario)}
                  style={estilos.botonSelector}
                >
                  <Text numberOfLines={1} style={estilos.textoSelector}>{selector.texto}</Text>
                  <Ionicons color={tema.textoPrincipal} name={selectorActual === selector.id || selectorFechaActual === selector.id ? 'chevron-up' : 'chevron-down'} size={16} />
                </Pressable>
              ))}
            </FilaFiltrosHorizontal>




            <BuscadorFiltrosMovimientos tema={tema} mostrarBuscador={false} alAbrirFiltros={() => { establecerSelectorActual(null); establecerSelectorFechaActual(null); establecerFiltroCategoriasAbierto(true); }} alLimpiar={limpiarFiltrosEstadistica} filtrosActivos={filtrosActivosEstadistica} cantidad={cantidadFiltrosActivos}>
              {preajustesCategorias.map(opcion => <Pressable key={opcion.id} accessibilityRole="button" accessibilityState={{ selected: esPreajusteActivo(opcion) }}
                onPress={() => { establecerCategoriasSeleccionadas(actuales => opcion.id === 'todos' ? todasLasCategorias : alternarGrupoCategorias(actuales, opcion.categorias, todasLasCategorias)); establecerCategoriaSeleccionada(null); }}
                style={[estilos.filtroRapido, esPreajusteActivo(opcion) && estilos.filtroRapidoActivo]}>
                <Text style={[estilos.textoFiltroRapido, esPreajusteActivo(opcion) && estilos.textoFiltroRapidoActivo]}>{opcion.nombre}</Text>
              </Pressable>)}
              {PREAJUSTES_MONTOS.filter(opcion => opcion.id !== 'todos').map(opcion => <Pressable key={opcion.id} accessibilityRole="button" accessibilityState={{ selected: preajusteMontoId === opcion.id }} onPress={() => elegirRango(preajusteMontoId === opcion.id ? 'todos' : opcion.id)} style={[estilos.filtroRapido, preajusteMontoId === opcion.id && estilos.filtroRapidoActivo]}>
                <Text style={[estilos.textoFiltroRapido, preajusteMontoId === opcion.id && estilos.textoFiltroRapidoActivo]}>{opcion.nombre}</Text>
              </Pressable>)}
            </BuscadorFiltrosMovimientos>
            {errorMonto ? <Text style={estilosGlobales.textoError}>{errorMonto}</Text> : null}


          </View>

          <View
            onLayout={(evento) => establecerAnchoSlider(evento.nativeEvent.layout.width)}
            style={estilos.contenedorCarrusel}
          >
            <ScrollView
              contentContainerStyle={estilos.contenidoCarrusel}
              horizontal
              onMomentumScrollEnd={(evento) => {
                const anchoPagina = evento.nativeEvent.layoutMeasurement.width;
                if (!anchoPagina) return;
                establecerIndiceGrafico(Math.min(1, Math.round(evento.nativeEvent.contentOffset.x / anchoPagina)));
              }}
              pagingEnabled
              scrollEnabled={!barraEnInteraccion}
              showsHorizontalScrollIndicator={false}
              style={estilos.carrusel}
            >
              <View style={[estilos.paginaGrafico, { width: anchoSlider || Math.max(0, anchoPantalla - (MARGEN_LATERAL_PANTALLA * 2)) }]}>
                <View style={estilos.cabeceraGrafico}>
                  <Text style={estilos.tituloGrafico}>{seccionesGrafico[0].titulo}</Text>
                  <Text style={estilos.subtituloGrafico}>{tituloResumen}</Text>
                </View>
                <View style={estilos.contenedorGraficoCircular}>
                  {estadoCarga === 'cargando' ? null : estadoCarga === 'error' ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => establecerIntentoCarga((intento) => intento + 1)}
                      style={estilos.botonReintentar}
                    >
                      <Text style={estilos.textoSinCategorias}>No se pudieron cargar las estadísticas. Tocá para reintentar.</Text>
                    </Pressable>
                  ) : !hayMovimientosResumen ? (
                    <Text style={estilos.textoSinCategorias}>No hay movimientos con estos filtros. Probá restablecerlos o cambiar el período.</Text>
                  ) : !hayDatosResumen ? (
                    <Text style={estilos.textoSinCategorias}>El total del período es cero y no hay importes para distribuir.</Text>
                  ) : datosResumen.length ? (
                    <GraficoCircular
                      alSeleccionar={establecerCategoriaSeleccionada}
                      categorias={datosResumen}
                      seleccionadaId={categoriaSeleccionada}
                      tamano={tamanoGrafico}
                      tema={tema}
                      totalGeneral={totalResumen}
                    />
                  ) : (
                    <Text style={estilos.textoSinCategorias}>Seleccioná categorías para ver el resumen.</Text>
                  )}
                </View>
              </View>
              <View style={[estilos.paginaGrafico, { width: anchoSlider || Math.max(0, anchoPantalla - (MARGEN_LATERAL_PANTALLA * 2)) }]}>
                <View style={estilos.cabeceraGrafico}>
                  <Text style={estilos.tituloGrafico}>{seccionesGrafico[1].titulo}</Text>
                  <Text style={estilos.subtituloGrafico}>{tituloColumnas}</Text>
                </View>
                {estadoCarga === 'cargando' ? null : estadoCarga === 'error' ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => establecerIntentoCarga((intento) => intento + 1)}
                    style={estilos.estadoGrafico}
                  >
                    <Text style={estilos.textoSinCategorias}>No se pudieron cargar las estadísticas. Tocá para reintentar.</Text>
                  </Pressable>
                ) : !hayDatosColumnas ? (
                  <Text style={estilos.textoSinCategorias}>No hay movimientos en este período.</Text>
                ) : !hayDatosColumnasVisibles ? (
                  <Text style={estilos.textoSinCategorias}>Seleccioná categorías para ver el gráfico.</Text>
                ) : (
                  <GraficoColumnas
                    alFinalizarSeleccion={() => establecerBarraEnInteraccion(false)}
                    alIniciarSeleccion={() => establecerBarraEnInteraccion(true)}
                    alSeleccionar={establecerIndiceColumnaSeleccionada}
                    barras={datosColumnas}
                    estilos={estilos}
                    graficoActivo={indiceGrafico === 1}
                    indiceSeleccionado={indiceColumnaVisible}
                    tamano={tamanoGrafico}
                    tema={tema}
                  />
                )}
              </View>
            </ScrollView>
            <View
              accessibilityLabel={`Gráfico ${indiceGrafico + 1} de 2`}
              accessible
              accessibilityRole="text"
              style={estilos.indicadoresCarrusel}
            >
              {seccionesGrafico.map((seccion) => (
                <View
                  accessibilityElementsHidden
                  key={seccion.id}
                  style={[estilos.indicadorCarrusel, indiceGrafico === seccion.id && estilos.indicadorCarruselActivo]}
                />
              ))}
            </View>
            {indiceGrafico === 0 ? (
              <>
                <View style={estilos.detalleSeleccion}>
                  {estadoCarga === 'cargando' ? null : estadoCarga === 'error' ? (
                    <Text style={estilos.textoDetalleSeleccion}>No se pudieron cargar las estadísticas.</Text>
                  ) : !hayMovimientosResumen ? (
                    <Text style={estilos.textoDetalleSeleccion}>No hay movimientos con estos filtros.</Text>
                  ) : !hayDatosResumen ? (
                    <Text style={estilos.textoDetalleSeleccion}>El total del período es cero.</Text>
                  ) : categoriaActiva ? (
                    <>
                      <View style={estilos.filaDetalleSeleccion}>
                        <View style={[estilos.muestraColor, { backgroundColor: categoriaActiva.color }]} />
                        <Text style={estilos.tituloDetalleSeleccion}>{categoriaActiva.nombre}</Text>
                      </View>
                      <Text style={estilos.textoDetalleSeleccion}>
                        {formatearMonto(categoriaActiva.monto)} · {formatearPorcentaje(categoriaActiva.participacion)}
                      </Text>
                    </>
                  ) : (
                    <Text style={estilos.textoDetalleSeleccion}>Toca un segmento para ver su importe.</Text>
                  )}
                </View>
                <View style={estilos.listaCategorias}>
                  {datosResumen.map((categoria, indice) => {
                    const familia = obtenerFamiliaCategoria(categoria.id, tipoMovimiento);
                    const iniciaFamilia = indice === 0 || obtenerFamiliaCategoria(datosResumen[indice - 1].id, tipoMovimiento).id !== familia.id;
                    const porcentaje = formatearPorcentaje(categoria.participacion);
                    const activa = categoria.id === categoriaSeleccionada;

                    return (
                      <Fragment key={categoria.id}>
                      {iniciaFamilia ? <Text accessibilityRole="header" style={estilos.tituloFamilia}>{familia.nombre}</Text> : null}
                      <Pressable
                        accessibilityLabel={`Ver detalle de ${categoria.nombre}, ${formatearMonto(categoria.monto)}, ${porcentaje}, ${categoria.cantidad} movimientos`}
                        accessibilityRole="button"
                        key={categoria.id}
                        onPress={() => abrirDetalleCategoria(categoria)}
                        style={[estilos.filaCategoria, activa && estilos.filaCategoriaActiva]}
                      >
                        <View style={[estilos.muestraColor, { backgroundColor: categoria.color }]} />
                        <Ionicons color={obtenerColorIconoCategoria(categoria.id, tema, tipoMovimiento)} name={categoria.icono} size={20} />
                        <View style={estilos.nombreCategoriaContenedor}>
                          <Text numberOfLines={1} style={estilos.nombreCategoria}>{categoria.nombre}</Text>
                          <Text style={estilos.cantidadMovimientos}>
                            {categoria.cantidad} {categoria.cantidad === 1 ? 'movimiento' : 'movimientos'}
                          </Text>
                        </View>
                        <Text style={estilos.porcentajeCategoria}>{porcentaje}</Text>
                        <Text style={estilos.montoCategoria}>{formatearMonto(categoria.monto)}</Text>
                      </Pressable>
                      </Fragment>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={estilos.detalleColumna}>
                {estadoCarga === 'cargando' ? null : estadoCarga === 'error' ? (
                  <Text style={estilos.textoDetalleSeleccion}>No se pudieron cargar las estadísticas.</Text>
                ) : !hayDatosColumnas ? (
                  <Text style={estilos.textoDetalleSeleccion}>No hay movimientos en el período seleccionado.</Text>
                ) : !hayDatosColumnasVisibles ? (
                  <Text style={estilos.textoDetalleSeleccion}>Seleccioná categorías para ver el detalle.</Text>
                ) : barraSeleccionada ? (
                  <>
                    <View style={estilos.resumenColumna}>
                      <Text style={estilos.tituloDetalleSeleccion}>{barraSeleccionada.etiqueta}</Text>
                      <Text style={estilos.totalColumna}>{formatearMonto(totalBarraSeleccionada)}</Text>
                    </View>
                    {filasDetalleColumna.length ? (
                      <View style={estilos.listaDetalleColumna}>
                        {filasDetalleColumna.map((segmento) => (
                          <View key={segmento.id} style={estilos.filaDetalleColumna}>
                            <View style={[estilos.muestraColor, { backgroundColor: segmento.color }]} />
                            <Text numberOfLines={1} style={estilos.nombreCategoria}>{segmento.nombre}</Text>
                            <Text style={estilos.montoCategoria}>{formatearMonto(segmento.monto)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={estilos.textoDetalleSeleccion}>
                        {barraSeleccionada.totalGeneral > 0
                          ? 'El período tiene movimientos en categorías ocultas.'
                          : 'Este día o mes no tuvo movimientos.'}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={estilos.textoDetalleSeleccion}>No hay datos para este período.</Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>


        {anclaSelector && (selectorActual || selectorFechaActual) ? <View pointerEvents="box-none" style={estilos.capaSelectores}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar desplegable" onPress={cerrarSelectores} style={estilos.fondoSelectorFlotante}/>
          <View style={[estilos.selectorFlotante, { left:anclaSelector.left, top:anclaSelector.top, width:anclaSelector.width }]}>
            {selectorActual ? (
            <SelectorDesplegable
              altoMaximo={anclaSelector.altoMaximo}
              alCerrar={() => establecerSelectorActual(null)}
              alSeleccionar={aplicarOpcionSelector}
              estilos={estilos}
              opciones={opcionesSelector}
              tema={tema}
              titulo={obtenerTituloSelector()}
              valorSeleccionado={obtenerValorSelector()}
              visible={Boolean(selectorActual)}
            />
            ) : <ScrollView style={{ maxHeight:anclaSelector.altoMaximo }} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
            <CalendarioDesplegable
              alCerrar={() => establecerSelectorFechaActual(null)}
              alSeleccionar={seleccionarFechaCalendario}
              estilos={estilos}
              fecha={fechaCalendario}
              tema={tema}
              visible={Boolean(selectorFechaActual)}
            />
            </ScrollView>}
          </View>
        </View> : null}

        <PanelFiltrosMovimientos tema={tema} filtrosVisibles={filtroCategoriasAbierto} alCerrar={() => establecerFiltroCategoriasAbierto(false)} limpiarFiltros={limpiarFiltrosEstadistica} cantidadFiltros={cantidadFiltrosActivos}>
          <SeccionFiltro titulo="Categorías" resumen={textoCategoriasActivas} abierta={seccionesAbiertas.includes('categorias')} alAlternar={() => alternarSeccion('categorias')} colorAcento={tema.foco} estilos={estilosFiltros}>
            <View style={estilos.encabezadoFiltrosRapidos}>
              <Pressable accessibilityRole="button" onPress={() => establecerCategoriasSeleccionadas(catalogo.map(categoria => categoria.id))} style={estilos.accionFiltroRapido}><Text style={estilos.textoAccionFiltroRapido}>Todas</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => establecerCategoriasSeleccionadas([])} style={estilos.accionFiltroRapido}><Text style={estilos.textoAccionFiltroRapido}>Ninguna</Text></Pressable>
            </View>
            <SelectorCategoria tema={tema} estilosGlobales={estilosGlobales} estilosMovimiento={estilosFiltros} categorias={categorias} tipoMovimiento={tipoMovimiento} etiqueta="" variante="grilla" seleccionMultiple seleccionadasIds={categoriasSeleccionadas} alCambiarMulti={establecerCategoriasSeleccionadas} usarColorIconoComoRelleno estiloTarjeta={estilosFiltros.tarjetaCategoriaFiltro}/>
          </SeccionFiltro>
          <SeccionFiltro titulo="Depósitos" resumen={depositosIds === null ? 'Todos los depósitos' : depositosIds.length + ' seleccionados'} abierta={seccionesAbiertas.includes('depositos')} alAlternar={() => alternarSeccion('depositos')} colorAcento={tema.foco} estilos={estilosFiltros}>
            {errorDepositos ? <Text style={estilosGlobales.textoError}>No se pudieron cargar los depósitos. Volvé a abrir la pantalla para reintentar.</Text> : <SelectorDeposito tema={tema} estilosGlobales={estilosGlobales} estilosMovimiento={estilosFiltros} etiqueta="" depositos={depositos} seleccionMultiple seleccionadasIds={depositosIds ?? depositos.map(deposito => deposito.id)} alCambiarMulti={establecerDepositosIds} impedirSeleccionVacia/>}
          </SeccionFiltro>
          <SeccionFiltro titulo="Monto" resumen={textoMontoActivo} abierta={seccionesAbiertas.includes('monto')} alAlternar={() => alternarSeccion('monto')} colorAcento={tema.foco} estilos={estilosFiltros}>
            <View style={estilosFiltros.filaRango}>
              <View style={estilosFiltros.grupoCampoRango}><Text style={estilosFiltros.textoEtiquetaCampoRango}>Mínimo</Text><EntradaMonto tema={tema} estilosGlobales={estilosGlobales} etiqueta="Monto mínimo" mostrarEtiqueta={false} mostrarLimpiar={false} compacto valor={montoMinimo} alCambiarTexto={valor => { establecerMontoMinimo(valor); establecerPreajusteMontoId('personalizado'); }} estiloContenedor={estilosFiltros.campoRango}/></View>
              <View style={estilosFiltros.grupoCampoRango}><Text style={estilosFiltros.textoEtiquetaCampoRango}>Máximo</Text><EntradaMonto tema={tema} estilosGlobales={estilosGlobales} etiqueta="Monto máximo" mostrarEtiqueta={false} mostrarLimpiar={false} compacto valor={montoMaximo} alCambiarTexto={valor => { establecerMontoMaximo(valor); establecerPreajusteMontoId('personalizado'); }} estiloContenedor={estilosFiltros.campoRango}/></View>
            </View>
            {errorMonto ? <Text style={estilosGlobales.textoError}>{errorMonto}</Text> : null}
          </SeccionFiltro>
        </PanelFiltrosMovimientos>

      </View>
    </SafeAreaView>
  );
}
