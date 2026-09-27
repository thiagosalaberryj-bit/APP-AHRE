import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import BotonPrincipal from '../components/PrimaryButton';
import SelectorCategoria from '../components/CategorySelector';
import SelectorFecha from '../components/DateSelector';
import TarjetaMovimiento from '../components/MovementCard';
import EncabezadoSeccion from '../components/SectionHeader';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { RUTAS } from '../constants/routes';
import { COLOR_DEPOSITO_PREDETERMINADO, COLOR_ICONO_DEPOSITO, COLORES_DEPOSITOS, TEMAS } from '../styles/colors';
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
  Object.freeze({ id: 'mes', nombre: 'Mes' }),
  Object.freeze({ id: 'personalizado', nombre: 'Rango' }),
]);
const IDS_INGRESO = new Set(CATEGORIAS_INGRESO.map((categoria) => categoria.id));
const IDS_EGRESO = new Set(CATEGORIAS_EGRESO.map((categoria) => categoria.id));
const MESES = Object.freeze([
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]);
const CATEGORIAS_FILTRO = Object.freeze([
  ...CATEGORIAS_INGRESO,
  ...CATEGORIAS_EGRESO.filter((categoria) => !IDS_INGRESO.has(categoria.id)),
]);
const ESTA_CARGANDO = false;
const DEPOSITO_PREDETERMINADO = Object.freeze({
  id: 'efectivo',
  nombre: 'Efectivo',
  tipo: 'Efectivo',
  descripcion: 'Para gastos diarios',
  color: COLOR_DEPOSITO_PREDETERMINADO,
  saldo: '$ 354.000',
  icono: 'cash-outline',
});

function crearFechaMuestra(diasAntes, hora) {
  const fecha = new Date();
  const [horas, minutos] = hora.split(':').map(Number);
  fecha.setDate(fecha.getDate() - diasAntes);
  fecha.setHours(horas, minutos, 0, 0);
  const dosDigitos = (valor) => String(valor).padStart(2, '0');
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}T${dosDigitos(horas)}:${dosDigitos(minutos)}:00`;
}

const MOVIMIENTOS_POR_DEPOSITO = Object.freeze({
  efectivo: Object.freeze([
    Object.freeze({ id: 'youtube-music', descripcion: 'YouTube Music', categoria: 'suscripciones', deposito_id: 'efectivo', fecha_hora: crearFechaMuestra(0, '09:40'), tipo: 'egreso', monto: 4130 }),
    Object.freeze({ id: 'supermercado', descripcion: 'Supermercado', categoria: 'alimentacion', deposito_id: 'efectivo', fecha_hora: crearFechaMuestra(1, '18:20'), tipo: 'egreso', monto: 48500 }),
    Object.freeze({ id: 'sueldo', descripcion: 'Sueldo', categoria: 'sueldo', deposito_id: 'efectivo', fecha_hora: crearFechaMuestra(4, '08:15'), tipo: 'ingreso', monto: 1250000 }),
    Object.freeze({ id: 'farmacia', descripcion: 'Farmacia', categoria: 'salud', deposito_id: 'efectivo', fecha_hora: crearFechaMuestra(5, '13:05'), tipo: 'egreso', monto: 7250 }),
    Object.freeze({ id: 'venta', descripcion: 'Venta de bicicleta', categoria: 'ventas', deposito_id: 'efectivo', fecha_hora: crearFechaMuestra(6, '16:30'), tipo: 'ingreso', monto: 85000 }),
  ]),
  'mercado-pago': Object.freeze([
    Object.freeze({ id: 'streaming', descripcion: 'YouTube Music', categoria: 'suscripciones', deposito_id: 'mercado-pago', fecha_hora: crearFechaMuestra(0, '09:40'), tipo: 'egreso', monto: 4130 }),
    Object.freeze({ id: 'transferencia', descripcion: 'Transferencia recibida', categoria: 'transferencias_recibidas', deposito_id: 'mercado-pago', fecha_hora: crearFechaMuestra(1, '12:10'), tipo: 'ingreso', monto: 18000 }),
    Object.freeze({ id: 'viaje', descripcion: 'Viaje', categoria: 'viajes', deposito_id: 'mercado-pago', fecha_hora: crearFechaMuestra(6, '17:40'), tipo: 'egreso', monto: 2800 }),
  ]),
  banco: Object.freeze([]),
});

function crearFechaSinHora(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function formatearFechaCorta(fecha) {
  return fecha.toLocaleDateString('es-AR');
}

function formatearFechaDia(fecha) {
  const hoy = crearFechaSinHora(new Date());
  const fechaNormalizada = crearFechaSinHora(fecha);
  const diferenciaDias = Math.round((hoy - fechaNormalizada) / 86400000);
  if (diferenciaDias === 0) return 'Hoy';
  if (diferenciaDias === 1) return 'Ayer';
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
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

function SeccionFiltro({ titulo, resumen, abierta, alAlternar, colorAcento, estilos, children }) {
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

export default function PantallaDetalleDeposito({ navigation: navegacion, route: ruta }) {
  const { height: altoVentana, width: anchoVentana } = useWindowDimensions();
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleDeposito(tema, anchoVentana);
  const estilosFormularioDeposito = crearEstilosDeposito(tema);
  const deposito = ruta?.params?.deposito ?? DEPOSITO_PREDETERMINADO;
  const movimientos = MOVIMIENTOS_POR_DEPOSITO[deposito.id] ?? MOVIMIENTOS_POR_DEPOSITO.efectivo;

  const [busqueda, establecerBusqueda] = useState('');
  const [buscadorEnfocado, establecerBuscadorEnfocado] = useState(false);
  const [filtrosVisibles, establecerFiltrosVisibles] = useState(false);
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
  const [seccionesFiltrosAbiertas, establecerSeccionesFiltrosAbiertas] = useState(['tipo', 'fecha']);
  const [modalOpcionesVisible, establecerModalOpcionesVisible] = useState(false);
  const [modalEdicionVisible, establecerModalEdicionVisible] = useState(false);
  const [modalIconosEdicionVisible, establecerModalIconosEdicionVisible] = useState(false);
  const [modalEliminacionVisible, establecerModalEliminacionVisible] = useState(false);
  const [nombreEdicionEnfocado, establecerNombreEdicionEnfocado] = useState(false);
  const [descripcionEdicionEnfocada, establecerDescripcionEdicionEnfocada] = useState(false);
  const [borrador, establecerBorrador] = useState(deposito);
  const [mensajeEstado, establecerMensajeEstado] = useState('');
  const tipoSeleccionado = borrador.tipo === 'Cuenta bancaria'
    ? 'banco'
    : TIPOS_DEPOSITO.find((opcion) => opcion.id === borrador.tipo || opcion.nombre === borrador.tipo)?.id;
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

  const categoriasDisponiblesFiltro = useMemo(() => {
    const idsDisponibles = new Set(movimientos.map((movimiento) => movimiento.categoria));
    const categoriasPorTipo = tipoFiltro === 'ingreso'
      ? CATEGORIAS_INGRESO
      : tipoFiltro === 'egreso'
        ? CATEGORIAS_EGRESO
        : CATEGORIAS_FILTRO;
    return categoriasPorTipo.filter((categoria) => idsDisponibles.has(categoria.id));
  }, [movimientos, tipoFiltro]);

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

  const filtrosActivos = useMemo(() => {
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
    return filtros;
  }, [categoriaFiltroIds, cambiarFechaFiltro, fechaDia, fechaFinal, fechaInicial, fechaFiltro, mesSeleccionado, montoMaximo, montoMinimo, tipoFiltro]);

  const cantidadFiltros = filtrosActivos.length;

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
  };

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
    establecerModalOpcionesVisible(false);
    establecerModalEdicionVisible(true);
    establecerModalIconosEdicionVisible(false);
    establecerNombreEdicionEnfocado(false);
    establecerDescripcionEdicionEnfocada(false);
    establecerMensajeEstado('');
  };

  const cerrarEdicion = () => {
    establecerModalEdicionVisible(false);
    establecerModalIconosEdicionVisible(false);
    establecerBorrador({ ...deposito });
  };

  const actualizarBorrador = (propiedad, valor) => {
    establecerBorrador((actual) => ({ ...actual, [propiedad]: valor }));
  };

  const abrirDetalleMovimiento = (movimiento, categoria) => {
    navegacion.push(RUTAS.DETALLE_MOVIMIENTO, { categoria, movimiento });
  };

  const movimientosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es-AR');
    const minimo = Number.parseFloat(montoMinimo);
    const maximo = Number.parseFloat(montoMaximo);

    return movimientos.filter((movimiento) => {
      if (tipoFiltro !== 'todos' && movimiento.tipo !== tipoFiltro) return false;
      if (texto && !movimiento.descripcion.toLocaleLowerCase('es-AR').includes(texto)) return false;
      if (categoriaFiltroIds.length > 0 && !categoriaFiltroIds.includes(movimiento.categoria)) return false;
      if (!Number.isNaN(minimo) && montoMinimo.trim() && movimiento.monto < minimo) return false;
      if (!Number.isNaN(maximo) && montoMaximo.trim() && movimiento.monto > maximo) return false;

      const fecha = new Date(movimiento.fecha_hora);
      if (fechaFiltro === 'dia' && fechaDia) {
        if (fecha.getFullYear() !== fechaDia.getFullYear()
          || fecha.getMonth() !== fechaDia.getMonth()
          || fecha.getDate() !== fechaDia.getDate()) return false;
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
    }).slice().sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
  }, [busqueda, categoriaFiltroIds, fechaDia, fechaFinal, fechaFiltro, fechaInicial, mesSeleccionado, montoMaximo, montoMinimo, movimientos, tipoFiltro]);

  const gruposMovimientos = useMemo(
    () => agruparMovimientosPorDia(movimientosFiltrados),
    [movimientosFiltrados],
  );

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
          <View style={[estilosGlobales.tarjeta, estilos.tarjetaDeposito]}>
            <View style={estilos.encabezadoDeposito}>
              <View style={[estilos.iconoDeposito, { backgroundColor: deposito.color || COLOR_DEPOSITO_PREDETERMINADO }]}>
                <Ionicons color={COLOR_ICONO_DEPOSITO} name={deposito.icono || 'wallet-outline'} size={28} />
              </View>
              <View style={estilos.datosDeposito}>
                <Text style={estilosGlobales.subtitulo}>{deposito.nombre}</Text>
                <Text style={estilosGlobales.textoSecundario}>{deposito.tipo}</Text>
                {deposito.descripcion ? <Text style={estilosGlobales.textoAyuda}>{deposito.descripcion}</Text> : null}
              </View>
            </View>
            <Pressable
              accessibilityLabel="Opciones del depósito"
              accessibilityRole="button"
              onPress={() => establecerModalOpcionesVisible(true)}
              style={estilos.botonOpciones}
            >
              <Ionicons color={tema.textoPrincipal} name="ellipsis-vertical" size={22} />
            </Pressable>
            <View style={estilos.separadorSaldo} />
            <Text style={estilosGlobales.textoSecundario}>Saldo de este depósito</Text>
            <Text style={estilos.saldo}>{deposito.saldo}</Text>
          </View>

          {mensajeEstado ? (
            <View style={estilos.mensajeEstado}>
              <Ionicons color={tema.foco} name="information-circle-outline" size={20} />
              <Text style={[estilosGlobales.textoSecundario, estilos.textoMensajeEstado]}>{mensajeEstado}</Text>
            </View>
          ) : null}

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
                onPress={() => establecerFiltrosVisibles(true)}
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

            {ESTA_CARGANDO ? (
              <View style={estilos.listaMovimientos}>
                {[0, 1, 2].map((indice) => <View key={indice} style={estilos.esqueletoMovimiento} />)}
              </View>
            ) : movimientos.length === 0 ? (
              <View style={estilos.estadoVacio}>
                <Ionicons color={tema.textoSecundario} name="receipt-outline" size={32} />
                <Text style={estilos.textoEstadoVacio}>Este depósito todavía no tiene movimientos.</Text>
              </View>
            ) : movimientosFiltrados.length > 0 ? (
              <View style={estilos.listaMovimientos}>
                {gruposMovimientos.map((grupo) => (
                  <View key={grupo.clave} style={estilos.grupoDia}>
                    <Text accessibilityRole="header" style={estilos.tituloDia}>{formatearFechaDia(grupo.fecha)}</Text>
                    <View style={estilos.movimientosDia}>
                      {grupo.movimientos.map((movimiento) => (
                        <TarjetaMovimiento
                          key={movimiento.id}
                          tema={tema}
                          estilos={estilos}
                          movimiento={movimiento}
                          alPresionar={abrirDetalleMovimiento}
                          soloHora
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
                  <View style={estilos.filaChips}>
                    {OPCIONES_TIPO.map((opcion) => {
                      const activa = tipoFiltro === opcion.id;
                      return (
                        <Pressable
                          key={opcion.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: activa }}
                          onPress={() => cambiarTipoFiltro(opcion.id)}
                          style={[estilos.chipFiltro, activa ? estilos.chipFiltroActivo : null]}
                        >
                          <Text style={[estilos.textoChipFiltro, activa ? estilos.textoChipFiltroActivo : null]}>
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
                          style={[estilos.chipFiltro, estilos.chipFecha, activa ? estilos.chipFiltroActivo : null]}
                        >
                          <Text style={[estilos.textoChipFiltro, activa ? estilos.textoChipFiltroActivo : null]}>
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
                      keyboardType="decimal-pad"
                      onChangeText={establecerMontoMinimo}
                      placeholder="Mínimo"
                      placeholderTextColor={tema.textoSecundario}
                      selectionColor={tema.foco}
                      style={estilos.campoRango}
                      value={montoMinimo}
                    />
                    <TextInput
                      accessibilityLabel="Monto máximo"
                      keyboardType="decimal-pad"
                      onChangeText={establecerMontoMaximo}
                      placeholder="Máximo"
                      placeholderTextColor={tema.textoSecundario}
                      selectionColor={tema.foco}
                      style={estilos.campoRango}
                      value={montoMaximo}
                    />
                  </View>
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
        <View style={estilos.fondoModal}>
          <Pressable style={estilos.fondoCierre} onPress={() => establecerModalOpcionesVisible(false)} />
          <View style={estilos.tarjetaOpciones}>
            <View style={estilos.encabezadoOpciones}>
              <View style={estilos.iconoEncabezadoOpciones}>
                <Ionicons color={tema.foco} name="wallet-outline" size={22} />
              </View>
              <View style={estilos.detalleEncabezadoOpciones}>
                <Text style={estilos.tituloOpciones}>Opciones del depósito</Text>
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
              style={({ pressed }) => [estilos.opcionModal, pressed ? estilos.botonPresionado : null]}
            >
              <View style={estilos.iconoOpcionModal}>
                <Ionicons color={tema.foco} name="create-outline" size={21} />
              </View>
              <View style={estilos.detalleOpcionModal}>
                <Text style={estilos.tituloOpcionModal}>Editar depósito</Text>
                <Text style={estilos.subtituloOpcionModal}>Nombre, tipo, ícono, color y descripción</Text>
              </View>
              <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                establecerModalOpcionesVisible(false);
                establecerModalEliminacionVisible(true);
                establecerMensajeEstado('');
              }}
              style={({ pressed }) => [estilos.opcionModal, estilos.opcionEliminar, pressed ? estilos.botonPresionado : null]}
            >
              <View style={[estilos.iconoOpcionModal, estilos.iconoOpcionEliminar]}>
                <Ionicons color={tema.error} name="trash-outline" size={21} />
              </View>
              <View style={estilos.detalleOpcionModal}>
                <Text style={[estilos.tituloOpcionModal, estilos.textoOpcionEliminar]}>Eliminar depósito</Text>
                <Text style={estilos.subtituloOpcionModal}>Quitar este depósito del listado</Text>
              </View>
              <Ionicons color={tema.error} name="chevron-forward" size={20} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => establecerModalOpcionesVisible(false)}
              style={estilos.botonCancelarModal}
            >
              <Text style={estilos.textoCancelarModal}>Cancelar</Text>
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
                          name={opcion.nombre}
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
                  Si la dejás vacía, podrá generarse más adelante usando el nombre y el tipo.
                </Text>
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
                alPresionar={() => {
                  cerrarEdicion();
                  establecerMensajeEstado('Los cambios todavía no se guardan. La información original del depósito se conserva.');
                }}
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
                  <Ionicons color={tema.foco} name={opcion.nombre} size={22} />
                  <Text style={estilosFormularioDeposito.nombreOpcionIcono}>{opcion.etiqueta}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => establecerModalEliminacionVisible(false)} transparent visible={modalEliminacionVisible}>
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
              <View style={[estilos.iconoDepositoEliminar, { backgroundColor: deposito.color || COLOR_DEPOSITO_PREDETERMINADO }]}>
                <Ionicons color={COLOR_ICONO_DEPOSITO} name={deposito.icono || 'wallet-outline'} size={21} />
              </View>
              <View style={estilos.datosDepositoEliminar}>
                <Text numberOfLines={1} style={estilos.nombreDepositoEliminar}>{deposito.nombre}</Text>
                <Text style={estilos.tipoDepositoEliminar}>{deposito.tipo}</Text>
              </View>
            </View>
            <View style={estilos.avisoEliminar}>
              <Ionicons color={tema.error} name="information-circle-outline" size={20} />
              <Text style={estilos.textoAvisoEliminar}>
                La eliminación todavía no está disponible. El depósito seguirá intacto.
              </Text>
            </View>
            <View style={estilos.accionesModal}>
              <Pressable accessibilityRole="button" onPress={() => establecerModalEliminacionVisible(false)} style={estilos.botonSecundarioModal}>
                <Text style={estilos.textoSecundarioModal}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  establecerModalEliminacionVisible(false);
                  establecerMensajeEstado('La eliminación todavía no está disponible. El depósito continúa intacto.');
                }}
                style={estilos.botonEliminar}
              >
                <Text style={estilos.textoEliminar}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
