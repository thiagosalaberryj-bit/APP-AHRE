import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import MensajeError from '../components/ErrorMessage';
import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import {
  COLOR_DEPOSITO_PREDETERMINADO,
  COLORES_DEPOSITOS,
  TEMAS,
} from '../styles/colors';
import { crearEstilosDeposito } from '../styles/DepositScreenStyles';
import { crearEstilosGlobales, ESPACIADO } from '../styles/globalStyles';

const TIPOS_DEPOSITO = Object.freeze([
  Object.freeze({ id: 'efectivo', nombre: 'Efectivo', icono: 'cash-outline' }),
  Object.freeze({ id: 'banco', nombre: 'Banco', icono: 'business-outline' }),
  Object.freeze({ id: 'billetera_virtual', nombre: 'Billetera virtual', icono: 'phone-portrait-outline' }),
]);

const NOMBRES_COLORES_DEPOSITO = Object.freeze([
  'Verde suave',
  'Violeta',
  'Rosa',
  'Amarillo suave',
]);

const COLORES_SELECTOR = Object.freeze(
  COLORES_DEPOSITOS
    .filter((color) => color !== COLOR_DEPOSITO_PREDETERMINADO)
    .map((color, indice) => ({
      valor: color,
      nombre: NOMBRES_COLORES_DEPOSITO[indice],
    })),
);
const ICONOS_DEPOSITO = Object.freeze([
  Object.freeze({ id: 'cash-outline', nombre: 'Efectivo' }),
  Object.freeze({ id: 'business-outline', nombre: 'Banco' }),
  Object.freeze({ id: 'phone-portrait-outline', nombre: 'Billetera virtual', nombreCorto: 'Virtual' }),
  Object.freeze({ id: 'wallet-outline', nombre: 'Billetera' }),
  Object.freeze({ id: 'card-outline', nombre: 'Tarjeta' }),
  Object.freeze({ id: 'briefcase-outline', nombre: 'Ahorros', nombreCorto: 'Ahorro' }),
]);

const ICONOS_PRINCIPALES = ICONOS_DEPOSITO.slice(0, 4);
const ICONOS_ADICIONALES = ICONOS_DEPOSITO.slice(4);

const convertirSaldoANumero = (valor) => Number(valor.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));

export default function PantallaDeposito({ navigation: navegacion }) {
  const insets = useSafeAreaInsets();
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDeposito(tema);
  const [nombre, establecerNombre] = useState('');
  const [saldoInicial, establecerSaldoInicial] = useState('');
  const [tipo, establecerTipo] = useState(null);
  const [icono, establecerIcono] = useState('cash-outline');
  const [color, establecerColor] = useState(null);
  const [descripcion, establecerDescripcion] = useState('');
  const [iconosAdicionalesVisibles, establecerIconosAdicionalesVisibles] = useState(false);
  const [nombreEnfocado, establecerNombreEnfocado] = useState(false);
  const [saldoEnfocado, establecerSaldoEnfocado] = useState(false);
  const [descripcionEnfocada, establecerDescripcionEnfocada] = useState(false);
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [errorCreacion, establecerErrorCreacion] = useState(null);

  const numeroSaldo = convertirSaldoANumero(saldoInicial);
  const nombreInvalido = !nombre.trim();
  const saldoInvalido =
    !saldoInicial.trim() ||
    !/\d/.test(saldoInicial) ||
    !Number.isFinite(numeroSaldo) ||
    numeroSaldo < 0;
  const tipoInvalido = !tipo;
  const errorNombre = intentoGuardar && nombreInvalido ? 'Ingresá el nombre del depósito.' : null;
  const errorSaldo = intentoGuardar && saldoInvalido
    ? saldoInicial.trim()
      ? 'Ingresá un saldo válido.'
      : 'Ingresá el saldo inicial.'
    : null;
  const errorTipo = intentoGuardar && tipoInvalido ? 'Elegí un tipo de depósito.' : null;
  const formularioInvalido = nombreInvalido || saldoInvalido || tipoInvalido;
  const iconoFueraDeVista = Boolean(
    icono && !ICONOS_PRINCIPALES.some((opcion) => opcion.id === icono),
  );
  const opcionColorSeleccionado = COLORES_SELECTOR.find((opcion) => opcion.valor === color);
  const errorGeneral = intentoGuardar && formularioInvalido
    ? 'Revisá los campos marcados antes de continuar.'
    : errorCreacion;

  const cambiarNombre = (valor) => {
    establecerNombre(valor);
    establecerErrorCreacion(null);
  };

  const cambiarSaldo = (valor) => {
    establecerSaldoInicial(valor);
    establecerErrorCreacion(null);
  };

  const cambiarDescripcion = (valor) => {
    establecerDescripcion(valor);
    establecerErrorCreacion(null);
  };

  const crearDeposito = () => {
    establecerIntentoGuardar(true);
    if (formularioInvalido || guardando) return;

    establecerErrorCreacion(null);
    establecerGuardando(true);
    setTimeout(() => {
      establecerGuardando(false);
      establecerErrorCreacion('La creación todavía no está disponible. No se guardó información.');
    }, 1000);
  };

  const volver = () => navegacion.goBack();

  const seleccionarIcono = (idIcono) => {
    establecerIcono(idIcono);
    establecerErrorCreacion(null);
    establecerIconosAdicionalesVisibles(false);
  };

  const seleccionarColor = (valorColor) => {
    establecerColor(valorColor);
    establecerErrorCreacion(null);
  };

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Nuevo depósito"
          descripcion="Organiza una nueva fuente de dinero."
          alVolver={volver}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={estilos.contenedorTeclado}
        >
          <ScrollView
            contentContainerStyle={[estilos.formulario, { paddingBottom: insets.bottom + ESPACIADO.enorme }]}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
          >
            <View style={estilos.grupo}>
              <Text style={estilosGlobales.etiqueta}>Saldo inicial *</Text>
              <View
                style={[
                  estilosGlobales.campo,
                  estilos.filaSaldo,
                  errorSaldo
                    ? estilosGlobales.campoError
                    : saldoEnfocado
                      ? estilosGlobales.campoEnfocado
                      : null,
                ]}
              >
                <Text style={estilos.simboloSaldo}>$</Text>
                <TextInput
                  accessibilityLabel="Saldo inicial"
                  accessibilityHint={errorSaldo || 'Ingresá el monto en pesos.'}
                  keyboardType="decimal-pad"
                  onBlur={() => establecerSaldoEnfocado(false)}
                  onChangeText={cambiarSaldo}
                  onFocus={() => establecerSaldoEnfocado(true)}
                  placeholder="0"
                  placeholderTextColor={tema.textoSecundario}
                  returnKeyType="next"
                  selectionColor={tema.foco}
                  style={estilos.entradaSaldo}
                  value={saldoInicial}
                />
                {saldoInicial ? (
                  <Pressable
                    accessibilityLabel="Limpiar saldo inicial"
                    accessibilityRole="button"
                    onPress={() => cambiarSaldo('')}
                    style={estilos.accionLimpiarSaldo}
                  >
                    <Ionicons color={tema.textoSecundario} name="close-circle-outline" size={24} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={estilosGlobales.textoAyuda}>Monto disponible al crear el depósito.</Text>
              {errorSaldo ? <Text style={estilosGlobales.textoError}>{errorSaldo}</Text> : null}
            </View>

            <View style={estilos.grupo}>
              <Text style={estilosGlobales.etiqueta}>Nombre del depósito *</Text>
              <View
                style={[
                  estilosGlobales.campo,
                  estilos.filaEntrada,
                  errorNombre
                    ? estilosGlobales.campoError
                    : nombreEnfocado
                      ? estilosGlobales.campoEnfocado
                      : null,
                ]}
              >
                <Ionicons color={tema.textoSecundario} name="wallet-outline" size={21} />
                <TextInput
                  accessibilityLabel="Nombre del depósito"
                  accessibilityHint={errorNombre || undefined}
                  maxLength={30}
                  onBlur={() => establecerNombreEnfocado(false)}
                  onChangeText={cambiarNombre}
                  onFocus={() => establecerNombreEnfocado(true)}
                  placeholder="Ej: Efectivo, Cuenta BNA"
                  placeholderTextColor={tema.textoSecundario}
                  returnKeyType="next"
                  selectionColor={tema.foco}
                  style={estilos.entradaTexto}
                  value={nombre}
                />
                {nombre ? (
                  <Pressable
                    accessibilityLabel="Limpiar nombre"
                    accessibilityRole="button"
                    onPress={() => cambiarNombre('')}
                    style={estilos.botonLimpiar}
                  >
                    <Ionicons color={tema.textoSecundario} name="close-circle" size={22} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={estilos.contador}>{`${nombre.length}/30`}</Text>
              {errorNombre ? <Text style={estilosGlobales.textoError}>{errorNombre}</Text> : null}
            </View>

            <View style={estilos.grupo}>
              <Text style={estilosGlobales.etiqueta}>Tipo de depósito *</Text>
              <View style={estilos.listaTipos}>
                {TIPOS_DEPOSITO.map((opcion) => {
                  const seleccionada = tipo === opcion.id;
                  return (
                    <Pressable
                      accessibilityLabel={opcion.nombre}
                      accessibilityRole="button"
                      accessibilityState={{ selected: seleccionada }}
                      key={opcion.id}
                      onPress={() => {
                        establecerTipo(opcion.id);
                        establecerErrorCreacion(null);
                      }}
                      style={({ pressed }) => [
                        estilos.tarjetaTipo,
                        seleccionada && estilos.tarjetaTipoSeleccionada,
                        errorTipo && estilos.tarjetaTipoError,
                        pressed && estilos.elementoPresionado,
                      ]}
                    >
                      <View style={[estilos.iconoTipo, seleccionada && estilos.iconoTipoSeleccionado]}>
                        <Ionicons
                          color={seleccionada ? tema.botonPrincipalTexto : tema.foco}
                          name={opcion.icono}
                          size={25}
                        />
                      </View>
                      <Text style={[estilos.nombreTipo, seleccionada && estilos.nombreTipoSeleccionado]}>
                        {opcion.nombre}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errorTipo ? <Text style={estilosGlobales.textoError}>{errorTipo}</Text> : null}
            </View>

            <View style={estilos.grupo}>
              <Text style={estilosGlobales.etiqueta}>Ícono</Text>
              <View style={estilos.listaIconos}>
                {ICONOS_PRINCIPALES.map((opcion) => {
                  const seleccionado = icono === opcion.id;
                  return (
                    <Pressable
                      accessibilityLabel={`Ícono ${opcion.nombre}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: seleccionado }}
                      key={opcion.id}
                      onPress={() => seleccionarIcono(opcion.id)}
                      style={({ pressed }) => [
                        estilos.botonIcono,
                        seleccionado && estilos.botonIconoSeleccionado,
                        pressed && estilos.elementoPresionado,
                      ]}
                    >
                      <Ionicons
                        color={seleccionado ? tema.foco : tema.textoPrincipal}
                        name={opcion.id}
                        size={23}
                      />
                      <Text numberOfLines={1} style={estilos.nombreIcono}>
                        {opcion.nombreCorto || opcion.nombre}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  accessibilityLabel="Ver más íconos"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: iconosAdicionalesVisibles }}
                  onPress={() => establecerIconosAdicionalesVisibles(true)}
                  style={({ pressed }) => [
                    estilos.botonIcono,
                    estilos.botonMasIconos,
                    pressed && estilos.elementoPresionado,
                  ]}
                >
                  <Ionicons color={tema.foco} name="add-outline" size={23} />
                  <Text style={estilos.nombreIcono}>Más</Text>
                </Pressable>
              </View>
              {iconoFueraDeVista ? (
                <Text style={estilosGlobales.textoAyuda}>
                  Ícono seleccionado: {ICONOS_DEPOSITO.find((opcion) => opcion.id === icono).nombre}
                </Text>
              ) : null}
            </View>

            <View style={estilos.grupo}>
              <View style={estilos.encabezadoColor}>
                <Text style={estilosGlobales.etiqueta}>Color</Text>
                <Text style={estilos.textoOpcional}>Opcional</Text>
              </View>
              <View style={estilos.listaColores}>
                <Pressable
                  accessibilityLabel="Color azul suave predeterminado"
                  accessibilityRole="button"
                  accessibilityState={{ selected: color === null }}
                  onPress={() => {
                    establecerColor(null);
                    establecerErrorCreacion(null);
                  }}
                  style={({ pressed }) => [
                    estilos.opcionColor,
                    pressed && estilos.elementoPresionado,
                  ]}
                >
                  <View style={[
                    estilos.muestraColor,
                    estilos.colorPredeterminado,
                    color === null && estilos.muestraColorSeleccionada,
                  ]}>
                    {color === null ? (
                      <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={22} />
                    ) : null}
                  </View>
                  <Text style={[estilos.nombreColor, color === null && estilos.nombreColorSeleccionado]}>
                    Azul suave
                  </Text>
                </Pressable>
                {COLORES_SELECTOR.map(({ nombre, valor }) => {
                  const seleccionado = color === valor;
                  return (
                    <Pressable
                      accessibilityLabel={`Color ${nombre}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: seleccionado }}
                      key={valor}
                      onPress={() => seleccionarColor(valor)}
                      style={({ pressed }) => [
                        estilos.opcionColor,
                        pressed && estilos.elementoPresionado,
                      ]}
                    >
                      <View
                        style={[
                          estilos.muestraColor,
                          { backgroundColor: valor },
                          seleccionado && estilos.muestraColorSeleccionada,
                        ]}
                      >
                        {seleccionado ? (
                          <Ionicons color={tema.botonPrincipalTexto} name="checkmark" size={22} />
                        ) : null}
                      </View>
                      <Text style={[estilos.nombreColor, seleccionado && estilos.nombreColorSeleccionado]}>
                        {nombre}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={estilos.colorSeleccionadoInfo}>
                <View
                  style={[
                    estilos.indicadorColorSeleccionado,
                    {
                      backgroundColor:
                        opcionColorSeleccionado?.valor || COLOR_DEPOSITO_PREDETERMINADO,
                    },
                  ]}
                />
                <Text style={estilosGlobales.textoAyuda}>
                  {opcionColorSeleccionado
                    ? `Color: ${opcionColorSeleccionado.nombre}`
                    : 'Color: Azul suave (predeterminado)'}
                </Text>
              </View>
            </View>

            <View style={estilos.grupo}>
              <View style={estilos.encabezadoColor}>
                <Text style={estilosGlobales.etiqueta}>Descripción</Text>
                <Text style={estilos.textoOpcional}>Opcional</Text>
              </View>
              <View
                style={[
                  estilosGlobales.campo,
                  estilos.filaDescripcion,
                  descripcionEnfocada ? estilosGlobales.campoEnfocado : null,
                ]}
              >
                <Ionicons color={tema.textoSecundario} name="document-text-outline" size={20} />
                <TextInput
                  accessibilityLabel="Descripción opcional"
                  maxLength={60}
                  multiline
                  onBlur={() => establecerDescripcionEnfocada(false)}
                  onChangeText={cambiarDescripcion}
                  onFocus={() => establecerDescripcionEnfocada(true)}
                  placeholder="Agregá un detalle para identificarlo"
                  placeholderTextColor={tema.textoSecundario}
                  selectionColor={tema.foco}
                  style={estilos.entradaDescripcion}
                  value={descripcion}
                />
                {descripcion ? (
                  <Pressable
                    accessibilityLabel="Limpiar descripción"
                    accessibilityRole="button"
                    onPress={() => cambiarDescripcion('')}
                    style={estilos.botonLimpiar}
                  >
                    <Ionicons color={tema.textoSecundario} name="close-circle" size={22} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={estilos.contador}>{`${descripcion.length}/60`}</Text>
              <Text style={estilosGlobales.textoAyuda}>
                Si la dejás vacía, podrá generarse más adelante usando el nombre y el tipo.
              </Text>
            </View>

            <MensajeError estilosAutenticacion={estilos} tema={tema}>
              {errorGeneral}
            </MensajeError>

            <View style={estilos.acciones}>
              <BotonPrincipal
                estilosAutenticacion={estilos}
                estilosGlobales={estilosGlobales}
                titulo="Crear depósito"
                cargando={guardando}
                alPresionar={crearDeposito}
              />
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <Modal
        animationType="fade"
        onRequestClose={() => establecerIconosAdicionalesVisibles(false)}
        transparent
        visible={iconosAdicionalesVisibles}
      >
        <Pressable
          accessibilityLabel="Cerrar selector de íconos"
          onPress={() => establecerIconosAdicionalesVisibles(false)}
          style={estilos.fondoModal}
        >
          <Pressable onPress={() => {}} style={estilos.tarjetaModal}>
            <View style={estilos.encabezadoModal}>
              <Text style={estilos.tituloModal}>Más íconos</Text>
              <Pressable
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => establecerIconosAdicionalesVisibles(false)}
                style={estilos.botonCerrarModal}
              >
                <Ionicons color={tema.textoPrincipal} name="close" size={22} />
              </Pressable>
            </View>
            {ICONOS_ADICIONALES.map((opcion) => {
              const seleccionado = icono === opcion.id;
              return (
                <Pressable
                  key={opcion.id}
                  accessibilityLabel={`Ícono ${opcion.nombre}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionado }}
                  onPress={() => seleccionarIcono(opcion.id)}
                  style={[
                    estilos.opcionIconoModal,
                    seleccionado && estilos.opcionIconoModalSeleccionada,
                  ]}
                >
                  <Ionicons color={tema.foco} name={opcion.id} size={22} />
                  <Text style={estilos.nombreOpcionIcono}>{opcion.nombre}</Text>
                  <Ionicons
                    color={seleccionado ? tema.foco : tema.borde}
                    name={seleccionado ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                  />
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
