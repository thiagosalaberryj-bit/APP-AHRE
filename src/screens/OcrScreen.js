import { useContext, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import SelectorCategoria from '../components/CategorySelector';
import SelectorFecha from '../components/DateSelector';
import SelectorDeposito from '../components/DepositSelector';
import EntradaMonto from '../components/MoneyInput';
import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import SelectorHora from '../components/TimeSelector';
import { CATEGORIAS_EGRESO, DEPOSITOS_SIMULADOS } from '../constants/movimientos';
import { crearEstilosEgreso } from '../styles/expenseStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosOcr } from '../styles/OcrScreenStyles';

const RESULTADO_ESCANER = Object.freeze({
  monto: '24580',
  descripcion: 'Supermercado',
  categoriaId: 'alimentacion',
  depositoId: 'mercado-pago',
  hora: '18:45',
});

const RESULTADO_GALERIA = Object.freeze({
  monto: '12150',
  descripcion: 'Ticket de compra',
  categoriaId: null,
  depositoId: 'efectivo',
  hora: '12:30',
});

export default function PantallaOCR({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosMovimiento = crearEstilosEgreso(tema);
  const estilos = crearEstilosOcr(tema);
  const [estado, establecerEstado] = useState('camara');
  const [origen, establecerOrigen] = useState('escaner');
  const [monto, establecerMonto] = useState('');
  const [descripcion, establecerDescripcion] = useState('');
  const [fecha, establecerFecha] = useState(() => new Date());
  const [hora, establecerHora] = useState('18:45');
  const [categoriaId, establecerCategoriaId] = useState(null);
  const [depositoId, establecerDepositoId] = useState(null);

  const cargarResultado = (datos) => {
    establecerMonto(datos.monto);
    establecerDescripcion(datos.descripcion);
    establecerFecha(new Date());
    establecerHora(datos.hora);
    establecerCategoriaId(datos.categoriaId);
    establecerDepositoId(datos.depositoId);
  };

  const iniciarProcesamiento = (origenElegido) => {
    establecerOrigen(origenElegido);
    establecerEstado('procesando');
    setTimeout(() => {
      cargarResultado(origenElegido === 'galeria' ? RESULTADO_GALERIA : RESULTADO_ESCANER);
      establecerEstado('resultado');
    }, 2000);
  };

  const volverAEscanear = () => {
    establecerEstado('camara');
  };

  const incompleto = estado === 'resultado' && !categoriaId;

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Escanear comprobante"
          descripcion="Colocá el ticket dentro del área indicada."
          alVolver={() => navegacion.goBack()}
        />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={estilos.contenido}>
            {estado === 'camara' ? (
              <>
                <View style={estilos.visor}>
                  <View style={estilos.guia}>
                    <View style={[estilos.esquinaGuia, { left: 0, top: 0, borderLeftWidth: 6, borderTopWidth: 6, borderTopLeftRadius: 12 }]} />
                    <View style={[estilos.esquinaGuia, { right: 0, top: 0, borderRightWidth: 6, borderTopWidth: 6, borderTopRightRadius: 12 }]} />
                    <View style={[estilos.esquinaGuia, { left: 0, bottom: 0, borderLeftWidth: 6, borderBottomWidth: 6, borderBottomLeftRadius: 12 }]} />
                    <View style={[estilos.esquinaGuia, { right: 0, bottom: 0, borderRightWidth: 6, borderBottomWidth: 6, borderBottomRightRadius: 12 }]} />
                  </View>
                  <Ionicons color="#FFFFFF" name="receipt-outline" size={40} />
                  <Text style={estilos.textoVisor}>La cámara se activará aquí próximamente.</Text>
                </View>
                <Text style={estilos.instrucciones}>
                  Colocá el ticket dentro del área indicada, con buena luz y sin arrugas.
                </Text>
                <View style={estilos.accionesEscaner}>
                  <View style={estilos.filaBotones}>
                    <View style={estilos.botonMitad}>
                      <BotonPrincipal
                        estilosAutenticacion={estilosMovimiento}
                        estilosGlobales={estilosGlobales}
                        titulo="Escanear"
                        alPresionar={() => iniciarProcesamiento('escaner')}
                      />
                    </View>
                    <View style={estilos.botonMitad}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => iniciarProcesamiento('galeria')}
                        style={estilos.botonGaleria}
                      >
                        <Ionicons color={tema.textoPrincipal} name="image-outline" size={22} />
                        <Text style={estilos.textoBotonGaleria}>Galería</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </>
            ) : null}

            {estado === 'procesando' ? (
              <View style={estilos.tarjetaEstado}>
                <ActivityIndicator size="large" color={tema.foco} />
                <Text style={estilos.tituloEstado}>Analizando comprobante...</Text>
                <Text style={estilos.textoEstado}>
                  Esto puede tardar algunos segundos. No cierres la pantalla.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navegacion.goBack()}
                  style={estilosGlobales.botonSecundario}
                >
                  <Text style={estilosGlobales.textoBotonSecundario}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Simular error de lectura"
                  accessibilityRole="button"
                  onPress={() => establecerEstado('error')}
                  style={estilos.accionSutil}
                >
                  <Text style={estilos.textoAccionSutil}>Simular error de lectura</Text>
                </Pressable>
              </View>
            ) : null}

            {estado === 'resultado' ? (
              <>
                {incompleto ? (
                  <View style={estilos.avisoIncompleto}>
                    <Ionicons color={tema.foco} name="alert-circle-outline" size={22} />
                    <Text style={estilos.textoAviso}>
                      No pudimos determinar la categoría. Elegila manualmente antes de confirmar.
                    </Text>
                  </View>
                ) : null}
                <EntradaMonto
                  tema={tema}
                  estilosGlobales={estilosGlobales}
                  estilosMovimiento={estilosMovimiento}
                  etiqueta="Monto"
                  valor={monto}
                  alCambiarTexto={establecerMonto}
                  alLimpiar={() => establecerMonto('')}
                />
                <View style={estilosMovimiento.grupo}>
                  <Text style={estilosGlobales.etiqueta}>Descripción</Text>
                  <View style={[estilosGlobales.campo, estilosMovimiento.filaDescripcion]}>
                    <TextInput
                      accessibilityLabel="Descripción detectada"
                      maxLength={500}
                      onChangeText={establecerDescripcion}
                      placeholder="Descripción del comprobante"
                      placeholderTextColor={tema.textoSecundario}
                      selectionColor={tema.foco}
                      style={estilosMovimiento.entradaDescripcion}
                      value={descripcion}
                    />
                  </View>
                </View>
                <View style={estilosMovimiento.grupo}>
                  <Text style={estilosGlobales.etiqueta}>Fecha y hora detectadas</Text>
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
                  </View>
                </View>
                <SelectorCategoria
                  tema={tema}
                  estilosGlobales={estilosGlobales}
                  estilosMovimiento={estilosMovimiento}
                  categorias={CATEGORIAS_EGRESO}
                  seleccionadaId={categoriaId}
                  alSeleccionar={establecerCategoriaId}
                />
                <SelectorDeposito
                  tema={tema}
                  estilosGlobales={estilosGlobales}
                  estilosMovimiento={estilosMovimiento}
                  depositos={DEPOSITOS_SIMULADOS}
                  seleccionadoId={depositoId}
                  alSeleccionar={establecerDepositoId}
                />
                <Text style={estilosGlobales.textoAyuda}>
                  Revisá y corregí los datos antes de confirmar. Todavía no se crea ningún egreso.
                </Text>
                <View style={estilos.accionesEscaner}>
                  <BotonPrincipal
                    estilosAutenticacion={estilosMovimiento}
                    estilosGlobales={estilosGlobales}
                    titulo="Confirmar"
                    alPresionar={() => navegacion.goBack()}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={volverAEscanear}
                    style={estilos.botonGaleria}
                  >
                    <Ionicons color={tema.textoPrincipal} name="scan-outline" size={22} />
                    <Text style={estilos.textoBotonGaleria}>Volver a escanear</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navegacion.goBack()}
                    style={estilosGlobales.botonSecundario}
                  >
                    <Text style={estilosGlobales.textoBotonSecundario}>Cancelar</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {estado === 'error' ? (
              <View style={estilos.tarjetaEstado}>
                <Ionicons color={tema.error} name="alert-circle-outline" size={48} />
                <Text style={estilos.tituloEstado}>No pudimos leer correctamente el comprobante.</Text>
                <Text style={estilos.textoEstado}>
                  Probá con mejor luz o cargá los datos manualmente desde Nuevo egreso.
                </Text>
                <BotonPrincipal
                  estilosAutenticacion={estilosMovimiento}
                  estilosGlobales={estilosGlobales}
                  titulo="Intentar nuevamente"
                  alPresionar={() => iniciarProcesamiento(origen)}
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navegacion.goBack()}
                  style={estilosGlobales.botonSecundario}
                >
                  <Text style={estilosGlobales.textoBotonSecundario}>Cancelar</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
