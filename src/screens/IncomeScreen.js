import { useCallback, useContext, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContextoAvisos } from '../contexts/ToastContext';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import SelectorCategoria from '../components/CategorySelector';
import SelectorFecha from '../components/DateSelector';
import SelectorDeposito from '../components/DepositSelector';
import EntradaMonto from '../components/MoneyInput';
import BotonPrincipal from '../components/PrimaryButton';
import ControlRecurrencia from '../components/RecurrenceControl';
import EncabezadoSeccion from '../components/SectionHeader';
import SelectorHora from '../components/TimeSelector';
import { RUTAS } from '../constants/routes';
import { ErrorBaseDatos } from '../database/errors';
import { cargarDatosIngreso, crearIngreso, ErrorIngreso } from '../movements/incomeService';
import { FRECUENCIAS_MOVIMIENTO, validarDatosIngreso } from '../utils/movementValidation';

import { crearEstilosEgreso } from '../styles/expenseStyles';
import { crearEstilosGlobales, ESPACIADO } from '../styles/globalStyles';

const FRECUENCIAS_RECURRENCIA = Object.freeze([
  Object.freeze({ id: 'diaria', nombre: 'Diaria' }),
  Object.freeze({ id: 'semanal', nombre: 'Semanal' }),
  Object.freeze({ id: 'mensual', nombre: 'Mensual' }),
  Object.freeze({ id: 'anual', nombre: 'Anual' }),
]);

const obtenerHoraActual = () => {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
};

export default function PantallaIngreso({ navigation: navegacion }) {
  const insets = useSafeAreaInsets();
  const { mostrarAviso } = useContext(ContextoAvisos);
  const { tema } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosMovimiento = crearEstilosEgreso(tema);
  const accionEnCurso = useRef(false);
  const [monto, establecerMonto] = useState('');
  const [descripcion, establecerDescripcion] = useState('');
  const [depositoId, establecerDepositoId] = useState(null);
  const [categoriaId, establecerCategoriaId] = useState(null);
  const [fecha, establecerFecha] = useState(() => new Date());
  const [hora, establecerHora] = useState(obtenerHoraActual);
  const [recurrente, establecerRecurrente] = useState(false);
  const [frecuencia, establecerFrecuencia] = useState('mensual');
  const [depositos, establecerDepositos] = useState([]);
  const [categorias, establecerCategorias] = useState([]);
  const [cargandoDatos, establecerCargandoDatos] = useState(true);
  const [errorCarga, establecerErrorCarga] = useState(null);
  const [guardando, establecerGuardando] = useState(false);
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [descripcionEnfocada, establecerDescripcionEnfocada] = useState(false);
  const datosFormulario = {
    monto,
    descripcion,
    deposito_id: depositoId,
    categoria: categoriaId,
    fecha,
    hora,
    recurrente,
    frecuencia,
  };
  const errores = validarDatosIngreso(datosFormulario);
  const mostrandoEstado = cargandoDatos || Boolean(errorCarga) || depositos.length === 0;

  const cargarDatos = useCallback(async () => {
    establecerCargandoDatos(true);
    establecerErrorCarga(null);

    try {
      const datos = await cargarDatosIngreso();
      establecerDepositos(datos.depositos);
      establecerCategorias(datos.categorias);
      establecerDepositoId((depositoActual) => (
        datos.depositos.some((deposito) => deposito.id === depositoActual)
          ? depositoActual
          : null
      ));
    } catch (error) {
      establecerErrorCarga(
        error instanceof ErrorIngreso || error instanceof ErrorBaseDatos
          ? error.message
          : 'No se pudo cargar la información del ingreso. Intentá nuevamente.',
      );
    } finally {
      establecerCargandoDatos(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    cargarDatos();
  }, [cargarDatos]));

  const guardarIngreso = async () => {
    if (accionEnCurso.current) return;

    establecerIntentoGuardar(true);

    if (Object.keys(errores).length > 0) {
      mostrarAviso('Revisá los campos marcados antes de guardar el ingreso.', { tipo: 'error' });
      return;
    }

    accionEnCurso.current = true;
    Keyboard.dismiss();
    establecerGuardando(true);

    try {
      await crearIngreso(datosFormulario);
      mostrarAviso('El ingreso se guardó correctamente.', { tipo: 'exito' });
      navegacion.goBack();
    } catch (error) {
      if (error instanceof ErrorIngreso && error.errores) {
        establecerIntentoGuardar(true);
      }

      const mensaje = error instanceof ErrorIngreso || error instanceof ErrorBaseDatos
        ? error.message
        : 'No se pudo guardar el ingreso. Intentá nuevamente.';
      mostrarAviso(mensaje, { tipo: 'error' });
    } finally {
      accionEnCurso.current = false;
      establecerGuardando(false);
    }
  };

  const volver = () => {
    if (!accionEnCurso.current) navegacion.goBack();
  };

  const abrirNuevoDeposito = () => {
    if (!accionEnCurso.current) navegacion.navigate(RUTAS.DEPOSITO);
  };

  const renderizarEstado = () => {
    if (cargandoDatos) {
      return (
        <View style={[estilosGlobales.tarjeta, { alignItems: 'center', gap: ESPACIADO.medio }]}>
          <ActivityIndicator color={tema.foco} size="large" />
          <Text style={estilosGlobales.texto}>Cargando depósitos y categorías…</Text>
        </View>
      );
    }

    if (errorCarga) {
      return (
        <View style={[estilosGlobales.tarjeta, { gap: ESPACIADO.medio }]}>
          <Text accessibilityRole="alert" style={estilosGlobales.textoError}>{errorCarga}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={cargarDatos}
            style={estilosGlobales.botonPrincipal}
          >
            <Text style={estilosGlobales.textoBotonPrincipal}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    if (depositos.length === 0) {
      return (
        <View style={[estilosGlobales.tarjeta, { alignItems: 'center', gap: ESPACIADO.medio }]}>
          <Ionicons color={tema.foco} name="wallet-outline" size={42} />
          <Text style={[estilosGlobales.subtitulo, { textAlign: 'center' }]}>Todavía no tenés depósitos.</Text>
          <Text style={[estilosGlobales.textoSecundario, { textAlign: 'center' }]}>
            Creá un depósito antes de registrar un ingreso.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={abrirNuevoDeposito}
            style={estilosGlobales.botonPrincipal}
          >
            <Text style={estilosGlobales.textoBotonPrincipal}>Nuevo depósito</Text>
          </Pressable>
        </View>
      );
    }

    const errorMonto = intentoGuardar ? errores.monto : null;
    const errorDescripcion = intentoGuardar ? errores.descripcion : null;
    const errorDeposito = intentoGuardar ? errores.deposito_id : null;
    const errorCategoria = intentoGuardar ? errores.categoria : null;
    const errorFechaHora = intentoGuardar ? errores.fecha_hora : null;

    return (
      <View pointerEvents={guardando ? 'none' : 'auto'} style={estilosMovimiento.formulario}>
        <EntradaMonto
          tema={tema}
          estilosGlobales={estilosGlobales}
          estilosMovimiento={estilosMovimiento}
          etiqueta="Monto"
          valor={monto}
          alCambiarTexto={establecerMonto}
          alLimpiar={() => establecerMonto('')}
          error={errorMonto}
        />

        <View style={estilosMovimiento.grupo}>
          <Text style={estilosGlobales.etiqueta}>Descripción *</Text>
          <View
            style={[
              estilosGlobales.campo,
              estilosMovimiento.filaDescripcion,
              errorDescripcion
                ? estilosGlobales.campoError
                : descripcionEnfocada
                  ? estilosGlobales.campoEnfocado
                  : null,
            ]}
          >
            <Ionicons color={tema.textoSecundario} name="document-text-outline" size={20} />
            <TextInput
              accessibilityLabel="Descripción"
              accessibilityHint={errorDescripcion || undefined}
              editable={!guardando}
              maxLength={500}
              onBlur={() => establecerDescripcionEnfocada(false)}
              onFocus={() => establecerDescripcionEnfocada(true)}
              onChangeText={establecerDescripcion}
              placeholder="Ej: Sueldo, Venta, Devolución"
              placeholderTextColor={tema.textoSecundario}
              selectionColor={tema.foco}
              style={estilosMovimiento.entradaDescripcion}
              value={descripcion}
            />
          </View>
          <Text style={estilosMovimiento.contador}>{`${descripcion.length}/500`}</Text>
          {errorDescripcion ? (
            <Text style={[estilosGlobales.textoError, estilosMovimiento.errorCampo]}>
              {errorDescripcion}
            </Text>
          ) : null}
        </View>

        <SelectorDeposito
          tema={tema}
          estilosGlobales={estilosGlobales}
          estilosMovimiento={estilosMovimiento}
          depositos={depositos}
          seleccionadoId={depositoId}
          alSeleccionar={establecerDepositoId}
          error={errorDeposito}
        />

        <SelectorCategoria
          tema={tema}
          estilosGlobales={estilosGlobales}
          estilosMovimiento={estilosMovimiento}
          categorias={categorias}
          seleccionadaId={categoriaId}
          alSeleccionar={establecerCategoriaId}
          error={errorCategoria}
        />

        <View style={estilosMovimiento.grupo}>
          <Text style={estilosGlobales.etiqueta}>Información adicional</Text>
          <View style={estilosMovimiento.tarjetaInformacion}>
            <SelectorFecha
              tema={tema}
              estilosMovimiento={estilosMovimiento}
              valor={fecha}
              alSeleccionar={establecerFecha}
            />
            <View style={estilosMovimiento.separadorInformacion} />
            <SelectorHora
              tema={tema}
              estilosMovimiento={estilosMovimiento}
              valor={hora}
              alSeleccionar={establecerHora}
            />
            <View style={estilosMovimiento.separadorInformacion} />
            <ControlRecurrencia
              tema={tema}
              estilosMovimiento={estilosMovimiento}
              valor={recurrente}
              alCambiar={establecerRecurrente}
              frecuencias={FRECUENCIAS_RECURRENCIA}
              frecuenciaSeleccionada={frecuencia}
              alCambiarFrecuencia={establecerFrecuencia}
            />
          </View>
          {errorFechaHora ? (
            <Text style={estilosGlobales.textoError}>{errorFechaHora}</Text>
          ) : null}
          {intentoGuardar && recurrente && !FRECUENCIAS_MOVIMIENTO.includes(frecuencia) ? (
            <Text style={estilosGlobales.textoError}>{errores.frecuencia}</Text>
          ) : null}
          <Text style={estilosGlobales.textoAyuda}>
            {recurrente
              ? 'Elegí cada cuánto se repetirá este movimiento.'
              : 'Sueldo, venta o pago recibido.'}
          </Text>
        </View>

        <View style={estilosMovimiento.acciones}>
          <BotonPrincipal
            estilosAutenticacion={estilosMovimiento}
            estilosGlobales={estilosGlobales}
            titulo="Guardar ingreso"
            cargando={guardando}
            alPresionar={guardarIngreso}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Nuevo ingreso"
          descripcion="Registra el dinero que recibes."
          alVolver={volver}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              mostrandoEstado && estilosMovimiento.formulario,
              { paddingBottom: insets.bottom + ESPACIADO.grande },
              mostrandoEstado && { flexGrow: 1, justifyContent: 'center' },
            ]}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
          >
            {renderizarEstado()}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
