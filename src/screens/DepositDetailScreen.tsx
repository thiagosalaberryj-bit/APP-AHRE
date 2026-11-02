import type { NombreIcono } from '../constants/movimientos';
import { useContext, useCallback, useEffect, useMemo, useRef, useState, SetStateAction } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import BotonPrincipal from '../components/PrimaryButton';
import SelectorCategoria from '../components/CategorySelector';
import SelectorFecha from '../components/DateSelector';
import EncabezadoSeccion from '../components/SectionHeader';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { RUTAS } from '../constants/routes';
import { actualizarDeposito, consultarDetalleDeposito, eliminarDeposito, ErrorDeposito } from '../deposits/depositService';
import { consultarSaldoOculto, guardarSaldoOculto } from '../profile/balanceVisibilityService';
import { convertirSaldoInicial } from '../utils/depositValidation';
import { COLOR_DEPOSITO_PREDETERMINADO, COLOR_ICONO_DEPOSITO, COLORES_DEPOSITOS, COLORES_ESTADO } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDetalleDeposito } from '../styles/DepositDetailScreenStyles';
import { crearEstilosDeposito } from '../styles/DepositScreenStyles';

const TIPOS_DEPOSITO = Object.freeze([
  Object.freeze({ id: 'efectivo', nombre: 'Efectivo', icono: 'cash-outline' }),
  Object.freeze({ id: 'banco', nombre: 'Banco', icono: 'business-outline' }),
  Object.freeze({ id: 'billetera_virtual', nombre: 'Billetera virtual', icono: 'phone-portrait-outline' }),
]);
const ICONOS_DEPOSITO = Object.freeze([
  { nombre: 'cash-outline', etiqueta: 'Efectivo' },
  { nombre: 'business-outline', etiqueta: 'Banco' },
  { nombre: 'phone-portrait-outline', etiqueta: 'Virtual' },
  { nombre: 'wallet-outline', etiqueta: 'Billetera' },
  { nombre: 'card-outline', etiqueta: 'Tarjeta' },
  { nombre: 'briefcase-outline', etiqueta: 'Ahorros' },
]);
const ICONOS_PRINCIPALES = ICONOS_DEPOSITO.slice(0, 4);
const ICONOS_ADICIONALES = ICONOS_DEPOSITO.slice(4);
const NOMBRES_COLORES_DEPOSITO = Object.freeze(['Verde suave', 'Violeta', 'Rosa', 'Amarillo suave']);
const COLORES_SELECTOR = Object.freeze(
  COLORES_DEPOSITOS
    .filter((color) => color !== COLOR_DEPOSITO_PREDETERMINADO)
    .map((valor, indice) => ({ valor, nombre: NOMBRES_COLORES_DEPOSITO[indice] })),
);
const OPCIONES_TIPO = Object.freeze([
  Object.freeze({ id: 'todos', nombre: 'Todos' }),
  Object.freeze({ id: 'ingreso', nombre: 'Ingresos' }),
  Object.freeze({ id: 'egreso', nombre: 'Egresos' }),
]);
const OPCIONES_FECHA = Object.freeze([
  Object.freeze({ id: 'todos', nombre: 'Todo' }),
  Object.freeze({ id: 'dia', nombre: 'Día' }),
  Object.freeze({ id: 'semana', nombre: 'Semana' }),
  Object.freeze({ id: 'mes', nombre: 'Mes' }),
  Object.freeze({ id: 'personalizado', nombre: 'Personalizado' }),
]);
const IDS_INGRESO = new Set(CATEGORIAS_INGRESO.map((categoria) => categoria.id));
const IDS_EGRESO = new Set(CATEGORIAS_EGRESO.map((categoria) => categoria.id));
const IDS_TRANSFERENCIA = new Set(['transferencias']);
const MESES = Object.freeze([
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]);
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

function formatearFechaHora(fechaHora: string|number|Date) {
  return new Date(fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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

function obtenerNombreTipoMovimiento(tipo: string) {
  if (tipo === 'transferencia_entrada') return 'Transferencia recibida';
  if (tipo === 'transferencia_salida') return 'Transferencia enviada';
  return esMovimientoDeIngreso(tipo) ? 'Ingreso' : 'Egreso';
}

function TarjetaMovimientoDeposito({ tema, estilos, movimiento, alPresionar }: {tema:import('../styles/colors').Tema;estilos:ReturnType<typeof crearEstilosDetalleDeposito>;movimiento:import('../types/forms').MovimientoVisible;alPresionar:(movimiento:import('../types/forms').MovimientoVisible,categoria:Partial<import('../constants/movimientos').Categoria>)=>void}) {
  const categoria: Partial<import('../constants/movimientos').Categoria> = CATEGORIAS_POR_ID.get(movimiento.categoria) || {};
  const esIngreso = esMovimientoDeIngreso(movimiento.tipo);
  const monto = Number(movimiento.monto);
  const textoMonto = Number.isFinite(monto)
    ? `${esIngreso ? '+' : '−'}$${Math.abs(monto).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`
    : '—';

  return (
    <Pressable
      accessibilityLabel={`${obtenerNombreTipoMovimiento(movimiento.tipo)}: ${movimiento.descripcion || categoria.nombre || 'Movimiento'}`}
      accessibilityRole="button"
      onPress={() => alPresionar(movimiento, categoria)}
      style={({ pressed }) => [estilos.filaMovimiento, pressed ? estilos.filaPresionada : null]}
    >
      <View style={[estilos.iconoMovimiento, { backgroundColor: esIngreso ? COLORES_ESTADO.ingreso : COLORES_ESTADO.egreso }]}>
        <Ionicons color={tema.encabezado} name={categoria.icono || 'swap-horizontal-outline'} size={20} />
      </View>
      <View style={estilos.detalleMovimiento}>
        <View style={estilos.filaCategoriaDescripcion}>
          <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.categoriaMovimiento}>
            {categoria.nombre || movimiento.categoria}
          </Text>
          <Text style={estilos.separadorMetadatos}>·</Text>
          <Text ellipsizeMode="tail" numberOfLines={1} style={[estilos.categoriaMovimiento, estilos.descripcionEnLinea]}>
            {movimiento.descripcion || categoria.nombre || 'Movimiento'}
          </Text>
        </View>
        <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.metaMovimiento}>
          {formatearFechaHora(movimiento.fecha_hora)} · {movimiento.deposito_nombre}
        </Text>
        <Text style={estilos.tipoMovimiento}>{obtenerNombreTipoMovimiento(movimiento.tipo)}</Text>
      </View>
      <Text style={estilos.montoMovimiento}>{textoMonto}</Text>
    </Pressable>
  );
}

function formatearFechaDia(fecha: Date) {
  const hoy = crearFechaSinHora(new Date());
  const fechaNormalizada = crearFechaSinHora(fecha);
  const diferenciaDias = Math.round((hoy.getTime() - fechaNormalizada.getTime()) / 86400000);
  if (diferenciaDias === 0) return 'Hoy';
  if (diferenciaDias === 1) return 'Ayer';
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

function agruparMovimientosPorDia(movimientos: import('../types/forms').MovimientoVisible[]) {
  return movimientos.reduce<{clave:string;fecha:Date;movimientos:import('../types/forms').MovimientoVisible[]}[]>((grupos, movimiento) => {
    const fecha = new Date(movimiento.fecha_hora);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
    let grupo = grupos[grupos.length - 1];
    if (!grupo || grupo.clave !== clave) {
      grupo = { clave, fecha, movimientos: [] };
      grupos.push(grupo);
    }
    grupo.movimientos.push(movimiento);
    return grupos;
  }, []);
}

function SeccionFiltro({ titulo, resumen, abierta, alAlternar, colorAcento, estilos, children }: {titulo:string;resumen:string;abierta:boolean;alAlternar:()=>void;colorAcento:string;estilos:ReturnType<typeof crearEstilosDetalleDeposito>;children:import('react').ReactNode}) {
  return (
    <View style={estilos.seccionFiltro}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        onPress={alAlternar}
        style={estilos.encabezadoSeccionFiltro}
      >
        <View style={estilos.detalleEncabezadoSeccionFiltro}>
          <View style={[estilos.acentoSeccionFiltro, { backgroundColor: colorAcento }]} />
          <View style={estilos.textosEncabezadoSeccionFiltro}>
            <Text numberOfLines={1} style={estilos.tituloSeccionFiltro}>{titulo}</Text>
            {!abierta ? <Text numberOfLines={1} style={estilos.resumenSeccionFiltro}>{resumen}</Text> : null}
          </View>
        </View>
        <Ionicons color={colorAcento} name={abierta ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>
      {abierta ? <View style={estilos.contenidoSeccionFiltro}>{children}</View> : null}
    </View>
  );
}

export default function PantallaDetalleDeposito({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
  const { height: altoVentana, width: anchoVentana } = useWindowDimensions();
  const { tema } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleDeposito(tema, anchoVentana);
  const estilosFormularioDeposito = crearEstilosDeposito(tema);
  const depositoId = ruta?.params?.depositoId;
  const [deposito, establecerDeposito] = useState<import("../database/types").Deposito | null>(null);
  const [saldoVisible, establecerSaldoVisible] = useState(true);
  const [guardandoVisibilidadSaldo, establecerGuardandoVisibilidadSaldo] = useState(false);
  const [movimientos, establecerMovimientos] = useState<{ deposito_nombre: string; id: string; deposito_id: string; categoria: string; recurrencia_id: string | null; transferencia_id: string | null; tipo: "ingreso" | "egreso" | "transferencia_salida" | "transferencia_entrada"; monto: number; descripcion: string; fecha_hora: string; anulado: number; reversion_de_id: string | null; fecha_creacion: string; fecha_actualizacion: string; }[]>([]);
  const [comparacionMensual, establecerComparacionMensual] = useState<Awaited<ReturnType<typeof consultarDetalleDeposito>>['comparacionMensual'] | null>(null);
  const [cargando, establecerCargando] = useState(true);
  const [errorCarga, establecerErrorCarga] = useState<string | null>(null);
  const depositoActual = useRef(deposito);
  const secuenciaCarga = useRef(0);

  const [busqueda, establecerBusqueda] = useState('');
  const [buscadorEnfocado, establecerBuscadorEnfocado] = useState(false);
  const [filtrosVisibles, establecerFiltrosVisibles] = useState(false);
  const [bordesDesplazamientoFecha, establecerBordesDesplazamientoFecha] = useState({
    izquierda: false,
    derecha: false,
  });
  const medidasDesplazamientoFecha = useRef({
    anchoContenido: 0,
    anchoVisible: 0,
    desplazamiento: 0,
  });
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
  const tipoSeleccionado = TIPOS_DEPOSITO.find((opcion) => opcion.id === borrador.tipo)?.id;
  const colorBorrador = borrador.color || COLOR_DEPOSITO_PREDETERMINADO;
  const opcionColorSeleccionado = COLORES_SELECTOR.find((opcion) => opcion.valor === colorBorrador);
  const iconoFueraDeVista = !ICONOS_PRINCIPALES.some((opcion) => opcion.nombre === borrador.icono);
  const estilosFormularioEdicion = {
    ...estilosFormularioDeposito,
    botonPrincipal: {
      ...estilosFormularioDeposito.botonPrincipal,
      ...estilos.botonPrincipalModal,
    },
  };
  const opacidadOverlay = useRef(new Animated.Value(0)).current;
  const desplazamientoPanel = useRef(new Animated.Value(0)).current;
  const guardadoVisibilidadEnCurso = useRef(false);

  useEffect(() => {
    depositoActual.current = deposito;
  }, [deposito]);

  const cargarDetalle = useCallback(async () => {
    const secuencia = secuenciaCarga.current + 1;
    secuenciaCarga.current = secuencia;
    establecerErrorCarga(null);
    establecerSaldoVisible(false);
    if (!depositoActual.current) establecerCargando(true);

    try {
      const detalle = await consultarDetalleDeposito(depositoId || '');
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
      establecerMovimientos(detalle.movimientos.map((movimiento) => ({
        ...movimiento,
        deposito_nombre: detalle.deposito.nombre,
      })));
    } catch (error) {
      if (secuencia !== secuenciaCarga.current) return;
      const noEncontrado = error instanceof ErrorDeposito && error.codigo === 'deposito_no_encontrado';
      const mensaje = error instanceof ErrorDeposito
        ? error.message
        : 'No se pudo cargar el depósito. Intentá nuevamente.';
      establecerDeposito(null);
      establecerMovimientos([]);
      establecerComparacionMensual(null);
      establecerErrorCarga(mensaje);
      if (!noEncontrado) mostrarAviso(mensaje, { tipo: 'error' });
    } finally {
      if (secuencia === secuenciaCarga.current) establecerCargando(false);
    }
  }, [depositoId, mostrarAviso]);

  const alternarVisibilidadSaldo = async () => {
    if (!deposito || guardadoVisibilidadEnCurso.current) return;

    const visibleAnterior = saldoVisible;
    const visibleNuevo = !visibleAnterior;
    guardadoVisibilidadEnCurso.current = true;
    establecerGuardandoVisibilidadSaldo(true);
    establecerSaldoVisible(visibleNuevo);

    try {
      await guardarSaldoOculto(deposito.usuario_id, !visibleNuevo);
    } catch (_error) {
      establecerSaldoVisible(visibleAnterior);
      mostrarAviso('No se pudo guardar esta preferencia. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      guardadoVisibilidadEnCurso.current = false;
      establecerGuardandoVisibilidadSaldo(false);
    }
  };

  useFocusEffect(useCallback(() => {
    cargarDetalle();
    return () => {
      secuenciaCarga.current += 1;
    };
  }, [cargarDetalle]));

  const categoriasDisponiblesFiltro = useMemo(() => {
    const idsDisponibles = new Set(movimientos.map((movimiento) => movimiento.categoria));
    const categoriasPorTipo = tipoFiltro === 'ingreso'
      ? [...CATEGORIAS_INGRESO, ...CATEGORIAS_EGRESO.filter((categoria) => IDS_TRANSFERENCIA.has(categoria.id))]
      : tipoFiltro === 'egreso'
        ? CATEGORIAS_EGRESO
        : CATEGORIAS_FILTRO;
    return categoriasPorTipo.filter((categoria) => idsDisponibles.has(categoria.id));
  }, [movimientos, tipoFiltro]);

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

  const actualizarBordesDesplazamientoFecha = useCallback((cambios: Partial<typeof medidasDesplazamientoFecha.current>) => {
    const medidas = { ...medidasDesplazamientoFecha.current, ...cambios };
    medidasDesplazamientoFecha.current = medidas;
    const contenidoDesborda = medidas.anchoContenido > medidas.anchoVisible + 1;
    const nuevosBordes = {
      izquierda: contenidoDesborda && medidas.desplazamiento > 1,
      derecha: contenidoDesborda
        && medidas.desplazamiento + medidas.anchoVisible < medidas.anchoContenido - 1,
    };

    establecerBordesDesplazamientoFecha((anteriores) => (
      anteriores.izquierda === nuevosBordes.izquierda
      && anteriores.derecha === nuevosBordes.derecha
        ? anteriores
        : nuevosBordes
    ));
  }, []);

  const abrirFiltros = () => {
    establecerFiltrosVisibles(true);
  };

  const cerrarFiltros = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacidadOverlay, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(desplazamientoPanel, {
        toValue: altoVentana,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) establecerFiltrosVisibles(false);
    });
  }, [altoVentana, desplazamientoPanel, opacidadOverlay]);

  const responderManija = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_evento, gesto) => gesto.dy > 6 && Math.abs(gesto.dy) > Math.abs(gesto.dx),
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_evento, gesto) => {
      if (gesto.dy > 0) desplazamientoPanel.setValue(gesto.dy);
    },
    onPanResponderRelease: (_evento, gesto) => {
      if (gesto.dy > 90 || gesto.vy > 0.8) {
        cerrarFiltros();
        return;
      }
      Animated.spring(desplazamientoPanel, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(desplazamientoPanel, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
      }).start();
    },
  }), [cerrarFiltros, desplazamientoPanel]);

  useEffect(() => {
    if (!filtrosVisibles) return undefined;
    opacidadOverlay.setValue(0);
    desplazamientoPanel.setValue(altoVentana);
    Animated.parallel([
      Animated.timing(opacidadOverlay, { toValue: 1, duration: 190, useNativeDriver: true }),
      Animated.spring(desplazamientoPanel, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 210,
      }),
    ]).start();
    return undefined;
  }, [altoVentana, desplazamientoPanel, filtrosVisibles, opacidadOverlay]);

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
      const minimo = montoMinimo.trim() ? `$${montoMinimo.trim()}` : 'Sin mínimo';
      const maximo = montoMaximo.trim() ? `$${montoMaximo.trim()}` : 'Sin máximo';
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
    ? `${montoMinimo.trim() ? `$${montoMinimo.trim()}` : 'Sin mínimo'} – ${montoMaximo.trim() ? `$${montoMaximo.trim()}` : 'Sin máximo'}`
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
    if (guardandoEdicion) return;
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
    if (guardandoEdicion || !deposito) return;
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
      establecerGuardandoEdicion(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (eliminando || !deposito) return;
    establecerEliminando(true);
    try {
      await eliminarDeposito(deposito.id);
      establecerModalEliminacionVisible(false);
      mostrarAviso('El depósito se desactivó y su historial quedó conservado.', { tipo: 'exito' });
      navegacion.goBack();
    } catch (error) {
      mostrarAviso(error instanceof ErrorDeposito
        ? error.message
        : 'No se pudo eliminar el depósito. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      establecerEliminando(false);
    }
  };

  const abrirDetalleMovimiento = (movimiento: import('../types/forms').MovimientoVisible, categoria: Partial<import('../constants/movimientos').Categoria>) => {
    navegacion.push(RUTAS.DETALLE_MOVIMIENTO, { categoria, movimiento, deposito_nombre: deposito?.nombre });
  };

  const movimientosFiltrados = useMemo(() => {
    if (errorMontoFiltro || errorFechaFiltro) return [];
    const texto = busqueda.trim().toLocaleLowerCase('es-AR');
    const minimo = montoMinimo.trim() ? montoMinimoNumero : null;
    const maximo = montoMaximo.trim() ? montoMaximoNumero : null;

    return movimientos.filter((movimiento) => {
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
    }).slice().sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
  }, [busqueda, categoriaFiltroIds, errorFechaFiltro, errorMontoFiltro, fechaDia, fechaFinal, fechaFiltro, fechaInicial, fechaSemana, mesSeleccionado, montoMaximo, montoMaximoNumero, montoMinimo, montoMinimoNumero, movimientos, tipoFiltro]);

  const gruposMovimientos = useMemo(
    () => agruparMovimientosPorDia(movimientosFiltrados),
    [movimientosFiltrados],
  );
  const direccionComparacion = comparacionMensual?.disponible
    ? comparacionMensual.diferencia > 0
      ? 'positivo'
      : comparacionMensual.diferencia < 0
        ? 'negativo'
        : 'neutral'
    : 'neutral';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Detalle de depósito"
          descripcion="Consultá el saldo y los movimientos de este depósito."
          alVolver={() => navegacion.goBack()}
        />
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
              <View style={[estilos.iconoDeposito, { backgroundColor: deposito.color || COLOR_DEPOSITO_PREDETERMINADO }]}>
                <Ionicons color={COLOR_ICONO_DEPOSITO} name={(deposito.icono || 'wallet-outline') as NombreIcono} size={28} />
              </View>
              <View style={estilos.datosDeposito}>
                <Text numberOfLines={1} style={estilos.nombreDeposito}>{deposito.nombre}</Text>
                <Text ellipsizeMode="tail" numberOfLines={3} style={estilos.descripcionDeposito}>
                  {deposito.descripcion ? <>
                    {deposito.descripcion}
                    <Text style={estilos.tipoDeposito}> · {TIPOS_DEPOSITO.find((tipo) => tipo.id === deposito.tipo)?.nombre || deposito.tipo}</Text>
                  </> : (
                    <Text style={estilos.tipoDeposito}>
                      {TIPOS_DEPOSITO.find((tipo) => tipo.id === deposito.tipo)?.nombre || deposito.tipo}
                    </Text>
                  )}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Opciones del depósito"
                accessibilityRole="button"
                onPress={() => establecerModalOpcionesVisible(true)}
                style={estilos.botonOpciones}
              >
                <Ionicons color={tema.textoSecundario} name="ellipsis-horizontal" size={22} />
              </Pressable>
            </View>
            <View style={estilos.resumenSaldo}>
              <Text style={estilos.etiquetaSaldo}>Saldo de este depósito</Text>
              <View style={estilos.filaSaldo}>
                <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={estilos.saldo}>
                  {saldoVisible ? formatearSaldo(deposito.saldo_actual) : '$ •••••••'}
                </Text>
                <Pressable
                  accessibilityLabel={saldoVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
                  accessibilityRole="button"
                  disabled={guardandoVisibilidadSaldo}
                  hitSlop={8}
                  onPress={alternarVisibilidadSaldo}
                  style={estilos.botonVisibilidadSaldo}
                >
                  <Ionicons
                    color={tema.textoSecundario}
                    name={saldoVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                  />
                </Pressable>
              </View>
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
                  <Text style={[
                    estilos.textoComparacion,
                    direccionComparacion === 'positivo'
                      ? estilos.textoComparacionPositiva
                      : direccionComparacion === 'negativo'
                        ? estilos.textoComparacionNegativa
                        : estilos.textoComparacionNeutral,
                  ]}>
                    {formatearComparacionMensual(comparacionMensual)}
                  </Text>
                </> : <>
                  <Ionicons color={tema.textoSecundario} name="eye-off-outline" size={16} />
                  <Text style={[estilos.textoComparacion, estilos.textoComparacionNeutral]}>
                    Variación mensual oculta
                  </Text>
                </>}
              </View>
            </View>
          </View>

          <View style={estilos.seccionMovimientos}>
            <Text style={estilosGlobales.encabezadoSeccion}>Movimientos</Text>
            <View style={estilos.filaBusqueda}>
              <View style={[
                estilosGlobales.campo,
                estilos.buscador,
                buscadorEnfocado ? estilosGlobales.campoEnfocado : null,
              ]}>
                <Ionicons color={tema.textoSecundario} name="search" size={22} />
                <TextInput
                  accessibilityLabel="Buscar movimientos"
                  onBlur={() => establecerBuscadorEnfocado(false)}
                  onChangeText={establecerBusqueda}
                  onFocus={() => establecerBuscadorEnfocado(true)}
                  placeholder="Buscar"
                  placeholderTextColor={tema.textoSecundario}
                  returnKeyType="search"
                  selectionColor={tema.botonPrincipal}
                  style={estilos.entradaBusqueda}
                  value={busqueda}
                />
                {busqueda ? (
                  <Pressable
                    accessibilityLabel="Limpiar búsqueda"
                    accessibilityRole="button"
                    onPress={() => establecerBusqueda('')}
                    style={estilos.botonLimpiarBusqueda}
                  >
                    <Ionicons color={tema.textoSecundario} name="close-circle-outline" size={22} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="Filtros"
                accessibilityRole="button"
                onPress={abrirFiltros}
                style={({ pressed }) => [
                  estilosGlobales.botonSecundario,
                  estilos.botonFiltros,
                  pressed ? estilos.botonPresionado : null,
                ]}
              >
                <Ionicons color={tema.botonSecundarioTexto} name="list" size={20} />
                <Text style={estilosGlobales.textoBotonSecundario}>Filtros</Text>
              </Pressable>
            </View>

            <View style={estilos.filtrosAplicados}>
              <View style={estilos.encabezadoFiltrosAplicados}>
                <Text style={estilos.textoFiltrosActivos}>
                  {cantidadFiltros === 0 ? 'Sin filtros aplicados' : `Filtros aplicados (${cantidadFiltros})`}
                </Text>
                {cantidadFiltros > 0 ? (
                  <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}>
                    <Text style={estilos.textoBotonLimpiar}>Limpiar todo</Text>
                  </Pressable>
                ) : null}
              </View>
              {cantidadFiltros > 0 ? (
                <ScrollView
                  contentContainerStyle={estilos.filaFiltrosAplicados}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {filtrosActivos.map((filtro) => (
                    <Pressable
                      accessibilityLabel={`Quitar ${filtro.etiqueta}`}
                      accessibilityRole="button"
                      key={filtro.id}
                      onPress={filtro.alQuitar}
                      style={estilos.chipFiltroAplicado}
                    >
                      <Text numberOfLines={1} style={estilos.textoChipFiltroAplicado}>{filtro.etiqueta}</Text>
                      <Ionicons color={tema.textoSecundario} name="close" size={16} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            {movimientos.length === 0 ? (
              <View style={estilos.estadoVacio}>
                <Ionicons color={tema.textoSecundario} name="receipt-outline" size={32} />
                <Text style={[estilosGlobales.textoSecundario, estilos.textoEstadoVacio]}>
                  Este depósito todavía no tiene movimientos.
                </Text>
              </View>
            ) : movimientosFiltrados.length > 0 ? (
              <View style={estilos.listaMovimientos}>
                {gruposMovimientos.map((grupo) => (
                  <View key={grupo.clave} style={estilos.grupoDia}>
                    <Text accessibilityRole="header" style={estilos.tituloDia}>{formatearFechaDia(grupo.fecha)}</Text>
                    <View style={estilos.movimientosDia}>
                      {grupo.movimientos.map((movimiento) => (
                        <TarjetaMovimientoDeposito
                          key={movimiento.id}
                          tema={tema}
                          estilos={estilos}
                          movimiento={movimiento}
                          alPresionar={abrirDetalleMovimiento}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={estilos.estadoVacio}>
                <View style={estilos.iconoEstadoVacio}>
                  <Ionicons color={tema.foco} name={busqueda.trim() ? 'search-outline' : 'receipt-outline'} size={26} />
                </View>
                <Text style={estilosGlobales.etiqueta}>
                  {busqueda.trim() ? `Sin resultados para “${busqueda.trim()}”.` : 'Sin resultados para los filtros elegidos.'}
                </Text>
                <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}>
                  <Text style={estilos.textoBotonLimpiar}>Limpiar filtros</Text>
                </Pressable>
              </View>
            )}
          </View>
          </>
          )}
        </ScrollView>
      </View>

      <Modal animationType="none" onRequestClose={cerrarFiltros} transparent visible={filtrosVisibles}>
        <View style={estilos.fondoFiltros}>
          <Animated.View pointerEvents="none" style={[estilos.overlayFiltros, { opacity: opacidadOverlay }]} />
          <Pressable accessibilityLabel="Cerrar filtros" onPress={cerrarFiltros} style={estilos.fondoTactilFiltros} />
          <Animated.View
            style={[estilos.panelFiltros, { transform: [{ translateY: desplazamientoPanel }] }]}
          >
            <View style={estilos.encabezadoPanelFiltros}>
              <View style={estilos.zonaManijaFiltros} {...responderManija.panHandlers}>
                <View style={estilos.manijaFiltros} />
              </View>
              <View style={estilos.encabezadoPanelContenido}>
                <Text style={estilos.tituloPanelFiltros}>Filtros</Text>
                <Pressable
                  accessibilityLabel="Cerrar filtros"
                  accessibilityRole="button"
                  onPress={cerrarFiltros}
                  style={estilos.botonCerrarFiltros}
                >
                  <Ionicons color={tema.textoPrincipal} name="close" size={24} />
                </Pressable>
              </View>
            </View>
            <ScrollView
              contentContainerStyle={estilos.contenidoFiltrosScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={estilos.scrollFiltros}
            >
              <View style={estilos.listaSeccionesFiltro}>
                <SeccionFiltro
                  titulo="Tipo"
                  resumen={resumenTipo}
                  abierta={seccionesFiltrosAbiertas.includes('tipo')}
                  alAlternar={() => alternarSeccionFiltro('tipo')}
                  colorAcento={tema.foco}
                  estilos={estilos}
                >
                  <View style={estilos.filaOpcionesTipo}>
                    {OPCIONES_TIPO.map((opcion) => {
                      const activa = tipoFiltro === opcion.id;
                      return (
                        <Pressable
                          key={opcion.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: activa }}
                          onPress={() => cambiarTipoFiltro(opcion.id)}
                          style={[estilos.chipFiltro, estilos.chipTipo, activa ? estilos.chipFiltroActivo : null]}
                        >
                          <Text numberOfLines={1} style={[estilos.textoChipFiltro, activa ? estilos.textoChipFiltroActivo : null]}>
                            {opcion.nombre}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </SeccionFiltro>

                <SeccionFiltro
                  titulo="Fecha"
                  resumen={resumenFecha}
                  abierta={seccionesFiltrosAbiertas.includes('fecha')}
                  alAlternar={() => alternarSeccionFiltro('fecha')}
                  colorAcento={tema.botonPrincipal}
                  estilos={estilos}
                >
                  <View style={estilos.contenedorOpcionesFecha}>
                    <ScrollView
                      contentContainerStyle={estilos.filaOpcionesFecha}
                      horizontal
                      nestedScrollEnabled
                      onContentSizeChange={(anchoContenido) => actualizarBordesDesplazamientoFecha({ anchoContenido })}
                      onLayout={(evento) => actualizarBordesDesplazamientoFecha({
                        anchoVisible: evento.nativeEvent.layout.width,
                      })}
                      onScroll={(evento) => actualizarBordesDesplazamientoFecha({
                        desplazamiento: evento.nativeEvent.contentOffset.x,
                      })}
                      scrollEventThrottle={16}
                      showsHorizontalScrollIndicator={false}
                      style={estilos.scrollOpcionesFecha}
                    >
                      {OPCIONES_FECHA.map((opcion) => {
                        const activa = fechaFiltro === opcion.id;
                        return (
                          <Pressable
                            key={opcion.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: activa }}
                            onPress={() => cambiarFechaFiltro(opcion.id)}
                            style={[estilos.chipFiltro, estilos.chipFecha, activa ? estilos.chipFiltroActivo : null]}
                          >
                            <Text style={[estilos.textoChipFiltro, activa ? estilos.textoChipFiltroActivo : null]}>
                              {opcion.nombre}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    {bordesDesplazamientoFecha.izquierda ? (
                      <Svg
                        height="100%"
                        pointerEvents="none"
                        style={[estilos.sombraBordeFecha, estilos.sombraBordeFechaIzquierda]}
                        width={36}
                      >
                        <Defs>
                          <LinearGradient id="desvanecidoFechaIzquierda" x1="0%" x2="100%" y1="0%" y2="0%">
                            <Stop offset="0" stopColor={tema.superficie} stopOpacity="1" />
                            <Stop offset="1" stopColor={tema.superficie} stopOpacity="0" />
                          </LinearGradient>
                        </Defs>
                        <Rect fill="url(#desvanecidoFechaIzquierda)" height="100%" width="100%" />
                      </Svg>
                    ) : null}
                    {bordesDesplazamientoFecha.derecha ? (
                      <Svg
                        height="100%"
                        pointerEvents="none"
                        style={[estilos.sombraBordeFecha, estilos.sombraBordeFechaDerecha]}
                        width={36}
                      >
                        <Defs>
                          <LinearGradient id="desvanecidoFechaDerecha" x1="0%" x2="100%" y1="0%" y2="0%">
                            <Stop offset="0" stopColor={tema.superficie} stopOpacity="0" />
                            <Stop offset="1" stopColor={tema.superficie} stopOpacity="1" />
                          </LinearGradient>
                        </Defs>
                        <Rect fill="url(#desvanecidoFechaDerecha)" height="100%" width="100%" />
                      </Svg>
                    ) : null}
                  </View>
                  {fechaFiltro === 'dia' ? (
                    <View style={estilos.grupoCalendarioFiltro}>
                      <Text style={estilos.textoAyudaFiltro}>Elegí un día</Text>
                      <SelectorFecha
                        tema={tema}
                        estilosMovimiento={estilos}
                        etiqueta="Día"
                        valor={fechaDia || new Date()}
                        alSeleccionar={establecerFechaDia}
                        enLinea
                      />
                    </View>
                  ) : null}
                  {fechaFiltro === 'mes' ? (
                    <View style={estilos.grupoCalendarioFiltro}>
                      <View style={estilos.encabezadoCalendario}>
                        <Pressable
                          accessibilityLabel="Año anterior"
                          accessibilityRole="button"
                          onPress={() => establecerAnioMesVisible((anio) => anio - 1)}
                          style={estilos.botonMes}
                        >
                          <Ionicons color={tema.textoPrincipal} name="chevron-back" size={20} />
                        </Pressable>
                        <Text style={estilos.mesCalendario}>{anioMesVisible}</Text>
                        <Pressable
                          accessibilityLabel="Año siguiente"
                          accessibilityRole="button"
                          onPress={() => establecerAnioMesVisible((anio) => anio + 1)}
                          style={estilos.botonMes}
                        >
                          <Ionicons color={tema.textoPrincipal} name="chevron-forward" size={20} />
                        </Pressable>
                      </View>
                      <View style={estilos.grillaMeses}>
                        {MESES.map((mes, indice) => {
                          const activo = mesSeleccionado
                            && mesSeleccionado.getMonth() === indice
                            && mesSeleccionado.getFullYear() === anioMesVisible;
                          return (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ selected: Boolean(activo) }}
                              key={mes}
                              onPress={() => establecerMesSeleccionado(new Date(anioMesVisible, indice, 1))}
                              style={[estilos.opcionMes, activo ? estilos.opcionMesActiva : null]}
                            >
                              <Text style={[estilos.textoOpcionMes, activo ? estilos.textoOpcionMesActivo : null]}>
                                {mes}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                  {fechaFiltro === 'personalizado' ? (
                    <View style={estilos.grupoCalendarioFiltro}>
                      <SelectorFecha
                        tema={tema}
                        estilosMovimiento={estilos}
                        etiqueta="Rango"
                        valor={fechaFinal || fechaInicial || new Date()}
                        textoValor={fechaInicial && fechaFinal
                          ? `${formatearFechaCorta(fechaInicial)} – ${formatearFechaCorta(fechaFinal)}`
                          : fechaInicial
                            ? `${formatearFechaCorta(fechaInicial)} · Elegí el final`
                            : 'Elegí fecha inicial'}
                        alSeleccionar={seleccionarFechaPersonalizada}
                        mantenerAbiertoAlSeleccionar
                        resaltarExtremosRango
                        enLinea
                        rangoInicio={fechaInicial}
                        rangoFin={fechaFinal}
                      />
                      {errorFechaFiltro ? <Text style={estilosGlobales.textoError}>{errorFechaFiltro}</Text> : null}
                    </View>
                  ) : null}
                </SeccionFiltro>

                <SeccionFiltro
                  titulo="Categorías"
                  resumen={resumenCategorias}
                  abierta={seccionesFiltrosAbiertas.includes('categorias')}
                  alAlternar={() => alternarSeccionFiltro('categorias')}
                  colorAcento={tema.foco}
                  estilos={estilos}
                >
                  <SelectorCategoria
                    tema={tema}
                    estilosGlobales={estilosGlobales}
                    estilosMovimiento={estilos}
                    estiloTarjeta={estilos.tarjetaCategoriaFiltro}
                    usarColorIconoComoRelleno
                    etiqueta=""
                    categorias={categoriasDisponiblesFiltro}
                    variante="grilla"
                    seleccionMultiple
                    seleccionadasIds={categoriaFiltroIds}
                    alCambiarMulti={establecerCategoriaFiltroIds}
                  />
                </SeccionFiltro>

                <SeccionFiltro
                  titulo="Monto"
                  resumen={resumenMonto}
                  abierta={seccionesFiltrosAbiertas.includes('monto')}
                  alAlternar={() => alternarSeccionFiltro('monto')}
                  colorAcento={tema.error}
                  estilos={estilos}
                >
                  <View style={estilos.filaRango}>
                    <View style={estilos.grupoCampoRango}>
                      <View style={estilos.etiquetaCampoRango}>
                        <Ionicons color={tema.textoSecundario} name="arrow-down-outline" size={16} />
                        <Text style={estilos.textoEtiquetaCampoRango}>Mínimo</Text>
                      </View>
                      <TextInput
                        accessibilityLabel="Monto mínimo"
                        keyboardType="decimal-pad"
                        onChangeText={establecerMontoMinimo}
                        placeholder="$ 0"
                        placeholderTextColor={tema.textoSecundario}
                        selectionColor={tema.foco}
                        style={estilos.campoRango}
                        value={montoMinimo}
                      />
                    </View>
                    <View style={estilos.grupoCampoRango}>
                      <View style={estilos.etiquetaCampoRango}>
                        <Ionicons color={tema.textoSecundario} name="arrow-up-outline" size={16} />
                        <Text style={estilos.textoEtiquetaCampoRango}>Máximo</Text>
                      </View>
                      <TextInput
                        accessibilityLabel="Monto máximo"
                        keyboardType="decimal-pad"
                        onChangeText={establecerMontoMaximo}
                        placeholder="$ 0"
                        placeholderTextColor={tema.textoSecundario}
                        selectionColor={tema.foco}
                        style={estilos.campoRango}
                        value={montoMaximo}
                      />
                    </View>
                  </View>
                  {errorMontoFiltro ? <Text style={estilosGlobales.textoError}>{errorMontoFiltro}</Text> : null}
                </SeccionFiltro>
              </View>
            </ScrollView>
            {cantidadFiltros > 0 ? (
              <View style={estilos.piePanelFiltros}>
                <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}>
                  <Text style={estilos.textoBotonLimpiar}>Limpiar filtros</Text>
                </Pressable>
              </View>
            ) : null}
          </Animated.View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => establecerModalOpcionesVisible(false)} transparent visible={modalOpcionesVisible}>
        <View style={estilos.fondoModalOpciones}>
          <Pressable style={estilos.fondoCierre} onPress={() => establecerModalOpcionesVisible(false)} />
          <View style={estilos.tarjetaOpciones}>
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
          <View style={estilos.tarjetaEdicion}>
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
              <View style={estilosFormularioDeposito.grupo}>
                <Text style={estilosGlobales.etiqueta}>Nombre del depósito *</Text>
                <View style={[
                  estilosGlobales.campo,
                  estilosFormularioDeposito.filaEntrada,
                  nombreEdicionEnfocado ? estilosGlobales.campoEnfocado : null,
                  erroresEdicion.nombre ? estilosGlobales.campoError : null,
                ]}>
                  <Ionicons color={tema.textoSecundario} name="wallet-outline" size={21} />
                  <TextInput
                    accessibilityLabel="Nombre del depósito"
                    maxLength={30}
                    onBlur={() => establecerNombreEdicionEnfocado(false)}
                    onChangeText={(valor) => actualizarBorrador('nombre', valor)}
                    onFocus={() => establecerNombreEdicionEnfocado(true)}
                    placeholder="Ej: Efectivo, Cuenta BNA"
                    placeholderTextColor={tema.textoSecundario}
                    returnKeyType="next"
                    selectionColor={tema.foco}
                    style={estilosFormularioDeposito.entradaTexto}
                    value={borrador.nombre || ''}
                  />
                  {borrador.nombre ? (
                    <Pressable
                      accessibilityLabel="Limpiar nombre"
                      accessibilityRole="button"
                      onPress={() => actualizarBorrador('nombre', '')}
                      style={estilosFormularioDeposito.botonLimpiar}
                    >
                      <Ionicons color={tema.textoSecundario} name="close-circle" size={22} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={estilosFormularioDeposito.contador}>{`${(borrador.nombre || '').length}/30`}</Text>
                {erroresEdicion.nombre ? <Text style={estilosGlobales.textoError}>{erroresEdicion.nombre}</Text> : null}
              </View>

              <View style={estilosFormularioDeposito.grupo}>
                <Text style={estilosGlobales.etiqueta}>Tipo de depósito *</Text>
                <View style={estilosFormularioDeposito.listaTipos}>
                  {TIPOS_DEPOSITO.map((opcion) => {
                    const seleccionado = tipoSeleccionado === opcion.id;
                    return (
                      <Pressable
                        accessibilityLabel={opcion.nombre}
                        accessibilityRole="button"
                        accessibilityState={{ selected: seleccionado }}
                        key={opcion.id}
                        onPress={() => actualizarBorrador('tipo', opcion.id)}
                        style={({ pressed }) => [
                          estilosFormularioDeposito.tarjetaTipo,
                          seleccionado && estilosFormularioDeposito.tarjetaTipoSeleccionada,
                          pressed && estilosFormularioDeposito.elementoPresionado,
                        ]}
                      >
                        <View style={[
                          estilosFormularioDeposito.iconoTipo,
                          seleccionado && estilosFormularioDeposito.iconoTipoSeleccionado,
                        ]}>
                          <Ionicons
                            color={seleccionado ? tema.botonPrincipalTexto : tema.foco}
                            name={opcion.icono}
                            size={25}
                          />
                        </View>
                        <Text style={[
                          estilosFormularioDeposito.nombreTipo,
                          seleccionado && estilosFormularioDeposito.nombreTipoSeleccionado,
                        ]}>
                          {opcion.nombre}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {erroresEdicion.tipo ? <Text style={estilosGlobales.textoError}>{erroresEdicion.tipo}</Text> : null}
              </View>

              <View style={estilosFormularioDeposito.grupo}>
                <Text style={estilosGlobales.etiqueta}>Ícono</Text>
                <View style={estilosFormularioDeposito.listaIconos}>
                  {ICONOS_PRINCIPALES.map((opcion) => {
                    const seleccionado = borrador.icono === opcion.nombre;
                    return (
                      <Pressable
                        accessibilityLabel={`Ícono ${opcion.etiqueta}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: seleccionado }}
                        key={opcion.nombre}
                        onPress={() => actualizarBorrador('icono', opcion.nombre)}
                        style={({ pressed }) => [
                          estilosFormularioDeposito.botonIcono,
                          seleccionado && estilosFormularioDeposito.botonIconoSeleccionado,
                          pressed && estilosFormularioDeposito.elementoPresionado,
                        ]}
                      >
                        <Ionicons
                          color={seleccionado ? tema.foco : tema.textoPrincipal}
                          name={opcion.nombre as NombreIcono}
                          size={23}
                        />
                        <Text numberOfLines={1} style={estilosFormularioDeposito.nombreIcono}>
                          {opcion.etiqueta}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    accessibilityLabel="Ver más íconos"
                    accessibilityRole="button"
                    accessibilityState={{ expanded: modalIconosEdicionVisible }}
                    onPress={() => establecerModalIconosEdicionVisible(true)}
                    style={({ pressed }) => [
                      estilosFormularioDeposito.botonIcono,
                      estilosFormularioDeposito.botonMasIconos,
                      pressed && estilosFormularioDeposito.elementoPresionado,
                    ]}
                  >
                    <Ionicons color={tema.foco} name="add-outline" size={23} />
                    <Text style={estilosFormularioDeposito.nombreIcono}>Más</Text>
                  </Pressable>
                </View>
                {iconoFueraDeVista ? (
                  <Text style={estilosGlobales.textoAyuda}>
                    Ícono seleccionado: {ICONOS_DEPOSITO.find((opcion) => opcion.nombre === borrador.icono)?.etiqueta}
                  </Text>
                ) : null}
                {erroresEdicion.icono ? <Text style={estilosGlobales.textoError}>{erroresEdicion.icono}</Text> : null}
              </View>

              <View style={estilosFormularioDeposito.grupo}>
                <View style={estilosFormularioDeposito.encabezadoColor}>
                  <Text style={estilosGlobales.etiqueta}>Color</Text>
                  <Text style={estilosFormularioDeposito.textoOpcional}>Opcional</Text>
                </View>
                <View style={estilosFormularioDeposito.listaColores}>
                  <Pressable
                    accessibilityLabel="Color azul suave predeterminado"
                    accessibilityRole="button"
                    accessibilityState={{ selected: colorBorrador === COLOR_DEPOSITO_PREDETERMINADO }}
                    onPress={() => actualizarBorrador('color', COLOR_DEPOSITO_PREDETERMINADO)}
                    style={({ pressed }) => [
                      estilosFormularioDeposito.opcionColor,
                      pressed && estilosFormularioDeposito.elementoPresionado,
                    ]}
                  >
                    <View style={[
                      estilosFormularioDeposito.muestraColor,
                      estilosFormularioDeposito.colorPredeterminado,
                      colorBorrador === COLOR_DEPOSITO_PREDETERMINADO && estilosFormularioDeposito.muestraColorSeleccionada,
                    ]}>
                      {colorBorrador === COLOR_DEPOSITO_PREDETERMINADO ? (
                        <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={22} />
                      ) : null}
                    </View>
                    <Text style={[
                      estilosFormularioDeposito.nombreColor,
                      colorBorrador === COLOR_DEPOSITO_PREDETERMINADO && estilosFormularioDeposito.nombreColorSeleccionado,
                    ]}>
                      Azul suave
                    </Text>
                  </Pressable>
                  {COLORES_SELECTOR.map(({ nombre, valor }) => {
                    const seleccionado = colorBorrador === valor;
                    return (
                      <Pressable
                        accessibilityLabel={`Color ${nombre}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: seleccionado }}
                        key={valor}
                        onPress={() => actualizarBorrador('color', valor)}
                        style={({ pressed }) => [
                          estilosFormularioDeposito.opcionColor,
                          pressed && estilosFormularioDeposito.elementoPresionado,
                        ]}
                      >
                        <View style={[
                          estilosFormularioDeposito.muestraColor,
                          { backgroundColor: valor },
                          seleccionado && estilosFormularioDeposito.muestraColorSeleccionada,
                        ]}>
                          {seleccionado ? <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={22} /> : null}
                        </View>
                        <Text style={[
                          estilosFormularioDeposito.nombreColor,
                          seleccionado && estilosFormularioDeposito.nombreColorSeleccionado,
                        ]}>
                          {nombre}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={estilosFormularioDeposito.colorSeleccionadoInfo}>
                  <View style={[estilosFormularioDeposito.indicadorColorSeleccionado, { backgroundColor: colorBorrador }]} />
                  <Text style={estilosGlobales.textoAyuda}>
                    {opcionColorSeleccionado
                      ? `Color: ${opcionColorSeleccionado.nombre}`
                      : 'Color: Azul suave (predeterminado)'}
                  </Text>
                </View>
                {erroresEdicion.color ? <Text style={estilosGlobales.textoError}>{erroresEdicion.color}</Text> : null}
              </View>

              <View style={estilosFormularioDeposito.grupo}>
                <View style={estilosFormularioDeposito.encabezadoColor}>
                  <Text style={estilosGlobales.etiqueta}>Descripción</Text>
                  <Text style={estilosFormularioDeposito.textoOpcional}>Opcional</Text>
                </View>
                <View style={[
                  estilosGlobales.campo,
                  estilosFormularioDeposito.filaDescripcion,
                  descripcionEdicionEnfocada ? estilosGlobales.campoEnfocado : null,
                  erroresEdicion.descripcion ? estilosGlobales.campoError : null,
                ]}>
                  <Ionicons color={tema.textoSecundario} name="document-text-outline" size={20} />
                  <TextInput
                    accessibilityLabel="Descripción opcional"
                    maxLength={60}
                    multiline
                    onBlur={() => establecerDescripcionEdicionEnfocada(false)}
                    onChangeText={(valor) => actualizarBorrador('descripcion', valor)}
                    onFocus={() => establecerDescripcionEdicionEnfocada(true)}
                    placeholder="Agregá un detalle para identificarlo"
                    placeholderTextColor={tema.textoSecundario}
                    selectionColor={tema.foco}
                    style={estilosFormularioDeposito.entradaDescripcion}
                    value={borrador.descripcion || ''}
                  />
                  {borrador.descripcion ? (
                    <Pressable
                      accessibilityLabel="Limpiar descripción"
                      accessibilityRole="button"
                      onPress={() => actualizarBorrador('descripcion', '')}
                      style={estilosFormularioDeposito.botonLimpiar}
                    >
                      <Ionicons color={tema.textoSecundario} name="close-circle" size={22} />
                    </Pressable>
                  ) : null}
                </View>
                <Text style={estilosFormularioDeposito.contador}>{`${(borrador.descripcion || '').length}/60`}</Text>
                <Text style={estilosGlobales.textoAyuda}>
                  Si la dejás vacía, se generará automáticamente con el nombre y el tipo.
                </Text>
                {erroresEdicion.descripcion ? <Text style={estilosGlobales.textoError}>{erroresEdicion.descripcion}</Text> : null}
              </View>
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

      <Modal
        animationType="fade"
        onRequestClose={() => establecerModalIconosEdicionVisible(false)}
        transparent
        visible={modalIconosEdicionVisible}
      >
        <Pressable
          accessibilityLabel="Cerrar selector de íconos"
          onPress={() => establecerModalIconosEdicionVisible(false)}
          style={estilos.fondoModal}
        >
          <Pressable onPress={() => {}} style={estilosFormularioDeposito.tarjetaModal}>
            <View style={estilosFormularioDeposito.encabezadoModal}>
              <Text style={estilosFormularioDeposito.tituloModal}>Más íconos</Text>
              <Pressable
                accessibilityLabel="Cerrar selector de íconos"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => establecerModalIconosEdicionVisible(false)}
                style={estilosFormularioDeposito.botonCerrarModal}
              >
                <Ionicons color={tema.textoPrincipal} name="close" size={22} />
              </Pressable>
            </View>
            {ICONOS_ADICIONALES.map((opcion) => {
              const seleccionado = borrador.icono === opcion.nombre;
              return (
                <Pressable
                  key={opcion.nombre}
                  accessibilityLabel={`Ícono ${opcion.etiqueta}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionado }}
                  onPress={() => {
                    actualizarBorrador('icono', opcion.nombre);
                    establecerModalIconosEdicionVisible(false);
                  }}
                  style={[
                    estilosFormularioDeposito.opcionIconoModal,
                    seleccionado && estilosFormularioDeposito.opcionIconoModalSeleccionada,
                  ]}
                >
                  <Ionicons color={tema.foco} name={opcion.nombre as NombreIcono} size={22} />
                  <Text style={estilosFormularioDeposito.nombreOpcionIcono}>{opcion.etiqueta}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => establecerModalEliminacionVisible(false)} transparent visible={modalEliminacionVisible && Boolean(deposito)}>
        <View style={estilos.fondoModal}>
          <Pressable style={estilos.fondoCierre} onPress={() => establecerModalEliminacionVisible(false)} />
          <View style={estilos.tarjetaConfirmacion}>
            <View style={estilos.encabezadoConfirmacion}>
              <View style={estilos.iconoEliminar}>
                <Ionicons color={tema.error} name="trash-outline" size={25} />
              </View>
              <Pressable
                accessibilityLabel="Cerrar confirmación"
                accessibilityRole="button"
                onPress={() => establecerModalEliminacionVisible(false)}
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
              <Pressable accessibilityRole="button" onPress={() => establecerModalEliminacionVisible(false)} style={estilos.botonSecundarioModal}>
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
