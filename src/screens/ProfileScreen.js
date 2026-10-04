import { useContext, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as AutenticacionLocal from 'expo-local-authentication';
import {
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import Conmutador from '../components/Toggle';
import { RUTAS } from '../constants/routes';
import {
  ErrorPerfil,
  actualizarContrasenaPerfil,
  actualizarPerfil,
  actualizarPreferencias,
  cargarPerfil,
  verificarContrasenaPerfil,
} from '../profile/profileService';
import { cerrarSesion } from '../authentication/sessionService';
import { validarDatosPerfil } from '../utils/authenticationValidation';

import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosPerfil } from '../styles/ProfileScreenStyles';

const IDIOMAS = Object.freeze([
  Object.freeze({ id: 'es', nombre: 'Español', descripcion: 'Textos y formatos en español.', icono: 'chatbox-ellipses-outline' }),
  Object.freeze({ id: 'en', nombre: 'Inglés', descripcion: 'Selección visual para una versión futura.', icono: 'globe-outline' }),
]);

const APARIENCIAS = Object.freeze([
  Object.freeze({ id: 'sistema', nombre: 'Modo del sistema', descripcion: 'Sigue el tema actual del dispositivo.', icono: 'phone-portrait-outline' }),
  Object.freeze({ id: 'claro', nombre: 'Modo claro', descripcion: 'Usa fondos claros en toda AHRE.', icono: 'sunny-outline' }),
  Object.freeze({ id: 'oscuro', nombre: 'Modo oscuro', descripcion: 'Usa fondos oscuros en toda AHRE.', icono: 'moon-outline' }),
]);

const OPCIONES_AVANZADAS_FUTURAS = Object.freeze([
  Object.freeze({ id: 'cuenta-fantasma', nombre: 'Cuenta fantasma', icono: 'eye-off-outline' }),
  Object.freeze({ id: 'seguridad', nombre: 'Seguridad', icono: 'shield-checkmark-outline' }),
  Object.freeze({ id: 'registro', nombre: 'Registro', icono: 'document-text-outline' }),
]);

function EncabezadoModalPerfil({ alCerrar, colorIcono, descripcion, etiquetaCerrar, estilos, icono, tema, titulo }) {
  return (
    <View style={estilos.encabezadoFormularioModal}>
      <View style={estilos.iconoEncabezadoFormularioModal}>
        <Ionicons color={colorIcono ?? tema.foco} name={icono} size={23} />
      </View>
      <View style={estilos.cuerpoEncabezadoFormularioModal}>
        <Text style={estilos.tituloFormularioModal}>{titulo}</Text>
        <Text style={estilos.descripcionFormularioModal}>{descripcion}</Text>
      </View>
      <Pressable
        accessibilityLabel={etiquetaCerrar}
        accessibilityRole="button"
        onPress={alCerrar}
        style={({ pressed: presionado }) => [
          estilos.botonCerrarFormularioModal,
          presionado && estilos.botonCerrarFormularioModalPresionado,
        ]}
      >
        <Ionicons color={tema.textoSecundario} name="close" size={22} />
      </Pressable>
    </View>
  );
}

function obtenerIniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

function formatearFechaRegistro(fecha) {
  if (!fecha || Number.isNaN(new Date(fecha).getTime())) {
    return 'Sin fecha disponible';
  }

  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(fecha));
}

export default function PantallaPerfil({ navigation: navegacion }) {
  const { tema, apariencia, establecerApariencia } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosPerfil(tema);
  const accionPreferenciaEnCurso = useRef(false);
  const [cargandoInfo, establecerCargandoInfo] = useState(true);
  const [errorCarga, establecerErrorCarga] = useState(null);
  const [nombre, establecerNombre] = useState('');
  const [correo, establecerCorreo] = useState('');
  const [fechaRegistro, establecerFechaRegistro] = useState(null);
  const [fotoPerfil, establecerFotoPerfil] = useState(null);
  const [nombreEdicion, establecerNombreEdicion] = useState('');
  const [correoEdicion, establecerCorreoEdicion] = useState('');
  const [modalEdicion, establecerModalEdicion] = useState(false);
  const [modalContrasena, establecerModalContrasena] = useState(false);
  const [contrasenaConfirmacion, establecerContrasenaConfirmacion] = useState('');
  const [errorContrasena, establecerErrorContrasena] = useState(null);
  const [verificandoContrasena, establecerVerificandoContrasena] = useState(false);
  const [verificandoHuella, establecerVerificandoHuella] = useState(false);
  const [mostrarContrasenaConfirmacion, establecerMostrarContrasenaConfirmacion] = useState(false);
  const [modalCambioContrasena, establecerModalCambioContrasena] = useState(false);
  const [contrasenaActualCambio, establecerContrasenaActualCambio] = useState('');
  const [contrasenaNueva, establecerContrasenaNueva] = useState('');
  const [confirmacionContrasenaNueva, establecerConfirmacionContrasenaNueva] = useState('');
  const [mostrarContrasenaActualCambio, establecerMostrarContrasenaActualCambio] = useState(false);
  const [mostrarContrasenaNueva, establecerMostrarContrasenaNueva] = useState(false);
  const [mostrarConfirmacionContrasenaNueva, establecerMostrarConfirmacionContrasenaNueva] = useState(false);
  const [errorCambioContrasena, establecerErrorCambioContrasena] = useState(null);
  const [guardandoContrasena, establecerGuardandoContrasena] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [erroresEdicion, establecerErroresEdicion] = useState({});
  const [idioma, establecerIdioma] = useState('es');
  const [modalIdioma, establecerModalIdioma] = useState(false);
  const [notificaciones, establecerNotificaciones] = useState(true);
  const [modalApariencia, establecerModalApariencia] = useState(false);
  const [modalCierre, establecerModalCierre] = useState(false);
  const [modalAcercaDe, establecerModalAcercaDe] = useState(false);
  const [cerrandoSesion, establecerCerrandoSesion] = useState(false);
  const referenciaCorreoEdicion = useRef(null);
  const referenciaContrasenaNueva = useRef(null);
  const referenciaConfirmacionContrasenaNueva = useRef(null);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarInformacion() {
      establecerCargandoInfo(true);
      establecerErrorCarga(null);
      try {
        const datos = await cargarPerfil();
        if (!componenteActivo) return;
        establecerNombre(datos.usuario.nombre);
        establecerCorreo(datos.usuario.correo_electronico);
        establecerFechaRegistro(datos.usuario.fecha_creacion);
        establecerNombreEdicion(datos.usuario.nombre);
        establecerCorreoEdicion(datos.usuario.correo_electronico);
        establecerIdioma(datos.preferencias.idioma);
        establecerNotificaciones(datos.preferencias.notificaciones_activas);
        establecerApariencia(datos.preferencias.apariencia);
      } catch (error) {
        if (!componenteActivo) return;
        establecerErrorCarga(
          error instanceof ErrorPerfil
            ? error.message
            : 'No se pudo cargar tu perfil. Intentá nuevamente.',
        );
      } finally {
        if (componenteActivo) establecerCargandoInfo(false);
      }
    }

    cargarInformacion();
    return () => {
      componenteActivo = false;
    };
  }, [establecerApariencia]);

  const idiomaActual = IDIOMAS.find((item) => item.id === idioma);
  const aparienciaActual = APARIENCIAS.find((item) => item.id === apariencia);
  const errorEdicion = intentoGuardar ? erroresEdicion.nombre : null;
  const errorCorreoEdicion = intentoGuardar ? erroresEdicion.correo : null;

  const abrirConfirmacionEdicion = () => {
    establecerContrasenaConfirmacion('');
    establecerErrorContrasena(null);
    establecerMostrarContrasenaConfirmacion(false);
    establecerModalContrasena(true);
  };

  const abrirEdicion = () => {
    establecerNombreEdicion(nombre);
    establecerCorreoEdicion(correo);
    establecerContrasenaConfirmacion('');
    establecerErrorContrasena(null);
    establecerIntentoGuardar(false);
    establecerModalContrasena(false);
    establecerModalEdicion(true);
  };

  const confirmarHuella = async () => {
    if (verificandoHuella || verificandoContrasena) return;
    establecerErrorContrasena(null);
    establecerVerificandoHuella(true);
    try {
      const [hayHardware, hayHuellaConfigurada] = await Promise.all([
        AutenticacionLocal.hasHardwareAsync(),
        AutenticacionLocal.isEnrolledAsync(),
      ]);
      if (!hayHardware || !hayHuellaConfigurada) {
        mostrarAviso('No hay una huella configurada en este dispositivo. Podés ingresar tu contraseña.', { tipo: 'informacion' });
        return;
      }

      const resultado = await AutenticacionLocal.authenticateAsync({
        promptMessage: 'Confirmá tu identidad para editar el perfil',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
      });
      if (resultado.success) {
        abrirEdicion();
      } else if (resultado.error !== 'user_cancel' && resultado.error !== 'system_cancel') {
        mostrarAviso('No se pudo verificar la huella. Podés continuar con tu contraseña.', { tipo: 'informacion' });
      }
    } catch {
      mostrarAviso('No se pudo iniciar la verificación biométrica. Podés continuar con tu contraseña.', { tipo: 'error' });
    } finally {
      establecerVerificandoHuella(false);
    }
  };

  const confirmarContrasena = async () => {
    if (verificandoContrasena || verificandoHuella) return;
    if (!contrasenaConfirmacion.trim()) {
      establecerErrorContrasena('Ingresá tu contraseña para continuar.');
      return;
    }

    establecerVerificandoContrasena(true);
    try {
      const contrasenaValida = await verificarContrasenaPerfil(contrasenaConfirmacion);
      if (!contrasenaValida) {
        establecerErrorContrasena('La contraseña no coincide.');
        return;
      }
      abrirEdicion();
    } catch (error) {
      mostrarAviso(
        error instanceof ErrorPerfil
          ? error.message
          : 'No se pudo verificar la contraseña. Intentá nuevamente.',
        { tipo: 'error' },
      );
    } finally {
      establecerVerificandoContrasena(false);
    }
  };

  const abrirCambioContrasena = () => {
    establecerContrasenaActualCambio('');
    establecerContrasenaNueva('');
    establecerConfirmacionContrasenaNueva('');
    establecerErrorCambioContrasena(null);
    establecerMostrarContrasenaActualCambio(false);
    establecerMostrarContrasenaNueva(false);
    establecerMostrarConfirmacionContrasenaNueva(false);
    establecerModalCambioContrasena(true);
  };

  const guardarCambioContrasena = async () => {
    if (guardandoContrasena) return;
    if (!contrasenaActualCambio.trim()) {
      establecerErrorCambioContrasena({ campo: 'actual', mensaje: 'Ingresá tu contraseña actual.' });
      return;
    }
    if (!contrasenaNueva.trim()) {
      establecerErrorCambioContrasena({ campo: 'nueva', mensaje: 'Ingresá una contraseña nueva.' });
      return;
    }
    if (!confirmacionContrasenaNueva.trim()) {
      establecerErrorCambioContrasena({ campo: 'confirmacion', mensaje: 'Repetí la nueva contraseña.' });
      return;
    }
    if (contrasenaNueva !== confirmacionContrasenaNueva) {
      establecerErrorCambioContrasena({ campo: 'confirmacion', mensaje: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    establecerGuardandoContrasena(true);
    try {
      await actualizarContrasenaPerfil(contrasenaActualCambio, contrasenaNueva);
      establecerModalCambioContrasena(false);
      establecerContrasenaActualCambio('');
      establecerContrasenaNueva('');
      establecerConfirmacionContrasenaNueva('');
      mostrarAviso('La contraseña se actualizó y quedó guardada para próximos ingresos.', { tipo: 'exito' });
    } catch (error) {
      if (error instanceof ErrorPerfil && error.errores) {
        const [campo, mensaje] = Object.entries(error.errores)[0] || [];
        establecerErrorCambioContrasena({ campo, mensaje });
      } else {
        mostrarAviso(
          error instanceof ErrorPerfil
            ? error.message
            : 'No se pudo actualizar la contraseña. Intentá nuevamente.',
          { tipo: 'error' },
        );
      }
    } finally {
      establecerGuardandoContrasena(false);
    }
  };

  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso necesario', 'Permití el acceso a tus fotos para seleccionar una imagen de perfil.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!resultado.canceled && resultado.assets?.[0]?.uri) {
        establecerFotoPerfil(resultado.assets[0].uri);
      }
    } catch {
      Alert.alert('No se pudo abrir la galería', 'Intentá seleccionar la foto nuevamente.');
    }
  };

  const quitarFoto = () => establecerFotoPerfil(null);

  const guardarCambios = async () => {
    if (guardando) return;
    const datos = { nombre: nombreEdicion, correo: correoEdicion };
    const nuevosErrores = validarDatosPerfil(datos);
    establecerIntentoGuardar(true);
    establecerErroresEdicion(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const nuevoNombre = nombreEdicion.trim();
    const nuevoCorreo = correoEdicion.trim();
    establecerGuardando(true);
    try {
      await actualizarPerfil(datos);
      establecerNombre(nuevoNombre);
      establecerCorreo(nuevoCorreo);
      establecerModalEdicion(false);
      mostrarAviso('Los datos de tu perfil se guardaron.', { tipo: 'exito' });
    } catch (error) {
      if (error instanceof ErrorPerfil && error.errores) {
        establecerErroresEdicion(error.errores);
        establecerIntentoGuardar(true);
      }
      mostrarAviso(
        error instanceof ErrorPerfil
          ? error.message
          : 'No se pudieron guardar los cambios. Intentá nuevamente.',
        { tipo: 'error' },
      );
    } finally {
      establecerGuardando(false);
    }
  };

  const guardarPreferencia = async (cambios, actualizarEstado, restaurarEstado) => {
    if (accionPreferenciaEnCurso.current) return;
    accionPreferenciaEnCurso.current = true;
    actualizarEstado();
    try {
      await actualizarPreferencias(cambios);
    } catch (error) {
      restaurarEstado();
      mostrarAviso(
        error instanceof ErrorPerfil
          ? error.message
          : 'No se pudo guardar la preferencia. Intentá nuevamente.',
        { tipo: 'error' },
      );
    } finally {
      accionPreferenciaEnCurso.current = false;
    }
  };

  const seleccionarIdioma = (nuevoIdioma) => {
    const idiomaAnterior = idioma;
    establecerModalIdioma(false);
    guardarPreferencia(
      { idioma: nuevoIdioma },
      () => establecerIdioma(nuevoIdioma),
      () => establecerIdioma(idiomaAnterior),
    );
  };

  const cambiarNotificaciones = (nuevoEstado) => {
    const estadoAnterior = notificaciones;
    guardarPreferencia(
      { notificaciones_activas: nuevoEstado },
      () => establecerNotificaciones(nuevoEstado),
      () => establecerNotificaciones(estadoAnterior),
    );
  };

  const seleccionarApariencia = (nuevaApariencia) => {
    const aparienciaAnterior = apariencia;
    establecerModalApariencia(false);
    guardarPreferencia(
      { apariencia: nuevaApariencia },
      () => establecerApariencia(nuevaApariencia),
      () => establecerApariencia(aparienciaAnterior),
    );
  };

  const cerrarSesionLocal = async () => {
    if (cerrandoSesion) return;
    establecerCerrandoSesion(true);
    try {
      await cerrarSesion();
      establecerApariencia('sistema');
      navegacion.reset({ index: 0, routes: [{ name: RUTAS.INICIO_SESION }] });
    } catch (error) {
      mostrarAviso(
        error instanceof ErrorPerfil
          ? error.message
          : 'No se pudo cerrar la sesión local. Intentá nuevamente.',
        { tipo: 'error' },
      );
    } finally {
      establecerCerrandoSesion(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Perfil"
          descripcion="Consultá los datos de tu cuenta y personalizá AHRE a tu gusto."
          alVolver={() => navegacion.goBack()}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={estilos.contenido}>
              {cargandoInfo ? (
                <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                  <View style={estilos.lineaCarga} />
                </View>
              ) : errorCarga ? (
                <View style={[estilosGlobales.tarjeta, estilos.grupo]}>
                  <Text accessibilityRole="alert" style={estilosGlobales.textoError}>{errorCarga}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navegacion.replace(RUTAS.INICIO_SESION)}
                    style={estilosGlobales.botonPrincipal}
                  >
                    <Text style={estilosGlobales.textoBotonPrincipal}>Ir a Login</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Usuario</Text>
                    <View style={estilos.tarjetaUsuario}>
                      <View style={estilos.resumenUsuario}>
                        <View style={estilos.columnaAvatar}>
                          <View style={estilos.avatar}>
                            {fotoPerfil ? (
                              <Image accessibilityLabel={`Foto de perfil de ${nombre}`} source={{ uri: fotoPerfil }} style={estilos.imagenAvatar} />
                            ) : (
                              <Text style={estilos.inicialesAvatar}>{obtenerIniciales(nombre) || 'A'}</Text>
                            )}
                          </View>
                          {fotoPerfil ? (
                            <View style={estilos.accionesFoto}>
                              <Pressable
                                accessibilityLabel="Cambiar foto de perfil"
                                accessibilityRole="button"
                                onPress={seleccionarFoto}
                                style={[estilos.accionFoto, estilos.accionFotoCompacta]}
                              >
                                <Text numberOfLines={1} style={estilos.textoAccionFoto}>Cambiar</Text>
                              </Pressable>
                              <Pressable
                                accessibilityLabel="Quitar foto de perfil"
                                accessibilityRole="button"
                                onPress={quitarFoto}
                                style={[estilos.accionFoto, estilos.accionFotoCompacta]}
                              >
                                <Text numberOfLines={1} style={estilos.textoQuitarFoto}>Quitar</Text>
                              </Pressable>
                            </View>
                          ) : (
                            <Pressable
                              accessibilityLabel="Cambiar foto de perfil"
                              accessibilityRole="button"
                              onPress={seleccionarFoto}
                              style={estilos.accionFoto}
                            >
                              <Text style={estilos.textoAccionFoto}>Cambiar foto</Text>
                            </Pressable>
                          )}
                        </View>
                        <View style={estilos.detalleUsuario}>
                          <View style={estilos.datosUsuario}>
                            <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.nombreUsuario}>{nombre}</Text>
                            <Text style={estilos.correoUsuario}>{correo}</Text>
                          </View>
                          <View style={estilos.fechaRegistro}>
                            <Ionicons color={tema.textoSecundario} name="calendar-outline" size={14} />
                            <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.textoFechaRegistro}>
                              Miembro desde {formatearFechaRegistro(fechaRegistro)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={estilos.separadorOpcion} />
                      <Pressable
                        accessibilityRole="button"
                        onPress={abrirConfirmacionEdicion}
                        style={estilos.filaOpcion}
                      >
                        <View style={estilos.iconoSelector}>
                          <Ionicons color={tema.foco} name="person-outline" size={21} />
                        </View>
                        <Text style={estilos.textoOpcion}>Editar perfil</Text>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Preferencias</Text>
                    <View style={estilos.tarjetaOpciones}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => establecerModalIdioma(true)}
                        style={estilos.filaSelector}
                      >
                        <View style={estilos.iconoSelector}>
                          <Ionicons color={tema.foco} name="language-outline" size={21} />
                        </View>
                        <View style={estilos.contenidoSelector}>
                          <Text style={estilos.textoFilaSelector}>Idioma</Text>
                          <Text style={estilos.valorSelector}>{idiomaActual?.nombre}</Text>
                        </View>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                      <View style={estilos.separadorOpcion} />
                      <View style={estilos.filaSelector}>
                        <View style={estilos.iconoSelector}>
                          <Ionicons color={tema.foco} name="notifications-outline" size={21} />
                        </View>
                        <View style={estilos.contenidoSelector}>
                          <Text style={estilos.textoFilaSelector}>Notificaciones</Text>
                          <Text style={estilos.valorSelector}>{notificaciones ? 'Activadas' : 'Desactivadas'}</Text>
                        </View>
                        <Conmutador
                          tema={tema}
                          valor={notificaciones}
                          alCambiar={cambiarNotificaciones}
                          etiquetaAccesibilidad="Notificaciones"
                        />
                      </View>
                      <View style={estilos.separadorOpcion} />
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => establecerModalApariencia(true)}
                        style={estilos.filaSelector}
                      >
                        <View style={estilos.iconoSelector}>
                          <Ionicons color={tema.foco} name="contrast-outline" size={21} />
                        </View>
                        <View style={estilos.contenidoSelector}>
                          <Text style={estilos.textoFilaSelector}>Apariencia</Text>
                          <Text style={estilos.valorSelector}>{aparienciaActual?.nombre}</Text>
                        </View>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                      <View style={estilos.separadorOpcion} />
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => seleccionarApariencia('sistema')}
                        style={estilos.filaSelector}
                      >
                        <View style={estilos.iconoSelector}>
                          <Ionicons color={tema.foco} name="refresh-outline" size={21} />
                        </View>
                        <View style={estilos.contenidoSelector}>
                          <Text style={estilos.textoFilaSelector}>Restablecer apariencia</Text>
                          <Text style={estilos.valorSelector}>Volver al tema del dispositivo</Text>
                        </View>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Cuenta</Text>
                    <View style={estilos.tarjetaOpciones}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={abrirCambioContrasena}
                        style={estilos.filaOpcion}
                      >
                        <View style={estilos.iconoSelector}>
                          <Ionicons color={tema.foco} name="key-outline" size={21} />
                        </View>
                        <Text style={estilos.textoOpcion}>Cambiar contraseña</Text>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Ajustes avanzados</Text>
                    <View style={estilos.tarjetaOpciones}>
                      {OPCIONES_AVANZADAS_FUTURAS.map((opcion) => (
                        <View key={opcion.id}>
                          <View style={[estilos.filaOpcion, estilos.filaOpcionDeshabilitada]}>
                            <View style={estilos.iconoSelector}>
                              <Ionicons color={tema.textoSecundario} name={opcion.icono} size={21} />
                            </View>
                            <View style={estilos.contenidoOpcionAvanzada}>
                              <Text style={estilos.textoFilaSelector}>{opcion.nombre}</Text>
                              <Text style={estilos.descripcionAvanzada}>Próximamente</Text>
                            </View>
                          </View>
                          <View style={estilos.separadorOpcion} />
                        </View>
                      ))}
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => establecerModalAcercaDe(true)}
                        style={estilos.filaOpcion}
                      >
                        <View style={estilos.iconoSelector}>
                          <Ionicons color={tema.foco} name="information-circle-outline" size={21} />
                        </View>
                        <Text style={estilos.textoOpcion}>Acerca de AHRE</Text>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Sesión</Text>
                    <View style={estilos.tarjetaOpciones}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => establecerModalCierre(true)}
                        style={estilos.filaCerrarSesion}
                      >
                        <View style={estilos.iconoPeligro}>
                          <Ionicons color="#FFFFFF" name="log-out-outline" size={21} />
                        </View>
                        <Text style={estilos.textoOpcionPeligro}>Cerrar sesión</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerModalContrasena(false)}
          transparent
          visible={modalContrasena}
        >
          <Pressable
            accessibilityLabel="Cerrar confirmación de contraseña"
            onPress={() => establecerModalContrasena(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <ScrollView
                contentContainerStyle={estilos.contenidoScrollModal}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={estilos.desplazamientoModal}
              >
                <View style={estilos.formularioModal}>
                  <EncabezadoModalPerfil
                    alCerrar={() => establecerModalContrasena(false)}
                    descripcion="Ingresá tu contraseña y presioná Listo para continuar."
                    etiquetaCerrar="Cerrar confirmación de contraseña"
                    estilos={estilos}
                    icono="shield-checkmark-outline"
                    tema={tema}
                    titulo="Confirmá tu identidad"
                  />
                  <View style={estilos.separadorModal} />
                  <View style={estilos.grupoCampoModal}>
                    <Text style={estilosGlobales.etiqueta}>Contraseña</Text>
                    <View style={[estilos.campoEdicion, errorContrasena ? estilosGlobales.campoError : null]}>
                      <TextInput
                        accessibilityLabel="Contraseña actual"
                        autoCapitalize="none"
                        onChangeText={(valor) => {
                          establecerContrasenaConfirmacion(valor);
                          establecerErrorContrasena(null);
                        }}
                        onSubmitEditing={confirmarContrasena}
                        placeholder="Tu contraseña"
                        placeholderTextColor={tema.textoSecundario}
                        returnKeyType="done"
                        secureTextEntry={!mostrarContrasenaConfirmacion}
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={contrasenaConfirmacion}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={mostrarContrasenaConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onPress={() => establecerMostrarContrasenaConfirmacion((visibilidadActual) => !visibilidadActual)}
                        style={estilos.botonVisibilidad}
                      >
                        <Ionicons
                          color={tema.textoSecundario}
                          name={mostrarContrasenaConfirmacion ? 'eye-off-outline' : 'eye-outline'}
                          size={21}
                        />
                      </Pressable>
                      {verificandoContrasena ? <ActivityIndicator color={tema.foco} size="small" /> : null}
                    </View>
                    {errorContrasena ? (
                      <Text style={estilosGlobales.textoError}>{errorContrasena}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ busy: verificandoHuella, disabled: verificandoHuella || verificandoContrasena }}
                    disabled={verificandoHuella || verificandoContrasena}
                    onPress={confirmarHuella}
                    style={({ pressed: presionado }) => [
                      estilos.botonBiometria,
                      presionado && !verificandoHuella && estilos.botonPresionado,
                      (verificandoHuella || verificandoContrasena) && estilos.botonBiometriaDeshabilitado,
                    ]}
                  >
                    <Ionicons color={tema.foco} name="finger-print-outline" size={23} />
                    <Text style={estilos.textoBotonBiometria}>
                      {verificandoHuella ? 'Verificando huella…' : 'Usar huella'}
                    </Text>
                    {verificandoHuella ? <ActivityIndicator color={tema.foco} size="small" /> : null}
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerModalCambioContrasena(false)}
          transparent
          visible={modalCambioContrasena}
        >
          <Pressable
            accessibilityLabel="Cerrar cambio de contraseña"
            onPress={() => establecerModalCambioContrasena(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <ScrollView
                contentContainerStyle={estilos.contenidoScrollModal}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={estilos.desplazamientoModal}
              >
                <View style={estilos.formularioModal}>
                  <EncabezadoModalPerfil
                    alCerrar={() => establecerModalCambioContrasena(false)}
                    descripcion="Ingresá la actual y elegí una nueva."
                    etiquetaCerrar="Cerrar cambio de contraseña"
                    estilos={estilos}
                    icono="key-outline"
                    tema={tema}
                    titulo="Cambiar contraseña"
                  />
                  <View style={estilos.separadorModal} />
                  <View style={estilos.grupoCampoModal}>
                    <Text style={estilosGlobales.etiqueta}>Contraseña actual</Text>
                    <View style={[estilos.campoEdicion, errorCambioContrasena?.campo === 'actual' && estilosGlobales.campoError]}>
                      <TextInput
                        accessibilityLabel="Contraseña actual"
                        autoCapitalize="none"
                        onChangeText={(valor) => {
                          establecerContrasenaActualCambio(valor);
                          establecerErrorCambioContrasena(null);
                        }}
                        onSubmitEditing={() => referenciaContrasenaNueva.current?.focus()}
                        placeholder="Ingresá tu contraseña actual"
                        placeholderTextColor={tema.textoSecundario}
                        returnKeyType="next"
                        secureTextEntry={!mostrarContrasenaActualCambio}
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={contrasenaActualCambio}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={mostrarContrasenaActualCambio ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                        onPress={() => establecerMostrarContrasenaActualCambio((visibilidadActual) => !visibilidadActual)}
                        style={estilos.botonVisibilidad}
                      >
                        <Ionicons color={tema.textoSecundario} name={mostrarContrasenaActualCambio ? 'eye-off-outline' : 'eye-outline'} size={21} />
                      </Pressable>
                    </View>
                    {errorCambioContrasena?.campo === 'actual' ? <Text style={estilosGlobales.textoError}>{errorCambioContrasena.mensaje}</Text> : null}
                  </View>
                  <View style={estilos.grupoCampoModal}>
                    <Text style={estilosGlobales.etiqueta}>Nueva contraseña</Text>
                    <View style={[estilos.campoEdicion, errorCambioContrasena?.campo === 'nueva' && estilosGlobales.campoError]}>
                      <TextInput
                        accessibilityLabel="Nueva contraseña"
                        autoCapitalize="none"
                        onChangeText={(valor) => {
                          establecerContrasenaNueva(valor);
                          establecerErrorCambioContrasena(null);
                        }}
                        onSubmitEditing={() => referenciaConfirmacionContrasenaNueva.current?.focus()}
                        placeholder="Ingresá una nueva contraseña"
                        placeholderTextColor={tema.textoSecundario}
                        ref={referenciaContrasenaNueva}
                        returnKeyType="next"
                        secureTextEntry={!mostrarContrasenaNueva}
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={contrasenaNueva}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={mostrarContrasenaNueva ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                        onPress={() => establecerMostrarContrasenaNueva((visibilidadActual) => !visibilidadActual)}
                        style={estilos.botonVisibilidad}
                      >
                        <Ionicons color={tema.textoSecundario} name={mostrarContrasenaNueva ? 'eye-off-outline' : 'eye-outline'} size={21} />
                      </Pressable>
                    </View>
                    {errorCambioContrasena?.campo === 'nueva' ? <Text style={estilosGlobales.textoError}>{errorCambioContrasena.mensaje}</Text> : null}
                  </View>
                  <View style={estilos.grupoCampoModal}>
                    <Text style={estilosGlobales.etiqueta}>Confirmar nueva contraseña</Text>
                    <View style={[estilos.campoEdicion, errorCambioContrasena?.campo === 'confirmacion' && estilosGlobales.campoError]}>
                      <TextInput
                        accessibilityLabel="Confirmar nueva contraseña"
                        autoCapitalize="none"
                        onChangeText={(valor) => {
                          establecerConfirmacionContrasenaNueva(valor);
                          establecerErrorCambioContrasena(null);
                        }}
                        onSubmitEditing={guardarCambioContrasena}
                        placeholder="Repetí la nueva contraseña"
                        placeholderTextColor={tema.textoSecundario}
                        ref={referenciaConfirmacionContrasenaNueva}
                        returnKeyType="done"
                        secureTextEntry={!mostrarConfirmacionContrasenaNueva}
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={confirmacionContrasenaNueva}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={mostrarConfirmacionContrasenaNueva ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                        onPress={() => establecerMostrarConfirmacionContrasenaNueva((visibilidadActual) => !visibilidadActual)}
                        style={estilos.botonVisibilidad}
                      >
                        <Ionicons color={tema.textoSecundario} name={mostrarConfirmacionContrasenaNueva ? 'eye-off-outline' : 'eye-outline'} size={21} />
                      </Pressable>
                    </View>
                    {errorCambioContrasena?.campo === 'confirmacion' ? <Text style={estilosGlobales.textoError}>{errorCambioContrasena.mensaje}</Text> : null}
                  </View>
                  <BotonPrincipal
                    estilosAutenticacion={estilos}
                    estilosGlobales={estilosGlobales}
                    titulo="Actualizar contraseña"
                    cargando={guardandoContrasena}
                    alPresionar={guardarCambioContrasena}
                  />
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerModalEdicion(false)}
          transparent
          visible={modalEdicion}
        >
          <Pressable
            accessibilityLabel="Cerrar edición de perfil"
            onPress={() => establecerModalEdicion(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <ScrollView
                contentContainerStyle={estilos.contenidoScrollModal}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={estilos.desplazamientoModal}
              >
                <View style={estilos.formularioModal}>
                  <EncabezadoModalPerfil
                    alCerrar={() => establecerModalEdicion(false)}
                    descripcion="Actualizá el nombre y correo de tu cuenta."
                    etiquetaCerrar="Cerrar edición de perfil"
                    estilos={estilos}
                    icono="person-outline"
                    tema={tema}
                    titulo="Editar perfil"
                  />
                  <View style={estilos.separadorModal} />
                  <View style={estilos.grupoCampoModal}>
                    <Text style={estilosGlobales.etiqueta}>Nombre</Text>
                    <View style={[estilos.campoEdicion, errorEdicion ? estilosGlobales.campoError : null]}>
                      <TextInput
                        accessibilityLabel="Nombre"
                        maxLength={80}
                        onChangeText={(valor) => {
                          establecerNombreEdicion(valor);
                          establecerIntentoGuardar(false);
                        }}
                        onSubmitEditing={() => referenciaCorreoEdicion.current?.focus()}
                        placeholder="Tu nombre"
                        placeholderTextColor={tema.textoSecundario}
                        returnKeyType="next"
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={nombreEdicion}
                      />
                    </View>
                    {errorEdicion ? <Text style={estilosGlobales.textoError}>{errorEdicion}</Text> : null}
                  </View>
                  <View style={estilos.grupoCampoModal}>
                    <Text style={estilosGlobales.etiqueta}>Correo electrónico</Text>
                    <View style={[estilos.campoEdicion, errorCorreoEdicion ? estilosGlobales.campoError : null]}>
                      <TextInput
                        accessibilityLabel="Correo electrónico"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        maxLength={120}
                        onChangeText={(valor) => {
                          establecerCorreoEdicion(valor);
                          establecerIntentoGuardar(false);
                        }}
                        onSubmitEditing={guardarCambios}
                        placeholder="tu@ejemplo.com"
                        placeholderTextColor={tema.textoSecundario}
                        ref={referenciaCorreoEdicion}
                        returnKeyType="done"
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={correoEdicion}
                      />
                    </View>
                    {errorCorreoEdicion ? (
                      <Text style={estilosGlobales.textoError}>{errorCorreoEdicion}</Text>
                    ) : null}
                  </View>
                  <BotonPrincipal
                    estilosAutenticacion={estilos}
                    estilosGlobales={estilosGlobales}
                    titulo="Guardar cambios"
                    cargando={guardando}
                    alPresionar={guardarCambios}
                  />
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerModalIdioma(false)}
          transparent
          visible={modalIdioma}
        >
          <Pressable
            accessibilityLabel="Cerrar selección de idioma"
            onPress={() => establecerModalIdioma(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <EncabezadoModalPerfil
                alCerrar={() => establecerModalIdioma(false)}
                descripcion="Elegí el idioma que querés guardar."
                etiquetaCerrar="Cerrar selección de idioma"
                estilos={estilos}
                icono="language-outline"
                tema={tema}
                titulo="Idioma"
              />
              <View style={estilos.listaOpcionesModal}>
                {IDIOMAS.map((opcion) => {
                  const activo = idioma === opcion.id;
                  return (
                    <View key={opcion.id} style={estilos.contenedorOpcionModal}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: activo }}
                        onPress={() => seleccionarIdioma(opcion.id)}
                        style={[estilos.opcionSelector, activo && estilos.opcionSelectorActiva]}
                      >
                        <View style={[estilos.iconoSelectorModal, activo && estilos.iconoSelectorModalActivo]}>
                          <Ionicons
                            color={activo ? tema.contenedorVerdeTexto : tema.textoSecundario}
                            name={opcion.icono}
                            size={21}
                          />
                        </View>
                        <View style={estilos.contenidoOpcionSelector}>
                          <Text style={estilos.textoOpcionSelector}>{opcion.nombre}</Text>
                          <Text style={estilos.descripcionOpcionSelector}>{opcion.descripcion}</Text>
                        </View>
                        <Ionicons
                          color={activo ? tema.foco : tema.textoSecundario}
                          name={activo ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerModalApariencia(false)}
          transparent
          visible={modalApariencia}
        >
          <Pressable
            accessibilityLabel="Cerrar selección de apariencia"
            onPress={() => establecerModalApariencia(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <EncabezadoModalPerfil
                alCerrar={() => establecerModalApariencia(false)}
                descripcion="Elegí cómo se ve AHRE en este dispositivo."
                etiquetaCerrar="Cerrar selección de apariencia"
                estilos={estilos}
                icono="contrast-outline"
                tema={tema}
                titulo="Apariencia"
              />
              <View style={estilos.listaOpcionesModal}>
                {APARIENCIAS.map((opcion) => {
                  const activo = apariencia === opcion.id;
                  return (
                    <View key={opcion.id} style={estilos.contenedorOpcionModal}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected: activo }}
                        onPress={() => seleccionarApariencia(opcion.id)}
                        style={[estilos.opcionSelector, activo && estilos.opcionSelectorActiva]}
                      >
                        <View style={[estilos.iconoSelectorModal, activo && estilos.iconoSelectorModalActivo]}>
                          <Ionicons
                            color={activo ? tema.contenedorVerdeTexto : tema.textoSecundario}
                            name={opcion.icono}
                            size={21}
                          />
                        </View>
                        <View style={estilos.contenidoOpcionSelector}>
                          <Text style={estilos.textoOpcionSelector}>{opcion.nombre}</Text>
                          <Text style={estilos.descripcionOpcionSelector}>{opcion.descripcion}</Text>
                        </View>
                        <Ionicons
                          color={activo ? tema.foco : tema.textoSecundario}
                          name={activo ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
              <Text style={[estilosGlobales.textoAyuda, estilos.textoAyudaModal]}>
                La selección se guarda en este dispositivo y se aplica en toda AHRE.
              </Text>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerModalAcercaDe(false)}
          transparent
          visible={modalAcercaDe}
        >
          <Pressable
            accessibilityLabel="Cerrar acerca de AHRE"
            onPress={() => establecerModalAcercaDe(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <EncabezadoModalPerfil
                alCerrar={() => establecerModalAcercaDe(false)}
                descripcion="Organizá tus finanzas, registrá movimientos y seguí tus depósitos, incluso sin conexión."
                etiquetaCerrar="Cerrar acerca de AHRE"
                estilos={estilos}
                icono="information-circle-outline"
                tema={tema}
                titulo="Acerca de AHRE"
              />
              <Text style={estilos.valorOpcion}>Versión 1.0.0</Text>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => establecerModalCierre(false)}
          transparent
          visible={modalCierre}
        >
          <Pressable
            accessibilityLabel="Cerrar confirmación"
            onPress={() => establecerModalCierre(false)}
            style={estilos.fondoSuperpuesto}
          >
            <Pressable style={estilos.tarjetaSuperpuesta}>
              <EncabezadoModalPerfil
                alCerrar={() => establecerModalCierre(false)}
                colorIcono={tema.error}
                descripcion="¿Seguro que querés cerrar tu sesión en este dispositivo?"
                etiquetaCerrar="Cerrar confirmación de cierre de sesión"
                estilos={estilos}
                icono="log-out-outline"
                tema={tema}
                titulo="Cerrar sesión"
              />
              <Pressable
                accessibilityRole="button"
                disabled={cerrandoSesion}
                onPress={cerrarSesionLocal}
                style={estilos.botonPeligro}
              >
                <Text style={estilos.textoBotonPeligro}>{cerrandoSesion ? 'Cerrando…' : 'Cerrar sesión'}</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
