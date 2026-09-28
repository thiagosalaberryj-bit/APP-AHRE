import { useContext, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  PanResponder,
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

function calcularMarcoRecorte(imagen, visor) {
  if (!imagen?.width || !imagen?.height || !visor.width || !visor.height) {
    return { ancho: 0, alto: 0, izquierda: 0, arriba: 0 };
  }

  const proporcion = imagen.width / imagen.height;
  const ancho = Math.min(visor.width * 0.9, visor.height * 0.84 * proporcion);
  const alto = ancho / proporcion;

  return {
    ancho,
    alto,
    izquierda: (visor.width - ancho) / 2,
    arriba: (visor.height - alto) / 2,
  };
}

function limitarDesplazamiento(valor, limite) {
  return Math.max(-limite, Math.min(limite, valor));
}

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
  const [imagenPendiente, establecerImagenPendiente] = useState(null);
  const [tamanoVisorRecorte, establecerTamanoVisorRecorte] = useState({ width: 0, height: 0 });
  const [escalaRecorte, establecerEscalaRecorte] = useState(1);
  const [desplazamientoRecorte, establecerDesplazamientoRecorte] = useState({ x: 0, y: 0 });
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
  const marcoRecorte = calcularMarcoRecorte(imagenPendiente, tamanoVisorRecorte);
  const modeloRecorteRef = useRef(null);
  const desplazamientoInicialRecorte = useRef({ x: 0, y: 0 });
  modeloRecorteRef.current = {
    marco: marcoRecorte,
    escala: escalaRecorte,
    desplazamiento: desplazamientoRecorte,
  };
  const gestosRecorte = useRef(null);
  if (!gestosRecorte.current) {
    gestosRecorte.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        desplazamientoInicialRecorte.current = modeloRecorteRef.current.desplazamiento;
      },
      onPanResponderMove: (_, gesto) => {
        const modelo = modeloRecorteRef.current;
        const limiteX = (modelo.marco.ancho * (modelo.escala - 1)) / 2;
        const limiteY = (modelo.marco.alto * (modelo.escala - 1)) / 2;
        establecerDesplazamientoRecorte({
          x: limitarDesplazamiento(desplazamientoInicialRecorte.current.x + gesto.dx, limiteX),
          y: limitarDesplazamiento(desplazamientoInicialRecorte.current.y + gesto.dy, limiteY),
        });
      },
    });
  }

  useEffect(() => {
    if (!enfocada) {
      establecerCamaraLista(false);
    }
  }, [enfocada]);

  const prepararAjusteImagen = async (imagen, origenElegido) => {
    let ancho = imagen.width;
    let alto = imagen.height;

    if (!ancho || !alto) {
      try {
        const dimensiones = await new Promise((resolver, rechazar) => {
          Image.getSize(imagen.uri, (anchoImagen, altoImagen) => {
            resolver({ width: anchoImagen, height: altoImagen });
          }, rechazar);
        });
        ancho = dimensiones.width;
        alto = dimensiones.height;
      } catch {
        establecerTituloError('No pudimos abrir la foto.');
        establecerMensajeError('Elegí otra imagen o intentá tomar la foto nuevamente.');
        establecerOrigen(origenElegido);
        establecerEstado('error');
        return;
      }
    }

    establecerOrigen(origenElegido);
    establecerImagenPendiente({ ...imagen, width: ancho, height: alto });
    establecerTamanoVisorRecorte({ width: 0, height: 0 });
    establecerEscalaRecorte(1);
    establecerDesplazamientoRecorte({ x: 0, y: 0 });
    establecerMensajeError('');
    establecerCamaraActiva(false);
    establecerCamaraLista(false);
    establecerEstado('recorte');
  };

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
    establecerImagenComprobante(imagen);
    establecerComprobanteAdjunto(true);
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

      await prepararAjusteImagen(imagen, 'escaner');
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
      await prepararAjusteImagen(imagen, 'galeria');
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
    establecerImagenPendiente(null);
    establecerEstado('camara');
    establecerCamaraLista(false);
    establecerCamaraActiva(origen === 'escaner' && permisoCamara?.granted === true);
  };

  const cancelarAjusteRecorte = () => {
    establecerImagenPendiente(null);
    establecerEstado('camara');
    establecerCamaraLista(false);
    establecerCamaraActiva(permisoCamara?.granted === true);
  };

  const ajustarEscalaRecorte = (cambio) => {
    const nuevaEscala = Math.max(1, Math.min(3.5, Math.round((escalaRecorte + cambio) * 100) / 100));
    establecerEscalaRecorte(nuevaEscala);
    establecerDesplazamientoRecorte((actual) => ({
      x: limitarDesplazamiento(actual.x, (marcoRecorte.ancho * (nuevaEscala - 1)) / 2),
      y: limitarDesplazamiento(actual.y, (marcoRecorte.alto * (nuevaEscala - 1)) / 2),
    }));
  };

  const confirmarRecorte = async () => {
    if (!imagenPendiente || !marcoRecorte.ancho || !marcoRecorte.alto) {
      return;
    }

    establecerEstado('procesando');
    try {
      const ancho = Math.max(1, Math.floor(imagenPendiente.width / escalaRecorte));
      const alto = Math.max(1, Math.floor(imagenPendiente.height / escalaRecorte));
      const escalaPantalla = (marcoRecorte.ancho * escalaRecorte) / imagenPendiente.width;
      const origenX = Math.max(0, Math.min(
        imagenPendiente.width - ancho,
        Math.round((imagenPendiente.width - ancho) / 2 - desplazamientoRecorte.x / escalaPantalla),
      ));
      const origenY = Math.max(0, Math.min(
        imagenPendiente.height - alto,
        Math.round((imagenPendiente.height - alto) / 2 - desplazamientoRecorte.y / escalaPantalla),
      ));
      const contextoImagen = ImageManipulator.ImageManipulator.manipulate(imagenPendiente.uri);
      contextoImagen.crop({ originX: origenX, originY: origenY, width: ancho, height: alto });
      const imagenProcesada = await contextoImagen.renderAsync();
      const imagenRecortada = await imagenProcesada.saveAsync({
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      const imagen = {
        ...imagenPendiente,
        uri: imagenRecortada.uri,
        width: imagenRecortada.width,
        height: imagenRecortada.height,
        mimeType: 'image/jpeg',
        fileName: imagenPendiente.fileName
          ? `${imagenPendiente.fileName.replace(/\.[^.]+$/, '')}-recorte.jpg`
          : 'comprobante-recortado.jpg',
      };

      establecerImagenPendiente(null);
      iniciarProcesamiento(origen, imagen);
    } catch (error) {
      const detalleError = error instanceof Error ? error.message : String(error);
      const requiereReconstruccion = /ExpoImageManipulator|native module|is not a function/i.test(detalleError);
      console.error('Error al recortar el comprobante:', error);
      establecerTituloError(requiereReconstruccion
        ? 'Hay que actualizar la app instalada.'
        : 'No pudimos recortar esta foto.');
      establecerMensajeError(requiereReconstruccion
        ? 'El recortador nativo no está incluido en esta versión instalada. Hace falta generar e instalar una compilación nueva de AHRE.'
        : `Probá con otra foto. Detalle técnico: ${detalleError}`);
      establecerEstado('error');
    }
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
                  {mostrarVistaCamara ? (
                    camaraLista ? (
                      <Text style={estilos.textoCamara}>Ubicá el ticket completo en la cámara.</Text>
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
                {camaraActiva ? (
                  <Pressable
                    accessibilityLabel="Tomar foto del comprobante"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !camaraLista }}
                    disabled={!camaraLista}
                    onPress={capturarComprobante}
                    style={[estilos.botonCaptura, !camaraLista && estilos.botonDeshabilitado]}
                  >
                    <Ionicons color={tema.botonPrincipalTexto} name="camera" size={26} />
                    <Text style={estilos.textoBotonCaptura}>
                      {camaraLista ? 'Tomar foto' : 'Preparando cámara...'}
                    </Text>
                  </Pressable>
                ) : null}
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

            {estado === 'recorte' ? (
              <>
                <Text style={estilos.instruccionesRecorte}>
                  Acercá la foto y arrastrala hasta centrar la parte que querés adjuntar.
                </Text>
                <View
                  onLayout={({ nativeEvent }) => establecerTamanoVisorRecorte({
                    width: nativeEvent.layout.width,
                    height: nativeEvent.layout.height,
                  })}
                  style={estilos.visorRecorte}
                >
                  <View {...gestosRecorte.current.panHandlers} style={estilos.areaImagenRecorte}>
                    {marcoRecorte.ancho > 0 ? (
                      <Image
                        accessibilityLabel="Foto del comprobante, arrastrá para ajustar el encuadre"
                        resizeMode="stretch"
                        source={{ uri: imagenPendiente.uri }}
                        style={[
                          estilos.imagenRecorte,
                          {
                            width: marcoRecorte.ancho * escalaRecorte,
                            height: marcoRecorte.alto * escalaRecorte,
                            left: marcoRecorte.izquierda - (marcoRecorte.ancho * (escalaRecorte - 1)) / 2 + desplazamientoRecorte.x,
                            top: marcoRecorte.arriba - (marcoRecorte.alto * (escalaRecorte - 1)) / 2 + desplazamientoRecorte.y,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                  <View
                    pointerEvents="none"
                    style={[
                      estilos.marcoRecorte,
                      {
                        width: marcoRecorte.ancho,
                        height: marcoRecorte.alto,
                        left: marcoRecorte.izquierda,
                        top: marcoRecorte.arriba,
                      },
                    ]}
                  >
                    <View style={estilos.lineaMarcoVertical} />
                    <View style={estilos.lineaMarcoHorizontal} />
                  </View>
                </View>
                <View style={estilos.controlesRecorte}>
                  <Pressable
                    accessibilityLabel="Alejar la foto"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: escalaRecorte <= 1 }}
                    disabled={escalaRecorte <= 1}
                    onPress={() => ajustarEscalaRecorte(-0.25)}
                    style={[estilos.botonZoom, escalaRecorte <= 1 && estilos.botonDeshabilitado]}
                  >
                    <Ionicons color={tema.textoPrincipal} name="remove" size={24} />
                  </Pressable>
                  <Text style={estilos.textoZoom}>{Math.round(escalaRecorte * 100)}%</Text>
                  <Pressable
                    accessibilityLabel="Acercar la foto"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: escalaRecorte >= 3.5 }}
                    disabled={escalaRecorte >= 3.5}
                    onPress={() => ajustarEscalaRecorte(0.25)}
                    style={[estilos.botonZoom, escalaRecorte >= 3.5 && estilos.botonDeshabilitado]}
                  >
                    <Ionicons color={tema.textoPrincipal} name="add" size={24} />
                  </Pressable>
                </View>
                <View style={estilos.accionesEscaner}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={cancelarAjusteRecorte}
                    style={estilos.botonGaleria}
                  >
                    <Ionicons color={tema.textoPrincipal} name="refresh-outline" size={22} />
                    <Text style={estilos.textoBotonGaleria}>Volver a escanear</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Usar el recorte y adjuntar la foto"
                    accessibilityRole="button"
                    disabled={!marcoRecorte.ancho}
                    onPress={confirmarRecorte}
                    style={[estilos.botonUsarRecorte, !marcoRecorte.ancho && estilos.botonDeshabilitado]}
                  >
                    <Ionicons color="#FFFFFF" name="checkmark-circle-outline" size={22} />
                    <Text style={estilos.textoBotonUsarRecorte}>Usar este recorte</Text>
                  </Pressable>
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
                    imagenPendiente
                      ? establecerEstado('recorte')
                      : imagenComprobante
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
