import AccionesCierreSesion from '../components/SessionExitActions';
import {useAccionConfirmada} from '../hooks/useConfirmedAction';
import AvisoFormulario from '../components/FormNotice';
import {useFinalizacionAccion} from '../hooks/useActionCompletion';
import {esperarDibujo} from '../utils/renderFrame';
import {conRespuestaVisual} from '../utils/pressFeedback';
import {iniciarOperacionFinanciera} from '../social/financialOperation';
import BotonAccion from '../components/ActionButton';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import PuntosCarga from '../components/LoadingDots';
import ReinicioDatosPerfil from '../components/ProfileDataReset';
import { useErrorNotificado } from '../hooks/useErrorNotice';
import { useRegresoProtegido } from '../navigation/useSafeGoBack';
import { consultarPermisoAvisos, activarAvisosTelefono } from '../notifications/nativeAdapter';
import OpcionNotificacionesPerfil from '../components/ProfileNotificationOption';
import MarcoEncabezado from '../components/ScreenHeaderFrame';
import { DesplazamientoEncabezado } from '../components/HeaderScrollView';
import ModalPerfil from '../components/ProfileModal';
import ListaOpcionesPerfil from '../components/ProfileOptionsList';
import { useContext, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Constantes from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as AutenticacionLocal from 'expo-local-authentication';
import { Alert, AppState, Image, Linking, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
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
import {prepararCambioDispositivo} from '../authentication/authenticationService';
import { validarDatosPerfil } from '../utils/authenticationValidation';

import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosPerfil } from '../styles/ProfileScreenStyles';
import { Preferencias } from '../database/types';

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

function obtenerIniciales(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

function formatearFechaRegistro(fecha: string|number|Date|null) {
  if (!fecha || Number.isNaN(new Date(fecha).getTime())) {
    return 'Sin fecha disponible';
  }

  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(fecha));
}

export default function PantallaPerfil({ navigation: navegacion }: import('../navigation/types').PropiedadesPantalla) {
 const finalizacion=useFinalizacionAccion();

  const [campoEnfocado,cambiarCampoEnfocado]=useState<string|null>(null);
  const bloqueoPerfil=useRef(false);
  const volverProtegido = useRegresoProtegido(navegacion,()=>bloqueoPerfil.current);
  const { tema, apariencia, establecerApariencia } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosPerfil(tema);
  const accionPreferenciaEnCurso = useRef(false);
  const [cargandoInfo, establecerCargandoInfo] = useState(true);
  const [errorCarga, establecerErrorCarga] = useErrorNotificado(null);
  const [nombre, establecerNombre] = useState('');
  const [apellido, establecerApellido] = useState('');
  const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ');
  const [correo, establecerCorreo] = useState('');
  const [fechaRegistro, establecerFechaRegistro] = useState<string | null>(null);
  const [fotoPerfil, establecerFotoPerfil] = useState<string | null>(null);
  const [nombreEdicion, establecerNombreEdicion] = useState('');
  const [apellidoEdicion, establecerApellidoEdicion] = useState('');
  const referenciaApellidoEdicion = useRef<TextInput | null>(null);
  const [correoEdicion, establecerCorreoEdicion] = useState('');
  const [modalEdicion, establecerModalEdicion] = useState(false);
  const [modalContrasena, establecerModalContrasena] = useState(false);
  const [contrasenaConfirmacion, establecerContrasenaConfirmacion] = useState('');
  const [errorContrasena, establecerErrorContrasena] = useState<string | null>(null);
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
  const [errorCambioContrasena, establecerErrorCambioContrasena] = useState<{ campo: string; mensaje: string; } | null>(null);
  const [guardandoContrasena, establecerGuardandoContrasena] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  bloqueoPerfil.current=guardando||guardandoContrasena||verificandoContrasena||verificandoHuella;
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [erroresEdicion, establecerErroresEdicion] = useState<Partial<Record<string, string>>>({});
  const [idioma, establecerIdioma] = useState('es');
  const [modalIdioma, establecerModalIdioma] = useState(false);
  const [notificaciones, establecerNotificaciones] = useState(true);
  const [gestionandoAvisos,establecerGestionandoAvisos]=useState(false);
  const gestionAvisos=useRef(false);
  const [permisoAvisos,establecerPermisoAvisos]=useState('Comprobando permisos');
  useEffect(()=>{let vigente=true;const cargar=()=>{void consultarPermisoAvisos().then(p=>{if(vigente)establecerPermisoAvisos(p);}).catch(()=>{if(vigente)establecerPermisoAvisos('No disponible');});};cargar();const escucha=AppState.addEventListener('change',estado=>{if(estado==='active')cargar();});return()=>{vigente=false;escucha.remove();};},[]);
  const [modalApariencia, establecerModalApariencia] = useState(false);
  const [modalCierre, establecerModalCierre] = useState(false);
  const [modalAcercaDe, establecerModalAcercaDe] = useState(false);
  const cierreSesion=useAccionConfirmada();
  const referenciaCorreoEdicion = useRef<import('react-native').TextInput | null>(null);
  const referenciaContrasenaNueva = useRef<import('react-native').TextInput | null>(null);
  const referenciaConfirmacionContrasenaNueva = useRef<import('react-native').TextInput | null>(null);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarInformacion() {
      establecerCargandoInfo(true);
      establecerErrorCarga(null);
      try {
        const datos = await cargarPerfil();
        if (!componenteActivo) return;
        establecerNombre(datos.usuario.nombre);
        establecerApellido(datos.usuario.apellido || '');
        establecerCorreo(datos.usuario.correo_electronico);
        establecerFechaRegistro(datos.usuario.fecha_creacion);
        establecerNombreEdicion(datos.usuario.nombre);
        establecerApellidoEdicion(datos.usuario.apellido || '');
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
  const errorApellidoEdicion = intentoGuardar ? erroresEdicion.apellido : null;
  const errorCorreoEdicion = intentoGuardar ? erroresEdicion.correo : null;

  const abrirConfirmacionEdicion = () => {
    establecerContrasenaConfirmacion('');
    establecerErrorContrasena(null);
    establecerMostrarContrasenaConfirmacion(false);
    establecerModalContrasena(true);
  };

  const abrirEdicion = () => {
    establecerNombreEdicion(nombre);
    establecerApellidoEdicion(apellido);
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
      } else if (('error' in resultado ? resultado.error : undefined) !== 'user_cancel' && ('error' in resultado ? resultado.error : undefined) !== 'system_cancel') {
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
    if (bloqueoPerfil.current) return;
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

    const liberarContrasena=iniciarOperacionFinanciera();if(!liberarContrasena)return;
    bloqueoPerfil.current=true;finalizacion.iniciar();establecerGuardandoContrasena(true);
    try {
      await actualizarContrasenaPerfil(contrasenaActualCambio, contrasenaNueva);
      if(!await finalizacion.confirmar())return;
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
      liberarContrasena();bloqueoPerfil.current=false;establecerGuardandoContrasena(false);
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
    if (bloqueoPerfil.current) return;
    const datos = { nombre: nombreEdicion, apellido: apellidoEdicion, correo: correoEdicion };
    const nuevosErrores = validarDatosPerfil(datos);
    establecerIntentoGuardar(true);
    establecerErroresEdicion(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const nuevoNombre = nombreEdicion.trim();
    const nuevoCorreo = correoEdicion.trim();
    const liberarAccion=iniciarOperacionFinanciera();if(!liberarAccion)return;
    bloqueoPerfil.current=true;finalizacion.iniciar();establecerGuardando(true);
    try {
      const resultadoPerfil = await actualizarPerfil(datos);
      establecerNombre(nuevoNombre);
      establecerApellido(apellidoEdicion.trim());
      establecerCorreo(nuevoCorreo);
      if(!await finalizacion.confirmar())return;
      establecerModalEdicion(false);
      mostrarAviso(resultadoPerfil.correoModificado
        ? 'Correo guardado en este teléfono. Hasta que el servidor confirme el cambio, usá el correo anterior para ingresar con conexión.'
        : 'Los datos de tu perfil se guardaron.', { tipo: resultadoPerfil.correoModificado ? 'informacion' : 'exito' });
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
      liberarAccion();
      bloqueoPerfil.current=false;establecerGuardando(false);
    }
  };

  const guardarPreferencia = async (cambios: Partial<Omit<Preferencias,"notificaciones_activas">>&{ notificaciones_activas?: boolean; }, actualizarEstado: { (): void; (): void; (): void; (): void; }, restaurarEstado: { (): void; (): void; (): void; (): void; }) => {
    if (accionPreferenciaEnCurso.current) return false;
    accionPreferenciaEnCurso.current = true;
    actualizarEstado();
    try {
      await actualizarPreferencias(cambios);
      return true;
    } catch (error) {
      restaurarEstado();
      mostrarAviso(
        error instanceof ErrorPerfil
          ? error.message
          : 'No se pudo guardar la preferencia. Intentá nuevamente.',
        { tipo: 'error' },
      );
      return false;
    } finally {
      accionPreferenciaEnCurso.current = false;
    }
  };

  const seleccionarIdioma = (nuevoIdioma: 'es'|'en') => {
    const idiomaAnterior = idioma;
    establecerModalIdioma(false);
    guardarPreferencia(
      { idioma: nuevoIdioma },
      () => establecerIdioma(nuevoIdioma),
      () => establecerIdioma(idiomaAnterior),
    );
  };

  const cambiarNotificaciones = async (nuevoEstado: boolean) => {
    if(gestionAvisos.current||accionPreferenciaEnCurso.current)return;
    gestionAvisos.current=true;establecerGestionandoAvisos(true);
    const estadoAnterior = notificaciones;
    try{
    if(nuevoEstado)establecerPermisoAvisos('Comprobando permisos');
    const guardada=await guardarPreferencia(
      { notificaciones_activas: nuevoEstado },
      () => establecerNotificaciones(nuevoEstado),
      () => establecerNotificaciones(estadoAnterior),
    );
    if(nuevoEstado)establecerPermisoAvisos(await (guardada?activarAvisosTelefono():consultarPermisoAvisos()));
    }catch{establecerPermisoAvisos(await consultarPermisoAvisos().catch(()=>'No disponible'));mostrarAviso('No se pudieron abrir los permisos. Probá desde Ajustes del teléfono.',{tipo:'error'});}
    finally{gestionAvisos.current=false;establecerGestionandoAvisos(false);}
  };

  const seleccionarApariencia = async (nuevaApariencia: import('../styles/colors').Apariencia) => {
    const aparienciaAnterior = apariencia;
    establecerModalApariencia(false);
    if(typeof requestAnimationFrame==='function')await esperarDibujo();
    guardarPreferencia(
      { apariencia: nuevaApariencia },
      () => establecerApariencia(nuevaApariencia),
      () => establecerApariencia(aparienciaAnterior),
    );
  };

  const cerrarSesionLocal = async () => {
    try{
      await cierreSesion.ejecutar(cerrarSesion,()=>{establecerApariencia('sistema');navegacion.reset({index:0,routes:[{name:RUTAS.INICIO_SESION}]});},'cerrar');
    }catch(error){mostrarAviso(error instanceof Error?error.message:'No se pudo cerrar la sesión local. Intentá nuevamente.',{tipo:'error'});}
  };
  const cambiarDispositivoLocal=async()=>{
    try{
      await cierreSesion.ejecutar(prepararCambioDispositivo,()=>{establecerApariencia('sistema');navegacion.reset({index:0,routes:[{name:RUTAS.INICIO_SESION}]});},'desvincular');
    }catch(error){mostrarAviso(error instanceof Error?error.message:'No se pudo preparar el cambio de dispositivo.',{tipo:'error'});}
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={estilosGlobales.areaSegura}>
      <MarcoEncabezado style={estilosGlobales.pantalla} tema={tema} encabezado={<EncabezadoSeccion
          tema={tema}
          titulo="Perfil"
          descripcion="Consultá los datos de tu cuenta y personalizá AHRE a tu gusto."
          alVolver={() => volverProtegido()}
        />}>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <DesplazamientoEncabezado keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={estilos.contenido}>
              {cargandoInfo ? null : errorCarga ? (
                <View style={[estilosGlobales.tarjeta, estilos.grupo]}>

                  <BotonAccion completado={finalizacion.completado} tema={tema} texto={"Ir a Login"} variante="principal" cargando={false} deshabilitado={false} alPresionar={() => navegacion.replace(RUTAS.INICIO_SESION)} estilo={estilosGlobales.botonPrincipal} />
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
                              <Image accessibilityLabel={`Foto de perfil de ${nombreCompleto}`} source={{ uri: fotoPerfil }} style={estilos.imagenAvatar} />
                            ) : (
                              <Text style={estilos.inicialesAvatar}>{obtenerIniciales(nombreCompleto) || 'A'}</Text>
                            )}
                          </View>
                          {fotoPerfil ? (
                            <View style={estilos.accionesFoto}>
                              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                                accessibilityLabel="Cambiar foto de perfil"
                                accessibilityRole="button"
                                onPress={conRespuestaVisual(seleccionarFoto)}
                                style={[estilos.accionFoto, estilos.accionFotoCompacta]}
                              >
                                <Text numberOfLines={1} style={estilos.textoAccionFoto}>Cambiar</Text>
                              </Pressable>
                              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                                accessibilityLabel="Quitar foto de perfil"
                                accessibilityRole="button"
                                onPress={conRespuestaVisual(quitarFoto)}
                                style={[estilos.accionFoto, estilos.accionFotoCompacta]}
                              >
                                <Text numberOfLines={1} style={estilos.textoQuitarFoto}>Quitar</Text>
                              </Pressable>
                            </View>
                          ) : (
                            <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                              accessibilityLabel="Cambiar foto de perfil"
                              accessibilityRole="button"
                              onPress={conRespuestaVisual(seleccionarFoto)}
                              style={estilos.accionFoto}
                            >
                              <Text style={estilos.textoAccionFoto}>Cambiar foto</Text>
                            </Pressable>
                          )}
                        </View>
                        <View style={estilos.detalleUsuario}>
                          <View style={estilos.datosUsuario}>
                            <Text ellipsizeMode="tail" numberOfLines={1} style={estilos.nombreUsuario}>{nombreCompleto}</Text>
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
                      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                        accessibilityRole="button"
                        onPress={conRespuestaVisual(abrirConfirmacionEdicion)}
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
                      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                        accessibilityRole="button"
                        onPress={conRespuestaVisual(() => establecerModalIdioma(true))}
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
                      <OpcionNotificacionesPerfil tema={tema} estilos={estilos} preferencia={notificaciones} permiso={permisoAvisos} ocupada={gestionandoAvisos} alCambiar={cambiarNotificaciones}/>
                      <View style={estilos.separadorOpcion} />
                      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                        accessibilityRole="button"
                        onPress={conRespuestaVisual(() => establecerModalApariencia(true))}
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
                      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                        accessibilityRole="button"
                        onPress={conRespuestaVisual(() => seleccionarApariencia('sistema'))}
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
                      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                        accessibilityRole="button"
                        onPress={conRespuestaVisual(abrirCambioContrasena)}
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
                      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                        accessibilityRole="button"
                        onPress={conRespuestaVisual(() => establecerModalAcercaDe(true))}
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
                    <Text style={estilos.tituloGrupo}>Zona de peligro</Text>
                    <View style={estilos.tarjetaOpciones}>
                      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                        accessibilityRole="button"
                        onPress={conRespuestaVisual(() => establecerModalCierre(true))}
                        style={estilos.filaCerrarSesion}
                      >
                        <View style={estilos.iconoPeligro}>
                          <Ionicons color="#FFFFFF" name="log-out-outline" size={21} />
                        </View>
                        <Text style={estilos.textoOpcionPeligro}>Cerrar sesión</Text>
                      </Pressable>
                      <View style={estilos.separadorOpcion} />
                      <ReinicioDatosPerfil navegacion={navegacion} />
                    </View>
                  </View>
                </>
              )}
            </View>
          </DesplazamientoEncabezado>
        </KeyboardAvoidingView>

        <ModalPerfil
          visible={modalContrasena}
          desplazable
          alCerrar={() => establecerModalContrasena(false)}
          descripcion="Ingresá tu contraseña y presioná Listo para continuar."
          etiquetaCerrar="Cerrar confirmación de contraseña"
          estilos={estilos}
          icono="shield-checkmark-outline"
          tema={tema}
          titulo="Confirmá tu identidad"
        >
          <View style={estilos.grupoCampoModal}>
            <Text style={estilosGlobales.etiqueta}>Contraseña</Text>
            <View style={[estilos.campoEdicion, errorContrasena ? estilosGlobales.campoError : null]}>
              <TextInput editable={!bloqueoPerfil.current}
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
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                accessibilityRole="button"
                accessibilityLabel={mostrarContrasenaConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onPress={conRespuestaVisual(() => establecerMostrarContrasenaConfirmacion((visibilidadActual) => !visibilidadActual))}
                style={estilos.botonVisibilidad}
              >
                <Ionicons
                  color={tema.textoSecundario}
                  name={mostrarContrasenaConfirmacion ? 'eye-off-outline' : 'eye-outline'}
                  size={21}
                />
              </Pressable>
              {verificandoContrasena ? <PuntosCarga color={tema.foco} size="small" /> : null}
            </View>
            {errorContrasena ? (
              <Text style={estilosGlobales.textoError}>{errorContrasena}</Text>
            ) : null}
          </View>
          <Pressable android_ripple={RETROALIMENTACION_PULSACION}
            accessibilityRole="button"
            accessibilityState={{ busy: verificandoHuella, disabled: verificandoHuella || verificandoContrasena }}
            disabled={verificandoHuella || verificandoContrasena}
            onPress={conRespuestaVisual(confirmarHuella)}
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
            {verificandoHuella ? <PuntosCarga color={tema.foco} size="small" /> : null}
          </Pressable>
        </ModalPerfil>

        <ModalPerfil
          visible={modalCambioContrasena}
          desplazable
          alCerrar={() => establecerModalCambioContrasena(false)}
          descripcion="Ingresá la actual y elegí una nueva."
          etiquetaCerrar="Cerrar cambio de contraseña"
          estilos={estilos}
          icono="key-outline"
          tema={tema}
          titulo="Cambiar contraseña"
        >
          <View style={estilos.grupoCampoModal}>
            <Text style={estilosGlobales.etiqueta}>Contraseña actual</Text>
            <View style={[estilos.campoEdicion, errorCambioContrasena?.campo === 'actual' && estilosGlobales.campoError]}>
              <TextInput editable={!bloqueoPerfil.current}
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
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                accessibilityRole="button"
                accessibilityLabel={mostrarContrasenaActualCambio ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                onPress={conRespuestaVisual(() => establecerMostrarContrasenaActualCambio((visibilidadActual) => !visibilidadActual))}
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
              <TextInput editable={!bloqueoPerfil.current}
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
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                accessibilityRole="button"
                accessibilityLabel={mostrarContrasenaNueva ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                onPress={conRespuestaVisual(() => establecerMostrarContrasenaNueva((visibilidadActual) => !visibilidadActual))}
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
              <TextInput editable={!bloqueoPerfil.current}
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
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                accessibilityRole="button"
                accessibilityLabel={mostrarConfirmacionContrasenaNueva ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                onPress={conRespuestaVisual(() => establecerMostrarConfirmacionContrasenaNueva((visibilidadActual) => !visibilidadActual))}
                style={estilos.botonVisibilidad}
              >
                <Ionicons color={tema.textoSecundario} name={mostrarConfirmacionContrasenaNueva ? 'eye-off-outline' : 'eye-outline'} size={21} />
              </Pressable>
            </View>
            {errorCambioContrasena?.campo === 'confirmacion' ? <Text style={estilosGlobales.textoError}>{errorCambioContrasena.mensaje}</Text> : null}
          </View>
          <BotonPrincipal completado={finalizacion.completado}
            estilosAutenticacion={estilos}
            estilosGlobales={estilosGlobales}
            titulo="Actualizar contraseña"
            cargando={guardandoContrasena}
            alPresionar={guardarCambioContrasena}
          />
        </ModalPerfil>

        <ModalPerfil
          visible={modalEdicion}
          desplazable
          alCerrar={() => establecerModalEdicion(false)}
          descripcion="Los cambios se guardan en este teléfono y se sincronizan con el servidor. Si cambiás el correo, usá el anterior para ingresar con conexión hasta que se sincronice."
          etiquetaCerrar="Cerrar edición de perfil"
          estilos={estilos}
          icono="person-outline"
          tema={tema}
          titulo="Editar perfil"
        >
          <View style={estilos.grupoCampoModal}>
            <View style={estilosGlobales.encabezadoCampo}>
              <Text style={[estilosGlobales.etiqueta,estilosGlobales.etiquetaCampo]}>Nombre</Text>
              <Text style={estilosGlobales.contadorCampo}>{nombreEdicion.length}/80</Text>
            </View>
            <View style={[estilos.campoEdicion, errorEdicion ? estilosGlobales.campoError : null]}>
              <TextInput editable={!bloqueoPerfil.current}
                accessibilityLabel="Nombre"
                maxLength={80}
                onChangeText={(valor) => {
                  establecerNombreEdicion(valor);
                  establecerIntentoGuardar(false);
                }}
                onSubmitEditing={() => referenciaApellidoEdicion.current?.focus()}
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
            <View style={estilosGlobales.encabezadoCampo}>
              <Text style={[estilosGlobales.etiqueta,estilosGlobales.etiquetaCampo]}>Apellido</Text>
              <Text style={estilosGlobales.contadorCampo}>{apellidoEdicion.length}/80</Text>
            </View>
            <View style={[estilos.campoEdicion, errorApellidoEdicion ? estilosGlobales.campoError : null]}>
              <TextInput ref={referenciaApellidoEdicion} accessibilityLabel="Apellido" autoCapitalize="words" autoComplete="family-name" maxLength={80} editable={!guardando}
                onChangeText={valor=>{establecerApellidoEdicion(valor);establecerIntentoGuardar(false);}}
                onSubmitEditing={()=>referenciaCorreoEdicion.current?.focus()} placeholder="Tu apellido" placeholderTextColor={tema.textoSecundario}
                returnKeyType="next" selectionColor={tema.foco} style={estilos.entradaEdicion} value={apellidoEdicion}/>
            </View>
            {errorApellidoEdicion ? <Text style={estilosGlobales.textoError}>{errorApellidoEdicion}</Text> : null}
          </View>
          <View style={estilos.grupoCampoModal}>
            <View style={estilosGlobales.encabezadoCampo}>
              <Text style={[estilosGlobales.etiqueta,estilosGlobales.etiquetaCampo]}>Correo electrónico</Text>
              <Text style={estilosGlobales.contadorCampo}>{correoEdicion.length}/120</Text>
            </View>
            <View style={[estilos.campoEdicion, errorCorreoEdicion ? estilosGlobales.campoError : null]}>
              <TextInput editable={!bloqueoPerfil.current}
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
          <BotonPrincipal completado={finalizacion.completado}
            estilosAutenticacion={estilos}
            estilosGlobales={estilosGlobales}
            titulo="Guardar cambios"
            cargando={guardando}
            alPresionar={guardarCambios}
          />
        </ModalPerfil>

        <ModalPerfil
          visible={modalIdioma}
          alCerrar={() => establecerModalIdioma(false)}
          descripcion="Elegí el idioma que querés guardar."
          etiquetaCerrar="Cerrar selección de idioma"
          estilos={estilos}
          icono="language-outline"
          tema={tema}
          titulo="Idioma"
        >
          <ListaOpcionesPerfil tema={tema} estilos={estilos} opciones={IDIOMAS} valor={idioma} alSeleccionar={seleccionarIdioma} />
        </ModalPerfil>

        <ModalPerfil
          visible={modalApariencia}
          alCerrar={() => establecerModalApariencia(false)}
          descripcion="Elegí cómo se ve AHRE en este dispositivo."
          etiquetaCerrar="Cerrar selección de apariencia"
          estilos={estilos}
          icono="contrast-outline"
          tema={tema}
          titulo="Apariencia"
        >
          <ListaOpcionesPerfil tema={tema} estilos={estilos} opciones={APARIENCIAS} valor={apariencia} alSeleccionar={seleccionarApariencia} />
          <AvisoFormulario tema={tema} titulo="Dónde se guarda la apariencia">La selección se guarda en este dispositivo y se aplica en toda AHRE.</AvisoFormulario>
        </ModalPerfil>

        <ModalPerfil
          visible={modalAcercaDe}
          alCerrar={() => establecerModalAcercaDe(false)}
          descripcion="Administrador de Historial y Recursos Económicos"
          etiquetaCerrar="Cerrar acerca de AHRE"
          estilos={estilos}
          icono="information-circle-outline"
          tema={tema}
          titulo="Acerca de AHRE"
          desplazable
        >
          <View style={estilos.presentacionAcerca}>
            <View style={estilos.cabeceraAcerca}>
              <Image source={require('../../assets/ahre-mark.png')} style={estilos.marcaAcerca} resizeMode="contain" accessible={false}/>
              <Text style={estilos.tituloAcerca}>{'Tus finanzas,\nmás claras.'}</Text>
            </View>
            <Text style={estilos.descripcionAcerca}>Organizá tu dinero y compartí gastos con otras personas, desde un solo lugar.</Text>
            <View style={estilos.filaVersionAcerca}>
              <Text style={estilos.detalleAcerca}>Versión actual</Text>
              <View style={estilos.versionAcerca}><Text style={estilos.detalleAcerca}>{Constantes.expoConfig?.version ?? 'no disponible'}</Text></View>
            </View>
          </View>
          <View style={estilos.resumenAcerca}>
            {[
              {icono:'wallet-outline' as const,texto:'Ingresos, gastos y depósitos'},
              {icono:'people-outline' as const,texto:'Salas y deudas compartidas'},
              {icono:'phone-portrait-outline' as const,texto:'Tus registros disponibles sin conexión'},
            ].map(({icono,texto})=><View key={icono} style={estilos.filaAcerca}><Ionicons name={icono} size={21} color={tema.foco}/><Text style={estilos.textoAcerca}>{texto}</Text></View>)}
          </View>
          <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="link" accessibilityLabel="Visitar la web de AHRE" accessibilityHint="Abre el sitio de AHRE en el navegador." onPress={conRespuestaVisual(()=>{void Linking.openURL('https://ahre-server.tailc5dfc5.ts.net/').catch(()=>mostrarAviso('No se pudo abrir la web de AHRE. Intentá nuevamente.',{tipo:'error'}));})} style={({pressed:presionado})=>[estilos.enlaceAcerca,presionado&&estilosGlobales.botonDeshabilitado]}>
            <Ionicons name="globe-outline" size={23} color={tema.botonPrincipalTexto}/>
            <Text style={estilos.textoEnlaceAcerca}>Visitar la web de AHRE</Text>
            <Ionicons name="open-outline" size={20} color={tema.botonPrincipalTexto}/>
          </Pressable>
        </ModalPerfil>

        <ModalPerfil
          visible={modalCierre}
          etiquetaCerrarFondo="Cerrar confirmación"
          alCerrar={() => establecerModalCierre(false)}
          colorIcono={tema.error}
          descripcion="Podés cerrar la sesión aquí o sincronizar los pendientes y desvincular esta instalación para usar otra. La desvinculación requiere conexión."
          etiquetaCerrar="Cerrar confirmación de cierre de sesión"
          estilos={estilos}
          icono="log-out-outline"
          tema={tema}
          titulo="Cerrar sesión"
        >
          <AccionesCierreSesion tema={tema} accionActiva={cierreSesion.accionActiva} completado={cierreSesion.completado} alDesvincular={cambiarDispositivoLocal} alCerrarSesion={cerrarSesionLocal} estilo={estilos.botonPeligro}/>
        </ModalPerfil>
      </MarcoEncabezado>
    </SafeAreaView>
  );
}
