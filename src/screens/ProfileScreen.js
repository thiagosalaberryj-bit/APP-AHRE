import { useContext, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
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
import MensajeError from '../components/ErrorMessage';
import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import Conmutador from '../components/Toggle';

import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosPerfil } from '../styles/ProfileScreenStyles';

const IDIOMAS = Object.freeze([
  Object.freeze({ id: 'es', nombre: 'Español', descripcion: 'Textos y formatos en español.' }),
  Object.freeze({ id: 'en', nombre: 'Inglés', descripcion: 'Selección visual para una versión futura.' }),
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

const FECHA_REGISTRO_SIMULADA = '2026-09-20T12:00:00-03:00';

function obtenerIniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

function formatearFechaRegistro(fecha) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(fecha));
}

export default function PantallaPerfil({ navigation: navegacion }) {
  const { tema, apariencia, establecerApariencia } = useContext(ContextoApariencia);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosPerfil(tema);
  const [cargandoInfo, establecerCargandoInfo] = useState(true);
  const [nombre, establecerNombre] = useState('Thiago Salaberry');
  const [correo, establecerCorreo] = useState('thiago@ejemplo.com');
  const [fotoPerfil, establecerFotoPerfil] = useState(null);
  const [nombreEdicion, establecerNombreEdicion] = useState('Thiago Salaberry');
  const [correoEdicion, establecerCorreoEdicion] = useState('thiago@ejemplo.com');
  const [modalEdicion, establecerModalEdicion] = useState(false);
  const [modalContrasena, establecerModalContrasena] = useState(false);
  const [contrasenaConfirmacion, establecerContrasenaConfirmacion] = useState('');
  const [errorContrasena, establecerErrorContrasena] = useState(null);
  const [modalCambioContrasena, establecerModalCambioContrasena] = useState(false);
  const [contrasenaActualCambio, establecerContrasenaActualCambio] = useState('');
  const [contrasenaNueva, establecerContrasenaNueva] = useState('');
  const [confirmacionContrasenaNueva, establecerConfirmacionContrasenaNueva] = useState('');
  const [contrasenaDemo, establecerContrasenaDemo] = useState('');
  const [errorCambioContrasena, establecerErrorCambioContrasena] = useState(null);
  const [guardandoContrasena, establecerGuardandoContrasena] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [idioma, establecerIdioma] = useState('es');
  const [modalIdioma, establecerModalIdioma] = useState(false);
  const [notificaciones, establecerNotificaciones] = useState(true);
  const [modalApariencia, establecerModalApariencia] = useState(false);
  const [modalCierre, establecerModalCierre] = useState(false);
  const [modalAcercaDe, establecerModalAcercaDe] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => establecerCargandoInfo(false), 1000);
    return () => clearTimeout(temporizador);
  }, []);

  const idiomaActual = IDIOMAS.find((item) => item.id === idioma);
  const aparienciaActual = APARIENCIAS.find((item) => item.id === apariencia);
  const errorEdicion = intentoGuardar && !nombreEdicion.trim() ? 'El nombre es obligatorio.' : null;

  const abrirConfirmacionEdicion = () => {
    establecerContrasenaConfirmacion('');
    establecerErrorContrasena(null);
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

  const confirmarContrasena = () => {
    if (!contrasenaConfirmacion.trim()) {
      establecerErrorContrasena('Ingresá tu contraseña para continuar.');
      return;
    }
    if (contrasenaDemo && contrasenaConfirmacion !== contrasenaDemo) {
      establecerErrorContrasena('La contraseña no coincide.');
      return;
    }
    abrirEdicion();
  };

  const abrirCambioContrasena = () => {
    establecerContrasenaActualCambio('');
    establecerContrasenaNueva('');
    establecerConfirmacionContrasenaNueva('');
    establecerErrorCambioContrasena(null);
    establecerModalCambioContrasena(true);
  };

  const guardarCambioContrasena = () => {
    if (guardandoContrasena) return;
    if (!contrasenaActualCambio.trim() || !contrasenaNueva.trim() || !confirmacionContrasenaNueva.trim()) {
      establecerErrorCambioContrasena('Completá los tres campos para continuar.');
      return;
    }
    if (contrasenaDemo && contrasenaActualCambio !== contrasenaDemo) {
      establecerErrorCambioContrasena('La contraseña actual no coincide.');
      return;
    }
    if (contrasenaNueva !== confirmacionContrasenaNueva) {
      establecerErrorCambioContrasena('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (contrasenaNueva === contrasenaActualCambio) {
      establecerErrorCambioContrasena('Elegí una contraseña distinta de la actual.');
      return;
    }

    establecerGuardandoContrasena(true);
    setTimeout(() => {
      establecerContrasenaDemo(contrasenaNueva);
      establecerGuardandoContrasena(false);
      establecerModalCambioContrasena(false);
      establecerContrasenaActualCambio('');
      establecerContrasenaNueva('');
      establecerConfirmacionContrasenaNueva('');
      Alert.alert('Contraseña actualizada', 'El cambio es de demostración y se conserva solo durante esta sesión.');
    }, 700);
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

  const guardarCambios = () => {
    establecerIntentoGuardar(true);
    if (!nombreEdicion.trim() || guardando) return;
    const nuevoNombre = nombreEdicion.trim();
    const nuevoCorreo = correoEdicion.trim() || correo;
    establecerGuardando(true);
    setTimeout(() => {
      establecerNombre(nuevoNombre);
      establecerCorreo(nuevoCorreo);
      establecerGuardando(false);
      establecerModalEdicion(false);
    }, 1200);
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
              ) : (
                <>
                  <View style={estilos.tarjetaUsuario}>
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
                          Miembro desde {formatearFechaRegistro(FECHA_REGISTRO_SIMULADA)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Usuario</Text>
                    <View style={estilos.tarjetaOpciones}>
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
                          alCambiar={establecerNotificaciones}
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
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => establecerApariencia('sistema')}
                        style={estilos.filaOpcion}
                      >
                        <View style={estilos.iconoSelector}>
                          <Ionicons color={tema.foco} name="refresh-outline" size={21} />
                        </View>
                        <View style={estilos.contenidoOpcionAvanzada}>
                          <Text style={estilos.textoFilaSelector}>Restablecer apariencia</Text>
                          <Text style={estilos.descripcionAvanzada}>Volver al tema del dispositivo</Text>
                        </View>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                      <View style={estilos.separadorOpcion} />
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
              <Text style={estilos.tituloModal}>Confirmá tu contraseña</Text>
              <Text style={estilos.descripcionModal}>
                Ingresá tu contraseña antes de cambiar los datos de la cuenta.
              </Text>
              <View style={estilos.grupo}>
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
                    secureTextEntry
                    selectionColor={tema.foco}
                    style={estilos.entradaEdicion}
                    value={contrasenaConfirmacion}
                  />
                </View>
                {errorContrasena ? (
                  <Text style={estilosGlobales.textoError}>{errorContrasena}</Text>
                ) : null}
              </View>
              <Text style={estilosGlobales.textoAyuda}>
                La autenticación aún no está conectada; esta confirmación es solo local y de demostración.
              </Text>
              <BotonPrincipal
                estilosAutenticacion={estilos}
                estilosGlobales={estilosGlobales}
                titulo="Continuar"
                alPresionar={confirmarContrasena}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => establecerModalContrasena(false)}
                style={estilosGlobales.botonSecundario}
              >
                <Text style={estilosGlobales.textoBotonSecundario}>Cancelar</Text>
              </Pressable>
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
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={estilos.grupo}>
                  <Text style={estilos.tituloModal}>Cambiar contraseña</Text>
                  <View style={estilos.grupo}>
                    <Text style={estilosGlobales.etiqueta}>Contraseña actual</Text>
                    <View style={[estilos.campoEdicion, errorCambioContrasena ? estilosGlobales.campoError : null]}>
                      <TextInput
                        accessibilityLabel="Contraseña actual"
                        autoCapitalize="none"
                        onChangeText={(valor) => {
                          establecerContrasenaActualCambio(valor);
                          establecerErrorCambioContrasena(null);
                        }}
                        placeholder="Ingresá tu contraseña actual"
                        placeholderTextColor={tema.textoSecundario}
                        secureTextEntry
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={contrasenaActualCambio}
                      />
                    </View>
                  </View>
                  <View style={estilos.grupo}>
                    <Text style={estilosGlobales.etiqueta}>Nueva contraseña</Text>
                    <View style={[estilos.campoEdicion, errorCambioContrasena ? estilosGlobales.campoError : null]}>
                      <TextInput
                        accessibilityLabel="Nueva contraseña"
                        autoCapitalize="none"
                        onChangeText={(valor) => {
                          establecerContrasenaNueva(valor);
                          establecerErrorCambioContrasena(null);
                        }}
                        placeholder="Ingresá una nueva contraseña"
                        placeholderTextColor={tema.textoSecundario}
                        secureTextEntry
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={contrasenaNueva}
                      />
                    </View>
                  </View>
                  <View style={estilos.grupo}>
                    <Text style={estilosGlobales.etiqueta}>Confirmar nueva contraseña</Text>
                    <View style={[estilos.campoEdicion, errorCambioContrasena ? estilosGlobales.campoError : null]}>
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
                        returnKeyType="done"
                        secureTextEntry
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={confirmacionContrasenaNueva}
                      />
                    </View>
                  </View>
                  {errorCambioContrasena ? (
                    <Text style={estilosGlobales.textoError}>{errorCambioContrasena}</Text>
                  ) : null}
                  <Text style={estilosGlobales.textoAyuda}>
                    La autenticación aún no está conectada; el cambio es de demostración y dura esta sesión.
                  </Text>
                  <BotonPrincipal
                    estilosAutenticacion={estilos}
                    estilosGlobales={estilosGlobales}
                    titulo="Actualizar contraseña"
                    cargando={guardandoContrasena}
                    alPresionar={guardarCambioContrasena}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => establecerModalCambioContrasena(false)}
                    style={estilosGlobales.botonSecundario}
                  >
                    <Text style={estilosGlobales.textoBotonSecundario}>Cancelar</Text>
                  </Pressable>
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
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={estilos.grupo}>
                  <Text style={estilos.tituloModal}>Editar perfil</Text>
                  <View style={estilos.grupo}>
                    <Text style={estilosGlobales.etiqueta}>Nombre</Text>
                    <View style={[estilos.campoEdicion, errorEdicion ? estilosGlobales.campoError : null]}>
                      <TextInput
                        accessibilityLabel="Nombre"
                        maxLength={80}
                        onChangeText={establecerNombreEdicion}
                        placeholder="Tu nombre"
                        placeholderTextColor={tema.textoSecundario}
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={nombreEdicion}
                      />
                    </View>
                    {errorEdicion ? <Text style={estilosGlobales.textoError}>{errorEdicion}</Text> : null}
                  </View>
                  <View style={estilos.grupo}>
                    <Text style={estilosGlobales.etiqueta}>Correo electrónico</Text>
                    <View style={estilos.campoEdicion}>
                      <TextInput
                        accessibilityLabel="Correo electrónico"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        maxLength={120}
                        onChangeText={establecerCorreoEdicion}
                        placeholder="tu@ejemplo.com"
                        placeholderTextColor={tema.textoSecundario}
                        selectionColor={tema.foco}
                        style={estilos.entradaEdicion}
                        value={correoEdicion}
                      />
                    </View>
                  </View>
                  <MensajeError estilosAutenticacion={estilos} tema={tema}>
                    {errorEdicion}
                  </MensajeError>
                  <BotonPrincipal
                    estilosAutenticacion={estilos}
                    estilosGlobales={estilosGlobales}
                    titulo="Guardar cambios"
                    cargando={guardando}
                    alPresionar={guardarCambios}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => establecerModalEdicion(false)}
                    style={estilosGlobales.botonSecundario}
                  >
                    <Text style={estilosGlobales.textoBotonSecundario}>Cancelar</Text>
                  </Pressable>
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
              <Text style={estilos.tituloModal}>Idioma</Text>
              {IDIOMAS.map((opcion) => {
                const activo = idioma === opcion.id;
                return (
                  <View key={opcion.id}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: activo }}
                      onPress={() => {
                        establecerIdioma(opcion.id);
                        establecerModalIdioma(false);
                      }}
                      style={[estilos.opcionSelector, activo && estilos.opcionSelectorActiva]}
                    >
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
              <Text style={estilos.tituloModal}>Apariencia</Text>
              {APARIENCIAS.map((opcion) => {
                const activo = apariencia === opcion.id;
                return (
                  <View key={opcion.id}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: activo }}
                      onPress={() => {
                        establecerApariencia(opcion.id);
                        establecerModalApariencia(false);
                      }}
                      style={[estilos.opcionSelector, activo && estilos.opcionSelectorActiva]}
                    >
                      <View style={estilos.iconoSelectorModal}>
                        <Ionicons color={activo ? tema.foco : tema.textoSecundario} name={opcion.icono} size={21} />
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
              <Text style={estilosGlobales.textoAyuda}>
                La selección se mantiene mientras AHRE está abierta. Al reiniciar, vuelve al modo del sistema.
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
              <Text style={estilos.tituloModal}>Acerca de AHRE</Text>
              <Text style={estilos.descripcionModal}>
                AHRE te ayuda a organizar tus finanzas personales, registrar movimientos y seguir tus depósitos, incluso sin conexión.
              </Text>
              <Text style={estilos.valorOpcion}>Versión 1.0.0</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => establecerModalAcercaDe(false)}
                style={estilosGlobales.botonSecundario}
              >
                <Text style={estilosGlobales.textoBotonSecundario}>Cerrar</Text>
              </Pressable>
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
              <Text style={estilos.tituloModal}>Cerrar sesión</Text>
              <Text style={estilos.descripcionModal}>¿Seguro que querés cerrar sesión?</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => establecerModalCierre(false)}
                style={estilosGlobales.botonSecundario}
              >
                <Text style={estilosGlobales.textoBotonSecundario}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => establecerModalCierre(false)}
                style={estilos.botonPeligro}
              >
                <Text style={estilos.textoBotonPeligro}>Cerrar sesión</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
