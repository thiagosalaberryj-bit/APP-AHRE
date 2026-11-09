import GraficoCircular from '../components/StatisticsPieChart';
import GraficoColumnas from '../components/StatisticsBarChart';
import ResumenColumna from '../components/StatisticsBarSummary';
import { SelectorDesplegable, CalendarioDesplegable } from '../components/StatisticsDateControls';
import { PERIODOS_RESUMEN, MODOS_COLUMNAS, MESES, ANIO_ACTUAL, ANIOS_DISPONIBLES } from '../constants/statistics';
import {
  normalizarFecha,
  formatearRangoSemana,
  formatearDiaSeleccionado,
  formatearDiaSelector,
  formatearSemanaSelector,
  obtenerCategorias,
  formatearMonto,
  formatearPorcentaje,
  obtenerRangoPeriodo,
  crearDatosResumen,
  crearDatosColumnas,
  calcularResumenVisible,
  obtenerDetalleColumna,
} from '../statistics/statisticsPresentation';
import SelectorSegmentado from '../components/SegmentedSelector';
import FilaFiltrosHorizontal from '../components/HorizontalFilterRow';
import BuscadorFiltrosMovimientos from '../components/MovementSearchFilters';
import PanelFiltrosMovimientos, { SeccionFiltro } from '../components/MovementFiltersPanel';
import SelectorCategoria from '../components/CategorySelector';
import SelectorDeposito from '../components/DepositSelector';
import EntradaMonto from '../components/MoneyInput';
import { crearEstilosMovimientos } from '../styles/MovementsScreenStyles';
import { crearEstilosBusquedaFiltros } from '../styles/MovementSearchFiltersStyles';
import { cargarOpcionesHistorialMovimientos } from '../movements/movementService';
import { convertirSaldoInicial } from '../utils/depositValidation';
import { formatearEntradaMonto } from '../utils/moneyInput';
import { PREAJUSTES_CATEGORIAS, PREAJUSTES_MONTOS, coincidenCategorias, alternarGrupoCategorias, agruparCategoriasSeleccionadas } from '../utils/statisticsFilters';
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

import { ContextoApariencia } from '../contexts/AppearanceContext';
import EncabezadoPrincipal from '../components/MainHeader';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
} from '../constants/movimientos';
import { RUTAS } from '../constants/routes';
import { obtenerColorIconoCategoria, obtenerFamiliaCategoria } from '../styles/categoryColors';
import { crearEstilosGlobales, MARGEN_LATERAL_PANTALLA } from '../styles/globalStyles';
import { crearEstilosEstadisticas } from '../styles/StatisticsScreenStyles';
import { cargarEstadisticas } from '../statistics/statisticsService';

export default function PantallaEstadisticas({ navigation: navegacion }: import('../navigation/types').PropiedadesPestana) {
  const raizSelectores = useRef<View>(null);
  const controlesSelectores = useRef<Record<string, View | null>>({});
  const [anclaSelector, establecerAnclaSelector] = useState<{left:number;top:number;width:number;altoMaximo:number} | null>(null);
  const { tema } = useContext(ContextoApariencia);
  const anchoPantalla = useWindowDimensions().width;
  const tamanoGrafico = Math.min(320, Math.max(248, anchoPantalla - 64));
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosEstadisticas(tema);
  const estilosAccesos = crearEstilosBusquedaFiltros(tema);
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

  const { totalResumen, hayMovimientosResumen, hayDatosResumen } = calcularResumenVisible(
    estadisticas?.resumen.categorias || [], categoriasSeleccionadas,
  );
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
  const { barraSeleccionada, indiceColumnaVisible, filasDetalleColumna, totalBarraSeleccionada, hayDatosColumnasVisibles } = obtenerDetalleColumna(datosColumnas, indiceColumnaSeleccionada);
  const hayDatosColumnas = Boolean(estadisticas?.columnas.length);

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
                style={[estilosAccesos.filtro, esPreajusteActivo(opcion) && estilosAccesos.filtroActivo]}>
                <Text style={[estilosAccesos.textoFiltro, esPreajusteActivo(opcion) && estilosAccesos.textoActivo]}>{opcion.nombre}</Text>
              </Pressable>)}
              {PREAJUSTES_MONTOS.filter(opcion => opcion.id !== 'todos').map(opcion => <Pressable key={opcion.id} accessibilityRole="button" accessibilityState={{ selected: preajusteMontoId === opcion.id }} onPress={() => elegirRango(preajusteMontoId === opcion.id ? 'todos' : opcion.id)} style={[estilosAccesos.filtro, preajusteMontoId === opcion.id && estilosAccesos.filtroActivo]}>
                <Text style={[estilosAccesos.textoFiltro, preajusteMontoId === opcion.id && estilosAccesos.textoActivo]}>{opcion.nombre}</Text>
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
                  <ResumenColumna barra={barraSeleccionada} segmentos={filasDetalleColumna} total={totalBarraSeleccionada}
                    tipo={tipoMovimiento} tema={tema} estilos={estilos}/>
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
            <SelectorCategoria tema={tema} estilosGlobales={estilosGlobales} estilosMovimiento={estilosFiltros} categorias={categorias} tipoMovimiento={tipoMovimiento} etiqueta="" variante="grilla" seleccionMultiple seleccionadasIds={categoriasSeleccionadas} alCambiarMulti={establecerCategoriasSeleccionadas} estiloTarjeta={estilosFiltros.tarjetaCategoriaFiltro}/>
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
