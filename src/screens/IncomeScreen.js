import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import SelectorCategoria from '../components/CategorySelector';
import SelectorFecha from '../components/DateSelector';
import SelectorDeposito from '../components/DepositSelector';
import MensajeError from '../components/ErrorMessage';
import EntradaMonto from '../components/MoneyInput';
import BotonPrincipal from '../components/PrimaryButton';
import ControlRecurrencia from '../components/RecurrenceControl';
import EncabezadoSeccion from '../components/SectionHeader';
import SelectorHora from '../components/TimeSelector';
import { CATEGORIAS_INGRESO, DEPOSITOS_SIMULADOS } from '../constants/movimientos';
import { TEMAS } from '../styles/colors';
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
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosMovimiento = crearEstilosEgreso(tema);
  const [monto, establecerMonto] = useState('');
  const [descripcion, establecerDescripcion] = useState('');
  const [depositoId, establecerDepositoId] = useState(null);
  const [categoriaId, establecerCategoriaId] = useState(null);
  const [fecha, establecerFecha] = useState(() => new Date());
  const [hora, establecerHora] = useState(obtenerHoraActual);
  const [recurrente, establecerRecurrente] = useState(false);
  const [frecuencia, establecerFrecuencia] = useState('mensual');
  const [guardando, establecerGuardando] = useState(false);
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [descripcionEnfocada, establecerDescripcionEnfocada] = useState(false);

  const errorMonto = intentoGuardar && !monto.trim() ? 'Ingresá un monto válido.' : null;
  const errorDescripcion = intentoGuardar && !descripcion.trim() ? 'La descripción es obligatoria.' : null;
  const errorDeposito = intentoGuardar && !depositoId ? 'Seleccioná el depósito del ingreso.' : null;
  const errorCategoria = intentoGuardar && !categoriaId ? 'Seleccioná una categoría.' : null;
  const errorGeneral =
    intentoGuardar && (!monto.trim() || !descripcion.trim() || !depositoId || !categoriaId)
      ? 'Revisá los campos marcados antes de guardar el ingreso.'
      : null;

  const guardarIngreso = () => {
    establecerIntentoGuardar(true);
    if (!monto.trim() || !descripcion.trim() || !depositoId || !categoriaId || guardando) {
      return;
    }
    establecerGuardando(true);
    setTimeout(() => establecerGuardando(false), 1500);
  };

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Nuevo ingreso"
          descripcion="Registra el dinero que recibes."
          alVolver={() => navegacion.goBack()}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + ESPACIADO.grande }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={estilosMovimiento.formulario}>
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
                depositos={DEPOSITOS_SIMULADOS}
                seleccionadoId={depositoId}
                alSeleccionar={establecerDepositoId}
                error={errorDeposito}
              />

              <SelectorCategoria
                tema={tema}
                estilosGlobales={estilosGlobales}
                estilosMovimiento={estilosMovimiento}
                categorias={CATEGORIAS_INGRESO}
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
                <Text style={estilosGlobales.textoAyuda}>
                  {recurrente
                    ? 'Elegí cada cuánto se repetirá este movimiento.'
                    : 'Sueldo, venta o pago recibido.'}
                </Text>
              </View>

              <MensajeError
                estilosAutenticacion={estilosMovimiento}
                tema={tema}
              >
                {errorGeneral}
              </MensajeError>

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
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
