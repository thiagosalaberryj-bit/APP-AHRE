import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import { COLOR_DEPOSITO_PREDETERMINADO, COLOR_ICONO_DEPOSITO, COLORES_DEPOSITOS, COLORES_ESTADO, TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosDetalleDeposito } from '../styles/DepositDetailScreenStyles';

const TIPOS_DEPOSITO = Object.freeze(['Efectivo', 'Banco', 'Billetera virtual']);
const ICONOS_DEPOSITO = Object.freeze([
  { nombre: 'cash-outline', etiqueta: 'Efectivo' },
  { nombre: 'business-outline', etiqueta: 'Banco' },
  { nombre: 'phone-portrait-outline', etiqueta: 'Billetera' },
  { nombre: 'wallet-outline', etiqueta: 'Billetera' },
  { nombre: 'card-outline', etiqueta: 'Tarjeta' },
  { nombre: 'briefcase-outline', etiqueta: 'Ahorros' },
]);
const CATEGORIAS_SIMULADAS = Object.freeze(['Comida', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud', 'Otros']);
const PERIODOS_FECHA = Object.freeze(['Día', 'Semana', 'Mes', 'Personalizado']);
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

const MOVIMIENTOS_POR_DEPOSITO = Object.freeze({
  efectivo: [
    { id: 'youtube-music', descripcion: 'YouTube Music', categoria: 'Entretenimiento', fecha: 'Hoy · 9:40', tipo: 'Egreso', monto: '− $ 4.130' },
    { id: 'supermercado', descripcion: 'Supermercado', categoria: 'Comida', fecha: 'Ayer · 18:20', tipo: 'Egreso', monto: '− $ 48.500' },
    { id: 'sueldo', descripcion: 'Sueldo', categoria: 'Otros', fecha: '22 sep · 8:15', tipo: 'Ingreso', monto: '+ $ 1.250.000' },
    { id: 'farmacia', descripcion: 'Farmacia', categoria: 'Salud', fecha: '21 sep · 13:05', tipo: 'Egreso', monto: '− $ 7.250' },
    { id: 'venta', descripcion: 'Venta de bicicleta', categoria: 'Otros', fecha: '20 sep · 16:30', tipo: 'Ingreso', monto: '+ $ 85.000' },
  ],
  'mercado-pago': [
    { id: 'streaming', descripcion: 'YouTube Music', categoria: 'Entretenimiento', fecha: 'Hoy · 9:40', tipo: 'Egreso', monto: '− $ 4.130' },
    { id: 'transferencia', descripcion: 'Transferencia recibida', categoria: 'Otros', fecha: 'Ayer · 12:10', tipo: 'Ingreso', monto: '+ $ 18.000' },
    { id: 'viaje', descripcion: 'Viaje', categoria: 'Transporte', fecha: '20 sep · 17:40', tipo: 'Egreso', monto: '− $ 2.800' },
  ],
  banco: [],
});

export default function PantallaDetalleDeposito({ navigation: navegacion, route: ruta }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDetalleDeposito(tema);
  const deposito = ruta?.params?.deposito ?? DEPOSITO_PREDETERMINADO;
  const movimientos = MOVIMIENTOS_POR_DEPOSITO[deposito.id] ?? MOVIMIENTOS_POR_DEPOSITO.efectivo;

  const [busqueda, establecerBusqueda] = useState('');
  const [filtrosAbiertos, establecerFiltrosAbiertos] = useState(false);
  const [periodoFecha, establecerPeriodoFecha] = useState(null);
  const [fechaInicial, establecerFechaInicial] = useState('');
  const [fechaFinal, establecerFechaFinal] = useState('');
  const [montoMinimo, establecerMontoMinimo] = useState('');
  const [montoMaximo, establecerMontoMaximo] = useState('');
  const [categoriaSeleccionada, establecerCategoriaSeleccionada] = useState(null);
  const [modalOpcionesVisible, establecerModalOpcionesVisible] = useState(false);
  const [modalEdicionVisible, establecerModalEdicionVisible] = useState(false);
  const [modalEliminacionVisible, establecerModalEliminacionVisible] = useState(false);
  const [borrador, establecerBorrador] = useState(deposito);
  const [mensajeEstado, establecerMensajeEstado] = useState('');
  const tipoSeleccionado = borrador.tipo === 'Cuenta bancaria' ? 'Banco' : borrador.tipo;

  const filtrosActivos = useMemo(() => {
    const filtros = [];
    if (periodoFecha) filtros.push(periodoFecha);
    if (fechaInicial) filtros.push('Desde ' + fechaInicial);
    if (fechaFinal) filtros.push('Hasta ' + fechaFinal);
    if (montoMinimo) filtros.push('Mín. $ ' + montoMinimo);
    if (montoMaximo) filtros.push('Máx. $ ' + montoMaximo);
    if (categoriaSeleccionada) filtros.push(categoriaSeleccionada);
    return filtros;
  }, [categoriaSeleccionada, fechaFinal, fechaInicial, montoMaximo, montoMinimo, periodoFecha]);

  const limpiarFiltros = () => {
    establecerPeriodoFecha(null);
    establecerFechaInicial('');
    establecerFechaFinal('');
    establecerMontoMinimo('');
    establecerMontoMaximo('');
    establecerCategoriaSeleccionada(null);
  };

  const abrirEdicion = () => {
    establecerBorrador({ ...deposito });
    establecerModalOpcionesVisible(false);
    establecerModalEdicionVisible(true);
    establecerMensajeEstado('');
  };

  const cerrarEdicion = () => {
    establecerModalEdicionVisible(false);
    establecerBorrador({ ...deposito });
  };

  const actualizarBorrador = (propiedad, valor) => {
    establecerBorrador((actual) => ({ ...actual, [propiedad]: valor }));
  };

  const movimientosVisibles = busqueda.trim() || filtrosActivos.length > 0 ? [] : movimientos;
  const textoEstadoVacio = busqueda.trim()
    ? 'No encontramos movimientos con esa búsqueda.'
    : filtrosActivos.length > 0
      ? 'No hay movimientos que coincidan con estos filtros.'
      : 'Este depósito todavía no tiene movimientos.';

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion tema={tema} titulo="Detalle de depósito" alVolver={() => navegacion.goBack()} />
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={estilosGlobales.tarjeta}>
            <View style={estilos.encabezadoDeposito}>
              <View style={[estilos.iconoDeposito, { backgroundColor: deposito.color || COLOR_DEPOSITO_PREDETERMINADO }]}>
                <Ionicons color={COLOR_ICONO_DEPOSITO} name={deposito.icono || 'wallet-outline'} size={28} />
              </View>
              <View style={estilos.datosDeposito}>
                <Text style={estilosGlobales.subtitulo}>{deposito.nombre}</Text>
                <Text style={estilosGlobales.textoSecundario}>{deposito.tipo}</Text>
                {deposito.descripcion ? <Text style={estilosGlobales.textoAyuda}>{deposito.descripcion}</Text> : null}
              </View>
              <Pressable
                accessibilityLabel="Opciones del depósito"
                accessibilityRole="button"
                onPress={() => establecerModalOpcionesVisible(true)}
                style={estilos.botonOpciones}
              >
                <Ionicons color={tema.textoPrincipal} name="ellipsis-vertical" size={22} />
              </Pressable>
            </View>
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
            <View style={[estilos.busqueda, { borderColor: tema.bordeFuerte }]}>
              <Ionicons color={tema.textoSecundario} name="search-outline" size={21} />
              <TextInput
                accessibilityLabel="Buscar movimientos del depósito"
                onChangeText={establecerBusqueda}
                placeholder="Buscar movimientos"
                placeholderTextColor={tema.textoSecundario}
                returnKeyType="search"
                style={[estilos.entradaBusqueda, { color: tema.textoPrincipal }]}
                value={busqueda}
              />
              {busqueda ? (
                <Pressable accessibilityLabel="Limpiar búsqueda" accessibilityRole="button" onPress={() => establecerBusqueda('')} style={estilos.botonLimpiarBusqueda}>
                  <Ionicons color={tema.textoSecundario} name="close-circle" size={21} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: filtrosAbiertos }}
              onPress={() => establecerFiltrosAbiertos((abiertos) => !abiertos)}
              style={estilos.botonFiltros}
            >
              <View style={estilos.filaFiltrosTitulo}>
                <Ionicons color={tema.foco} name="options-outline" size={20} />
                <Text style={[estilosGlobales.etiqueta, estilos.textoBotonFiltros]}>Filtros</Text>
                {filtrosActivos.length > 0 ? <Text style={estilos.contadorFiltros}>{filtrosActivos.length}</Text> : null}
              </View>
              <Ionicons color={tema.textoSecundario} name={filtrosAbiertos ? 'chevron-up' : 'chevron-down'} size={20} />
            </Pressable>

            {filtrosAbiertos ? (
              <View style={estilos.panelFiltros}>
                <Text style={estilosGlobales.etiqueta}>Fecha</Text>
                <View style={estilos.listaOpciones}>
                  {PERIODOS_FECHA.map((periodo) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: periodoFecha === periodo }}
                      key={periodo}
                      onPress={() => establecerPeriodoFecha(periodoFecha === periodo ? null : periodo)}
                      style={[estilos.chip, periodoFecha === periodo && estilos.chipSeleccionado]}
                    >
                      <Text style={[estilos.textoChip, periodoFecha === periodo && estilos.textoChipSeleccionado]}>{periodo}</Text>
                    </Pressable>
                  ))}
                </View>
                {periodoFecha === 'Personalizado' ? (
                  <View style={estilos.filaCampos}>
                    <TextInput
                      accessibilityLabel="Fecha inicial"
                      onChangeText={establecerFechaInicial}
                      placeholder="Fecha inicial"
                      placeholderTextColor={tema.textoSecundario}
                      style={[estilosGlobales.campo, estilos.campoRango]}
                      value={fechaInicial}
                    />
                    <TextInput
                      accessibilityLabel="Fecha final"
                      onChangeText={establecerFechaFinal}
                      placeholder="Fecha final"
                      placeholderTextColor={tema.textoSecundario}
                      style={[estilosGlobales.campo, estilos.campoRango]}
                      value={fechaFinal}
                    />
                  </View>
                ) : null}

                <Text style={estilosGlobales.etiqueta}>Monto</Text>
                <View style={estilos.filaCampos}>
                  <TextInput
                    accessibilityLabel="Monto mínimo"
                    keyboardType="decimal-pad"
                    onChangeText={establecerMontoMinimo}
                    placeholder="Mínimo"
                    placeholderTextColor={tema.textoSecundario}
                    style={[estilosGlobales.campo, estilos.campoRango]}
                    value={montoMinimo}
                  />
                  <TextInput
                    accessibilityLabel="Monto máximo"
                    keyboardType="decimal-pad"
                    onChangeText={establecerMontoMaximo}
                    placeholder="Máximo"
                    placeholderTextColor={tema.textoSecundario}
                    style={[estilosGlobales.campo, estilos.campoRango]}
                    value={montoMaximo}
                  />
                </View>

                <Text style={estilosGlobales.etiqueta}>Categoría</Text>
                <View style={estilos.listaOpciones}>
                  {CATEGORIAS_SIMULADAS.map((categoria) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: categoriaSeleccionada === categoria }}
                      key={categoria}
                      onPress={() => establecerCategoriaSeleccionada(categoriaSeleccionada === categoria ? null : categoria)}
                      style={[estilos.chip, categoriaSeleccionada === categoria && estilos.chipSeleccionado]}
                    >
                      <Text style={[estilos.textoChip, categoriaSeleccionada === categoria && estilos.textoChipSeleccionado]}>{categoria}</Text>
                    </Pressable>
                  ))}
                </View>
                {filtrosActivos.length > 0 ? (
                  <View style={estilos.filtrosActivos}>
                    <Text style={estilos.textoFiltrosActivos}>Activos: {filtrosActivos.join(' · ')}</Text>
                    <Pressable accessibilityRole="button" onPress={limpiarFiltros}>
                      <Text style={estilos.enlaceLimpiar}>Limpiar filtros</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : null}

            {filtrosActivos.length > 0 && !filtrosAbiertos ? (
              <View style={estilos.filtrosActivosCompactos}>
                <Text numberOfLines={2} style={estilos.textoFiltrosActivos}>Activos: {filtrosActivos.join(' · ')}</Text>
                <Pressable accessibilityRole="button" onPress={limpiarFiltros}>
                  <Text style={estilos.enlaceLimpiar}>Limpiar</Text>
                </Pressable>
              </View>
            ) : null}

            {ESTA_CARGANDO ? (
              <View style={estilos.listaMovimientos}>
                {[0, 1, 2].map((indice) => <View key={indice} style={estilos.esqueletoMovimiento} />)}
              </View>
            ) : movimientosVisibles.length > 0 ? (
              <View style={estilos.listaMovimientos}>
                {movimientosVisibles.map((movimiento) => {
                  const esIngreso = movimiento.tipo === 'Ingreso';
                  const colorTipo = esIngreso ? COLORES_ESTADO.ingreso : COLORES_ESTADO.egreso;
                  return (
                    <Pressable
                      accessibilityLabel={`${movimiento.tipo}: ${movimiento.descripcion}, ${movimiento.monto}`}
                      accessibilityRole="button"
                      key={movimiento.id}
                      style={({ pressed }) => [estilos.filaMovimiento, pressed && estilos.elementoPresionado]}
                    >
                      <View style={[estilos.iconoMovimiento, { backgroundColor: colorTipo }]}>
                        <Ionicons color={tema.encabezado} name={esIngreso ? 'arrow-down-outline' : 'arrow-up-outline'} size={19} />
                      </View>
                      <View style={estilos.detalleMovimiento}>
                        <Text style={estilosGlobales.texto}>{movimiento.descripcion}</Text>
                        <Text style={estilosGlobales.textoAyuda}>{movimiento.categoria} · {movimiento.fecha} · {movimiento.tipo}</Text>
                      </View>
                      <Text style={[estilos.montoMovimiento, { color: tema.textoPrincipal }]}>{movimiento.monto}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={estilos.estadoVacio}>
                <View style={estilos.iconoEstadoVacio}>
                  <Ionicons color={tema.foco} name={busqueda.trim() ? 'search-outline' : 'receipt-outline'} size={26} />
                </View>
                <Text style={estilosGlobales.etiqueta}>{busqueda.trim() ? 'Sin resultados de búsqueda' : filtrosActivos.length ? 'Sin resultados para estos filtros' : 'Sin movimientos'}</Text>
                <Text style={[estilosGlobales.textoSecundario, estilos.textoEstadoVacio]}>{textoEstadoVacio}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <Modal animationType="fade" onRequestClose={() => establecerModalOpcionesVisible(false)} transparent visible={modalOpcionesVisible}>
        <View style={estilos.fondoModal}>
          <Pressable style={estilos.fondoCierre} onPress={() => establecerModalOpcionesVisible(false)} />
          <View style={estilos.tarjetaOpciones}>
            <Text style={estilosGlobales.subtitulo}>Opciones del depósito</Text>
            <Pressable accessibilityRole="button" onPress={abrirEdicion} style={estilos.opcionModal}>
              <Ionicons color={tema.foco} name="create-outline" size={22} />
              <Text style={estilosGlobales.texto}>Editar depósito</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                establecerModalOpcionesVisible(false);
                establecerModalEliminacionVisible(true);
                establecerMensajeEstado('');
              }}
              style={estilos.opcionModal}
            >
              <Ionicons color={tema.error} name="trash-outline" size={22} />
              <Text style={[estilosGlobales.texto, { color: tema.error }]}>Eliminar depósito</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => establecerModalOpcionesVisible(false)} style={estilos.botonCancelarModal}>
              <Text style={estilos.textoCancelarModal}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={cerrarEdicion} transparent visible={modalEdicionVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={estilos.fondoModal}>
          <View style={estilos.tarjetaEdicion}>
            <View style={estilos.encabezadoModal}>
              <Text style={estilosGlobales.subtitulo}>Editar depósito</Text>
              <Pressable accessibilityLabel="Cerrar edición" accessibilityRole="button" onPress={cerrarEdicion} style={estilos.botonCerrarModal}>
                <Ionicons color={tema.textoSecundario} name="close" size={24} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={estilos.contenidoModal}>
              <View style={estilos.grupoCampo}>
                <Text style={estilosGlobales.etiqueta}>Nombre</Text>
                <TextInput
                  accessibilityLabel="Nombre del depósito"
                  maxLength={30}
                  onChangeText={(valor) => actualizarBorrador('nombre', valor)}
                  style={estilosGlobales.campo}
                  value={borrador.nombre}
                />
              </View>
              <View style={estilos.grupoCampo}>
                <Text style={estilosGlobales.etiqueta}>Tipo de depósito</Text>
                <View style={estilos.listaOpciones}>
                  {TIPOS_DEPOSITO.map((tipo) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: tipoSeleccionado === tipo }}
                      key={tipo}
                      onPress={() => actualizarBorrador('tipo', tipo)}
                      style={[estilos.chip, tipoSeleccionado === tipo && estilos.chipSeleccionado]}
                    >
                      <Text style={[estilos.textoChip, tipoSeleccionado === tipo && estilos.textoChipSeleccionado]}>{tipo}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={estilos.grupoCampo}>
                <Text style={estilosGlobales.etiqueta}>Ícono</Text>
                <View style={estilos.listaIconos}>
                  {ICONOS_DEPOSITO.map((opcion, indice) => (
                    <Pressable
                      accessibilityLabel={`Elegir ícono ${opcion.etiqueta} ${indice + 1}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: borrador.icono === opcion.nombre }}
                      key={`${opcion.nombre}-${indice}`}
                      onPress={() => actualizarBorrador('icono', opcion.nombre)}
                      style={[estilos.opcionIcono, borrador.icono === opcion.nombre && estilos.opcionIconoSeleccionada]}
                    >
                      <Ionicons color={borrador.icono === opcion.nombre ? tema.foco : tema.textoSecundario} name={opcion.nombre} size={22} />
                      <Text numberOfLines={1} style={estilos.textoOpcionIcono}>{opcion.etiqueta}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={estilos.grupoCampo}>
                <Text style={estilosGlobales.etiqueta}>Color</Text>
                <View style={estilos.listaColores}>
                  {COLORES_DEPOSITOS.map((color) => (
                    <Pressable
                      accessibilityLabel={`Elegir color ${color}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: borrador.color === color }}
                      key={color}
                      onPress={() => actualizarBorrador('color', color)}
                      style={[estilos.opcionColor, { backgroundColor: color }, borrador.color === color && estilos.opcionColorSeleccionada]}
                    >
                      {borrador.color === color ? <Ionicons color={COLOR_ICONO_DEPOSITO} name="checkmark" size={19} /> : null}
                    </Pressable>
                  ))}
                </View>
                <Pressable accessibilityRole="button" onPress={() => actualizarBorrador('color', COLOR_DEPOSITO_PREDETERMINADO)}>
                  <Text style={estilos.enlaceLimpiar}>Usar color predeterminado</Text>
                </Pressable>
              </View>
              <View style={estilos.grupoCampo}>
                <Text style={estilosGlobales.etiqueta}>Descripción</Text>
                <TextInput
                  accessibilityLabel="Descripción del depósito"
                  maxLength={60}
                  multiline
                  onChangeText={(valor) => actualizarBorrador('descripcion', valor)}
                  placeholder="Agrega una descripción"
                  placeholderTextColor={tema.textoSecundario}
                  style={[estilosGlobales.campo, estilos.campoDescripcion]}
                  value={borrador.descripcion}
                />
              </View>
              <View style={estilos.grupoCampo}>
                <Text style={estilosGlobales.etiqueta}>Saldo actual · No editable</Text>
                <View style={estilos.saldoNoEditable}>
                  <Ionicons color={tema.textoSecundario} name="lock-closed-outline" size={18} />
                  <Text style={[estilosGlobales.etiqueta, { color: tema.textoSecundario }]}>{deposito.saldo}</Text>
                </View>
              </View>
            </ScrollView>
            <View style={estilos.accionesModal}>
              <Pressable accessibilityRole="button" onPress={cerrarEdicion} style={estilos.botonSecundarioModal}>
                <Text style={estilos.textoSecundarioModal}>Cancelar</Text>
              </Pressable>
              <BotonPrincipal
                estilosAutenticacion={estilos}
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

      <Modal animationType="fade" onRequestClose={() => establecerModalEliminacionVisible(false)} transparent visible={modalEliminacionVisible}>
        <View style={estilos.fondoModal}>
          <Pressable style={estilos.fondoCierre} onPress={() => establecerModalEliminacionVisible(false)} />
          <View style={estilos.tarjetaConfirmacion}>
            <View style={estilos.iconoEliminar}>
              <Ionicons color={tema.error} name="trash-outline" size={27} />
            </View>
            <Text style={[estilosGlobales.subtitulo, estilos.tituloConfirmacion]}>Eliminar depósito</Text>
            <Text style={[estilosGlobales.textoSecundario, estilos.textoConfirmacion]}>
              ¿Seguro que querés eliminar «{deposito.nombre}»? Esta acción no se realizará todavía.
            </Text>
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
