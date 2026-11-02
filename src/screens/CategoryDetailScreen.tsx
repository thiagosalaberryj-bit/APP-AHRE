import { Key, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import EncabezadoSeccion from '../components/SectionHeader';
import { RUTAS } from '../constants/routes';
import {
  CATEGORIAS_EGRESO,
  CATEGORIAS_INGRESO,
} from '../constants/movimientos';
import { obtenerColoresGraficos } from '../styles/colors';
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

function formatearFechaDia(fecha: Date) {
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
  });
}

function formatearHora(fechaISO: string|number|Date) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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

export default function PantallaDetalleCategoria({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
  const { tema } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleCategoria(tema);
  const categoriaRecibida = ruta.params?.categoria || {};
  const tipoMovimiento = ruta.params?.tipoMovimiento === 'ingreso' ? 'ingreso' : 'egreso';
  const catalogo = tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO;
  const indiceCategoria = catalogo.findIndex((item) => item.id === categoriaRecibida.id);
  const categoriaCatalogo = catalogo[indiceCategoria] || catalogo[0];
  const coloresGraficos = obtenerColoresGraficos(tema);
  const categoria = {
    ...categoriaCatalogo,
    ...categoriaRecibida,
    color: coloresGraficos[Math.max(0, indiceCategoria) % coloresGraficos.length],
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
  const [selectorPeriodo, establecerSelectorPeriodo] = useState<string | null>(null);
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
    establecerDatosDetalle(null);
    cargarDetalleCategoriaEstadistica({
      categoria: categoria.id,
      tipo: tipoMovimiento,
      anio,
      mes: mesSeleccionado,
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
  }, [categoria.id, tipoMovimiento, anio, mesSeleccionado, intentoCarga]));

  const movimientos = datosDetalle?.movimientos || [];
  const gruposMovimientos = agruparMovimientosPorDia(movimientos);
  const montoCategoria = datosDetalle?.resumenMes.total || 0;
  const cantidadMovimientos = datosDetalle?.resumenMes.cantidad || 0;
  const evolucion = datosDetalle?.evolucion || [];
  const maximoEvolucion = Math.max(0, ...evolucion.map((item) => item.total));
  const hayMovimientosAnuales = maximoEvolucion > 0;
  const textoResultado = `${cantidadMovimientos} ${cantidadMovimientos === 1 ? 'movimiento' : 'movimientos'} en ${MESES[mesSeleccionado].nombre.toLowerCase()}`;

  const abrirDetalleMovimiento = (movimiento: import('../types/forms').MovimientoVisible) => {
    navegacion.push(RUTAS.DETALLE_MOVIMIENTO, {
      categoria,
      movimiento,
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          alVolver={() => navegacion.goBack()}
          descripcion="Consultá los movimientos de esta categoría."
          tema={tema}
          titulo="Detalle de categoría"
        />

        <ScrollView contentContainerStyle={estilos.contenidoCategoria} showsVerticalScrollIndicator={false}>
          <View style={estilos.resumenCategoria}>
            <View style={estilos.encabezadoCategoria}>
              <View style={[estilos.iconoCategoriaGrande, { backgroundColor: tema.superficie, borderColor: categoria.color }]}>
                <Ionicons color={categoria.color} name={categoria.icono} size={40} />
              </View>
              <View style={estilos.datosCategoria}>
                <Text style={estilos.nombreCategoriaResumen}>{categoria.nombre}</Text>
                <Text style={estilos.descripcionCategoria}>{categoria.descripcion}</Text>
              </View>
            </View>

            <View style={estilos.selectoresPeriodo}>
              <Pressable
                accessibilityLabel={`Mes ${MESES[mesSeleccionado].nombre}. Cambiar mes`}
                accessibilityRole="button"
                onPress={() => establecerSelectorPeriodo('mes')}
                style={({ pressed }) => [
                  estilos.selectorPeriodo,
                  pressed && estilos.selectorPeriodoPresionado,
                ]}
              >
                <Text numberOfLines={1} style={estilos.textoSelectorPeriodo}>{MESES[mesSeleccionado].nombre}</Text>
                <Ionicons color={tema.textoSecundario} name="chevron-down" size={16} />
              </Pressable>
              <Pressable
                accessibilityLabel={`Año ${anio}. Cambiar año`}
                accessibilityHint="Elegí un año anterior o el año actual."
                accessibilityRole="button"
                onPress={() => establecerSelectorPeriodo('anio')}
                style={({ pressed }) => [
                  estilos.selectorPeriodo,
                  pressed && estilos.selectorPeriodoPresionado,
                ]}
              >
                <Text style={estilos.textoSelectorPeriodo}>{anio}</Text>
                <Ionicons color={tema.textoSecundario} name="chevron-down" size={16} />
              </Pressable>
            </View>

            <View style={estilos.separadorResumen} />

            {estadoCarga === 'cargando' ? (
              <Text style={estilos.estadoCargaDetalle}>Buscando movimientos locales...</Text>
            ) : estadoCarga === 'error' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => establecerIntentoCarga((intento) => intento + 1)}
              >
                <Text style={estilos.estadoCargaDetalle}>No se pudieron cargar los datos. Tocá para reintentar.</Text>
              </Pressable>
            ) : cantidadMovimientos === 0 ? (
              <Text style={estilos.estadoCargaDetalle}>No hay movimientos en este período.</Text>
            ) : (
              <View accessibilityLiveRegion="polite" style={estilos.resultadoCategoria}>
                <Text style={[estilos.montoCategoria, tipoMovimiento === 'ingreso' ? estilos.montoIngreso : estilos.montoEgreso]}>
                  {formatearMonto(montoCategoria, tipoMovimiento)}
                </Text>
                <Text style={estilos.cantidadMovimientosCategoria}>{textoResultado}</Text>
              </View>
            )}
          </View>

          {estadoCarga === 'listo' && hayMovimientosAnuales ? (
            <View style={estilos.evolucionCategoria}>
              <Text style={estilos.tituloEvolucion}>Evolución anual</Text>
              {evolucion.map((item) => {
                const anchoBarra = maximoEvolucion > 0 ? (item.total / maximoEvolucion) * 100 : 0;
                return (
                  <View
                    accessible
                    accessibilityLabel={`${MESES[item.mes].nombre}: ${formatearMonto(item.total, tipoMovimiento)}`}
                    key={item.mes}
                    style={estilos.filaEvolucion}
                  >
                    <Text style={estilos.mesEvolucion}>{MESES[item.mes].corto}</Text>
                    <View style={estilos.fondoBarraEvolucion}>
                      <View
                        style={[
                          estilos.barraEvolucion,
                          { backgroundColor: categoria.color, width: `${anchoBarra}%` },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
          {estadoCarga === 'listo' && gruposMovimientos.length ? (
            <View style={estilos.listaMovimientosCategoria}>
              {gruposMovimientos.map((grupo) => (
              <View key={grupo.clave} style={estilos.grupoDia}>
                <Text accessibilityRole="header" style={estilos.tituloDia}>
                  {formatearFechaDia(grupo.fecha)}
                </Text>
                <View style={estilos.movimientosDia}>
                  {grupo.movimientos.map((movimiento) => (
                    <Pressable
                      accessibilityLabel={`Ver ${movimiento.descripcion}, ${movimiento.deposito_nombre || 'Depósito'}, ${formatearHora(movimiento.fecha_hora)}`}
                      accessibilityRole="button"
                      key={movimiento.id}
                      onPress={() => abrirDetalleMovimiento(movimiento)}
                      style={estilos.filaMovimiento}
                    >
                      <View style={[estilos.iconoMovimiento, { backgroundColor: tema.superficie }]}>
                        <Ionicons color={categoria.color} name={categoria.icono} size={21} />
                      </View>
                      <View style={estilos.detalleFilaMovimiento}>
                        <Text numberOfLines={1} style={estilos.nombreFilaMovimiento}>{movimiento.descripcion}</Text>
                        <Text numberOfLines={1} style={estilos.subtituloFilaMovimiento}>
                          {movimiento.deposito_nombre || 'Depósito'} · {formatearHora(movimiento.fecha_hora)}
                        </Text>
                      </View>
                      <Text style={[
                        estilos.montoFilaMovimiento,
                        tipoMovimiento === 'ingreso' ? estilos.montoIngreso : estilos.montoEgreso,
                      ]}>
                        {formatearMonto(movimiento.monto, tipoMovimiento)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerSelectorPeriodo(null)}
          transparent
          visible={selectorPeriodo !== null}
        >
          <View style={estilos.fondoModalPeriodo}>
            <Pressable
              accessibilityLabel="Cerrar selección del período"
              onPress={() => establecerSelectorPeriodo(null)}
              style={StyleSheet.absoluteFill}
            />
            <View accessibilityViewIsModal style={[estilos.tarjetaModalPeriodo, { backgroundColor: tema.superficie }]}>
              <View style={estilos.encabezadoModalPeriodo}>
                <Text style={estilos.tituloModalPeriodo}>
                  {selectorPeriodo === 'mes' ? 'Seleccioná un mes' : 'Seleccioná un año'}
                </Text>
                <Pressable
                  accessibilityLabel="Cerrar selección del período"
                  accessibilityRole="button"
                  onPress={() => establecerSelectorPeriodo(null)}
                  style={estilos.botonCerrarModalPeriodo}
                >
                  <Ionicons color={tema.textoPrincipal} name="close" size={22} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={estilos.opcionesPeriodo} showsVerticalScrollIndicator={false}>
                {(selectorPeriodo === 'mes'
                  ? MESES.map((mes) => ({ valor: mes.id, etiqueta: mes.nombre }))
                  : aniosDisponibles.map((opcionAnio) => ({ valor: opcionAnio, etiqueta: String(opcionAnio) }))
                ).map((opcion) => {
                  const seleccionado = selectorPeriodo === 'mes'
                    ? opcion.valor === mesSeleccionado
                    : opcion.valor === anio;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: seleccionado }}
                      key={opcion.valor}
                      onPress={() => {
                        if (selectorPeriodo === 'mes') establecerMesSeleccionado(opcion.valor);
                        else establecerAnio(opcion.valor);
                        establecerSelectorPeriodo(null);
                      }}
                      style={[estilos.opcionPeriodo, seleccionado && estilos.opcionPeriodoActiva]}
                    >
                      <Text style={estilos.textoOpcionPeriodo}>{opcion.etiqueta}</Text>
                      {seleccionado ? <Ionicons color={tema.foco} name="checkmark" size={20} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
