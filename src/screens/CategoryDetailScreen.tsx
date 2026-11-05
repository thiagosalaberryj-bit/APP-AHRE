import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import EncabezadoSeccion from '../components/SectionHeader';
import TarjetaMovimiento from '../components/MovementCard';
import { RUTAS } from '../constants/routes';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
} from '../constants/movimientos';
import { obtenerColorIconoCategoria, obtenerColorCategoria, obtenerFamiliaCategoria } from '../styles/categoryColors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDetalleCategoria } from '../styles/CategoryDetailScreenStyles';
import { cargarDetalleCategoriaEstadistica } from '../statistics/statisticsService';

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
function formatearMonto(monto: number, tipo: string) {
  const valor = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 2,
  }).format(Number(monto) || 0);
  return tipo === 'ingreso' ? `+$ ${valor}` : `−$ ${valor}`;
}

export default function PantallaDetalleCategoria({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
  const { tema } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleCategoria(tema);
  const categoriaRecibida = ruta.params?.categoria || {};
  const tipoMovimiento = ruta.params?.tipoMovimiento === 'ingreso' ? 'ingreso' : 'egreso';
  const catalogo = tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const indiceCategoria = catalogo.findIndex((item) => item.id === categoriaRecibida.id);
  const categoriaCatalogo = catalogo[indiceCategoria] || catalogo[0];
  const categoria = {
    ...categoriaCatalogo,
    ...categoriaRecibida,
    color: obtenerColorCategoria(categoriaCatalogo.id, tema, tipoMovimiento),
  };
  const anioRecibido = Number(ruta.params?.anio);
  const anioActual = new Date().getFullYear();
  const anioInicial = Number.isInteger(anioRecibido) && anioRecibido >= 1000
    ? Math.min(anioRecibido, anioActual)
    : new Date().getFullYear();
  const [anio, establecerAnio] = useState(anioInicial);
  const [anioMinimoDisponible, establecerAnioMinimoDisponible] = useState(
    () => Math.min(anioInicial, anioActual - 1),
  );
  const [selectorPeriodo, establecerSelectorPeriodo] = useState<'anio' | null>(null);
  const raizContenido = useRef<View>(null);
  const controlAnio = useRef<View>(null);
  const [anclaSelector, establecerAnclaSelector] = useState({ left: 0, top: 0, width: 160, maxHeight: 184 });
  const abrirSelector = () => {
    if (selectorPeriodo) { establecerSelectorPeriodo(null); return; }
    controlAnio.current?.measureInWindow((x, y, ancho, alto) => {
      raizContenido.current?.measureInWindow((raizX, raizY, anchoRaiz, altoRaiz) => {
        const anchoMenu = Math.min(Math.max(ancho, 148), 200, anchoRaiz - 24);
        const debajo = y - raizY + alto + 4;
        const abrirArriba = altoRaiz - debajo < 184 && y - raizY > altoRaiz - debajo;
        const altura = Math.min(184, Math.max(32, (abrirArriba ? y - raizY : altoRaiz - debajo) - 12));
        establecerAnclaSelector({ left: Math.max(12, Math.min(x - raizX, anchoRaiz - anchoMenu - 12)), top: abrirArriba ? y - raizY - altura - 4 : debajo, width: anchoMenu, maxHeight: altura });
        establecerSelectorPeriodo('anio');
      });
    });
  };
  useFocusEffect(useCallback(() => {
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!selectorPeriodo) return false;
      establecerSelectorPeriodo(null);
      return true;
    });
    return () => suscripcion.remove();
  }, [selectorPeriodo]));
  const aniosDisponibles = useMemo(() => {
    if (!Number.isInteger(anioMinimoDisponible) || anioMinimoDisponible > anioActual) return [];
    return Array.from(
      { length: anioActual - anioMinimoDisponible + 1 },
      (_, indice) => anioActual - indice,
    );
  }, [anioActual, anioMinimoDisponible]);
  const mesRecibido = Number(ruta.params?.mes);
  const mesInicial = Number.isInteger(mesRecibido) && mesRecibido >= 0 && mesRecibido < 12
    ? mesRecibido
    : new Date().getMonth();
  const [mesSeleccionado, establecerMesSeleccionado] = useState(
    () => mesInicial,
  );
  const [datosDetalle, establecerDatosDetalle] = useState<{ anio: number; anioMinimoDisponible: number; evolucion: { mes: number; total: number; }[]; resumenMes: { total: number; cantidad: number; }; movimientos: import("../database/types").MovimientoHistorial[]; } | null>(null);
  const [estadoCarga, establecerEstadoCarga] = useState('cargando');
  const [intentoCarga, establecerIntentoCarga] = useState(0);

  useFocusEffect(useCallback(() => {
    let vigente = true;
    establecerEstadoCarga('cargando');
    cargarDetalleCategoriaEstadistica({
      categoria: categoria.id,
      tipo: tipoMovimiento,
      anio,
      mes: mesSeleccionado,
      rangoMonto: ruta.params?.rangoMontoEstadistica,
    }).then((resultado) => {
      if (!vigente) return;
      establecerAnioMinimoDisponible(resultado.anioMinimoDisponible);
      if (resultado.anio !== anio) establecerAnio(resultado.anio);
      establecerDatosDetalle(resultado);
      establecerEstadoCarga('listo');
    }).catch(() => {
      if (vigente) establecerEstadoCarga('error');
    });

    return () => {
      vigente = false;
    };
  }, [categoria.id, tipoMovimiento, anio, mesSeleccionado, intentoCarga, ruta.params?.rangoMontoEstadistica]));

  const movimientos = datosDetalle?.movimientos || [];
  const montoCategoria = datosDetalle?.resumenMes.total || 0;
  const cantidadMovimientos = datosDetalle?.resumenMes.cantidad || 0;
  const evolucion = MESES.map(mes => ({ mes: mes.id, total: datosDetalle?.anio === anio ? datosDetalle.evolucion.find(item => item.mes === mes.id)?.total || 0 : 0 }));
  const maximoEvolucion = Math.max(0, ...evolucion.map(item => item.total));
  const promedioMovimiento = cantidadMovimientos ? montoCategoria / cantidadMovimientos : 0;

  const abrirDetalleMovimiento = (movimiento: import('../types/forms').MovimientoVisible) => {
    navegacion.push(RUTAS.DETALLE_MOVIMIENTO, {
      categoria,
      movimiento,
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion alVolver={() => navegacion.goBack()} descripcion="Consultá la evolución y los movimientos de esta categoría." tema={tema} titulo="Detalle de categoría" />
        <View ref={raizContenido} collapsable={false} style={estilos.cuerpo}>
          <ScrollView contentContainerStyle={estilos.contenidoCategoria} showsVerticalScrollIndicator={false} onScrollBeginDrag={() => establecerSelectorPeriodo(null)}>
            <View style={estilos.resumenCategoria}>
              <View style={estilos.encabezadoCategoria}>
                <View style={[estilos.iconoCategoria, { backgroundColor: categoria.color }]}>
                  <Ionicons color={tema.nombre === 'oscuro' ? tema.fondo : obtenerColorIconoCategoria(categoria.id, tema, tipoMovimiento)} name={categoria.icono} size={30} />
                </View>
                <View style={estilos.datosCategoria}>
                  <Text style={estilos.nombreCategoria}>{categoria.nombre}</Text>
                  <Text style={estilos.textoSecundario}>{obtenerFamiliaCategoria(categoria.id, tipoMovimiento).nombre}</Text>
                </View>
              </View>
              <Text style={estilos.textoSecundario}>{categoria.descripcion}</Text>
              {estadoCarga !== 'error' ? <>
                <View accessibilityLiveRegion="polite" style={estilos.filaTotal}>
                  <View style={estilos.datosTotal}>
                    <Text style={estilos.etiquetaTotal}>{tipoMovimiento === 'ingreso' ? 'Total de ingresos' : 'Total de egresos'}</Text>
                    <Text style={estilos.textoSecundario}>{MESES[mesSeleccionado].nombre} · {anio}</Text>
                  </View>
                  <Text accessibilityLabel={estadoCarga === 'listo' ? formatearMonto(montoCategoria, tipoMovimiento) : 'Consultando importe'} numberOfLines={1} adjustsFontSizeToFit style={[estilos.montoCategoria, { color: tipoMovimiento === 'ingreso' ? tema.exito : tema.error }]}>{estadoCarga === 'listo' ? formatearMonto(montoCategoria, tipoMovimiento) : '—'}</Text>
                </View>
                <View style={estilos.datosResumen}>
                  <View style={estilos.datoResumen}>
                    <Text style={estilos.textoSecundario}>Movimientos</Text>
                    <Text style={estilos.valorResumen}>{estadoCarga === 'listo' ? cantidadMovimientos : '—'}</Text>
                  </View>
                  <View style={[estilos.datoResumen, estilos.datoPromedio]}>
                    <Text style={estilos.textoSecundario}>Promedio por movimiento</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.valorResumen, estilos.valorPromedio]}>{estadoCarga === 'listo' && cantidadMovimientos ? formatearMonto(promedioMovimiento, tipoMovimiento) : '—'}</Text>
                  </View>
                </View>
              </> : (
                <Pressable accessibilityRole="button" onPress={() => establecerIntentoCarga(intento => intento + 1)} style={estilos.estadoDetalle}>
                  <Ionicons color={tema.error} name="alert-circle-outline" size={22} />
                  <Text style={estilos.textoEstado}>No se pudieron cargar los datos. Tocá para reintentar.</Text>
                </Pressable>
              )}
            </View>

            {ruta.params?.rangoMontoEstadistica && (ruta.params.rangoMontoEstadistica.minimo !== undefined || ruta.params.rangoMontoEstadistica.maximo !== undefined) ? (
              <View style={estilos.avisoFiltro}>
                <Ionicons color={tema.textoSecundario} name="options-outline" size={16} />
                <Text style={estilos.textoAviso}>Importe por movimiento: {ruta.params.rangoMontoEstadistica.minimo === undefined ? 'sin mínimo' : formatearMonto(ruta.params.rangoMontoEstadistica.minimo, 'ingreso').replace('+', '')} – {ruta.params.rangoMontoEstadistica.maximo === undefined ? 'sin máximo' : formatearMonto(ruta.params.rangoMontoEstadistica.maximo, 'ingreso').replace('+', '')}</Text>
              </View>
            ) : null}

            <View style={estilos.evolucionCategoria}>
              <View style={estilos.encabezadoSeccion}>
                <Text accessibilityRole="header" style={estilos.tituloSeccion}>Evolución anual</Text>
                <Pressable ref={controlAnio} accessibilityLabel={'Año ' + anio + '. Cambiar año'} accessibilityRole="button"
                  accessibilityState={{ expanded: selectorPeriodo !== null }} onPress={abrirSelector}
                  style={[estilos.selectorPeriodo, selectorPeriodo && estilos.selectorPeriodoActivo]}>
                  <Text numberOfLines={1} style={estilos.textoSelectorPeriodo}>{anio}</Text>
                  <Ionicons color={tema.textoSecundario} name={selectorPeriodo ? 'chevron-up' : 'chevron-down'} size={14} />
                </Pressable>
              </View>
              <View style={estilos.graficoEvolucion}>
                {evolucion.map(item => {
                  const seleccionado = item.mes === mesSeleccionado;
                  return <Pressable key={item.mes} accessibilityRole="button" accessibilityState={{ selected: seleccionado }}
                    accessibilityLabel={MESES[item.mes].nombre + ': ' + formatearMonto(item.total, tipoMovimiento) + '. Ver movimientos'}
                    onPress={() => establecerMesSeleccionado(item.mes)} style={estilos.columnaMes}>
                    <View style={[estilos.pistaMes, seleccionado && estilos.pistaMesActiva]}>
                      <View style={[estilos.barraMes, { height: item.total > 0 ? Math.max(4, item.total / maximoEvolucion * 100) + '%' as `${number}%` : 2, backgroundColor: item.total > 0 ? categoria.color : tema.borde }]} />
                    </View>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.etiquetaMes, seleccionado && estilos.etiquetaMesActiva]}>{MESES[item.mes].corto}</Text>
                  </Pressable>;
                })}
              </View>
            </View>

            {estadoCarga === 'listo' ? (
              <View style={estilos.listaMovimientos}>
                <View style={estilos.encabezadoSeccion}>
                  <Text accessibilityRole="header" style={estilos.tituloSeccion}>Movimientos</Text>
                  <Text style={estilos.textoSecundario}>{MESES[mesSeleccionado].nombre} · {anio}</Text>
                </View>
                {movimientos.length ? movimientos.map(movimiento => <TarjetaMovimiento key={movimiento.id} tema={tema} movimiento={movimiento} alPresionar={abrirDetalleMovimiento} />) : (
                  <View style={estilos.vacio}>
                    <Ionicons color={tema.textoSecundario} name="receipt-outline" size={28} />
                    <Text style={estilos.tituloVacio}>Sin movimientos este mes</Text>
                    <Text style={estilos.textoEstado}>Probá con otro mes o año para consultar esta categoría.</Text>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>
          {selectorPeriodo ? <View style={estilos.capaSelector}>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar selección del período" onPress={() => establecerSelectorPeriodo(null)} style={StyleSheet.absoluteFill} />
            <View style={[estilos.menuPeriodo, anclaSelector]}>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: anclaSelector.maxHeight }} keyboardShouldPersistTaps="handled">
                {aniosDisponibles.map(valor => ({ valor, etiqueta: String(valor) })).map(opcion => {
                  const seleccionado = opcion.valor === anio;
                  return <Pressable key={opcion.valor} accessibilityRole="button" accessibilityState={{ selected: seleccionado }}
                    onPress={() => { establecerAnio(opcion.valor); establecerSelectorPeriodo(null); }}
                    style={[estilos.opcionPeriodo, seleccionado && estilos.opcionPeriodoActiva]}>
                    <Text numberOfLines={1} style={estilos.textoSelectorPeriodo}>{opcion.etiqueta}</Text>
                    <Ionicons color={tema.foco} name="checkmark" size={16} style={{ opacity: seleccionado ? 1 : 0 }} />
                  </Pressable>;
                })}
              </ScrollView>
            </View>
          </View> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
