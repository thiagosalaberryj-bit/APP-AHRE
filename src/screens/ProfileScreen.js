import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MensajeError from '../components/ErrorMessage';
import BotonPrincipal from '../components/PrimaryButton';
import EncabezadoSeccion from '../components/SectionHeader';
import Conmutador from '../components/Toggle';
import { TEMAS } from '../styles/colors';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosPerfil } from '../styles/ProfileScreenStyles';

const IDIOMAS = Object.freeze([
  Object.freeze({ id: 'es', nombre: 'Español' }),
  Object.freeze({ id: 'en', nombre: 'Inglés' }),
]);

const APARIENCIAS = Object.freeze([
  Object.freeze({ id: 'sistema', nombre: 'Modo sistema', icono: 'phone-portrait-outline' }),
  Object.freeze({ id: 'claro', nombre: 'Modo claro', icono: 'sunny-outline' }),
  Object.freeze({ id: 'oscuro', nombre: 'Modo oscuro', icono: 'moon-outline' }),
]);

function obtenerIniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export default function PantallaPerfil({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilos = crearEstilosPerfil(tema);
  const [cargandoInfo, establecerCargandoInfo] = useState(true);
  const [nombre, establecerNombre] = useState('Thiago Salaberry');
  const [correo, establecerCorreo] = useState('thiago@ejemplo.com');
  const [nombreEdicion, establecerNombreEdicion] = useState('Thiago Salaberry');
  const [correoEdicion, establecerCorreoEdicion] = useState('thiago@ejemplo.com');
  const [modalEdicion, establecerModalEdicion] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [intentoGuardar, establecerIntentoGuardar] = useState(false);
  const [idioma, establecerIdioma] = useState('es');
  const [modalIdioma, establecerModalIdioma] = useState(false);
  const [notificaciones, establecerNotificaciones] = useState(true);
  const [apariencia, establecerApariencia] = useState('sistema');
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

  const abrirEdicion = () => {
    establecerNombreEdicion(nombre);
    establecerCorreoEdicion(correo);
    establecerIntentoGuardar(false);
    establecerModalEdicion(true);
  };

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
    <SafeAreaView edges={['top']} style={estilosGlobales.areaSegura}>
      <View style={estilosGlobales.pantalla}>
        <EncabezadoSeccion
          tema={tema}
          titulo="Perfil"
          descripcion="Administra tu información personal y tus preferencias."
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
                    <View style={estilos.avatar}>
                      <Text style={estilos.inicialesAvatar}>{obtenerIniciales(nombre) || 'A'}</Text>
                    </View>
                    <Text style={estilos.nombreUsuario}>{nombre}</Text>
                    <Text style={estilos.correoUsuario}>{correo}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={abrirEdicion}
                      style={estilos.accionFoto}
                    >
                      <Text style={estilos.textoAccionFoto}>Cambiar foto</Text>
                    </Pressable>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Usuario</Text>
                    <View style={estilos.tarjetaOpciones}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={abrirEdicion}
                        style={estilos.filaOpcion}
                      >
                        <Ionicons color={tema.textoSecundario} name="person-outline" size={22} />
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
                        style={estilos.filaOpcion}
                      >
                        <Ionicons color={tema.textoSecundario} name="language-outline" size={22} />
                        <Text style={estilos.textoOpcion}>Idioma</Text>
                        <Text style={estilos.valorOpcion}>{idiomaActual?.nombre}</Text>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                      <View style={estilos.separadorOpcion} />
                      <View style={estilos.filaOpcion}>
                        <Ionicons color={tema.textoSecundario} name="notifications-outline" size={22} />
                        <Text style={estilos.textoOpcion}>Notificaciones</Text>
                        <Text style={estilos.valorOpcion}>{notificaciones ? 'Activadas' : 'Desactivadas'}</Text>
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
                        style={estilos.filaOpcion}
                      >
                        <Ionicons color={tema.textoSecundario} name="contrast-outline" size={22} />
                        <Text style={estilos.textoOpcion}>Apariencia</Text>
                        <Text style={estilos.valorOpcion}>{aparienciaActual?.nombre}</Text>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Cuenta</Text>
                    <View style={estilos.tarjetaOpciones}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => establecerModalCierre(true)}
                        style={estilos.filaOpcion}
                      >
                        <Ionicons color={tema.error} name="log-out-outline" size={22} />
                        <Text style={estilos.textoOpcionPeligro}>Cerrar sesión</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={estilos.grupo}>
                    <Text style={estilos.tituloGrupo}>Avanzado</Text>
                    <View style={estilos.tarjetaOpciones}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => establecerModalAcercaDe(true)}
                        style={estilos.filaOpcion}
                      >
                        <Ionicons color={tema.textoSecundario} name="information-circle-outline" size={22} />
                        <Text style={estilos.textoOpcion}>Acerca de AHRE</Text>
                        <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
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
                  <View style={[estilos.avatar, { alignSelf: 'center' }]}>
                    <Text style={estilos.inicialesAvatar}>{obtenerIniciales(nombreEdicion) || 'A'}</Text>
                  </View>
                  <Pressable accessibilityRole="button" style={estilos.accionFoto}>
                    <Text style={estilos.textoAccionFoto}>Cambiar foto</Text>
                  </Pressable>
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
              {IDIOMAS.map((opcion, indice) => {
                const activo = idioma === opcion.id;
                return (
                  <View key={opcion.id}>
                    {indice > 0 ? <View style={estilos.separadorOpcion} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: activo }}
                      onPress={() => {
                        establecerIdioma(opcion.id);
                        establecerModalIdioma(false);
                      }}
                      style={estilos.opcionIdioma}
                    >
                      <Text style={estilos.textoIdioma}>{opcion.nombre}</Text>
                      <Ionicons
                        color={activo ? tema.foco : tema.textoSecundario}
                        name={activo ? 'checkmark-circle' : 'chevron-forward'}
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
              {APARIENCIAS.map((opcion, indice) => {
                const activo = apariencia === opcion.id;
                return (
                  <View key={opcion.id}>
                    {indice > 0 ? <View style={estilos.separadorOpcion} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: activo }}
                      onPress={() => {
                        establecerApariencia(opcion.id);
                        establecerModalApariencia(false);
                      }}
                      style={estilos.opcionIdioma}
                    >
                      <Ionicons color={tema.textoSecundario} name={opcion.icono} size={22} />
                      <Text style={estilos.textoIdioma}>{opcion.nombre}</Text>
                      <Ionicons
                        color={activo ? tema.foco : tema.textoSecundario}
                        name={activo ? 'checkmark-circle' : 'chevron-forward'}
                        size={22}
                      />
                    </Pressable>
                  </View>
                );
              })}
              <Text style={estilosGlobales.textoAyuda}>
                Modo sistema usa la apariencia del dispositivo. El cambio real de tema lo implementará el líder.
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
                Administrador de Historial y Recursos Económicos. Tus datos permanecen en tu dispositivo (offline-first).
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
