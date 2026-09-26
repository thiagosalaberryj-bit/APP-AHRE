import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
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
  Object.freeze({ id: 'dia', nombre: 'Día' }),
  Object.freeze({ id: 'semana', nombre: 'Semana' }),
  Object.freeze({ id: 'mes', nombre: 'Mes' }),
  Object.freeze({ id: 'personalizado', nombre: 'Personalizado' }),
]);

const IDS_INGRESO = new Set(CATEGORIAS_INGRESO.map((categoria) => categoria.id));
const CATEGORIAS_FILTRO = Object.freeze([
  ...CATEGORIAS_INGRESO,
  ...CATEGORIAS_EGRESO.filter((categoria) => !IDS_INGRESO.has(categoria.id)),
]);

export default function PantallaMovimientos({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosMovimientos(tema);
  const abrirPantallaSecundaria = (ruta, parametros) => navegacion.getParent()?.navigate(ruta, parametros);
  const [busqueda, establecerBusqueda] = useState('');
  const [tipoFiltro, establecerTipoFiltro] = useState('todos');
  const [fechaFiltro, establecerFechaFiltro] = useState('mes');
  const [fechaInicial, establecerFechaInicial] = useState(() => new Date(2026, 8, 1));
  const [fechaFinal, establecerFechaFinal] = useState(() => new Date(2026, 8, 30));
  const [montoMinimo, establecerMontoMinimo] = useState('');
  const [montoMaximo, establecerMontoMaximo] = useState('');
  const [categoriaFiltroIds, establecerCategoriaFiltroIds] = useState([]);
  const [depositoFiltroIds, establecerDepositoFiltroIds] = useState([]);
  const [filtrosVisibles, establecerFiltrosVisibles] = useState(false);
  const [cargando, establecerCargando] = useState(true);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerCargando(false), 1200);
    return () => clearTimeout(temporizador);
  }, []);

  const cantidadFiltros = useMemo(() => {
    let cantidad = 0;
    if (tipoFiltro !== 'todos') cantidad += 1;
    if (fechaFiltro !== 'mes') cantidad += 1;
    if (montoMinimo.trim() || montoMaximo.trim()) cantidad += 1;
    cantidad += categoriaFiltroIds.length;
    cantidad += depositoFiltroIds.length;
    return cantidad;
  }, [tipoFiltro, fechaFiltro, montoMinimo, montoMaximo, categoriaFiltroIds, depositoFiltroIds]);

  const movimientosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const minimo = Number.parseFloat(montoMinimo);
    const maximo = Number.parseFloat(montoMaximo);
    return MOVIMIENTOS_SIMULADOS.filter((movimiento) => {
      if (tipoFiltro !== 'todos' && movimiento.tipo !== tipoFiltro) return false;
      if (categoriaFiltroIds.length > 0 && !categoriaFiltroIds.includes(movimiento.categoria)) return false;
      if (depositoFiltroIds.length > 0 && !depositoFiltroIds.includes(movimiento.deposito_id)) return false;
      if (texto && !movimiento.descripcion.toLowerCase().includes(texto)) return false;
      if (!Number.isNaN(minimo) && montoMinimo.trim() && movimiento.monto < minimo) return false;
      if (!Number.isNaN(maximo) && montoMaximo.trim() && movimiento.monto > maximo) return false;
      const fecha = new Date(movimiento.fecha_hora);
      if (fechaFiltro === 'dia' && fecha < inicioHoy) return false;
      if (fechaFiltro === 'semana' && fecha < new Date(inicioHoy.getTime() - 6 * 86400000)) return false;
      if (fechaFiltro === 'mes' && (fecha.getMonth() !== ahora.getMonth() || fecha.getFullYear() !== ahora.getFullYear())) return false;
      if (fechaFiltro === 'personalizado' && (fecha < fechaInicial || fecha > fechaFinal)) return false;
      return true;
    }).slice().sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
  }, [busqueda, tipoFiltro, fechaFiltro, montoMinimo, montoMaximo, categoriaFiltroIds, depositoFiltroIds, fechaInicial, fechaFinal]);

  const limpiarFiltros = () => {
    establecerBusqueda('');
    establecerTipoFiltro('todos');
    establecerFechaFiltro('mes');
    establecerMontoMinimo('');
    establecerMontoMaximo('');
    establecerCategoriaFiltroIds([]);
    establecerDepositoFiltroIds([]);
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
            <View style={estilos.buscador}>
              <Ionicons color={tema.botonPrincipal} name="search" size={22} />
              <TextInput
                accessibilityLabel="Buscar movimientos"
                onChangeText={establecerBusqueda}
                placeholder="Buscar"
                placeholderTextColor={tema.botonPrincipal}
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
                  <Ionicons color={tema.botonPrincipal} name="close-circle-outline" size={22} />
                </Pressable>
              ) : null}
            </View>

            <View style={estilos.filaFiltros}>
              <Text style={estilos.textoFiltrosActivos}>
                {cantidadFiltros === 0 ? 'Sin filtros activos' : `${cantidadFiltros} filtro${cantidadFiltros > 1 ? 's' : ''} activo${cantidadFiltros > 1 ? 's' : ''}`}
              </Text>
              {cantidadFiltros > 0 ? (
                <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}>
                  <Text style={estilos.textoBotonLimpiar}>Limpiar filtros</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityLabel="Filtros"
                accessibilityRole="button"
                onPress={() => establecerFiltrosVisibles(true)}
                style={estilos.botonFiltros}
              >
                <Ionicons color={tema.botonPrincipal} name="list" size={20} />
                <Text style={estilos.textoBotonFiltros}>Filtros</Text>
              </Pressable>
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
                {movimientosFiltrados.map((movimiento) => (
                  <TarjetaMovimiento
                    key={movimiento.id}
                    tema={tema}
                    estilos={estilos}
                    movimiento={movimiento}
                    alPresionar={abrirDetalle}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerFiltrosVisibles(false)}
          transparent
          visible={filtrosVisibles}
        >
          <Pressable
            accessibilityLabel="Cerrar filtros"
            onPress={() => establecerFiltrosVisibles(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={estilos.grupo}>
                  <View style={estilos.encabezadoModal}>
                    <Text style={estilos.tituloModal}>Filtros</Text>
                    <Pressable
                      accessibilityLabel="Cerrar filtros"
                      accessibilityRole="button"
                      onPress={() => establecerFiltrosVisibles(false)}
                      style={estilos.botonCerrarModal}
                    >
                      <Ionicons color={tema.textoPrincipal} name="close" size={24} />
                    </Pressable>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilosGlobales.etiqueta}>Tipo</Text>
                    <View style={estilos.filaChips}>
                      {OPCIONES_TIPO.map((opcion) => {
                        const activa = tipoFiltro === opcion.id;
                        return (
                          <Pressable
                            key={opcion.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: activa }}
                            onPress={() => establecerTipoFiltro(opcion.id)}
                            style={[estilos.chip, activa ? estilos.chipActivo : null]}
                          >
                            <Text style={[estilos.textoChip, activa ? estilos.textoChipActivo : null]}>
                              {opcion.nombre}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilosGlobales.etiqueta}>Fecha</Text>
                    <View style={estilos.filaChips}>
                      {OPCIONES_FECHA.map((opcion) => {
                        const activa = fechaFiltro === opcion.id;
                        return (
                          <Pressable
                            key={opcion.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: activa }}
                            onPress={() => establecerFechaFiltro(opcion.id)}
                            style={[estilos.chip, activa ? estilos.chipActivo : null]}
                          >
                            <Text style={[estilos.textoChip, activa ? estilos.textoChipActivo : null]}>
                              {opcion.nombre}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {fechaFiltro === 'personalizado' ? (
                      <View style={estilos.grupo}>
                        <SelectorFecha
                          tema={tema}
                          estilosMovimiento={estilos}
                          etiqueta="Fecha inicial"
                          valor={fechaInicial}
                          alSeleccionar={establecerFechaInicial}
                          enLinea
                          rangoInicio={fechaInicial}
                          rangoFin={fechaFinal}
                        />
                        <SelectorFecha
                          tema={tema}
                          estilosMovimiento={estilos}
                          etiqueta="Fecha final"
                          valor={fechaFinal}
                          alSeleccionar={establecerFechaFinal}
                          enLinea
                          rangoInicio={fechaInicial}
                          rangoFin={fechaFinal}
                        />
                      </View>
                    ) : null}
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilosGlobales.etiqueta}>Monto</Text>
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
                  </View>

                  <SelectorCategoria
                    tema={tema}
                    estilosGlobales={estilosGlobales}
                    estilosMovimiento={estilos}
                    etiqueta="Categoría"
                    categorias={CATEGORIAS_FILTRO}
                    carrusel
                    seleccionMultiple
                    seleccionadasIds={categoriaFiltroIds}
                    alCambiarMulti={establecerCategoriaFiltroIds}
                  />

                  <SelectorDeposito
                    tema={tema}
                    estilosGlobales={estilosGlobales}
                    estilosMovimiento={estilos}
                    etiqueta="Depósito"
                    depositos={DEPOSITOS_SIMULADOS}
                    seleccionMultiple
                    seleccionadasIds={depositoFiltroIds}
                    alCambiarMulti={establecerDepositoFiltroIds}
                    enLinea
                  />

                  <Pressable accessibilityRole="button" onPress={limpiarFiltros} style={estilos.botonLimpiar}>
                    <Text style={estilos.textoBotonLimpiar}>Limpiar filtros</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
