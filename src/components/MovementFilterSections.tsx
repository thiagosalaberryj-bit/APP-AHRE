import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { OPCIONES_TIPO, OPCIONES_FECHA, MESES } from '../constants/movementFilters';
import type { Tema } from '../styles/colors';
import type { crearEstilosMovimientos } from '../styles/MovementsScreenStyles';
import type { crearEstilosBusquedaFiltros } from '../styles/MovementSearchFiltersStyles';
import type { EstilosGlobales, EstilosMovimiento, SelectorCategoriaProps } from '../types/ui';
import { SeccionFiltro } from './MovementFiltersPanel';
import SelectorCategoria from './CategorySelector';
import SelectorFecha from './DateSelector';
import EntradaMonto from './MoneyInput';

type PropiedadesSeccion = {
  tema: Tema;
  estilos: ReturnType<typeof crearEstilosMovimientos>;
  // El detalle usa los chips de accesos rápidos; el historial conserva los propios.
  estilosChips?: ReturnType<typeof crearEstilosBusquedaFiltros>;
  resumen: string;
  abierta: boolean;
  alAlternar: () => void;
};

function formatearFechaCorta(fecha: Date) {
  return fecha.toLocaleDateString('es-AR');
}

export function FiltroTipoMovimientos({ tema, estilos, estilosChips, resumen, abierta, alAlternar, tipoFiltro, cambiarTipoFiltro }: PropiedadesSeccion & {
  tipoFiltro: string;
  cambiarTipoFiltro: (tipo: string) => void;
}) {
  return (
    <SeccionFiltro
      titulo="Tipo"
      resumen={resumen}
      abierta={abierta}
      alAlternar={alAlternar}
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
              style={[estilosChips?.filtro ?? estilos.chip, estilos.chipTipo, activa ? estilosChips?.filtroActivo ?? estilos.chipActivo : null]}
            >
              <Text numberOfLines={1} style={[estilosChips?.textoFiltro ?? estilos.textoChip, activa ? estilosChips?.textoActivo ?? estilos.textoChipActivo : null]}>
                {opcion.nombre}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SeccionFiltro>
  );
}

export function FiltroFechaMovimientos({
  tema, estilos, estilosChips, estilosSelectores, estilosGlobales, resumen, abierta, alAlternar,
  fechaFiltro, cambiarFechaFiltro, fechaDia, establecerFechaDia, anioMesVisible,
  establecerAnioMesVisible, mesSeleccionado, establecerMesSeleccionado, fechaInicial,
  fechaFinal, seleccionarFechaPersonalizada, mostrarSelectorSemana = false, errorFechaFiltro,
}: PropiedadesSeccion & {
  estilosSelectores: EstilosMovimiento;
  estilosGlobales: EstilosGlobales;
  fechaFiltro: string;
  cambiarFechaFiltro: (modo: string) => void;
  fechaDia: Date | null;
  establecerFechaDia: (fecha: Date) => void;
  anioMesVisible: number;
  establecerAnioMesVisible: Dispatch<SetStateAction<number>>;
  mesSeleccionado: Date | null;
  establecerMesSeleccionado: (fecha: Date) => void;
  fechaInicial: Date | null;
  fechaFinal: Date | null;
  seleccionarFechaPersonalizada: (fecha: Date) => void;
  // El calendario de semana solo estaba presente en el historial general.
  mostrarSelectorSemana?: boolean;
  errorFechaFiltro?: string | null;
}) {
  const [bordesDesplazamientoFecha, establecerBordesDesplazamientoFecha] = useState({
    izquierda: false,
    derecha: false,
  });
  const medidasDesplazamientoFecha = useRef({
    anchoContenido: 0,
    anchoVisible: 0,
    desplazamiento: 0,
  });
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

  return (
    <SeccionFiltro
      titulo="Fecha"
      resumen={resumen}
      abierta={abierta}
      alAlternar={alAlternar}
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
                style={[estilosChips?.filtro ?? estilos.chip, estilos.chipFecha, activa ? estilosChips?.filtroActivo ?? estilos.chipActivo : null]}
              >
                <Text style={[estilosChips?.textoFiltro ?? estilos.textoChip, activa ? estilosChips?.textoActivo ?? estilos.textoChipActivo : null]}>
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
            estilosMovimiento={estilosSelectores}
            etiqueta="Día"
            valor={fechaDia || new Date()}
            alSeleccionar={establecerFechaDia}
            enLinea
          />
        </View>
      ) : null}
      {mostrarSelectorSemana && fechaFiltro === 'semana' ? (
        <View style={estilos.grupoCalendarioFiltro}>
          <Text style={estilos.textoAyudaFiltro}>Elegí una fecha de la semana</Text>
          <SelectorFecha
            tema={tema}
            estilosMovimiento={estilosSelectores}
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
            estilosMovimiento={estilosSelectores}
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
  );
}

export function FiltroCategoriasMovimientos({
  tema, estilos, estilosSelectores, estilosGlobales, resumen, abierta, alAlternar,
  categoriasDisponiblesFiltro, tipoMovimiento, categoriaFiltroIds, establecerCategoriaFiltroIds,
}: PropiedadesSeccion & {
  estilosSelectores: EstilosMovimiento;
  estilosGlobales: EstilosGlobales;
  categoriasDisponiblesFiltro: SelectorCategoriaProps['categorias'];
  tipoMovimiento?: string;
  categoriaFiltroIds: string[];
  establecerCategoriaFiltroIds: (ids: string[]) => void;
}) {
  return (
    <SeccionFiltro
      titulo="Categorías"
      resumen={resumen}
      abierta={abierta}
      alAlternar={alAlternar}
      colorAcento={tema.foco}
      estilos={estilos}
    >
      <SelectorCategoria
        tema={tema}
        estilosGlobales={estilosGlobales}
        estilosMovimiento={estilosSelectores}
        estiloTarjeta={estilos.tarjetaCategoriaFiltro}
        etiqueta=""
        categorias={categoriasDisponiblesFiltro}
        tipoMovimiento={tipoMovimiento}
        variante="grilla"
        seleccionMultiple
        seleccionadasIds={categoriaFiltroIds}
        alCambiarMulti={establecerCategoriaFiltroIds}
      />
    </SeccionFiltro>
  );
}

export function FiltroMontoMovimientos({
  tema, estilos, estilosGlobales, resumen, abierta, alAlternar,
  montoMinimo, establecerMontoMinimo, montoMaximo, establecerMontoMaximo, errorMontoFiltro,
}: PropiedadesSeccion & {
  estilosGlobales: EstilosGlobales;
  montoMinimo: string;
  establecerMontoMinimo: (texto: string) => void;
  montoMaximo: string;
  establecerMontoMaximo: (texto: string) => void;
  errorMontoFiltro: string | null;
}) {
  return (
    <SeccionFiltro
      titulo="Monto"
      resumen={resumen}
      abierta={abierta}
      alAlternar={alAlternar}
      colorAcento={tema.error}
      estilos={estilos}
    >
      <View style={estilos.filaRango}>
        <View style={estilos.grupoCampoRango}>
          <View style={estilos.etiquetaCampoRango}>
            <Ionicons color={tema.textoSecundario} name="arrow-down-outline" size={16} />
            <Text style={estilos.textoEtiquetaCampoRango}>Mínimo</Text>
          </View>
          <EntradaMonto tema={tema} estilosGlobales={estilosGlobales}
            etiqueta="Monto mínimo" valor={montoMinimo} alCambiarTexto={establecerMontoMinimo}
            mostrarEtiqueta={false} mostrarLimpiar={false} compacto
            estiloContenedor={estilos.campoRango}/>
        </View>
        <View style={estilos.grupoCampoRango}>
          <View style={estilos.etiquetaCampoRango}>
            <Ionicons color={tema.textoSecundario} name="arrow-up-outline" size={16} />
            <Text style={estilos.textoEtiquetaCampoRango}>Máximo</Text>
          </View>
          <EntradaMonto tema={tema} estilosGlobales={estilosGlobales}
            etiqueta="Monto máximo" valor={montoMaximo} alCambiarTexto={establecerMontoMaximo}
            mostrarEtiqueta={false} mostrarLimpiar={false} compacto
            estiloContenedor={estilos.campoRango}/>
        </View>
      </View>
      {errorMontoFiltro ? (
        <Text style={estilosGlobales.textoError}>{errorMontoFiltro}</Text>
      ) : null}
    </SeccionFiltro>
  );
}
