import { useContext, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ICONOS_ADICIONALES_DEPOSITO,
  ICONOS_DEPOSITO,
  ICONOS_PRINCIPALES_DEPOSITO,
  TIPOS_DEPOSITO,
} from '../constants/deposits';
import { ErrorBaseDatos } from '../database/errors';
import { crearDeposito, ErrorDeposito } from '../deposits/depositService';
import { ContextoAvisos } from '../contexts/ToastContext';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import MensajeError from '../components/ErrorMessage';
import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import { COLOR_DEPOSITO_PREDETERMINADO, COLORES_DEPOSITOS } from '../styles/colors';
import { crearEstilosDeposito } from '../styles/DepositScreenStyles';
import { crearEstilosGlobales, ESPACIADO } from '../styles/globalStyles';
import { validarDatosDeposito } from '../utils/depositValidation';

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
export default function PantallaDeposito({ navigation: navegacion }) {
  const insets = useSafeAreaInsets();
  const { tema } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosDeposito(tema);
  const guardandoRef = useRef(false);
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
  const datosFormulario = { nombre, saldo_inicial: saldoInicial, tipo, icono, color, descripcion };
  const erroresFormulario = validarDatosDeposito(datosFormulario);
  const errorNombre = intentoGuardar ? erroresFormulario.nombre : null;
  const errorSaldo = intentoGuardar ? erroresFormulario.saldo_inicial : null;
  const errorTipo = intentoGuardar ? erroresFormulario.tipo : null;
  const errorIcono = intentoGuardar ? erroresFormulario.icono : null;
  const errorColor = intentoGuardar ? erroresFormulario.color : null;
  const errorDescripcion = intentoGuardar ? erroresFormulario.descripcion : null;
  const formularioInvalido = Object.keys(erroresFormulario).length > 0;
  const iconoFueraDeVista = Boolean(
    icono && !ICONOS_PRINCIPALES_DEPOSITO.some((opcion) => opcion.id === icono),
  );
  const opcionColorSeleccionado = COLORES_SELECTOR.find((opcion) => opcion.valor === color);
  const cambiarNombre = (valor) => {
    establecerNombre(valor);
  };

  const cambiarSaldo = (valor) => {
    establecerSaldoInicial(valor);
  };

  const cambiarDescripcion = (valor) => {
    establecerDescripcion(valor);
  };

  const guardarDeposito = async () => {
    if (guardandoRef.current) return;

    establecerIntentoGuardar(true);
    if (formularioInvalido) return;

    guardandoRef.current = true;
    establecerGuardando(true);

    try {
      const depositoCreado = await crearDeposito(datosFormulario);
      guardandoRef.current = false;
      establecerGuardando(false);
      mostrarAviso(`Se creó el depósito «${depositoCreado.nombre}».`, { tipo: 'exito' });
      navegacion.goBack();
    } catch (error) {
      guardandoRef.current = false;
      establecerGuardando(false);
      if (error instanceof ErrorDeposito && error.errores) {
        establecerIntentoGuardar(true);
      }
      const mensaje = error instanceof ErrorDeposito || error instanceof ErrorBaseDatos
        ? error.message
        : 'No se pudo crear el depósito. Intentá nuevamente.';
      mostrarAviso(mensaje, { tipo: 'error' });
    }
  };

  const volver = () => {
    if (!guardandoRef.current) navegacion.goBack();
  };

  const seleccionarIcono = (idIcono) => {
    establecerIcono(idIcono);
    establecerIconosAdicionalesVisibles(false);
  };

  const seleccionarColor = (valorColor) => {
    establecerColor(valorColor);
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
                  editable={!guardando}
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
                    disabled={guardando}
                    onPress={() => cambiarSaldo('')}
                    style={estilos.accionLimpiarSaldo}
                  >
                    <Ionicons color={tema.textoSecundario} name="close-circle-outline" size={24} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={estilosGlobales.textoAyuda}>
                Monto en pesos. Usá punto para miles y coma para centavos.
              </Text>
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
                  editable={!guardando}
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
                    disabled={guardando}
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
                      disabled={guardando}
                      key={opcion.id}
                      onPress={() => {
                        establecerTipo(opcion.id);
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
                {ICONOS_PRINCIPALES_DEPOSITO.map((opcion) => {
                  const seleccionado = icono === opcion.id;
                  return (
                    <Pressable
                      accessibilityLabel={`Ícono ${opcion.nombre}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: seleccionado }}
                      disabled={guardando}
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
                  disabled={guardando}
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
              {errorIcono ? <Text style={estilosGlobales.textoError}>{errorIcono}</Text> : null}
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
                  disabled={guardando}
                  onPress={() => {
                    establecerColor(null);
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
                      disabled={guardando}
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
              {errorColor ? <Text style={estilosGlobales.textoError}>{errorColor}</Text> : null}
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
                  editable={!guardando}
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
                    disabled={guardando}
                    onPress={() => cambiarDescripcion('')}
                    style={estilos.botonLimpiar}
                  >
                    <Ionicons color={tema.textoSecundario} name="close-circle" size={22} />
                  </Pressable>
                ) : null}
              </View>
              <Text style={estilos.contador}>{`${descripcion.length}/60`}</Text>
              {errorDescripcion ? <Text style={estilosGlobales.textoError}>{errorDescripcion}</Text> : null}
              <Text style={estilosGlobales.textoAyuda}>
                Si la dejás vacía, se genera automáticamente con el nombre y el tipo.
              </Text>
            </View>

            <MensajeError estilosAutenticacion={estilos} tema={tema}>
              {intentoGuardar && formularioInvalido ? 'Revisá los campos marcados antes de crear el depósito.' : null}
            </MensajeError>

            <View style={estilos.acciones}>
              <BotonPrincipal
                estilosAutenticacion={estilos}
                estilosGlobales={estilosGlobales}
                titulo="Crear depósito"
                cargando={guardando}
                alPresionar={guardarDeposito}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: guardando }}
                disabled={guardando}
                onPress={volver}
                style={({ pressed }) => [
                  estilosGlobales.botonSecundario,
                  pressed && !guardando && estilos.elementoPresionado,
                  guardando && estilosGlobales.botonDeshabilitado,
                ]}
              >
                <Text style={guardando ? estilosGlobales.textoDeshabilitado : estilosGlobales.textoBotonSecundario}>
                  Cancelar
                </Text>
              </Pressable>
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
            {ICONOS_ADICIONALES_DEPOSITO.map((opcion) => {
              const seleccionado = icono === opcion.id;
              return (
                <Pressable
                  key={opcion.id}
                  accessibilityLabel={`Ícono ${opcion.nombre}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionado }}
                  disabled={guardando}
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
