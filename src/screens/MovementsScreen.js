import { useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import SelectorCategoria from '../components/CategorySelector';
import SelectorFecha from '../components/DateSelector';
import SelectorDeposito from '../components/DepositSelector';
import EncabezadoPrincipal from '../components/MainHeader';
import TarjetaMovimiento from '../components/MovementCard';
import { RUTAS } from '../constants/routes';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
} from '../constants/movimientos';
import {
  cargarOpcionesHistorialMovimientos,
  cargarPaginaHistorialMovimientos,
} from '../movements/movementService';

import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosMovimientos } from '../styles/MovementsScreenStyles';

const TAMANO_PAGINA = 50;

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

const MESES = Object.freeze([
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]);

function crearFechaSinHora(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function formatearFechaCorta(fecha) {
  return fecha.toLocaleDateString('es-AR');
}

function formatearFechaDia(fecha) {
  const hoy = new Date();
  const fechaNormalizada = crearFechaSinHora(fecha);
  const hoyNormalizado = crearFechaSinHora(hoy);
  const diferenciaDias = Math.round((hoyNormalizado - fechaNormalizada) / 86400000);

  if (diferenciaDias === 0) return 'Hoy';
  if (diferenciaDias === 1) return 'Ayer';
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
  });
}

function crearRangoConsultaFecha(fechaFiltro, fechaDia, mesSeleccionado, fechaInicial, fechaFinal) {
  let inicio = null;
  let fin = null;

  if (fechaFiltro === 'dia' && fechaDia) {
    inicio = new Date(fechaDia.getFullYear(), fechaDia.getMonth(), fechaDia.getDate());
    fin = new Date(fechaDia.getFullYear(), fechaDia.getMonth(), fechaDia.getDate() + 1);
  } else if (fechaFiltro === 'semana' && fechaDia) {
    inicio = new Date(fechaDia.getFullYear(), fechaDia.getMonth(), fechaDia.getDate());
    const diasDesdeLunes = (inicio.getDay() + 6) % 7;
    inicio.setDate(inicio.getDate() - diasDesdeLunes);
    fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7);
  } else if (fechaFiltro === 'mes' && mesSeleccionado) {
    inicio = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth(), 1);
    fin = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() + 1, 1);
  } else if (fechaFiltro === 'personalizado' && fechaInicial && fechaFinal) {
    inicio = new Date(fechaInicial.getFullYear(), fechaInicial.getMonth(), fechaInicial.getDate());
    fin = new Date(fechaFinal.getFullYear(), fechaFinal.getMonth(), fechaFinal.getDate() + 1);
  }

  return inicio && fin
    ? { desde: inicio.toISOString(), hasta: fin.toISOString() }
    : {};
}

function convertirMontoFiltro(texto) {
  const valor = texto.trim();
  if (!valor) return null;
  const normalizado = valor.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizado)) return null;
  const monto = Number(normalizado);
  return Number.isFinite(monto) && monto >= 0 ? monto : null;
}

function obtenerTextoTipoDeposito(tipo) {
  if (tipo === 'efectivo') return 'Efectivo';
  if (tipo === 'banco') return 'Banco';
  if (tipo === 'billetera_virtual') return 'Billetera virtual';
  return 'Depósito con movimientos';
}

function agruparMovimientosPorDia(movimientos) {
  return movimientos.reduce((grupos, movimiento) => {
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

function SeccionFiltro({
  titulo,
  resumen,
  abierta,
  alAlternar,
  colorAcento,
  estilos,
  children,
}) {
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

export default function PantallaMovimientos({ navigation: navegacion }) {
  const { height: altoVentana, width: anchoVentana } = useWindowDimensions();
  const { tema } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosMovimientos(tema, anchoVentana);
  const abrirPantallaSecundaria = (ruta, parametros) => navegacion.getParent()?.navigate(ruta, parametros);
  const [busqueda, establecerBusqueda] = useState('');
  const [busquedaAplicada, establecerBusquedaAplicada] = useState('');
  const [tipoFiltro, establecerTipoFiltro] = useState('todos');
  const [fechaFiltro, establecerFechaFiltro] = useState('todos');
  const [fechaDia, establecerFechaDia] = useState(null);
  const [mesSeleccionado, establecerMesSeleccionado] = useState(null);
  const [anioMesVisible, establecerAnioMesVisible] = useState(() => new Date().getFullYear());
  const [fechaInicial, establecerFechaInicial] = useState(null);
  const [fechaFinal, establecerFechaFinal] = useState(null);
  const [montoMinimo, establecerMontoMinimo] = useState('');
  const [montoMaximo, establecerMontoMaximo] = useState('');
  const [categoriaFiltroIds, establecerCategoriaFiltroIds] = useState([]);
  const [depositoFiltroIds, establecerDepositoFiltroIds] = useState([]);
  const [categoriasHistorial, establecerCategoriasHistorial] = useState([]);
  const [depositosHistorial, establecerDepositosHistorial] = useState([]);
  const [usuarioId, establecerUsuarioId] = useState(null);
  const [cantidadTotal, establecerCantidadTotal] = useState(null);
  const [movimientosHistorial, establecerMovimientosHistorial] = useState([]);
  const [errorConsulta, establecerErrorConsulta] = useState(null);
  const [errorCargaMas, establecerErrorCargaMas] = useState(null);
  const [cargandoMas, establecerCargandoMas] = useState(false);
  const [hayMas, establecerHayMas] = useState(false);
  const [enfocada, establecerEnfocada] = useState(false);
  const [revisionHistorial, establecerRevisionHistorial] = useState(0);
  const [intentoCargaOpciones, establecerIntentoCargaOpciones] = useState(0);
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
  const [seccionesFiltrosAbiertas, establecerSeccionesFiltrosAbiertas] = useState(['tipo', 'fecha']);
  const [cargando, establecerCargando] = useState(true);
  const [buscadorEnfocado, establecerBuscadorEnfocado] = useState(false);
  const secuenciaConsulta = useRef(0);
  const bloqueoCargaMas = useRef(false);
  const depositosHistorialRef = useRef([]);
  const depositoFiltroIdsRef = useRef([]);
  useEffect(() => {
    depositoFiltroIdsRef.current = depositoFiltroIds;
  }, [depositoFiltroIds]);
  const filtraPorDepositos = depositoFiltroIds.length > 0
    && depositoFiltroIds.length < depositosHistorial.length;
  const opacidadOverlay = useRef(new Animated.Value(0)).current;
  const desplazamientoPanel = useRef(new Animated.Value(0)).current;
  const categoriasDisponiblesFiltro = tipoFiltro === 'ingreso'
    ? categoriasHistorial.filter((categoria) => categoria.tipo === 'ingreso')
    : tipoFiltro === 'egreso'
      ? categoriasHistorial.filter((categoria) => categoria.tipo === 'egreso')
      : [...new Map(categoriasHistorial.map((categoria) => [categoria.id, categoria])).values()];

  useEffect(() => {
    const idsDisponibles = new Set(categoriasHistorial.map((categoria) => categoria.id));
    establecerCategoriaFiltroIds((ids) => ids.filter((id) => idsDisponibles.has(id)));
  }, [categoriasHistorial]);

  const cambiarTipoFiltro = (tipo) => {
    establecerTipoFiltro(tipo);
    if (tipo === 'todos') return;
    const idsPermitidos = new Set(
      categoriasHistorial
        .filter((categoria) => categoria.tipo === tipo)
        .map((categoria) => categoria.id),
    );
    establecerCategoriaFiltroIds((ids) => ids.filter((id) => idsPermitidos.has(id)));
  };

  useFocusEffect(useCallback(() => {
    let vigente = true;
    establecerEnfocada(true);
    establecerCargando(true);
    establecerErrorConsulta(null);

    cargarOpcionesHistorialMovimientos()
      .then((datos) => {
        if (!vigente) return;
        const categoriasPorTipo = datos.categorias.map((elemento) => {
          const catalogo = elemento.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
          const categoria = catalogo.find((opcion) => opcion.id === elemento.categoria);
          return categoria
            ? { ...categoria, tipo: elemento.tipo }
            : {
              id: elemento.categoria,
              nombre: elemento.categoria,
              icono: 'pricetag-outline',
              tipo: elemento.tipo,
            };
        });
        const depositos = datos.depositos.map((deposito) => ({
          ...deposito,
          saldoTexto: obtenerTextoTipoDeposito(deposito.tipo),
        }));
        const idsDepositos = depositos.map((deposito) => deposito.id);
        const idsSeleccionadosAntes = depositoFiltroIdsRef.current;
        const eranTodosLosDepositos = idsSeleccionadosAntes.length === depositosHistorialRef.current.length;

        establecerUsuarioId(datos.usuarioId);
        establecerCantidadTotal(datos.cantidad);
        establecerCategoriasHistorial(categoriasPorTipo);
        establecerDepositosHistorial(depositos);
        establecerDepositoFiltroIds(eranTodosLosDepositos
          ? idsDepositos
          : idsSeleccionadosAntes.filter((id) => idsDepositos.includes(id)));
        depositosHistorialRef.current = depositos;
        establecerRevisionHistorial((revision) => revision + 1);
      })
      .catch((error) => {
        if (!vigente) return;
        establecerErrorConsulta(error?.message || 'No se pudo cargar el historial. Intentá nuevamente.');
        establecerCargando(false);
        mostrarAviso('No se pudo consultar el historial de movimientos.', { tipo: 'error' });
      });

    return () => {
      vigente = false;
      secuenciaConsulta.current += 1;
      establecerEnfocada(false);
    };
  }, [mostrarAviso, intentoCargaOpciones]));

  const alternarSeccionFiltro = (seccion) => {
    establecerSeccionesFiltrosAbiertas((abiertas) => (abiertas.includes(seccion)
      ? abiertas.filter((elemento) => elemento !== seccion)
      : [...abiertas, seccion]));
  };

  const actualizarBordesDesplazamientoFecha = useCallback((cambios) => {
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
      Animated.timing(opacidadOverlay, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
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
      Animated.timing(opacidadOverlay, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true,
      }),
      Animated.spring(desplazamientoPanel, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 210,
      }),
    ]).start();
    return undefined;
  }, [altoVentana, desplazamientoPanel, filtrosVisibles, opacidadOverlay]);

  const cambiarFechaFiltro = useCallback((modo) => {
    if (modo === fechaFiltro) return;
    establecerFechaFiltro(modo);
    if (modo === 'dia' || modo === 'semana') establecerFechaDia(new Date());
    if (modo === 'mes') {
      establecerMesSeleccionado(null);
      establecerAnioMesVisible(new Date().getFullYear());
    }
    if (modo === 'personalizado') {
      establecerFechaInicial(null);
      establecerFechaFinal(null);
    }
  }, [fechaFiltro]);

  const seleccionarFechaPersonalizada = (fecha) => {
    const seleccion = crearFechaSinHora(fecha);
    if (!fechaInicial || fechaFinal) {
      establecerFechaInicial(seleccion);
      establecerFechaFinal(null);
      return;
    }
    if (seleccion < fechaInicial) {
      establecerFechaInicial(seleccion);
      establecerFechaFinal(fechaInicial);
    } else {
      establecerFechaFinal(seleccion);
    }
  };

  useEffect(() => {
    establecerCargando(true);
    const temporizador = setTimeout(() => establecerBusquedaAplicada(busqueda.trim()), 250);
    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const montoMinimoNumerico = convertirMontoFiltro(montoMinimo);
  const montoMaximoNumerico = convertirMontoFiltro(montoMaximo);
  const errorMontoFiltro = montoMinimo.trim() && montoMinimoNumerico === null
    ? 'Ingresá un monto mínimo válido, por ejemplo 2.500,50.'
    : montoMaximo.trim() && montoMaximoNumerico === null
      ? 'Ingresá un monto máximo válido, por ejemplo 2.500,50.'
      : montoMinimoNumerico !== null
        && montoMaximoNumerico !== null
        && montoMinimoNumerico > montoMaximoNumerico
        ? 'El monto mínimo no puede superar al máximo.'
        : null;
  const rangoFechaConsulta = useMemo(
    () => crearRangoConsultaFecha(fechaFiltro, fechaDia, mesSeleccionado, fechaInicial, fechaFinal),
    [fechaFiltro, fechaDia, mesSeleccionado, fechaInicial, fechaFinal],
  );
  const filtrosConsulta = useMemo(() => ({
    busqueda: busquedaAplicada,
    tipo: tipoFiltro,
    categoriaIds: categoriaFiltroIds.length ? categoriaFiltroIds : null,
    depositoIds: filtraPorDepositos ? depositoFiltroIds : null,
    montoMinimo: montoMinimo.trim() ? montoMinimoNumerico : null,
    montoMaximo: montoMaximo.trim() ? montoMaximoNumerico : null,
    ...rangoFechaConsulta,
  }), [
    busquedaAplicada,
    tipoFiltro,
    categoriaFiltroIds,
    filtraPorDepositos,
    depositoFiltroIds,
    montoMinimo,
    montoMaximo,
    montoMinimoNumerico,
    montoMaximoNumerico,
    rangoFechaConsulta,
  ]);

  useEffect(() => {
    if (!enfocada || !usuarioId || !revisionHistorial) return undefined;
    const secuencia = ++secuenciaConsulta.current;
    if (errorMontoFiltro) {
      establecerMovimientosHistorial([]);
      establecerCargando(false);
      establecerHayMas(false);
      establecerErrorConsulta(null);
      return undefined;
    }

    establecerCargando(true);
    establecerCargandoMas(false);
    bloqueoCargaMas.current = false;
    establecerErrorConsulta(null);
    establecerErrorCargaMas(null);

    cargarPaginaHistorialMovimientos(usuarioId, filtrosConsulta)
      .then((movimientos) => {
        if (secuencia !== secuenciaConsulta.current) return;
        establecerMovimientosHistorial(movimientos);
        establecerHayMas(movimientos.length === TAMANO_PAGINA);
      })
      .catch((error) => {
        if (secuencia !== secuenciaConsulta.current) return;
        establecerMovimientosHistorial([]);
        establecerHayMas(false);
        establecerErrorConsulta(error?.message || 'No se pudo cargar el historial. Intentá nuevamente.');
        mostrarAviso('No se pudo consultar el historial de movimientos.', { tipo: 'error' });
      })
      .finally(() => {
        if (secuencia === secuenciaConsulta.current) establecerCargando(false);
      });

    return () => {
      if (secuencia === secuenciaConsulta.current) secuenciaConsulta.current += 1;
    };
  }, [enfocada, usuarioId, revisionHistorial, filtrosConsulta, errorMontoFiltro, mostrarAviso]);

  const filtrosAplicados = useMemo(() => {
    const filtros = [];

    if (busqueda.trim()) {
      filtros.push({
        id: 'busqueda',
        etiqueta: `Búsqueda: ${busqueda.trim()}`,
        alQuitar: () => establecerBusqueda(''),
      });
    }

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
    } else if (fechaFiltro === 'semana' && fechaDia) {
      const inicioSemana = crearFechaSinHora(fechaDia);
      inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
      const finSemana = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate() + 6);
      filtros.push({
        id: 'fecha',
        etiqueta: `Semana: ${formatearFechaCorta(inicioSemana)} – ${formatearFechaCorta(finSemana)}`,
        alQuitar: () => cambiarFechaFiltro('todos'),
      });
    } else if (fechaFiltro === 'mes' && mesSeleccionado) {
      filtros.push({
        id: 'fecha',
        etiqueta: `Fecha: ${MESES[mesSeleccionado.getMonth()]} ${mesSeleccionado.getFullYear()}`,
        alQuitar: () => cambiarFechaFiltro('todos'),
      });
    } else if (fechaFiltro === 'personalizado' && fechaInicial && fechaFinal) {
      filtros.push({
        id: 'fecha',
        etiqueta: `Fecha: ${formatearFechaCorta(fechaInicial)} – ${formatearFechaCorta(fechaFinal)}`,
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
      const categoria = categoriasDisponiblesFiltro.find((elemento) => elemento.id === idCategoria)
        || categoriasHistorial.find((elemento) => elemento.id === idCategoria);
      if (!categoria) return;
      filtros.push({
        id: `categoria-${idCategoria}`,
        etiqueta: `Categoría: ${categoria.nombre}`,
        alQuitar: () => establecerCategoriaFiltroIds((ids) => ids.filter((id) => id !== idCategoria)),
      });
    });

    if (filtraPorDepositos) {
      depositoFiltroIds.forEach((idDeposito) => {
        const deposito = depositosHistorial.find((elemento) => elemento.id === idDeposito);
        if (!deposito) return;
        filtros.push({
          id: `deposito-${idDeposito}`,
          etiqueta: `Depósito: ${deposito.nombre}`,
          bloqueado: depositoFiltroIds.length === 1,
          alQuitar: () => establecerDepositoFiltroIds((ids) => (
            ids.length === 1 ? ids : ids.filter((id) => id !== idDeposito)
          )),
        });
      });
    }

    return filtros;
  }, [busqueda, tipoFiltro, fechaFiltro, fechaDia, mesSeleccionado, fechaInicial, fechaFinal, montoMinimo, montoMaximo, categoriaFiltroIds, depositoFiltroIds, categoriasDisponiblesFiltro, categoriasHistorial, depositosHistorial, filtraPorDepositos, cambiarFechaFiltro]);
  const cantidadFiltros = filtrosAplicados.length;
  const gruposMovimientos = useMemo(
    () => agruparMovimientosPorDia(movimientosHistorial),
    [movimientosHistorial],
  );
  const resumenTipo = OPCIONES_TIPO.find((opcion) => opcion.id === tipoFiltro)?.nombre || 'Todos';
  const resumenFecha = fechaFiltro === 'dia'
    ? (fechaDia ? formatearFechaCorta(fechaDia) : 'Elegí un día')
    : fechaFiltro === 'semana'
      ? (fechaDia ? (() => {
        const inicio = crearFechaSinHora(fechaDia);
        inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
        const fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
        return `${formatearFechaCorta(inicio)} – ${formatearFechaCorta(fin)}`;
      })() : 'Elegí una semana')
    : fechaFiltro === 'mes'
      ? (mesSeleccionado ? `${MESES[mesSeleccionado.getMonth()]} ${mesSeleccionado.getFullYear()}` : 'Elegí un mes')
      : fechaFiltro === 'personalizado'
        ? (fechaInicial && fechaFinal
          ? `${formatearFechaCorta(fechaInicial)} – ${formatearFechaCorta(fechaFinal)}`
          : 'Elegí un rango')
        : 'Todo';
  const resumenDepositos = !filtraPorDepositos
    ? 'Todos'
    : depositosHistorial
      .filter((deposito) => depositoFiltroIds.includes(deposito.id))
      .map((deposito) => deposito.nombre)
      .join(', ');
  const resumenCategorias = categoriaFiltroIds.length === 0
    ? 'Todas'
    : categoriasDisponiblesFiltro
      .filter((categoria) => categoriaFiltroIds.includes(categoria.id))
      .map((categoria) => categoria.nombre)
      .join(', ');
  const resumenMonto = montoMinimo.trim() || montoMaximo.trim()
    ? `${montoMinimo.trim() ? `$${montoMinimo.trim()}` : 'Sin mínimo'} – ${montoMaximo.trim() ? `$${montoMaximo.trim()}` : 'Sin máximo'}`
    : 'Cualquier monto';

  const limpiarFiltros = () => {
    establecerBusqueda('');
    establecerTipoFiltro('todos');
    establecerFechaFiltro('todos');
    establecerFechaDia(null);
    establecerMesSeleccionado(null);
    establecerAnioMesVisible(new Date().getFullYear());
    establecerFechaInicial(null);
    establecerFechaFinal(null);
    establecerMontoMinimo('');
    establecerMontoMaximo('');
    establecerCategoriaFiltroIds([]);
    establecerDepositoFiltroIds(depositosHistorial.map((deposito) => deposito.id));
  };

  const reintentarHistorial = () => {
    establecerErrorConsulta(null);
    establecerCargando(true);
    establecerIntentoCargaOpciones((intento) => intento + 1);
  };

  const abrirDetalle = (movimiento) => {
    abrirPantallaSecundaria(RUTAS.DETALLE_MOVIMIENTO, { movimientoId: movimiento.id });
  };

  const cargarMasMovimientos = useCallback(async () => {
    const ultimoMovimiento = movimientosHistorial[movimientosHistorial.length - 1];
    if (
      !usuarioId
      || !enfocada
      || cargando
      || cargandoMas
      || !hayMas
      || !ultimoMovimiento
      || bloqueoCargaMas.current
      || errorMontoFiltro
    ) return;

    const secuencia = secuenciaConsulta.current;
    bloqueoCargaMas.current = true;
    establecerCargandoMas(true);
    establecerErrorCargaMas(null);
    try {
      const nuevosMovimientos = await cargarPaginaHistorialMovimientos(
        usuarioId,
        filtrosConsulta,
        { fecha_hora: ultimoMovimiento.fecha_hora, id: ultimoMovimiento.id },
      );
      if (secuencia !== secuenciaConsulta.current) return;
      establecerMovimientosHistorial((anteriores) => {
        const idsCargados = new Set(anteriores.map((movimiento) => movimiento.id));
        return [
          ...anteriores,
          ...nuevosMovimientos.filter((movimiento) => !idsCargados.has(movimiento.id)),
        ];
      });
      establecerHayMas(nuevosMovimientos.length === TAMANO_PAGINA);
    } catch (error) {
      if (secuencia !== secuenciaConsulta.current) return;
      establecerErrorCargaMas(error?.message || 'No se pudieron cargar más movimientos. Intentá nuevamente.');
      mostrarAviso('No se pudieron cargar más movimientos.', { tipo: 'error' });
    } finally {
      if (secuencia === secuenciaConsulta.current) {
        bloqueoCargaMas.current = false;
        establecerCargandoMas(false);
      }
    }
  }, [movimientosHistorial, usuarioId, enfocada, cargando, cargandoMas, hayMas, errorMontoFiltro, filtrosConsulta, mostrarAviso]);

  const sinMovimientos = !cargando && cantidadTotal === 0;
  const sinResultados = !cargando && (cantidadTotal || 0) > 0 && movimientosHistorial.length === 0;

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoPrincipal
          tema={tema}
          titulo="Movimientos"
          descripcion="Consulta el historial general de tus operaciones."
          alAbrirNotificaciones={() => abrirPantallaSecundaria(RUTAS.NOTIFICACIONES)}
          alAbrirPerfil={() => abrirPantallaSecundaria(RUTAS.PERFIL)}
        />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={estilos.contenido}>
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
                  selectionColor={tema.botonPrincipal}
                  style={estilos.entradaBuscador}
                  value={busqueda}
                />
                {busqueda ? (
                  <Pressable
                    accessibilityLabel="Limpiar búsqueda"
                    accessibilityRole="button"
                    onPress={() => establecerBusqueda('')}
                    style={estilos.accionBuscador}
                  >
                    <Ionicons color={tema.textoSecundario} name="close-circle-outline" size={22} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="Filtros"
                accessibilityRole="button"
                onPress={abrirFiltros}
                style={({ pressed: presionado }) => [
                  estilosGlobales.botonSecundario,
                  estilos.botonFiltros,
                  presionado ? { opacity: 0.85 } : null,
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
                  <Pressable
                    accessibilityRole="button"
                    onPress={limpiarFiltros}
                    style={estilos.botonLimpiar}
                  >
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
                  {filtrosAplicados.map((filtro) => (
                    <Pressable
                      accessibilityLabel={filtro.bloqueado
                        ? `${filtro.etiqueta}. Seleccioná otro depósito antes de quitar este filtro.`
                        : `Quitar ${filtro.etiqueta}`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: filtro.bloqueado }}
                      disabled={filtro.bloqueado}
                      key={filtro.id}
                      onPress={filtro.alQuitar}
                      style={estilos.chipFiltroAplicado}
                    >
                      <Text numberOfLines={1} style={estilos.textoChipFiltroAplicado}>
                        {filtro.etiqueta}
                      </Text>
                      <Ionicons
                        color={tema.textoSecundario}
                        name={filtro.bloqueado ? 'lock-closed' : 'close'}
                        size={16}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            {cargando ? (
              <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
                <View style={estilos.lineaCarga} />
                <View style={estilos.lineaCarga} />
                <View style={estilos.lineaCarga} />
              </View>
            ) : errorConsulta ? (
              <View style={estilos.estadoVacio}>
                <Ionicons color={tema.error} name="alert-circle-outline" size={32} />
                <Text style={estilos.textoEstadoVacio}>{errorConsulta}</Text>
                <Pressable accessibilityRole="button" onPress={reintentarHistorial} style={estilos.botonLimpiar}>
                  <Text style={estilos.textoBotonLimpiar}>Reintentar</Text>
                </Pressable>
              </View>
            ) : errorMontoFiltro ? (
              <View style={estilos.estadoVacio}>
                <Ionicons color={tema.error} name="cash-outline" size={32} />
                <Text style={estilos.textoEstadoVacio}>{errorMontoFiltro}</Text>
              </View>
            ) : sinMovimientos ? (
              <View style={estilos.estadoVacio}>
                <Ionicons color={tema.textoSecundario} name="receipt-outline" size={32} />
                <Text style={estilos.textoEstadoVacio}>Todavía no hay movimientos para mostrar.</Text>
              </View>
            ) : sinResultados ? (
              <View style={estilos.estadoVacio}>
                <Ionicons color={tema.textoSecundario} name="search-outline" size={32} />
                <Text style={estilos.textoEstadoVacio}>
                  {busqueda.trim()
                    ? `Sin resultados para “${busqueda.trim()}”.`
                    : 'Sin resultados para los filtros elegidos.'}
                </Text>
                <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}>
                  <Text style={estilos.textoBotonLimpiar}>Limpiar filtros</Text>
                </Pressable>
              </View>
            ) : (
              <View style={estilos.listaMovimientos}>
                {gruposMovimientos.map((grupo) => (
                  <View key={grupo.clave} style={estilos.grupoDia}>
                    <Text accessibilityRole="header" style={estilos.tituloDia}>
                      {formatearFechaDia(grupo.fecha)}
                    </Text>
                    <View style={estilos.movimientosDia}>
                      {grupo.movimientos.map((movimiento) => (
                        <TarjetaMovimiento
                          key={movimiento.id}
                          tema={tema}
                          estilos={estilos}
                          movimiento={movimiento}
                          alPresionar={abrirDetalle}
                          soloHora
                        />
                      ))}
                    </View>
                  </View>
                ))}
                {errorCargaMas ? (
                  <View style={estilos.estadoVacio}>
                    <Text style={estilos.textoEstadoVacio}>{errorCargaMas}</Text>
                    <Pressable accessibilityRole="button" onPress={cargarMasMovimientos} style={estilos.botonLimpiar}>
                      <Text style={estilos.textoBotonLimpiar}>Reintentar</Text>
                    </Pressable>
                  </View>
                ) : hayMas || cargandoMas ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={cargandoMas}
                    onPress={cargarMasMovimientos}
                    style={estilos.botonCargarMas}
                  >
                    {cargandoMas ? <ActivityIndicator color={tema.foco} /> : null}
                    <Text style={estilos.textoBotonCargarMas}>
                      {cargandoMas ? 'Cargando más movimientos…' : 'Cargar más movimientos'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          animationType="none"
          onRequestClose={cerrarFiltros}
          transparent
          visible={filtrosVisibles}
        >
          <View style={estilos.fondoFiltros}>
            <Animated.View pointerEvents="none" style={[estilos.overlayFiltros, { opacity: opacidadOverlay }]} />
            <Pressable
              accessibilityLabel="Cerrar filtros"
              onPress={cerrarFiltros}
              style={estilos.fondoTactilFiltros}
            />
            <Animated.View
              style={[
                estilos.panelFiltros,
                { transform: [{ translateY: desplazamientoPanel }] },
              ]}
            >
              <View style={estilos.encabezadoPanelFiltros}>
                <View style={estilos.zonaManijaFiltros} {...responderManija.panHandlers}>
                  <View style={estilos.manijaFiltros} />
                </View>
                <View style={estilos.encabezadoPanelContenido}>
                  <Text style={estilos.tituloModal}>Filtros</Text>
                  <Pressable
                    accessibilityLabel="Cerrar filtros"
                    accessibilityRole="button"
                    onPress={cerrarFiltros}
                    style={estilos.botonCerrarModal}
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
                            style={[estilos.chip, estilos.chipTipo, activa ? estilos.chipActivo : null]}
                          >
                            <Text numberOfLines={1} style={[estilos.textoChip, activa ? estilos.textoChipActivo : null]}>
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
                              style={[estilos.chip, estilos.chipFecha, activa ? estilos.chipActivo : null]}
                            >
                              <Text style={[estilos.textoChip, activa ? estilos.textoChipActivo : null]}>
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
                    {fechaFiltro === 'semana' ? (
                      <View style={estilos.grupoCalendarioFiltro}>
                        <Text style={estilos.textoAyudaFiltro}>Elegí una fecha de la semana</Text>
                        <SelectorFecha
                          tema={tema}
                          estilosMovimiento={estilos}
                          etiqueta="Semana que incluye"
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
                    titulo="Depósitos"
                    resumen={resumenDepositos}
                    abierta={seccionesFiltrosAbiertas.includes('depositos')}
                    alAlternar={() => alternarSeccionFiltro('depositos')}
                    colorAcento={tema.exito}
                    estilos={estilos}
                  >
                    <SelectorDeposito
                      tema={tema}
                      estilosGlobales={estilosGlobales}
                      estilosMovimiento={estilos}
                      etiqueta=""
                      depositos={depositosHistorial}
                      seleccionMultiple
                      seleccionadasIds={depositoFiltroIds}
                      alCambiarMulti={establecerDepositoFiltroIds}
                      enLinea
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
                          keyboardType="numeric"
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
                          keyboardType="numeric"
                          onChangeText={establecerMontoMaximo}
                          placeholder="$ 0"
                          placeholderTextColor={tema.textoSecundario}
                          selectionColor={tema.foco}
                          style={estilos.campoRango}
                          value={montoMaximo}
                        />
                      </View>
                    </View>
                    {errorMontoFiltro ? (
                      <Text style={estilosGlobales.textoError}>{errorMontoFiltro}</Text>
                    ) : null}
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
      </View>
    </SafeAreaView>
  );
}
