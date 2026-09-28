import { useContext, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { crearEstilosGlobales, ESPACIADO } from '../styles/globalStyles';
import { crearEstilosOcr } from '../styles/OcrScreenStyles';

const RESULTADO_ESCANER = Object.freeze({
  monto: '24580',
  descripcion: [
    'Leche — 2 × $ 1.900 = $ 3.800',
    'Pan lactal — 1 × $ 3.500 = $ 3.500',
    'Frutas de estación — 1 × $ 8.280 = $ 8.280',
    'Yogur natural — 2 × $ 4.500 = $ 9.000',
  ].join('\n'),
  categoriaId: null,
  depositoId: null,
  hora: '18:45',
});

const RESULTADO_GALERIA = Object.freeze({
  monto: '12150',
  descripcion: [
    'Café molido — 1 × $ 5.150 = $ 5.150',
    'Galletitas — 2 × $ 2.000 = $ 4.000',
    'Agua mineral — 3 × $ 1.000 = $ 3.000',
  ].join('\n'),
  categoriaId: null,
  depositoId: null,
  hora: '12:30',
});

export default function PantallaOCR({ navigation: navegacion }) {
  const insets = useSafeAreaInsets();
  const enfocada = useIsFocused();
  const referenciaCamara = useRef(null);
  const [permisoCamara, solicitarPermisoCamara] = useCameraPermissions();
  const { tema } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosMovimiento = crearEstilosEgreso(tema);
  const estilos = crearEstilosOcr(tema);
  const [estado, establecerEstado] = useState('camara');
  const [origen, establecerOrigen] = useState('escaner');
  const [camaraActiva, establecerCamaraActiva] = useState(false);
  const [camaraLista, establecerCamaraLista] = useState(false);
  const [monto, establecerMonto] = useState('');
  const [descripcion, establecerDescripcion] = useState('');
  const [fecha, establecerFecha] = useState(() => new Date());
  const [hora, establecerHora] = useState('18:45');
  const [categoriaId, establecerCategoriaId] = useState(null);
  const [depositoId, establecerDepositoId] = useState(null);
  const [imagenComprobante, establecerImagenComprobante] = useState(null);
  const [comprobanteAdjunto, establecerComprobanteAdjunto] = useState(false);
  const [mensajeError, establecerMensajeError] = useState('');
  const [tituloError, establecerTituloError] = useState('No pudimos leer correctamente el comprobante.');

  useEffect(() => {
    if (!enfocada) {
      establecerCamaraLista(false);
    }
  }, [enfocada]);

  const cargarResultado = (datos, imagen) => {
    establecerMonto(datos.monto);
    establecerDescripcion(datos.descripcion);
    establecerFecha(new Date());
    establecerHora(datos.hora);
    establecerCategoriaId(datos.categoriaId);
    establecerDepositoId(datos.depositoId);
    establecerImagenComprobante(imagen);
    establecerComprobanteAdjunto(true);
  };

  const iniciarProcesamiento = (origenElegido, imagen) => {
    establecerOrigen(origenElegido);
    establecerMensajeError('');
    establecerCamaraActiva(false);
    establecerCamaraLista(false);
    establecerEstado('procesando');
    setTimeout(() => {
      cargarResultado(origenElegido === 'galeria' ? RESULTADO_GALERIA : RESULTADO_ESCANER, imagen);
      establecerEstado('resultado');
    }, 2000);
  };

  const activarCamara = async () => {
    establecerOrigen('escaner');

    try {
      const permiso = permisoCamara?.granted
        ? permisoCamara
        : await solicitarPermisoCamara();

      if (!permiso.granted) {
        establecerOrigen('escaner');
        establecerTituloError('No pudimos acceder a la cámara.');
        establecerMensajeError('Permití el acceso a la cámara para fotografiar el comprobante.');
        establecerEstado('error');
        return;
      }

      establecerOrigen('escaner');
      establecerMensajeError('');
      establecerCamaraLista(false);
      establecerCamaraActiva(true);
    } catch {
      establecerTituloError('No pudimos abrir la cámara.');
      establecerMensajeError('Intentá nuevamente o elegí una imagen de la galería.');
      establecerEstado('error');
    }
  };

  const capturarComprobante = async () => {
    if (!camaraLista || !referenciaCamara.current) {
      return;
    }

    try {
      establecerCamaraLista(false);
      const imagen = await referenciaCamara.current.takePictureAsync({ quality: 1 });
      if (!imagen) {
        return;
      }

      establecerImagenComprobante(imagen);
      iniciarProcesamiento('escaner', imagen);
    } catch {
      establecerCamaraActiva(false);
      establecerCamaraLista(false);
      establecerTituloError('No pudimos tomar la foto.');
      establecerMensajeError('Intentá nuevamente o elegí una imagen de la galería.');
      establecerOrigen('escaner');
      establecerEstado('error');
    }
  };

  const seleccionarComprobante = async () => {
    const camaraEstabaActiva = camaraActiva;
    establecerCamaraActiva(false);
    establecerCamaraLista(false);

    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (resultado.canceled || !resultado.assets?.[0]) {
        establecerCamaraActiva(camaraEstabaActiva);
        return;
      }

      const imagen = resultado.assets[0];
      establecerImagenComprobante(imagen);
      iniciarProcesamiento('galeria', imagen);
    } catch {
      establecerTituloError('No pudimos abrir el comprobante.');
      establecerMensajeError('No pudimos abrir la imagen. Intentá nuevamente.');
      establecerOrigen('galeria');
      establecerEstado('error');
    }
  };

  const manejarErrorMontajeCamara = () => {
    establecerCamaraActiva(false);
    establecerCamaraLista(false);
    establecerOrigen('escaner');
    establecerTituloError('No pudimos abrir la cámara.');
    establecerMensajeError('Intentá nuevamente o elegí una imagen de la galería.');
    establecerEstado('error');
  };

  const volverAEscanear = () => {
    establecerComprobanteAdjunto(false);
    establecerImagenComprobante(null);
    establecerEstado('camara');
    establecerCamaraLista(false);
    establecerCamaraActiva(origen === 'escaner' && permisoCamara?.granted === true);
  };

  const mostrarVistaCamara = camaraActiva && enfocada;

  return (
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Escanear comprobante"
          descripcion="Tomá o elegí una foto del ticket."
          alVolver={() => navegacion.goBack()}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              estilos.contenedorDesplazamiento,
              { paddingBottom: insets.bottom + ESPACIADO.grande },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={estilos.contenido}>
            {estado === 'camara' ? (
              <>
                <View style={estilos.visor}>
                  {mostrarVistaCamara ? (
                    <CameraView
                      active={enfocada}
                      facing="back"
                      onCameraReady={() => establecerCamaraLista(true)}
                      onMountError={manejarErrorMontajeCamara}
                      ref={referenciaCamara}
                      style={estilos.vistaCamara}
                    />
                  ) : null}
                  <View style={estilos.guia}>
                    <View style={[estilos.esquinaGuia, { left: 0, top: 0, borderLeftWidth: 6, borderTopWidth: 6, borderTopLeftRadius: 12 }]} />
                    <View style={[estilos.esquinaGuia, { right: 0, top: 0, borderRightWidth: 6, borderTopWidth: 6, borderTopRightRadius: 12 }]} />
                    <View style={[estilos.esquinaGuia, { left: 0, bottom: 0, borderLeftWidth: 6, borderBottomWidth: 6, borderBottomLeftRadius: 12 }]} />
                    <View style={[estilos.esquinaGuia, { right: 0, bottom: 0, borderRightWidth: 6, borderBottomWidth: 6, borderBottomRightRadius: 12 }]} />
                  </View>
                  {mostrarVistaCamara ? (
                    camaraLista ? (
                      <>
                        <Text style={estilos.textoCamara}>Ubicá el ticket dentro del recuadro.</Text>
                        <Pressable
                          accessibilityLabel="Tomar foto del comprobante"
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !camaraLista }}
                          disabled={!camaraLista}
                          onPress={capturarComprobante}
                          style={estilos.botonCaptura}
                        >
                          <Ionicons color={tema.foco} name="camera" size={32} />
                        </Pressable>
                      </>
                    ) : (
                      <View pointerEvents="none" style={estilos.estadoCamara}>
                        <ActivityIndicator color="#FFFFFF" size="large" />
                        <Text style={estilos.textoVisor}>Preparando cámara...</Text>
                      </View>
                    )
                  ) : (
                    <>
                      <Ionicons color="#FFFFFF" name="receipt-outline" size={40} />
                      <Text style={estilos.textoVisor}>Asegurate de que el ticket se vea completo.</Text>
                    </>
                  )}
                </View>
                <Text style={estilos.instrucciones}>
                  Usá buena luz y evitá sombras o arrugas.
                </Text>
                <View style={estilos.accionesEscaner}>
                  {camaraActiva ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={seleccionarComprobante}
                      style={estilos.botonGaleria}
                    >
                      <Ionicons color={tema.textoPrincipal} name="image-outline" size={22} />
                      <Text style={estilos.textoBotonGaleria}>Galería</Text>
                    </Pressable>
                  ) : (
                    <View style={estilos.filaBotones}>
                      <View style={estilos.botonMitad}>
                        <BotonPrincipal
                          estilosAutenticacion={estilosMovimiento}
                          estilosGlobales={estilosGlobales}
                          titulo="Escanear"
                          alPresionar={activarCamara}
                        />
                      </View>
                      <View style={estilos.botonMitad}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={seleccionarComprobante}
                          style={estilos.botonGaleria}
                        >
                          <Ionicons color={tema.textoPrincipal} name="image-outline" size={22} />
                          <Text style={estilos.textoBotonGaleria}>Galería</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
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
                  onPress={() => {
                    establecerTituloError('No pudimos leer correctamente el comprobante.');
                    establecerMensajeError('Probá con mejor luz o cargá los datos manualmente desde Nuevo egreso.');
                    establecerEstado('error');
                  }}
                  style={estilos.accionSutil}
                >
                  <Text style={estilos.textoAccionSutil}>Simular error de lectura</Text>
                </Pressable>
              </View>
            ) : null}

            {estado === 'resultado' ? (
              <>
                <EntradaMonto
                  tema={tema}
                  estilosGlobales={estilosGlobales}
                  estilosMovimiento={estilosMovimiento}
                  etiqueta="Total del ticket"
                  valor={monto}
                  alCambiarTexto={establecerMonto}
                  alLimpiar={() => establecerMonto('')}
                />
                <View style={estilosMovimiento.grupo}>
                  <View style={estilos.filaEtiqueta}>
                    <Text style={estilosGlobales.etiqueta}>Detalle de productos</Text>
                    <Text style={estilosMovimiento.contador}>{descripcion.length}/500</Text>
                  </View>
                  <View style={[estilosGlobales.campo, estilosMovimiento.filaDescripcion, estilos.descripcionMultilinea]}>
                    <TextInput
                      accessibilityLabel="Detalle de productos del comprobante"
                      maxLength={500}
                      multiline
                      onChangeText={establecerDescripcion}
                      placeholder="Escribí cada producto en una línea"
                      placeholderTextColor={tema.textoSecundario}
                      scrollEnabled
                      selectionColor={tema.foco}
                      style={estilosMovimiento.entradaDescripcion}
                      textAlignVertical="top"
                      value={descripcion}
                    />
                  </View>
                  <Text style={estilos.textoAyudaDescripcion}>
                    Cada producto muestra cantidad, precio unitario y subtotal.
                    Revisá que coincidan con el total.
                  </Text>
                </View>
                {comprobanteAdjunto ? (
                  <View
                    accessibilityLabel="Comprobante adjunto al movimiento"
                    style={estilos.tarjetaComprobante}
                  >
                    <Image
                      accessibilityLabel="Vista previa del comprobante"
                      resizeMode="contain"
                      source={{ uri: imagenComprobante.uri }}
                      style={estilos.vistaPreviaComprobante}
                    />
                    <View style={estilos.datosComprobante}>
                      <Text style={estilos.tituloComprobante}>Comprobante adjunto</Text>
                      <Text numberOfLines={1} style={estilos.nombreComprobante}>
                        {imagenComprobante.fileName || 'comprobante.jpg'}
                      </Text>
                      <Text style={estilos.textoComprobante}>Adjunto a este movimiento.</Text>
                    </View>
                    <Ionicons color={tema.exito} name="checkmark-circle" size={22} />
                  </View>
                ) : null}
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
                <View style={estilosMovimiento.grupo}>
                  <Text style={estilosGlobales.etiqueta}>Fecha y hora</Text>
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
                <Text style={estilosGlobales.textoAyuda}>
                  Revisá los datos y confirmá el egreso. Podés completar lo que el comprobante no informa.
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
                </View>
              </>
            ) : null}

            {estado === 'error' ? (
              <View style={estilos.tarjetaEstado}>
                <Ionicons color={tema.error} name="alert-circle-outline" size={48} />
                <Text style={estilos.tituloEstado}>{tituloError}</Text>
                <Text style={estilos.textoEstado}>
                  {mensajeError || 'Probá con mejor luz o cargá los datos manualmente desde Nuevo egreso.'}
                </Text>
                <BotonPrincipal
                  estilosAutenticacion={estilosMovimiento}
                  estilosGlobales={estilosGlobales}
                  titulo="Intentar nuevamente"
                  alPresionar={() => (
                    imagenComprobante
                      ? iniciarProcesamiento(origen, imagenComprobante)
                      : origen === 'escaner'
                        ? activarCamara()
                        : seleccionarComprobante()
                  )}
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
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
