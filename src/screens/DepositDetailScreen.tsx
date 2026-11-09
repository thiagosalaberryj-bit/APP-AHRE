import MarcoEncabezado from '../components/ScreenHeaderFrame';
import { DesplazamientoEncabezado } from '../components/HeaderScrollView';
import FormularioDeposito from '../components/DepositForm';
import ModalIconosDeposito from '../components/DepositIconModal';
import { TIPOS_DEPOSITO } from '../constants/deposits';
import {
  FiltroTipoMovimientos,
  FiltroFechaMovimientos,
  FiltroCategoriasMovimientos,
  FiltroMontoMovimientos,
} from '../components/MovementFilterSections';
import FiltrosRapidosMovimientos from '../components/MovementQuickFilters';
import { OPCIONES_TIPO, MESES } from '../constants/movementFilters';
import {operacionFinancieraEnCurso} from '../social/financialOperation';
import {consultarRecurrenciasDeposito} from '../recurrences/recurrenceService';
import SelectorSegmentado from '../components/SegmentedSelector';
import BuscadorFiltrosMovimientos from '../components/MovementSearchFilters';
import PanelFiltrosMovimientos from '../components/MovementFiltersPanel';
import {crearEstilosMovimientos} from '../styles/MovementsScreenStyles';
import {crearEstilosBusquedaFiltros} from '../styles/MovementSearchFiltersStyles';
import {obtenerPreajustesMovimientos} from '../utils/statisticsFilters';
import { formatearEntradaMonto } from '../utils/moneyInput';
import PanelRecurrencias from '../components/RecurrencePanel';
import type { NombreIcono } from '../constants/movimientos';
import { useContext, useCallback, useEffect, useMemo, useRef, useState, SetStateAction } from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { RUTAS } from '../constants/routes';
import { actualizarDeposito, consultarDetalleDeposito, consultarMesesMovimientosDeposito, consultarPaginaMovimientosDeposito, eliminarDeposito, ErrorDeposito } from '../deposits/depositService';
import { useMovimientosPorMes } from '../movements/useMonthlyMovements';
import ListaMesesMovimientos from '../components/MovementMonthList';
import { consultarSaldoOculto } from '../profile/balanceVisibilityService';
import { convertirSaldoInicial } from '../utils/depositValidation';
import { COLOR_DEPOSITO_PREDETERMINADO, COLOR_ICONO_DEPOSITO } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDetalleDeposito } from '../styles/DepositDetailScreenStyles';
import { crearEstilosDeposito } from '../styles/DepositScreenStyles';

const IDS_INGRESO = new Set(CATEGORIAS_INGRESO.map((categoria) => categoria.id));
const IDS_EGRESO = new Set(CATEGORIAS_EGRESO.map((categoria) => categoria.id));
const IDS_TRANSFERENCIA = new Set(['transferencias']);
const CATEGORIAS_FILTRO = Object.freeze([
  ...CATEGORIAS_INGRESO,
  ...CATEGORIAS_EGRESO.filter((categoria) => !IDS_INGRESO.has(categoria.id)),
]);

const CATEGORIAS_POR_ID = new Map(CATEGORIAS_FILTRO.map((categoria) => [categoria.id, categoria]));

function crearFechaSinHora(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function formatearFechaCorta(fecha: Date) {
  return fecha.toLocaleDateString('es-AR');
}

function formatearSaldo(monto: number) {
  const saldo = Number(monto);
  if (!Number.isFinite(saldo)) return '—';
  return `$ ${saldo.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatearComparacionMensual(comparacion: Awaited<ReturnType<typeof consultarDetalleDeposito>>['comparacionMensual'] | null) {
  const fechaReferencia = comparacion?.fechaReferencia;
  if (!comparacion?.disponible) {
    return comparacion?.motivo === 'sin_cierre_anterior' && fechaReferencia
      ? `Este depósito no existía el ${fechaReferencia}`
      : 'No hay saldo anterior para comparar';
  }

  const diferencia = Number(comparacion.diferencia);
  if (diferencia === 0) {
    return `Sin cambios desde el ${fechaReferencia} · saldo anterior: ${formatearSaldo(comparacion.saldoAnterior)}`;
  }

  if (comparacion.porcentaje === null) {
    return `${diferencia > 0 ? 'Subió' : 'Bajó'} ${formatearSaldo(Math.abs(diferencia))} desde el ${fechaReferencia} · saldo anterior: ${formatearSaldo(comparacion.saldoAnterior)}`;
  }

  const porcentaje = Math.abs(Number(comparacion.porcentaje)).toLocaleString('es-AR', {
    maximumFractionDigits: 1,
  });
  return `${porcentaje} % ${diferencia > 0 ? 'más' : 'menos'} que el saldo del ${fechaReferencia} (${formatearSaldo(comparacion.saldoAnterior)})`;
}

function obtenerRangoSemana(fecha: Date) {
  const inicio = crearFechaSinHora(fecha);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
}

function formatearRangoSemana(fecha: Date) {
  const { inicio, fin } = obtenerRangoSemana(fecha);
  return `${formatearFechaCorta(inicio)} – ${formatearFechaCorta(fin)}`;
}

function esMovimientoDeIngreso(tipo: string) {
  return tipo === 'ingreso' || tipo === 'transferencia_entrada';
}

function ComparacionDesplazable({ texto, estilo }: { texto: string; estilo: import('react-native').StyleProp<import('react-native').TextStyle> }) {
  const desplazamiento = useRef(new Animated.Value(0)).current;
  const [anchoVisible, establecerAnchoVisible] = useState(0);
  const [anchoTexto, establecerAnchoTexto] = useState(0);
  const [reducirMovimiento, establecerReducirMovimiento] = useState(true);
  useEffect(() => {
    let activo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(valor => { if (activo) establecerReducirMovimiento(valor); });
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', establecerReducirMovimiento);
    return () => { activo = false; suscripcion.remove(); };
  }, []);
  useFocusEffect(useCallback(() => {
    desplazamiento.setValue(0);
    const distancia = Math.max(0, anchoTexto - anchoVisible);
    if (reducirMovimiento || anchoVisible === 0 || distancia <= 1) return;
    const animacion = Animated.loop(Animated.sequence([
      Animated.delay(1000),
      Animated.timing(desplazamiento, { toValue: -distancia, duration: Math.max(1500, distancia / 25 * 1000), easing: Easing.linear, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(desplazamiento, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    animacion.start();
    return () => { animacion.stop(); desplazamiento.setValue(0); };
  }, [texto, anchoTexto, anchoVisible, reducirMovimiento, desplazamiento]));
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={reducirMovimiento}
    style={{ flex: 1 }} onLayout={evento => establecerAnchoVisible(evento.nativeEvent.layout.width)}>
    <Animated.Text accessibilityLabel={texto} numberOfLines={1}
      onLayout={evento => establecerAnchoTexto(evento.nativeEvent.layout.width)}
      style={[estilo, { flex: 0, transform: [{ translateX: desplazamiento }] }]}>{texto}</Animated.Text>
  </ScrollView>;
}

export default function PantallaDetalleDeposito({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
  const operacionDepositoEnCurso=useRef(false);
  useEffect(()=>navegacion.addListener('beforeRemove',evento=>{if(operacionFinancieraEnCurso()||operacionDepositoEnCurso.current)evento.preventDefault();}),[navegacion]);
  const { width: anchoVentana } = useWindowDimensions();
  const { tema } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleDeposito(tema, anchoVentana);
  const estilosBaseFormulario = crearEstilosDeposito(tema);
  const estilosFormularioDeposito = {
    ...estilosBaseFormulario,
    formulario: { ...estilosBaseFormulario.formulario, ...estilos.formularioEdicion },
    tarjetaModal: estilos.tarjetaOpciones,
  };
  const depositoId = ruta?.params?.depositoId;
  const [deposito, establecerDeposito] = useState<import("../database/types").Deposito | null>(null);
  const [saldoVisible, establecerSaldoVisible] = useState(false);
  const [saldoAmpliado, establecerSaldoAmpliado] = useState(false);
  useEffect(()=>{establecerSaldoAmpliado(false);},[saldoVisible,depositoId]);
  const [seccionDeposito,establecerSeccionDeposito]=useState('movimientos');
  const [cantidadRecurrencias,establecerCantidadRecurrencias]=useState(0);
  const estilosFiltros = crearEstilosMovimientos(tema, anchoVentana);
  const estilosAccesos=crearEstilosBusquedaFiltros(tema);
  const [cantidadMovimientos, establecerCantidadMovimientos] = useState(0);
  const [categoriasMovimientos, establecerCategoriasMovimientos] = useState<string[]>([]);
  const [revisionMovimientos, establecerRevisionMovimientos] = useState(0);
  const [enfocada, establecerEnfocada] = useState(false);
  const [comparacionMensual, establecerComparacionMensual] = useState<Awaited<ReturnType<typeof consultarDetalleDeposito>>['comparacionMensual'] | null>(null);
  const [cargando, establecerCargando] = useState(true);
  const [errorCarga, establecerErrorCarga] = useState<string | null>(null);
  const depositoActual = useRef(deposito);
  const secuenciaCarga = useRef(0);

  const [busqueda, establecerBusqueda] = useState('');
  const [busquedaAplicada, establecerBusquedaAplicada] = useState('');
  useEffect(() => {
    const temporizador = setTimeout(() => establecerBusquedaAplicada(busqueda.trim()), 250);
    return () => clearTimeout(temporizador);
  }, [busqueda]);
  const cambiarBusqueda = (texto: string) => {
    establecerBusqueda(texto);
    if (!texto.trim()) establecerBusquedaAplicada('');
  };
  const [filtrosVisibles, establecerFiltrosVisibles] = useState(false);
  const [tipoFiltro, establecerTipoFiltro] = useState('todos');
  const [fechaFiltro, establecerFechaFiltro] = useState('todos');
  const [fechaDia, establecerFechaDia] = useState<Date | null>(null);
  const [fechaSemana, establecerFechaSemana] = useState<Date | null>(null);
  const [mesSeleccionado, establecerMesSeleccionado] = useState<Date | null>(null);
  const [anioMesVisible, establecerAnioMesVisible] = useState(() => new Date().getFullYear());
  const [fechaInicial, establecerFechaInicial] = useState<Date | null>(null);
  const [fechaFinal, establecerFechaFinal] = useState<Date | null>(null);
  const [montoMinimo, establecerMontoMinimo] = useState('');
  const [montoMaximo, establecerMontoMaximo] = useState('');
  const [categoriaFiltroIds, establecerCategoriaFiltroIds] = useState<string[]>([]);
  const [seccionesFiltrosAbiertas, establecerSeccionesFiltrosAbiertas] = useState(['tipo', 'fecha']);
  const [modalOpcionesVisible, establecerModalOpcionesVisible] = useState(false);
  const [modalEdicionVisible, establecerModalEdicionVisible] = useState(false);
  const [modalIconosEdicionVisible, establecerModalIconosEdicionVisible] = useState(false);
  const [modalEliminacionVisible, establecerModalEliminacionVisible] = useState(false);
  const [nombreEdicionEnfocado, establecerNombreEdicionEnfocado] = useState(false);
  const [descripcionEdicionEnfocada, establecerDescripcionEdicionEnfocada] = useState(false);
  const [borrador, establecerBorrador] = useState<Partial<import('../database/types').Deposito>>({});
  const [erroresEdicion, establecerErroresEdicion] = useState<Partial<Record<string, string>>>({});
  const [guardandoEdicion, establecerGuardandoEdicion] = useState(false);
  const [eliminando, establecerEliminando] = useState(false);
  const estilosFormularioEdicion = {
    ...estilosFormularioDeposito,
    botonPrincipal: {
      ...estilosFormularioDeposito.botonPrincipal,
      ...estilos.botonPrincipalModal,
    },
  };

  useEffect(() => {
    depositoActual.current = deposito;
  }, [deposito]);

  const cargarDetalle = useCallback(async () => {
    const secuencia = secuenciaCarga.current + 1;
    secuenciaCarga.current = secuencia;
    establecerErrorCarga(null);
    if(!depositoActual.current||depositoActual.current.id!==depositoId)establecerSaldoVisible(false);
    if (!depositoActual.current) establecerCargando(true);

    try {
      const [detalle,recurrencias]=await Promise.all([consultarDetalleDeposito(depositoId||''),consultarRecurrenciasDeposito(depositoId||'').catch(()=>[])]);
      if (secuencia !== secuenciaCarga.current) return;
      let saldoOculto = true;
      try {
        saldoOculto = await consultarSaldoOculto(detalle.deposito.usuario_id);
      } catch (_error) {
        mostrarAviso('No se pudo cargar la preferencia de privacidad del saldo.', { tipo: 'error' });
      }
      if (secuencia !== secuenciaCarga.current) return;
      establecerSaldoVisible(!saldoOculto);
      establecerDeposito(detalle.deposito);
      establecerComparacionMensual(detalle.comparacionMensual);
      establecerCantidadRecurrencias(recurrencias.length);
      establecerCantidadMovimientos(detalle.cantidadMovimientos);
      establecerCategoriasMovimientos(detalle.categoriasMovimientos);
      establecerRevisionMovimientos(valor => valor + 1);
    } catch (error) {
      if (secuencia !== secuenciaCarga.current) return;
      const noEncontrado = error instanceof ErrorDeposito && error.codigo === 'deposito_no_encontrado';
      const mensaje = error instanceof ErrorDeposito
        ? error.message
        : 'No se pudo cargar el depósito. Intentá nuevamente.';
      establecerDeposito(null);
      establecerCantidadMovimientos(0);
      establecerCategoriasMovimientos([]);
      establecerComparacionMensual(null);
      establecerErrorCarga(mensaje);
      if (!noEncontrado) mostrarAviso(mensaje, { tipo: 'error' });
    } finally {
      if (secuencia === secuenciaCarga.current) establecerCargando(false);
    }
  }, [depositoId, mostrarAviso]);

  useFocusEffect(useCallback(() => {
    establecerEnfocada(true);
    cargarDetalle();
    return () => {
      establecerEnfocada(false);
      secuenciaCarga.current += 1;
    };
  }, [cargarDetalle]));

  const categoriasDisponiblesFiltro = useMemo(() => {
    const idsDisponibles = new Set(categoriasMovimientos);
    const categoriasPorTipo = tipoFiltro === 'ingreso'
      ? [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO.filter((categoria) => IDS_TRANSFERENCIA.has(categoria.id))]
      : tipoFiltro === 'egreso'
        ? CATEGORIAS_EGRESO
        : CATEGORIAS_FILTRO;
    return categoriasPorTipo.filter((categoria) => seccionDeposito==='recurrentes'||idsDisponibles.has(categoria.id));
  }, [categoriasMovimientos, tipoFiltro,seccionDeposito]);

  const cambiarTipoFiltro = (tipo: SetStateAction<string>) => {
    establecerTipoFiltro(tipo);
    if (tipo === 'todos') return;
    const idsPermitidos = tipo === 'ingreso'
      ? new Set([...IDS_INGRESO, ...IDS_TRANSFERENCIA])
      : IDS_EGRESO;
    establecerCategoriaFiltroIds((ids) => ids.filter((id) => idsPermitidos.has(id)));
  };

  const alternarSeccionFiltro = (seccion: string) => {
    establecerSeccionesFiltrosAbiertas((abiertas) => (abiertas.includes(seccion)
      ? abiertas.filter((elemento) => elemento !== seccion)
      : [...abiertas, seccion]));
  };

  const abrirFiltros = () => {
    establecerFiltrosVisibles(true);
  };

  const cambiarFechaFiltro = useCallback((modo: string) => {
    if (modo === fechaFiltro) return;
    establecerFechaFiltro(modo);
    if (modo === 'dia') establecerFechaDia(new Date());
    if (modo === 'semana') establecerFechaSemana(new Date());
    if (modo === 'mes') {
      const ahora = new Date();
      establecerMesSeleccionado(new Date(ahora.getFullYear(), ahora.getMonth(), 1));
      establecerAnioMesVisible(ahora.getFullYear());
    }
    if (modo === 'personalizado') {
      establecerFechaInicial(null);
      establecerFechaFinal(null);
    }
  }, [fechaFiltro]);

  const seleccionarFechaPersonalizada = (fecha: Date) => {
    const seleccion = crearFechaSinHora(fecha);
    if (!fechaInicial || fechaFinal) {
      establecerFechaInicial(seleccion);
      establecerFechaFinal(null);
      return;
    }
    establecerFechaFinal(seleccion);
  };

  const montoMinimoNumero = montoMinimo.trim() ? convertirSaldoInicial(montoMinimo) : null;
  const montoMaximoNumero = montoMaximo.trim() ? convertirSaldoInicial(montoMaximo) : null;
  const errorMontoFiltro = montoMinimo.trim() && montoMinimoNumero === null
    ? 'Ingresá un monto mínimo válido.'
    : montoMaximo.trim() && montoMaximoNumero === null
      ? 'Ingresá un monto máximo válido.'
      : montoMinimoNumero !== null && montoMaximoNumero !== null && montoMinimoNumero > montoMaximoNumero
        ? 'El monto mínimo no puede superar al máximo.'
        : null;
  const errorFechaFiltro = fechaFiltro === 'personalizado'
    ? !fechaInicial || !fechaFinal
      ? 'Elegí una fecha desde y una fecha hasta.'
      : fechaInicial > fechaFinal
        ? 'La fecha desde debe ser anterior o igual a la fecha hasta.'
        : null
    : null;

  const filtrosConsulta = useMemo(() => {
    let inicio: Date | null = null, fin: Date | null = null;
    if (fechaFiltro === 'dia' && fechaDia) {
      inicio = crearFechaSinHora(fechaDia);
      fin = new Date(fechaDia.getFullYear(), fechaDia.getMonth(), fechaDia.getDate() + 1);
    } else if (fechaFiltro === 'semana' && fechaSemana) {
      inicio = obtenerRangoSemana(fechaSemana).inicio;
      fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7);
    } else if (fechaFiltro === 'mes' && mesSeleccionado) {
      inicio = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth(), 1);
      fin = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 1);
    } else if (fechaFiltro === 'personalizado' && fechaInicial && fechaFinal) {
      inicio = crearFechaSinHora(fechaInicial);
      fin = new Date(fechaFinal.getFullYear(), fechaFinal.getMonth(), fechaFinal.getDate() + 1);
    }
    return { busqueda: busquedaAplicada, tipo: tipoFiltro, categoriaIds: categoriaFiltroIds.length ? categoriaFiltroIds : null,
      montoMinimo: montoMinimoNumero, montoMaximo: montoMaximoNumero,
      ...(inicio && fin ? { desde: inicio.toISOString(), hasta: fin.toISOString() } : {}) };
  }, [busquedaAplicada, tipoFiltro, categoriaFiltroIds, montoMinimoNumero, montoMaximoNumero,
    fechaFiltro, fechaDia, fechaSemana, mesSeleccionado, fechaInicial, fechaFinal]);
  const consultarMeses = useCallback((criterios: import('../types/forms').FiltrosHistorial) => consultarMesesMovimientosDeposito(depositoId || '', criterios), [depositoId]);
  const consultarPagina = useCallback((criterios: import('../types/forms').FiltrosHistorial, cursor: {fecha_hora:string;id:string}|null) => consultarPaginaMovimientosDeposito(depositoId || '', criterios, cursor), [depositoId]);
  const datosMeses = useMovimientosPorMes({ habilitado: enfocada && deposito?.id === depositoId && seccionDeposito === 'movimientos',
    revision: revisionMovimientos, filtros: filtrosConsulta, invalido: !!errorMontoFiltro || !!errorFechaFiltro, consultarMeses, consultarPagina });

  const filtrosActivos = useMemo(() => {
    const filtros: {id:string;etiqueta:string;alQuitar:()=>void}[] = [];
    if (tipoFiltro !== 'todos') {
      const opcionTipo = OPCIONES_TIPO.find((opcion) => opcion.id === tipoFiltro);
      filtros.push({
        id: 'tipo',
        etiqueta: `Tipo: ${opcionTipo?.nombre || tipoFiltro}`,
        alQuitar: () => establecerTipoFiltro('todos'),
      });
    }

    if (fechaFiltro === 'dia' && fechaDia) {
      filtros.push({
        id: 'fecha',
        etiqueta: `Fecha: ${formatearFechaCorta(fechaDia)}`,
        alQuitar: () => cambiarFechaFiltro('todos'),
      });
    } else if (fechaFiltro === 'semana' && fechaSemana) {
      filtros.push({
        id: 'fecha',
        etiqueta: `Semana: ${formatearRangoSemana(fechaSemana)}`,
        alQuitar: () => cambiarFechaFiltro('todos'),
      });
    } else if (fechaFiltro === 'mes' && mesSeleccionado) {
      filtros.push({
        id: 'fecha',
        etiqueta: `Fecha: ${MESES[mesSeleccionado.getMonth()]} ${mesSeleccionado.getFullYear()}`,
        alQuitar: () => cambiarFechaFiltro('todos'),
      });
    } else if (fechaFiltro === 'personalizado' && (fechaInicial || fechaFinal)) {
      filtros.push({
        id: 'fecha',
        etiqueta: `Fecha: ${fechaInicial ? formatearFechaCorta(fechaInicial) : 'Desde'} – ${fechaFinal ? formatearFechaCorta(fechaFinal) : 'Hasta'}`,
        alQuitar: () => cambiarFechaFiltro('todos'),
      });
    }

    if (montoMinimo.trim() || montoMaximo.trim()) {
      const minimo = montoMinimo.trim() ? ('$ ' + formatearEntradaMonto(montoMinimo.trim())) : 'Sin mínimo';
      const maximo = montoMaximo.trim() ? ('$ ' + formatearEntradaMonto(montoMaximo.trim())) : 'Sin máximo';
      filtros.push({
        id: 'monto',
        etiqueta: `Monto: ${minimo} – ${maximo}`,
        alQuitar: () => {
          establecerMontoMinimo('');
          establecerMontoMaximo('');
        },
      });
    }

    categoriaFiltroIds.forEach((idCategoria) => {
      const categoria = CATEGORIAS_FILTRO.find((elemento) => elemento.id === idCategoria);
      if (!categoria) return;
      filtros.push({
        id: `categoria-${idCategoria}`,
        etiqueta: `Categoría: ${categoria.nombre}`,
        alQuitar: () => establecerCategoriaFiltroIds((ids) => ids.filter((id) => id !== idCategoria)),
      });
    });
    return filtros;
  }, [categoriaFiltroIds, cambiarFechaFiltro, fechaDia, fechaFinal, fechaInicial, fechaFiltro, fechaSemana, mesSeleccionado, montoMaximo, montoMinimo, tipoFiltro]);

  const cantidadFiltros = filtrosActivos.length;

  const limpiarFiltros = () => {
    establecerBusqueda('');
    establecerBusquedaAplicada('');
    establecerTipoFiltro('todos');
    establecerFechaFiltro('todos');
    establecerFechaDia(null);
    establecerFechaSemana(null);
    establecerMesSeleccionado(null);
    establecerAnioMesVisible(new Date().getFullYear());
    establecerFechaInicial(null);
    establecerFechaFinal(null);
    establecerMontoMinimo('');
    establecerMontoMaximo('');
    establecerCategoriaFiltroIds([]);
  };

  const resumenTipo = OPCIONES_TIPO.find((opcion) => opcion.id === tipoFiltro)?.nombre || 'Todos';
  const resumenFecha = fechaFiltro === 'dia'
    ? (fechaDia ? formatearFechaCorta(fechaDia) : 'Elegí un día')
    : fechaFiltro === 'semana'
      ? (fechaSemana ? formatearRangoSemana(fechaSemana) : 'Elegí una semana')
    : fechaFiltro === 'mes'
      ? (mesSeleccionado ? `${MESES[mesSeleccionado.getMonth()]} ${mesSeleccionado.getFullYear()}` : 'Elegí un mes')
      : fechaFiltro === 'personalizado'
        ? (fechaInicial && fechaFinal
          ? `${formatearFechaCorta(fechaInicial)} – ${formatearFechaCorta(fechaFinal)}`
          : 'Elegí un rango')
        : 'Todo';
  const resumenCategorias = categoriaFiltroIds.length === 0
    ? 'Todas'
    : CATEGORIAS_FILTRO
      .filter((categoria) => categoriaFiltroIds.includes(categoria.id))
      .map((categoria) => categoria.nombre)
      .join(', ');
  const resumenMonto = montoMinimo.trim() || montoMaximo.trim()
    ? `${montoMinimo.trim() ? ('$ ' + formatearEntradaMonto(montoMinimo.trim())) : 'Sin mínimo'} – ${montoMaximo.trim() ? ('$ ' + formatearEntradaMonto(montoMaximo.trim())) : 'Sin máximo'}`
    : 'Cualquier monto';

  const abrirEdicion = () => {
    establecerBorrador({ ...deposito });
    establecerErroresEdicion({});
    establecerModalOpcionesVisible(false);
    establecerModalEdicionVisible(true);
    establecerModalIconosEdicionVisible(false);
    establecerNombreEdicionEnfocado(false);
    establecerDescripcionEdicionEnfocada(false);
  };

  const cerrarEdicion = () => {
    if (guardandoEdicion||operacionDepositoEnCurso.current) return;
    establecerModalEdicionVisible(false);
    establecerModalIconosEdicionVisible(false);
    establecerBorrador({ ...deposito });
    establecerErroresEdicion({});
  };

  const actualizarBorrador = (propiedad: string, valor: string) => {
    establecerBorrador((actual) => ({ ...actual, [propiedad]: valor }));
    establecerErroresEdicion((actuales) => ({ ...actuales, [propiedad]: undefined }));
  };

  const guardarEdicion = async () => {
    if (guardandoEdicion || !deposito || operacionDepositoEnCurso.current) return;
    operacionDepositoEnCurso.current=true;
    establecerGuardandoEdicion(true);
    establecerErroresEdicion({});
    try {
      const actualizado = await actualizarDeposito(deposito.id, borrador as import('../types/forms').DatosDeposito);
      establecerDeposito(actualizado);
      establecerBorrador(actualizado);
      establecerModalEdicionVisible(false);
      establecerModalIconosEdicionVisible(false);
      mostrarAviso('Los cambios del depósito se guardaron.', { tipo: 'exito' });
    } catch (error) {
      if (error instanceof ErrorDeposito && error.errores) {
        establecerErroresEdicion(error.errores);
      }
      mostrarAviso(error instanceof ErrorDeposito
        ? error.message
        : 'No se pudieron guardar los cambios. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      operacionDepositoEnCurso.current=false;establecerGuardandoEdicion(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (eliminando || !deposito || operacionDepositoEnCurso.current) return;
    operacionDepositoEnCurso.current=true;
    establecerEliminando(true);
    try {
      await eliminarDeposito(deposito.id);
      establecerModalEliminacionVisible(false);
      mostrarAviso('El depósito se desactivó y su historial quedó conservado.', { tipo: 'exito' });
      operacionDepositoEnCurso.current=false;navegacion.goBack();
    } catch (error) {
      mostrarAviso(error instanceof ErrorDeposito
        ? error.message
        : 'No se pudo eliminar el depósito. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      operacionDepositoEnCurso.current=false;establecerEliminando(false);
    }
  };

  const abrirDetalleMovimiento = useCallback((movimiento: import('../types/forms').MovimientoVisible, categoria: Partial<import('../constants/movimientos').Categoria>) => {
    navegacion.push(RUTAS.DETALLE_MOVIMIENTO, { movimientoId:movimiento.id, categoria, movimiento, deposito_nombre: deposito?.nombre });
  }, [navegacion, deposito?.nombre]);

  const cumpleFiltros = useCallback((movimiento: Pick<import('../database/types').Movimiento, 'tipo' | 'descripcion' | 'categoria' | 'monto' | 'fecha_hora'>) => {
    if(errorMontoFiltro||errorFechaFiltro)return false;
    const texto=busquedaAplicada.trim().toLocaleLowerCase('es-AR');
    const minimo=montoMinimo.trim()?montoMinimoNumero:null,maximo=montoMaximo.trim()?montoMaximoNumero:null;
      if (tipoFiltro === 'ingreso' && !esMovimientoDeIngreso(movimiento.tipo)) return false;
      if (tipoFiltro === 'egreso' && esMovimientoDeIngreso(movimiento.tipo)) return false;
      const categoria = CATEGORIAS_POR_ID.get(movimiento.categoria);
      const textoBuscable = `${movimiento.descripcion || ''} ${categoria?.nombre || ''} ${movimiento.categoria || ''}`.toLocaleLowerCase('es-AR');
      if (texto && !textoBuscable.includes(texto)) return false;
      if (categoriaFiltroIds.length > 0 && !categoriaFiltroIds.includes(movimiento.categoria)) return false;
      if (minimo !== null && movimiento.monto < minimo) return false;
      if (maximo !== null && movimiento.monto > maximo) return false;

      const fecha = new Date(movimiento.fecha_hora);
      if (fechaFiltro === 'dia' && fechaDia) {
        if (fecha.getFullYear() !== fechaDia.getFullYear()
          || fecha.getMonth() !== fechaDia.getMonth()
          || fecha.getDate() !== fechaDia.getDate()) return false;
      }
      if (fechaFiltro === 'semana' && fechaSemana) {
        const { inicio, fin } = obtenerRangoSemana(fechaSemana);
        if (fecha < inicio || fecha > fin) return false;
      }
      if (fechaFiltro === 'mes' && mesSeleccionado) {
        if (fecha.getMonth() !== mesSeleccionado.getMonth()
          || fecha.getFullYear() !== mesSeleccionado.getFullYear()) return false;
      }
      if (fechaFiltro === 'personalizado' && fechaInicial && fechaFinal) {
        const inicio = crearFechaSinHora(fechaInicial);
        const fin = new Date(fechaFinal.getFullYear(), fechaFinal.getMonth(), fechaFinal.getDate(), 23, 59, 59, 999);
        if (fecha < inicio || fecha > fin) return false;
      }
      return true;
  }, [
    errorMontoFiltro, errorFechaFiltro, busquedaAplicada, montoMinimo, montoMaximo,
    montoMinimoNumero, montoMaximoNumero, tipoFiltro, categoriaFiltroIds,
    fechaFiltro, fechaDia, fechaSemana, mesSeleccionado, fechaInicial, fechaFinal,
  ]);
  const categoriasContexto=seccionDeposito==='recurrentes'?CATEGORIAS_FILTRO:categoriasDisponiblesFiltro;
  const preajustesCategorias=obtenerPreajustesMovimientos(tipoFiltro,categoriasContexto.map(c=>({...c,tipo:IDS_INGRESO.has(c.id)?'ingreso':'egreso'})));

  const direccionComparacion = comparacionMensual?.disponible
    ? comparacionMensual.diferencia > 0
      ? 'positivo'
      : comparacionMensual.diferencia < 0
        ? 'negativo'
        : 'neutral'
    : 'neutral';

  const saldoFormateado = deposito ? formatearSaldo(deposito.saldo_actual) : '';
  const saldoLargo = saldoVisible && saldoFormateado.length > 12;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
      <MarcoEncabezado style={estilosGlobales.pantalla} tema={tema} encabezado={<EncabezadoSeccion
          tema={tema}
          titulo="Detalle de depósito"
          descripcion="Consultá el saldo y los movimientos de este depósito."
          alVolver={() => navegacion.goBack()}
        />}>

        <DesplazamientoEncabezado ref={datosMeses.referenciaScroll} {...datosMeses.eventosScroll} alVolverAlInicio={datosMeses.detenerDesplazamiento} contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {cargando ? (
            <View style={estilos.estadoVacio}>
              <ActivityIndicator color={tema.foco} size="large" />
              <Text style={estilosGlobales.textoSecundario}>Cargando depósito…</Text>
            </View>
          ) : errorCarga || !deposito ? (
            <View style={estilos.estadoVacio}>
              <Ionicons color={tema.error} name="alert-circle-outline" size={32} />
              <Text style={estilosGlobales.etiqueta}>{errorCarga || 'No se encontró el depósito.'}</Text>
              {errorCarga ? (
                <Pressable accessibilityRole="button" onPress={cargarDetalle} style={estilos.botonLimpiar}>
                  <Text style={estilos.textoBotonLimpiar}>Intentar nuevamente</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
          <>
          <View style={[estilosGlobales.tarjeta, estilos.tarjetaDeposito]}>
            <View style={estilos.encabezadoDeposito}>
              <View style={estilos.identidadDeposito}>
                <View style={[estilos.iconoDeposito,{backgroundColor:deposito.color || COLOR_DEPOSITO_PREDETERMINADO}]}>
                  <Ionicons color={COLOR_ICONO_DEPOSITO} name={(deposito.icono || 'wallet-outline') as NombreIcono} size={30}/>
                </View>
                <View style={estilos.datosDeposito}>
                  <Text style={estilos.nombreDeposito}>{deposito.nombre}</Text>
                  <Text style={estilos.tipoDeposito}>{TIPOS_DEPOSITO.find(tipo=>tipo.id===deposito.tipo)?.nombre || deposito.tipo}</Text>
                </View>
              </View>
              <Pressable style={estilos.resumenSaldo} disabled={!saldoLargo}
                accessibilityRole={saldoLargo ? 'button' : undefined}
                accessibilityLabel={saldoVisible ? 'Saldo: ' + saldoFormateado : 'Saldo oculto'}
                accessibilityHint={saldoLargo ? 'Abre el saldo completo.' : undefined}
                onPress={() => establecerSaldoAmpliado(true)}>
                <View style={estilos.encabezadoSaldo}>
                  <Text style={estilos.etiquetaSaldo}>Saldo</Text>
                  {saldoLargo ? <Ionicons name="expand-outline" size={16} color={tema.foco} accessible={false}/> : null}
                </View>
                <Text selectable={saldoVisible && !saldoLargo} numberOfLines={1} ellipsizeMode="middle" adjustsFontSizeToFit={!saldoLargo} style={estilos.saldo}>{saldoVisible ? saldoFormateado : '$ •••••••'}</Text>
              </Pressable>
            </View>
            <View style={estilos.seccionDescripcion}>
              <Text style={estilos.etiquetaSaldo}>Descripción</Text>
              <Text selectable style={estilos.descripcionDeposito}>{deposito.descripcion || 'Sin descripción'}</Text>
            </View>
            <View style={estilos.seccionComparacion}>
              <View style={estilos.resumenComparacion}>
                <Text style={estilos.etiquetaSaldo}>Variación mensual</Text>
              <View style={estilos.comparacionSaldo}>
                {saldoVisible ? <>
                  <Ionicons
                    color={direccionComparacion === 'positivo'
                      ? tema.exito
                      : direccionComparacion === 'negativo'
                        ? tema.error
                        : tema.textoSecundario}
                    name={direccionComparacion === 'positivo'
                      ? 'trending-up-outline'
                      : direccionComparacion === 'negativo'
                        ? 'trending-down-outline'
                        : 'remove-outline'}
                    size={16}
                  />
                  <ComparacionDesplazable texto={formatearComparacionMensual(comparacionMensual)} estilo={[
                    estilos.textoComparacion,
                    direccionComparacion === 'positivo'
                      ? estilos.textoComparacionPositiva
                      : direccionComparacion === 'negativo'
                        ? estilos.textoComparacionNegativa
                        : estilos.textoComparacionNeutral,
                  ]} />
                </> : <>
                  <Ionicons color={tema.textoSecundario} name="eye-off-outline" size={16} />
                  <Text style={[estilos.textoComparacion, estilos.textoComparacionNeutral]}>
                    Variación mensual oculta
                  </Text>
                </>}
              </View>
              </View>
              <Pressable accessibilityLabel="Opciones del depósito" accessibilityRole="button" onPress={() => establecerModalOpcionesVisible(true)} style={estilos.botonOpciones}>
                <Ionicons color={tema.textoSecundario} name="ellipsis-horizontal" size={22}/>
              </Pressable>
            </View>
          </View>

          <View style={estilos.seccionMovimientos}>
            <SelectorSegmentado tema={tema} opciones={[{id:'movimientos',nombre:'Movimientos'},{id:'recurrentes',nombre:'Recurrentes'+(cantidadRecurrencias?' · '+cantidadRecurrencias:'')}]} valor={seccionDeposito} alSeleccionar={establecerSeccionDeposito} etiqueta="Sección del depósito"/>
            <BuscadorFiltrosMovimientos tema={tema} busqueda={busqueda} alBuscar={cambiarBusqueda} alAbrirFiltros={abrirFiltros} alLimpiar={limpiarFiltros} filtrosActivos={filtrosActivos} cantidad={cantidadFiltros}>
              <FiltrosRapidosMovimientos estilosAccesos={estilosAccesos}
                tipoFiltro={tipoFiltro} cambiarTipoFiltro={cambiarTipoFiltro} establecerTipoFiltro={establecerTipoFiltro}
                preajustesCategorias={preajustesCategorias} categoriaFiltroIds={categoriaFiltroIds} establecerCategoriaFiltroIds={establecerCategoriaFiltroIds}
                montoMinimoNumerico={montoMinimoNumero} montoMaximoNumerico={montoMaximoNumero}
                errorMontoFiltro={errorMontoFiltro} establecerMontoMinimo={establecerMontoMinimo} establecerMontoMaximo={establecerMontoMaximo}/>
            </BuscadorFiltrosMovimientos>
            {seccionDeposito==='recurrentes'&&depositoId?<PanelRecurrencias depositoId={depositoId} tema={tema} alCambiar={()=>{void cargarDetalle();}} alCambiarCantidad={establecerCantidadRecurrencias} filtrar={fila=>cumpleFiltros({...fila,fecha_hora:fila.proxima_ejecucion})}/>:null}
            {seccionDeposito==='movimientos'?<>
              {datosMeses.cargando ? <ActivityIndicator color={tema.foco} accessibilityLabel="Cargando meses del depósito"/> : datosMeses.error ? (
                <View style={estilos.estadoVacio}>
                  <Text style={estilosGlobales.textoError}>{datosMeses.error}</Text>
                  <Pressable accessibilityRole="button" onPress={datosMeses.reintentar} style={estilos.botonLimpiar}><Text style={estilos.textoBotonLimpiar}>Reintentar</Text></Pressable>
                </View>
              ) : datosMeses.meses.length ? <ListaMesesMovimientos datos={datosMeses} tema={tema} alPresionar={abrirDetalleMovimiento}/> : (
                <View style={estilos.estadoVacio}>
                  <Text style={estilosGlobales.textoSecundario}>{cantidadMovimientos === 0 ? 'Este depósito todavía no tiene movimientos.' : busquedaAplicada.trim() ? 'Sin resultados para la búsqueda.' : 'Sin resultados para los filtros elegidos.'}</Text>
                  {cantidadMovimientos > 0 ? <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}><Text style={estilos.textoBotonLimpiar}>Limpiar filtros</Text></Pressable> : null}
                </View>
              )}
            </>:null}
          </View>
          </>
          )}
        </DesplazamientoEncabezado>
      </MarcoEncabezado>

      <PanelFiltrosMovimientos tema={tema} filtrosVisibles={filtrosVisibles} alCerrar={()=>establecerFiltrosVisibles(false)} limpiarFiltros={limpiarFiltros} cantidadFiltros={cantidadFiltros}>
              <View style={estilosFiltros.listaSeccionesFiltro}>
                <FiltroTipoMovimientos tema={tema} estilos={estilosFiltros} estilosChips={estilosAccesos} resumen={resumenTipo}
                    abierta={seccionesFiltrosAbiertas.includes('tipo')} alAlternar={() => alternarSeccionFiltro('tipo')}
                    tipoFiltro={tipoFiltro} cambiarTipoFiltro={cambiarTipoFiltro}
                  />

                <FiltroFechaMovimientos tema={tema} estilos={estilosFiltros} estilosChips={estilosAccesos} resumen={resumenFecha}
                    abierta={seccionesFiltrosAbiertas.includes('fecha')} alAlternar={() => alternarSeccionFiltro('fecha')}
                    estilosSelectores={estilos} estilosGlobales={estilosGlobales}
                    fechaFiltro={fechaFiltro} cambiarFechaFiltro={cambiarFechaFiltro}
                    fechaDia={fechaFiltro === 'semana' ? fechaSemana : fechaDia} establecerFechaDia={fechaFiltro === 'semana' ? establecerFechaSemana : establecerFechaDia}
                    anioMesVisible={anioMesVisible} establecerAnioMesVisible={establecerAnioMesVisible}
                    mesSeleccionado={mesSeleccionado} establecerMesSeleccionado={establecerMesSeleccionado}
                    fechaInicial={fechaInicial} fechaFinal={fechaFinal}
                    seleccionarFechaPersonalizada={seleccionarFechaPersonalizada} errorFechaFiltro={errorFechaFiltro}
                  />

                <FiltroCategoriasMovimientos tema={tema} estilos={estilosFiltros} resumen={resumenCategorias}
                    abierta={seccionesFiltrosAbiertas.includes('categorias')} alAlternar={() => alternarSeccionFiltro('categorias')}
                    estilosSelectores={estilos} estilosGlobales={estilosGlobales}
                    categoriasDisponiblesFiltro={categoriasDisponiblesFiltro}
                    categoriaFiltroIds={categoriaFiltroIds} establecerCategoriaFiltroIds={establecerCategoriaFiltroIds}
                  />

                <FiltroMontoMovimientos tema={tema} estilos={estilosFiltros} resumen={resumenMonto}
                    abierta={seccionesFiltrosAbiertas.includes('monto')} alAlternar={() => alternarSeccionFiltro('monto')}
                    estilosGlobales={estilosGlobales} montoMinimo={montoMinimo} establecerMontoMinimo={establecerMontoMinimo}
                    montoMaximo={montoMaximo} establecerMontoMaximo={establecerMontoMaximo} errorMontoFiltro={errorMontoFiltro}
                  />
              </View>
      </PanelFiltrosMovimientos>

      <Modal animationType="fade" transparent visible={saldoAmpliado && saldoVisible && Boolean(deposito)} onRequestClose={()=>establecerSaldoAmpliado(false)}>
        <SafeAreaView style={estilos.fondoModalOpciones}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar saldo completo" style={estilos.fondoCierre} onPress={()=>establecerSaldoAmpliado(false)}/>
          <View accessibilityViewIsModal style={estilos.tarjetaOpciones}>
            <View style={estilos.encabezadoOpciones}>
              <Text accessibilityRole="header" style={[estilos.tituloOpciones,{flex:1}]}>Saldo del depósito</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" style={estilos.botonCerrarModal} onPress={()=>establecerSaldoAmpliado(false)}><Ionicons name="close" size={24} color={tema.textoSecundario}/></Pressable>
            </View>
            <Text style={estilos.descripcionOpciones}>{deposito?.nombre}</Text>
            <View style={estilos.valorSaldoCompleto}>
              <ScrollView horizontal showsHorizontalScrollIndicator><Text selectable style={estilos.saldoCompleto}>{saldoVisible && deposito?formatearSaldo(deposito.saldo_actual):'$ •••••••'}</Text></ScrollView>
            </View>
            <Text style={estilos.descripcionOpciones}>Podés deslizar el saldo para verlo completo y mantenerlo presionado para copiarlo.</Text>
            <Pressable accessibilityRole="button" style={estilosGlobales.botonPrincipal} onPress={()=>establecerSaldoAmpliado(false)}><Text style={estilosGlobales.textoBotonPrincipal}>Cerrar</Text></Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => establecerModalOpcionesVisible(false)} transparent visible={modalOpcionesVisible}>
        <View style={estilos.fondoModalOpciones}>
          <Pressable style={estilos.fondoCierre} onPress={() => establecerModalOpcionesVisible(false)} />
          <View accessibilityViewIsModal style={estilos.tarjetaOpciones}>
            <View style={estilos.encabezadoOpciones}>
              <View style={estilos.detalleEncabezadoOpciones}>
                <Text style={estilos.tituloOpciones}>Opciones del depósito</Text>
                <Text style={estilos.descripcionOpciones}>Elegí qué querés hacer con este depósito.</Text>
              </View>
              <Pressable
                accessibilityLabel="Cerrar opciones"
                accessibilityRole="button"
                onPress={() => establecerModalOpcionesVisible(false)}
                style={estilos.botonCerrarModal}
              >
                <Ionicons color={tema.textoSecundario} name="close" size={22} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={abrirEdicion}
              style={({ pressed }) => [estilos.opcionModal, pressed ? estilos.opcionPresionada : null]}
            >
              <View style={estilos.iconoOpcionModal}>
                <Ionicons color={tema.foco} name="create-outline" size={21} />
              </View>
              <View style={estilos.detalleOpcionModal}>
                <Text style={estilos.tituloOpcionModal}>Editar depósito</Text>
                <Text style={estilos.subtituloOpcionModal}>Cambiar nombre, tipo y apariencia</Text>
              </View>
              <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
            </Pressable>
            <View style={estilos.separadorOpcionModal} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                establecerModalOpcionesVisible(false);
                establecerModalEliminacionVisible(true);
              }}
              style={({ pressed }) => [estilos.opcionModal, pressed ? estilos.opcionPresionada : null]}
            >
              <View style={[estilos.iconoOpcionModal, estilos.iconoOpcionEliminar]}>
                <Ionicons color={tema.error} name="trash-outline" size={21} />
              </View>
              <View style={estilos.detalleOpcionModal}>
                <Text style={[estilos.tituloOpcionModal, estilos.textoOpcionEliminar]}>Eliminar depósito</Text>
                <Text style={estilos.subtituloOpcionModal}>El historial de movimientos se conserva</Text>
              </View>
              <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={cerrarEdicion} transparent visible={modalEdicionVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.fondoModal}>
          <View accessibilityViewIsModal style={estilos.tarjetaEdicion}>
            <View style={estilos.encabezadoModal}>
              <View style={estilos.detalleEncabezadoEdicion}>
                <Text style={estilos.tituloEdicion}>Editar depósito</Text>
                <Text style={estilos.subtituloEdicion}>Actualizá los datos de tu depósito.</Text>
              </View>
              <Pressable
                accessibilityLabel="Cerrar edición"
                accessibilityRole="button"
                onPress={cerrarEdicion}
                style={estilos.botonCerrarModal}
              >
                <Ionicons color={tema.textoSecundario} name="close" size={24} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={estilosFormularioDeposito.formulario}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={estilos.contenidoModal}
            >
              <FormularioDeposito
                tema={tema} estilos={estilosFormularioDeposito} estilosGlobales={estilosGlobales} variante="edicion"
                valores={borrador} errores={erroresEdicion} alCambiar={(campo, valor) => actualizarBorrador(campo, valor || '')}
                focoNombre={{ enfocado: nombreEdicionEnfocado, alCambiar: establecerNombreEdicionEnfocado }}
                focoDescripcion={{ enfocado: descripcionEdicionEnfocada, alCambiar: establecerDescripcionEdicionEnfocada }}
                iconosAdicionalesVisibles={modalIconosEdicionVisible} alAbrirIconos={() => establecerModalIconosEdicionVisible(true)}
              />
            </ScrollView>
            <View style={estilos.accionesEdicion}>
              <Pressable accessibilityRole="button" onPress={cerrarEdicion} style={estilos.botonSecundarioModal}>
                <Text style={estilos.textoSecundarioModal}>Cancelar</Text>
              </Pressable>
              <BotonPrincipal
                estilosAutenticacion={estilosFormularioEdicion}
                estilosGlobales={estilosGlobales}
                titulo="Guardar cambios"
                cargando={guardandoEdicion}
                deshabilitado={guardandoEdicion}
                alPresionar={guardarEdicion}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ModalIconosDeposito
        tema={tema} estilos={estilosFormularioDeposito} estiloFondo={estilos.fondoModal} variante="edicion"
        visible={modalIconosEdicionVisible} icono={borrador.icono}
        alCerrar={() => establecerModalIconosEdicionVisible(false)}
        alSeleccionar={icono => { actualizarBorrador('icono', icono); establecerModalIconosEdicionVisible(false); }}
      />

      <Modal animationType="fade" onRequestClose={() => {if(!operacionDepositoEnCurso.current)establecerModalEliminacionVisible(false);}} transparent visible={modalEliminacionVisible && Boolean(deposito)}>
        <View style={estilos.fondoModal}>
          <Pressable style={estilos.fondoCierre} disabled={eliminando} onPress={() => {if(!operacionDepositoEnCurso.current)establecerModalEliminacionVisible(false);}} />
          <View accessibilityViewIsModal style={estilos.tarjetaConfirmacion}>
            <View style={estilos.encabezadoConfirmacion}>
              <View style={estilos.iconoEliminar}>
                <Ionicons color={tema.error} name="trash-outline" size={25} />
              </View>
              <Pressable
                accessibilityLabel="Cerrar confirmación"
                accessibilityRole="button"
                disabled={eliminando} onPress={() => {if(!operacionDepositoEnCurso.current)establecerModalEliminacionVisible(false);}}
                style={estilos.botonCerrarModal}
              >
                <Ionicons color={tema.textoSecundario} name="close" size={22} />
              </Pressable>
            </View>
            <View style={estilos.detalleConfirmacion}>
              <Text style={estilos.tituloConfirmacion}>Eliminar depósito</Text>
              <Text style={estilos.textoConfirmacion}>
                ¿Querés eliminar este depósito?
              </Text>
            </View>
            <View style={estilos.resumenDepositoEliminar}>
              <View style={[estilos.iconoDepositoEliminar, { backgroundColor: deposito?.color || COLOR_DEPOSITO_PREDETERMINADO }]}>
                <Ionicons color={COLOR_ICONO_DEPOSITO} name={(deposito?.icono || 'wallet-outline') as NombreIcono} size={21} />
              </View>
              <View style={estilos.datosDepositoEliminar}>
                <Text numberOfLines={1} style={estilos.nombreDepositoEliminar}>{deposito?.nombre}</Text>
                <Text style={estilos.tipoDepositoEliminar}>
                  {TIPOS_DEPOSITO.find((tipo) => tipo.id === deposito?.tipo)?.nombre || deposito?.tipo}
                </Text>
              </View>
            </View>
            <View style={estilos.avisoEliminar}>
              <Ionicons color={tema.error} name="information-circle-outline" size={20} />
              <Text style={estilos.textoAvisoEliminar}>
                El depósito se desactivará y sus movimientos permanecerán en el historial.
              </Text>
            </View>
            <View style={estilos.accionesModal}>
              <Pressable accessibilityRole="button" disabled={eliminando} onPress={() => {if(!operacionDepositoEnCurso.current)establecerModalEliminacionVisible(false);}} style={estilos.botonSecundarioModal}>
                <Text style={estilos.textoSecundarioModal}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={eliminando}
                onPress={confirmarEliminacion}
                style={estilos.botonEliminar}
              >
                {eliminando
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={estilos.textoEliminar}>Eliminar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
