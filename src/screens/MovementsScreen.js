import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SelectorCategoria from '../components/CategorySelector';
import SelectorFecha from '../components/DateSelector';
import SelectorDeposito from '../components/DepositSelector';
import EncabezadoPrincipal from '../components/MainHeader';
import TarjetaMovimiento from '../components/MovementCard';
import { RUTAS } from '../constants/routes';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
  DEPOSITOS_SIMULADOS,
} from '../constants/movimientos';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosMovimientos } from '../styles/MovementsScreenStyles';

const MOVIMIENTOS_SIMULADOS = Object.freeze([
  Object.freeze({ id: 'subte', tipo: 'egreso', descripcion: 'Subte', categoria: 'transporte', deposito_id: 'mercado-pago', fecha_hora: '2026-09-25T07:43:00', monto: 1500, recurrente: false }),
  Object.freeze({ id: 'youtube-music', tipo: 'egreso', descripcion: 'YouTube Music', categoria: 'suscripciones', deposito_id: 'mercado-pago', fecha_hora: '2026-09-24T09:40:00', monto: 4130, recurrente: true, frecuencia: 'mensual' }),
  Object.freeze({ id: 'supermercado', tipo: 'egreso', descripcion: 'Supermercado', categoria: 'alimentacion', deposito_id: 'mercado-pago', fecha_hora: '2026-09-24T18:45:00', monto: 48500, recurrente: false }),
  Object.freeze({ id: 'sueldo', tipo: 'ingreso', descripcion: 'Sueldo', categoria: 'sueldo', deposito_id: 'efectivo', fecha_hora: '2026-09-22T09:00:00', monto: 1250000, recurrente: true, frecuencia: 'mensual' }),
  Object.freeze({ id: 'farmacia', tipo: 'egreso', descripcion: 'Farmacia', categoria: 'salud', deposito_id: 'cuenta-bancaria', fecha_hora: '2026-09-21T19:15:00', monto: 7250, recurrente: false }),
  Object.freeze({ id: 'venta-bici', tipo: 'ingreso', descripcion: 'Venta de bicicleta', categoria: 'ventas', deposito_id: 'efectivo', fecha_hora: '2026-09-20T16:30:00', monto: 85000, recurrente: false }),
  Object.freeze({ id: 'freelance', tipo: 'ingreso', descripcion: 'Trabajo freelance', categoria: 'trabajo_independiente', deposito_id: 'mercado-pago', fecha_hora: '2026-09-18T12:00:00', monto: 120000, recurrente: false }),
  Object.freeze({ id: 'regalo', tipo: 'ingreso', descripcion: 'Regalo de cumpleaños', categoria: 'regalos', deposito_id: 'efectivo', fecha_hora: '2026-09-15T20:00:00', monto: 20000, recurrente: false }),
  Object.freeze({ id: 'zapatillas', tipo: 'egreso', descripcion: 'Zapatillas', categoria: 'compras', deposito_id: 'cuenta-bancaria', fecha_hora: '2026-09-12T17:20:00', monto: 45000, recurrente: false }),
  Object.freeze({ id: 'alquiler', tipo: 'egreso', descripcion: 'Alquiler', categoria: 'hogar', deposito_id: 'cuenta-bancaria', fecha_hora: '2026-09-10T10:00:00', monto: 350000, recurrente: true, frecuencia: 'mensual' }),
]);

const OPCIONES_TIPO = Object.freeze([
  Object.freeze({ id: 'todos', nombre: 'Todos' }),
  Object.freeze({ id: 'ingreso', nombre: 'Ingresos' }),
  Object.freeze({ id: 'egreso', nombre: 'Egresos' }),
]);

const OPCIONES_FECHA = Object.freeze([
  Object.freeze({ id: 'todos', nombre: 'Todo' }),
  Object.freeze({ id: 'dia', nombre: 'Día' }),
  Object.freeze({ id: 'mes', nombre: 'Mes' }),
  Object.freeze({ id: 'personalizado', nombre: 'Rango' }),
]);

const IDS_INGRESO = new Set(CATEGORIAS_INGRESO.map((categoria) => categoria.id));
const IDS_EGRESO = new Set(CATEGORIAS_EGRESO.map((categoria) => categoria.id));
const IDS_DEPOSITOS = Object.freeze(DEPOSITOS_SIMULADOS.map((deposito) => deposito.id));
const CATEGORIAS_FILTRO = Object.freeze([
  ...CATEGORIAS_INGRESO,
  ...CATEGORIAS_EGRESO.filter((categoria) => !IDS_INGRESO.has(categoria.id)),
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
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosMovimientos(tema, anchoVentana);
  const abrirPantallaSecundaria = (ruta, parametros) => navegacion.getParent()?.navigate(ruta, parametros);
  const [busqueda, establecerBusqueda] = useState('');
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
  const [depositoFiltroIds, establecerDepositoFiltroIds] = useState(IDS_DEPOSITOS);
  const [filtrosVisibles, establecerFiltrosVisibles] = useState(false);
  const [seccionesFiltrosAbiertas, establecerSeccionesFiltrosAbiertas] = useState(['tipo', 'fecha']);
  const [cargando, establecerCargando] = useState(true);
  const [buscadorEnfocado, establecerBuscadorEnfocado] = useState(false);
  const filtraPorDepositos = depositoFiltroIds.length > 0
    && depositoFiltroIds.length < DEPOSITOS_SIMULADOS.length;
  const opacidadOverlay = useRef(new Animated.Value(0)).current;
  const desplazamientoPanel = useRef(new Animated.Value(0)).current;
  const categoriasDisponiblesFiltro = tipoFiltro === 'ingreso'
    ? CATEGORIAS_INGRESO
    : tipoFiltro === 'egreso'
      ? CATEGORIAS_EGRESO
      : CATEGORIAS_FILTRO;

  const cambiarTipoFiltro = (tipo) => {
    establecerTipoFiltro(tipo);
    if (tipo === 'todos') return;
    const idsPermitidos = tipo === 'ingreso' ? IDS_INGRESO : IDS_EGRESO;
    establecerCategoriaFiltroIds((ids) => ids.filter((id) => idsPermitidos.has(id)));
  };

  const alternarSeccionFiltro = (seccion) => {
    establecerSeccionesFiltrosAbiertas((abiertas) => (abiertas.includes(seccion)
      ? abiertas.filter((elemento) => elemento !== seccion)
      : [...abiertas, seccion]));
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
    if (modo === 'dia') establecerFechaDia(null);
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
    const temporizador = setTimeout(() => establecerCargando(false), 1200);
    return () => clearTimeout(temporizador);
  }, []);

  const filtrosAplicados = useMemo(() => {
    const filtros = [];

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
      const categoria = CATEGORIAS_FILTRO.find((elemento) => elemento.id === idCategoria);
      if (!categoria) return;
      filtros.push({
        id: `categoria-${idCategoria}`,
        etiqueta: `Categoría: ${categoria.nombre}`,
        alQuitar: () => establecerCategoriaFiltroIds((ids) => ids.filter((id) => id !== idCategoria)),
      });
    });

    if (filtraPorDepositos) {
      depositoFiltroIds.forEach((idDeposito) => {
        const deposito = DEPOSITOS_SIMULADOS.find((elemento) => elemento.id === idDeposito);
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
  }, [tipoFiltro, fechaFiltro, fechaDia, mesSeleccionado, fechaInicial, fechaFinal, montoMinimo, montoMaximo, categoriaFiltroIds, depositoFiltroIds, filtraPorDepositos, cambiarFechaFiltro]);
  const cantidadFiltros = filtrosAplicados.length;

  const movimientosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const minimo = Number.parseFloat(montoMinimo);
    const maximo = Number.parseFloat(montoMaximo);
    return MOVIMIENTOS_SIMULADOS.filter((movimiento) => {
      if (tipoFiltro !== 'todos' && movimiento.tipo !== tipoFiltro) return false;
      if (categoriaFiltroIds.length > 0 && !categoriaFiltroIds.includes(movimiento.categoria)) return false;
      if (filtraPorDepositos && !depositoFiltroIds.includes(movimiento.deposito_id)) return false;
      if (texto && !movimiento.descripcion.toLowerCase().includes(texto)) return false;
      if (!Number.isNaN(minimo) && montoMinimo.trim() && movimiento.monto < minimo) return false;
      if (!Number.isNaN(maximo) && montoMaximo.trim() && movimiento.monto > maximo) return false;
      const fecha = new Date(movimiento.fecha_hora);
      if (fechaFiltro === 'dia' && fechaDia && !(
        fecha.getFullYear() === fechaDia.getFullYear()
        && fecha.getMonth() === fechaDia.getMonth()
        && fecha.getDate() === fechaDia.getDate()
      )) return false;
      if (fechaFiltro === 'mes' && mesSeleccionado && (
        fecha.getMonth() !== mesSeleccionado.getMonth()
        || fecha.getFullYear() !== mesSeleccionado.getFullYear()
      )) return false;
      if (fechaFiltro === 'personalizado' && fechaInicial && fechaFinal) {
        const inicio = crearFechaSinHora(fechaInicial);
        const fin = new Date(fechaFinal.getFullYear(), fechaFinal.getMonth(), fechaFinal.getDate(), 23, 59, 59, 999);
        if (fecha < inicio || fecha > fin) return false;
      }
      return true;
    }).slice().sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
  }, [busqueda, tipoFiltro, fechaFiltro, fechaDia, mesSeleccionado, montoMinimo, montoMaximo, categoriaFiltroIds, depositoFiltroIds, filtraPorDepositos, fechaInicial, fechaFinal]);
  const gruposMovimientos = useMemo(
    () => agruparMovimientosPorDia(movimientosFiltrados),
    [movimientosFiltrados],
  );
  const resumenTipo = OPCIONES_TIPO.find((opcion) => opcion.id === tipoFiltro)?.nombre || 'Todos';
  const resumenFecha = fechaFiltro === 'dia'
    ? (fechaDia ? formatearFechaCorta(fechaDia) : 'Elegí un día')
    : fechaFiltro === 'mes'
      ? (mesSeleccionado ? `${MESES[mesSeleccionado.getMonth()]} ${mesSeleccionado.getFullYear()}` : 'Elegí un mes')
      : fechaFiltro === 'personalizado'
        ? (fechaInicial && fechaFinal
          ? `${formatearFechaCorta(fechaInicial)} – ${formatearFechaCorta(fechaFinal)}`
          : 'Elegí un rango')
        : 'Todo';
  const resumenDepositos = !filtraPorDepositos
    ? 'Todos'
    : DEPOSITOS_SIMULADOS
      .filter((deposito) => depositoFiltroIds.includes(deposito.id))
      .map((deposito) => deposito.nombre)
      .join(', ');
  const resumenCategorias = categoriaFiltroIds.length === 0
    ? 'Todas'
    : CATEGORIAS_FILTRO
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
    establecerDepositoFiltroIds(IDS_DEPOSITOS);
  };

  const abrirDetalle = (movimiento, categoria) => {
    abrirPantallaSecundaria(RUTAS.DETALLE_MOVIMIENTO, { movimiento, categoria });
  };

  const sinResultados = !cargando && MOVIMIENTOS_SIMULADOS.length > 0 && movimientosFiltrados.length === 0;

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
                onPress={() => establecerFiltrosVisibles(true)}
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
            ) : MOVIMIENTOS_SIMULADOS.length === 0 ? (
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
                    <View style={estilos.filaChips}>
                      {OPCIONES_TIPO.map((opcion) => {
                        const activa = tipoFiltro === opcion.id;
                        return (
                          <Pressable
                            key={opcion.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: activa }}
                            onPress={() => cambiarTipoFiltro(opcion.id)}
                            style={[estilos.chip, activa ? estilos.chipActivo : null]}
                          >
                            <Text style={[estilos.textoChip, activa ? estilos.textoChipActivo : null]}>
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
                    <View style={estilos.filaChips}>
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
                      </View>
                    ) : null}
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
                      depositos={DEPOSITOS_SIMULADOS}
                      seleccionMultiple
                      seleccionadasIds={depositoFiltroIds}
                      alCambiarMulti={establecerDepositoFiltroIds}
                      enLinea
                    />
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
                      <TextInput
                        accessibilityLabel="Monto mínimo"
                        keyboardType="numeric"
                        onChangeText={establecerMontoMinimo}
                        placeholder="Mínimo"
                        placeholderTextColor={tema.textoSecundario}
                        selectionColor={tema.foco}
                        style={estilos.campoRango}
                        value={montoMinimo}
                      />
                      <TextInput
                        accessibilityLabel="Monto máximo"
                        keyboardType="numeric"
                        onChangeText={establecerMontoMaximo}
                        placeholder="Máximo"
                        placeholderTextColor={tema.textoSecundario}
                        selectionColor={tema.foco}
                        style={estilos.campoRango}
                        value={montoMaximo}
                      />
                    </View>
                  </SeccionFiltro>

                  <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}>
                    <Text style={estilos.textoBotonLimpiar}>Limpiar filtros</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
