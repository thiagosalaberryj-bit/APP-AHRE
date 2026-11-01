import { SetStateAction, useContext, useEffect, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import FormularioEgresoOcr from '../ocr/OcrExpenseForm';
import ResultadoOcrSocial from '../ocr/OcrSocialResult';
import { eliminarImagenTemporal, OCR_DISPONIBLE, reconocerComprobante } from '../ocr/ocrService';
import { crearEstilosEgreso } from '../styles/expenseStyles';
import { crearEstilosGlobales, ESPACIADO } from '../styles/globalStyles';
import { crearEstilosOcr } from '../styles/OcrScreenStyles';

function calcularMarcoRecorte(imagen: Partial<{uri:string;width:number;height:number;fileName?:string|null}> | null, visor: {width:number;height:number}) {
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

function limitarDesplazamiento(valor: number, limite: number) {
  return Math.max(-limite, Math.min(limite, valor));
}

export default function PantallaOCR({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
  const insets = useSafeAreaInsets();
  const enfocada = useIsFocused();
  const referenciaCamara = useRef<CameraView|null>(null);
  const [permisoCamara, solicitarPermisoCamara] = useCameraPermissions();
  const { tema } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosMovimiento = crearEstilosEgreso(tema);
  const estilos = crearEstilosOcr(tema);
  const [estado, establecerEstado] = useState('camara');
  const [origen, establecerOrigen] = useState('escaner');
  const [camaraActiva, establecerCamaraActiva] = useState(false);
  const [camaraLista, establecerCamaraLista] = useState(false);
  const [imagenPendiente, establecerImagenPendiente] = useState<{uri:string;width:number;height:number;fileName?:string|null}|null>(null);
  const [tamanoVisorRecorte, establecerTamanoVisorRecorte] = useState({ width: 0, height: 0 });
  const [escalaRecorte, establecerEscalaRecorte] = useState(1);
  const [desplazamientoRecorte, establecerDesplazamientoRecorte] = useState({ x: 0, y: 0 });
  const [resultado, establecerResultado] = useState<{ monto: number | null; fecha: string | null; hora: string | null; comercio: string | null; productos: string[]; items: { descripcion: string; monto: number | null; }[]; descripcion: string; candidatosMonto: { monto: number; linea: string; prioridad: number; indice: number; }[]; lineas: string[]; texto: string; duracionMs: number | undefined; ancho: number | undefined; alto: number | undefined; } | null>(null);
  const guardandoEgresoRef = useRef(false);
  const operacionActual = useRef(0);
  const operacionEnCurso = useRef(false);
  const pantallaMontada = useRef(true);
  const imagenesTemporales = useRef(new Set<string>());
  const [imagenComprobante, establecerImagenComprobante] = useState<{uri:string;width:number;height:number;fileName?:string|null} | null>(null);
  const [mensajeError, establecerMensajeError] = useState('');
  const [tituloError, establecerTituloError] = useState('No pudimos leer correctamente el comprobante.');
  const marcoRecorte = calcularMarcoRecorte(imagenPendiente, tamanoVisorRecorte);
  const modeloRecorteRef = useRef<{marco:ReturnType<typeof calcularMarcoRecorte>;escala:number;desplazamiento:{x:number;y:number}}>(null!);
  const desplazamientoInicialRecorte = useRef({ x: 0, y: 0 });
  modeloRecorteRef.current = {
    marco: marcoRecorte,
    escala: escalaRecorte,
    desplazamiento: desplazamientoRecorte,
  };
  const gestosRecorte = useRef<import('react-native').PanResponderInstance | null>(null);
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

  useEffect(() => {
    pantallaMontada.current = true;
    return () => {
      pantallaMontada.current = false;
      operacionActual.current += 1;
      imagenesTemporales.current.forEach((uri) => { eliminarImagenTemporal(uri); });
      imagenesTemporales.current.clear();
    };
  }, []);

  const descartarImagenes = () => {
    imagenesTemporales.current.forEach((uri) => { eliminarImagenTemporal(uri); });
    imagenesTemporales.current.clear();
  };

  const prepararAjusteImagen = async (imagen: {uri:string;width:number;height:number;fileName?:string|null}, origenElegido: SetStateAction<string>) => {
    let ancho = imagen.width;
    let alto = imagen.height;

    if (!ancho || !alto) {
      try {
        const dimensiones = await new Promise<{ width: number; height: number }>((resolver, rechazar: (motivo?:unknown)=>void) => {
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

    if (!pantallaMontada.current) return;
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

  const iniciarProcesamiento = async (origenElegido: string, imagen: {uri:string;width:number;height:number;fileName?:string|null}) => {
    if (operacionEnCurso.current) return;
    operacionEnCurso.current = true;
    const operacion = ++operacionActual.current;
    establecerOrigen(origenElegido);
    establecerMensajeError('');
    establecerImagenComprobante(imagen);
    establecerCamaraActiva(false);
    establecerCamaraLista(false);
    establecerEstado('procesando');
    try {
      const resultadoReconocido = await reconocerComprobante(imagen.uri);
      if (operacionActual.current !== operacion) return;
      establecerResultado(resultadoReconocido);
      establecerEstado('resultado');
    } catch (error) {
      if (operacionActual.current !== operacion) return;
      establecerTituloError('No pudimos leer el comprobante.');
      establecerMensajeError((error instanceof Error ? error.message : "") || 'Probá nuevamente con otra imagen.');
      establecerEstado('error');
    } finally {
      operacionEnCurso.current = false;
    }
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
      if (!pantallaMontada.current) {
        await eliminarImagenTemporal(imagen.uri);
        return;
      }
      imagenesTemporales.current.add(imagen.uri);
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
      if (!pantallaMontada.current) return;

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
    if (operacionEnCurso.current || guardandoEgresoRef.current) return;
    operacionActual.current += 1;
    descartarImagenes();
    establecerResultado(null);
    establecerImagenComprobante(null);
    establecerImagenPendiente(null);
    establecerEstado('camara');
    establecerCamaraLista(false);
    establecerCamaraActiva(origen === 'escaner' && permisoCamara?.granted === true);
  };

  const cancelarAjusteRecorte = () => {
    if (operacionEnCurso.current) return;
    descartarImagenes();
    establecerImagenPendiente(null);
    establecerEstado('camara');
    establecerCamaraLista(false);
    establecerCamaraActiva(permisoCamara?.granted === true);
  };

  const ajustarEscalaRecorte = (cambio: number) => {
    const nuevaEscala = Math.max(1, Math.min(3.5, Math.round((escalaRecorte + cambio) * 100) / 100));
    establecerEscalaRecorte(nuevaEscala);
    establecerDesplazamientoRecorte((actual) => ({
      x: limitarDesplazamiento(actual.x, (marcoRecorte.ancho * (nuevaEscala - 1)) / 2),
      y: limitarDesplazamiento(actual.y, (marcoRecorte.alto * (nuevaEscala - 1)) / 2),
    }));
  };

  const confirmarRecorte = async () => {
    if (operacionEnCurso.current || !imagenPendiente || !marcoRecorte.ancho || !marcoRecorte.alto) {
      return;
    }
    operacionEnCurso.current = true;
    const operacion = ++operacionActual.current;
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
      const contextoImagen = ImageManipulator.ImageManipulator.manipulate(imagenPendiente!.uri);
      contextoImagen.crop({ originX: origenX, originY: origenY, width: ancho, height: alto });
      const imagenProcesada = await contextoImagen.renderAsync();
      const imagenRecortada = await imagenProcesada.saveAsync({
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      if (operacionActual.current !== operacion) {
        await eliminarImagenTemporal(imagenRecortada.uri);
        return;
      }
      imagenesTemporales.current.add(imagenRecortada.uri);
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
      establecerResultado(null);
      operacionEnCurso.current = false;
      iniciarProcesamiento(origen, imagen);
    } catch (error) {
      operacionEnCurso.current = false;
      if (operacionActual.current !== operacion) return;
      establecerTituloError('No pudimos recortar esta foto.');
      establecerMensajeError('Probá con otra foto y verificá que la app instalada incluya el recortador nativo.');
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
          alVolver={() => { if (!guardandoEgresoRef.current) navegacion.goBack(); }}
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
            {estado === 'camara' && !OCR_DISPONIBLE ? (
              <Text accessibilityRole="alert" style={estilosGlobales.textoError}>Para reconocer comprobantes necesitás el APK Android con ML Kit. Expo Go no incluye el motor.</Text>
            ) : null}
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
                  Incluí el comercio, los productos, la fecha y el total dentro del recorte.
                </Text>
                <View
                  onLayout={({ nativeEvent }) => establecerTamanoVisorRecorte({
                    width: nativeEvent.layout.width,
                    height: nativeEvent.layout.height,
                  })}
                  style={estilos.visorRecorte}
                >
                  <View {...gestosRecorte.current!.panHandlers} style={estilos.areaImagenRecorte}>
                    {marcoRecorte.ancho > 0 ? (
                      <Image
                        accessibilityLabel="Foto del comprobante, arrastrá para ajustar el encuadre"
                        resizeMode="stretch"
                        source={{ uri: imagenPendiente!.uri }}
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
                    onPress={() => confirmarRecorte()}
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
                  El procesamiento ocurre en este dispositivo.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navegacion.goBack()}
                  style={estilosGlobales.botonSecundario}
                >
                  <Text style={estilosGlobales.textoBotonSecundario}>Cancelar</Text>
                </Pressable>
              </View>
            ) : null}

            {estado === 'resultado' && resultado ? (
              ruta?.params?.destino === 'social' ? <ResultadoOcrSocial resultado={resultado} salaId={ruta.params.salaId} navegacion={navegacion} tema={tema} estilosGlobales={estilosGlobales} /> : <FormularioEgresoOcr
                resultado={resultado}
                imagen={imagenComprobante}
                navegacion={navegacion}
                tema={tema}
                estilos={estilos}
                estilosGlobales={estilosGlobales}
                estilosMovimiento={estilosMovimiento}
                alVolverAEscanear={volverAEscanear}
                alCambiarGuardado={(valor) => {
                  guardandoEgresoRef.current = valor;
                }}
              />
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
                {imagenPendiente || imagenComprobante ? (
                  <Pressable accessibilityRole="button" onPress={volverAEscanear} style={estilos.botonGaleria}>
                    <Text style={estilos.textoBotonGaleria}>Volver a escanear</Text>
                  </Pressable>
                ) : null}
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
