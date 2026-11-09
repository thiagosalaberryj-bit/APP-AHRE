import {
  FiltroTipoMovimientos,
  FiltroFechaMovimientos,
  FiltroCategoriasMovimientos,
  FiltroMontoMovimientos,
} from '../components/MovementFilterSections';
import FiltrosRapidosMovimientos from '../components/MovementQuickFilters';
import { OPCIONES_TIPO, MESES } from '../constants/movementFilters';
import { obtenerPreajustesMovimientos, agruparCategoriasSeleccionadas } from '../utils/statisticsFilters';
import { crearEstilosBusquedaFiltros } from '../styles/MovementSearchFiltersStyles';
import PanelFiltrosMovimientos, { SeccionFiltro } from '../components/MovementFiltersPanel';
import BuscadorFiltrosMovimientos from '../components/MovementSearchFilters';
import { formatearEntradaMonto } from '../utils/moneyInput';
import { useContext, useCallback, useEffect, useMemo, useRef, useState, SetStateAction } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import SelectorDeposito from '../components/DepositSelector';
import EncabezadoPrincipal from '../components/MainHeader';
import ListaMesesMovimientos from '../components/MovementMonthList';
import { useMovimientosPorMes } from '../movements/useMonthlyMovements';
import { RUTAS } from '../constants/routes';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
} from '../constants/movimientos';
import {
  cargarOpcionesHistorialMovimientos,
  cargarPaginaHistorialMovimientos,
  cargarMesesHistorialMovimientos,
} from '../movements/movementService';

import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosMovimientos } from '../styles/MovementsScreenStyles';

function crearFechaSinHora(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function formatearFechaCorta(fecha: Date) {
  return fecha.toLocaleDateString('es-AR');
}

function crearRangoConsultaFecha(fechaFiltro: string, fechaDia: Date|null, mesSeleccionado: Date|null, fechaInicial: Date|null, fechaFinal: Date|null) {
  let inicio: Date | null = null;
  let fin: Date | null = null;

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

function convertirMontoFiltro(texto: string) {
  const valor = texto.trim();
  if (!valor) return null;
  const normalizado = valor.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizado)) return null;
  const monto = Number(normalizado);
  return Number.isFinite(monto) && monto >= 0 ? monto : null;
}

function obtenerTextoTipoDeposito(tipo: string) {
  if (tipo === 'efectivo') return 'Efectivo';
  if (tipo === 'banco') return 'Banco';
  if (tipo === 'billetera_virtual') return 'Billetera virtual';
  return 'Depósito con movimientos';
}

export default function PantallaMovimientos({ navigation: navegacion }: import('../navigation/types').PropiedadesPestana) {
  const { width: anchoVentana } = useWindowDimensions();
  const { tema } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosMovimientos(tema, anchoVentana);
  const estilosAccesos = crearEstilosBusquedaFiltros(tema);
  const abrirPantallaSecundaria = useCallback((ruta: string, parametros: import('../navigation/types').ParametrosPantalla | undefined = undefined) => navegacion.getParent()?.navigate(ruta, parametros), [navegacion]);
  const [busqueda, establecerBusqueda] = useState('');
  const [busquedaAplicada, establecerBusquedaAplicada] = useState('');
  const [tipoFiltro, establecerTipoFiltro] = useState('todos');
  const [fechaFiltro, establecerFechaFiltro] = useState('todos');
  const [fechaDia, establecerFechaDia] = useState<Date | null>(null);
  const [mesSeleccionado, establecerMesSeleccionado] = useState<Date | null>(null);
  const [anioMesVisible, establecerAnioMesVisible] = useState(() => new Date().getFullYear());
  const [fechaInicial, establecerFechaInicial] = useState<Date | null>(null);
  const [fechaFinal, establecerFechaFinal] = useState<Date | null>(null);
  const [montoMinimo, establecerMontoMinimo] = useState('');
  const [montoMaximo, establecerMontoMaximo] = useState('');
  const [categoriaFiltroIds, establecerCategoriaFiltroIds] = useState<string[]>([]);
  const [depositoFiltroIds, establecerDepositoFiltroIds] = useState<string[]>([]);
  const [categoriasHistorial, establecerCategoriasHistorial] = useState<({ tipo: "ingreso" | "egreso" | "transferencia_salida" | "transferencia_entrada"; id: string; nombre: string; nombreCorto?: string; descripcion: string; icono: import("../constants/movimientos").NombreIcono; } | { id: string; nombre: string; icono: import('../constants/movimientos').NombreIcono; tipo: "ingreso" | "egreso" | "transferencia_salida" | "transferencia_entrada"; })[]>([]);
  const [depositosHistorial, establecerDepositosHistorial] = useState<(Awaited<ReturnType<typeof cargarOpcionesHistorialMovimientos>>['depositos'][number] & {saldoTexto:string})[]>([]);
  const [usuarioId, establecerUsuarioId] = useState<string | null>(null);
  const [cantidadTotal, establecerCantidadTotal] = useState<number | null>(null);
  const [errorConsulta, establecerErrorConsulta] = useState<string | null>(null);
  const [enfocada, establecerEnfocada] = useState(false);
  const [revisionHistorial, establecerRevisionHistorial] = useState(0);
  const [intentoCargaOpciones, establecerIntentoCargaOpciones] = useState(0);
  const [filtrosVisibles, establecerFiltrosVisibles] = useState(false);
  const [seccionesFiltrosAbiertas, establecerSeccionesFiltrosAbiertas] = useState(['tipo', 'fecha']);
  const [cargando, establecerCargando] = useState(true);
  const depositosHistorialRef = useRef<typeof depositosHistorial>([]);
  const depositoFiltroIdsRef = useRef<string[]>([]);
  useEffect(() => {
    depositoFiltroIdsRef.current = depositoFiltroIds;
  }, [depositoFiltroIds]);
  const filtraPorDepositos = depositoFiltroIds.length > 0
    && depositoFiltroIds.length < depositosHistorial.length;
  const categoriasDisponiblesFiltro = tipoFiltro === 'ingreso'
    ? categoriasHistorial.filter((categoria) => categoria.tipo === 'ingreso')
    : tipoFiltro === 'egreso'
      ? categoriasHistorial.filter((categoria) => categoria.tipo === 'egreso')
      : [...new Map(categoriasHistorial.map((categoria) => [categoria.id, categoria])).values()];

  useEffect(() => {
    const idsDisponibles = new Set(categoriasHistorial.map((categoria) => categoria.id));
    establecerCategoriaFiltroIds((ids) => {
      const vigentes = ids.filter((id) => idsDisponibles.has(id));
      return vigentes.length === ids.length ? ids : vigentes;
    });
  }, [categoriasHistorial]);

  const cambiarTipoFiltro = (tipo: SetStateAction<string>) => {
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
              icono: 'pricetag-outline' as const,
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
        establecerCargando(false);
      })
      .catch((error: unknown) => {
        if (!vigente) return;
        establecerErrorConsulta((error instanceof Error ? error.message : '') || 'No se pudo cargar el historial. Intentá nuevamente.');
        establecerCargando(false);
        mostrarAviso('No se pudo consultar el historial de movimientos.', { tipo: 'error' });
      });

    return () => {
      vigente = false;
      establecerEnfocada(false);
    };
  }, [mostrarAviso, intentoCargaOpciones]));

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

  const seleccionarFechaPersonalizada = (fecha: Date) => {
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

  const consultarMeses = useCallback((criterios: import('../types/forms').FiltrosHistorial) => cargarMesesHistorialMovimientos(usuarioId || '', criterios), [usuarioId]);
  const consultarPagina = useCallback((criterios: import('../types/forms').FiltrosHistorial, cursor: {fecha_hora:string;id:string}|null) => cargarPaginaHistorialMovimientos(usuarioId || '', criterios, cursor), [usuarioId]);
  const datosMeses = useMovimientosPorMes({ habilitado: enfocada && !!usuarioId && !!revisionHistorial && !cargando,
    revision: revisionHistorial, filtros: filtrosConsulta, invalido: !!errorMontoFiltro, consultarMeses, consultarPagina });

  const filtrosAplicados = useMemo(() => {
    const filtros: {id:string;etiqueta:string;alQuitar:()=>void;bloqueado?:boolean}[] = [];

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

    const gruposCategorias = agruparCategoriasSeleccionadas(
      categoriaFiltroIds,
      obtenerPreajustesMovimientos(tipoFiltro, categoriasHistorial),
      categoriasDisponiblesFiltro,
    );
    gruposCategorias.forEach(grupo => {
      filtros.push({
        id: 'categorias-' + grupo.id,
        etiqueta: grupo.nombre,
        alQuitar: () => establecerCategoriaFiltroIds(ids => ids.filter(id => !grupo.categorias.includes(id))),
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
    ? `${montoMinimo.trim() ? ('$ ' + formatearEntradaMonto(montoMinimo.trim())) : 'Sin mínimo'} – ${montoMaximo.trim() ? ('$ ' + formatearEntradaMonto(montoMaximo.trim())) : 'Sin máximo'}`
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

  const abrirDetalle = useCallback((movimiento: import('../types/forms').MovimientoVisible) => {
    abrirPantallaSecundaria(RUTAS.DETALLE_MOVIMIENTO, { movimientoId: movimiento.id });
  }, [abrirPantallaSecundaria]);

  const preajustesCategorias = obtenerPreajustesMovimientos(tipoFiltro, categoriasHistorial);

  const sinMovimientos = !cargando && cantidadTotal === 0;
  const sinResultados = !cargando && (cantidadTotal || 0) > 0 && datosMeses.meses.length === 0;

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
        <ScrollView ref={datosMeses.referenciaScroll} {...datosMeses.eventosScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={estilos.contenido}>
            <BuscadorFiltrosMovimientos tema={tema} busqueda={busqueda} alBuscar={establecerBusqueda} alAbrirFiltros={abrirFiltros} alLimpiar={limpiarFiltros} filtrosActivos={filtrosAplicados} cantidad={cantidadFiltros}>
              <FiltrosRapidosMovimientos estilosAccesos={estilosAccesos}
                tipoFiltro={tipoFiltro} cambiarTipoFiltro={cambiarTipoFiltro} establecerTipoFiltro={establecerTipoFiltro}
                preajustesCategorias={preajustesCategorias} categoriaFiltroIds={categoriaFiltroIds} establecerCategoriaFiltroIds={establecerCategoriaFiltroIds}
                montoMinimoNumerico={montoMinimoNumerico} montoMaximoNumerico={montoMaximoNumerico}
                errorMontoFiltro={errorMontoFiltro} establecerMontoMinimo={establecerMontoMinimo} establecerMontoMaximo={establecerMontoMaximo}/>
            </BuscadorFiltrosMovimientos>

            {cargando || datosMeses.cargando ? <ActivityIndicator color={tema.foco} accessibilityLabel="Cargando meses"/> : errorConsulta || datosMeses.error ? (
              <View style={estilos.estadoVacio}>
                <Ionicons color={tema.error} name="alert-circle-outline" size={32} />
                <Text style={estilos.textoEstadoVacio}>{errorConsulta || datosMeses.error}</Text>
                <Pressable accessibilityRole="button" onPress={errorConsulta ? reintentarHistorial : datosMeses.reintentar} style={estilos.botonLimpiar}>
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
              <ListaMesesMovimientos datos={datosMeses} tema={tema} alPresionar={abrirDetalle}/>
            )}
          </View>
        </ScrollView>

        <PanelFiltrosMovimientos tema={tema} filtrosVisibles={filtrosVisibles} alCerrar={() => establecerFiltrosVisibles(false)} limpiarFiltros={limpiarFiltros} cantidadFiltros={cantidadFiltros}>
                <View style={estilos.listaSeccionesFiltro}>
                  <FiltroTipoMovimientos tema={tema} estilos={estilos} resumen={resumenTipo}
                    abierta={seccionesFiltrosAbiertas.includes('tipo')} alAlternar={() => alternarSeccionFiltro('tipo')}
                    tipoFiltro={tipoFiltro} cambiarTipoFiltro={cambiarTipoFiltro}
                  />

                  <FiltroFechaMovimientos tema={tema} estilos={estilos} resumen={resumenFecha}
                    abierta={seccionesFiltrosAbiertas.includes('fecha')} alAlternar={() => alternarSeccionFiltro('fecha')}
                    estilosSelectores={estilos} estilosGlobales={estilosGlobales}
                    fechaFiltro={fechaFiltro} cambiarFechaFiltro={cambiarFechaFiltro}
                    fechaDia={fechaDia} establecerFechaDia={establecerFechaDia}
                    anioMesVisible={anioMesVisible} establecerAnioMesVisible={establecerAnioMesVisible}
                    mesSeleccionado={mesSeleccionado} establecerMesSeleccionado={establecerMesSeleccionado}
                    fechaInicial={fechaInicial} fechaFinal={fechaFinal}
                    seleccionarFechaPersonalizada={seleccionarFechaPersonalizada}
                    mostrarSelectorSemana
                  />

                  <FiltroCategoriasMovimientos tema={tema} estilos={estilos} resumen={resumenCategorias}
                    abierta={seccionesFiltrosAbiertas.includes('categorias')} alAlternar={() => alternarSeccionFiltro('categorias')}
                    estilosSelectores={estilos} estilosGlobales={estilosGlobales}
                    categoriasDisponiblesFiltro={categoriasDisponiblesFiltro}
                    tipoMovimiento={tipoFiltro === 'todos' ? undefined : tipoFiltro}
                    categoriaFiltroIds={categoriaFiltroIds} establecerCategoriaFiltroIds={establecerCategoriaFiltroIds}
                  />

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
                      impedirSeleccionVacia
                    />
                  </SeccionFiltro>

                  <FiltroMontoMovimientos tema={tema} estilos={estilos} resumen={resumenMonto}
                    abierta={seccionesFiltrosAbiertas.includes('monto')} alAlternar={() => alternarSeccionFiltro('monto')}
                    estilosGlobales={estilosGlobales} montoMinimo={montoMinimo} establecerMontoMinimo={establecerMontoMinimo}
                    montoMaximo={montoMaximo} establecerMontoMaximo={establecerMontoMaximo} errorMontoFiltro={errorMontoFiltro}
                  />
                </View>
        </PanelFiltrosMovimientos>
      </View>
    </SafeAreaView>
  );
}
