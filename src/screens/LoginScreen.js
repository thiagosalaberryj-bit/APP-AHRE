import { useContext, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import ContenedorAutenticacion from '../components/AuthContainer';
import CampoAutenticacion from '../components/AuthInput';
import CampoContrasena from '../components/PasswordInput';
import BotonPrincipal from '../components/PrimaryButton';
import { iniciarSesion } from '../authentication/authenticationService';
import { RUTAS } from '../constants/routes';
import { validarInicioSesion } from '../utils/authenticationValidation';
import { crearEstilosAutenticacion } from '../styles/authStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PantallaInicioSesion({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosAutenticacion = crearEstilosAutenticacion(tema);
  const referenciaContrasena = useRef(null);
  const accionEnCurso = useRef(false);
  const progresoRecordarme = useRef(new Animated.Value(1)).current;
  const [correo, establecerCorreo] = useState('');
  const [contrasena, establecerContrasena] = useState('');
  const [recordarme, establecerRecordarme] = useState(true);
  const [cargando, establecerCargando] = useState(false);
  const [errores, establecerErrores] = useState({});
  const moverControlRecordarme = progresoRecordarme.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const colorFondoRecordarme = progresoRecordarme.interpolate({
    inputRange: [0, 1],
    outputRange: [tema.nombre === 'oscuro' ? tema.fondoDeshabilitado : '#D6D6D6', tema.encabezado],
  });
  const colorControlRecordarme = progresoRecordarme.interpolate({
    inputRange: [0, 1],
    outputRange: [tema.nombre === 'oscuro' ? tema.textoSecundario : tema.superficie, tema.botonPrincipal],
  });

  const alternarRecordarme = () => {
    if (cargando) return;
    const nuevoEstado = !recordarme;
    establecerRecordarme(nuevoEstado);
    Animated.spring(progresoRecordarme, {
      toValue: nuevoEstado ? 1 : 0,
      damping: 16,
      stiffness: 180,
      useNativeDriver: false,
    }).start();
  };

  const manejarInicioSesion = async () => {
    if (accionEnCurso.current) return;

    const nuevosErrores = validarInicioSesion({ correo, contrasena });
    establecerErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    accionEnCurso.current = true;
    establecerCargando(true);
    try {
      await iniciarSesion({ correo, contrasena, recordar: recordarme });
      establecerContrasena('');
      navegacion.reset({ index: 0, routes: [{ name: RUTAS.PRINCIPAL }] });
    } catch (error) {
      if (error.detalles) establecerErrores(error.detalles);
      else mostrarAviso(error.message || 'No se pudo iniciar sesión. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      accionEnCurso.current = false;
      establecerCargando(false);
    }
  };

  const cambiarCorreo = (valor) => {
    establecerCorreo(valor);
    establecerErrores((actuales) => ({ ...actuales, correo: undefined }));
  };

  const cambiarContrasena = (valor) => {
    establecerContrasena(valor);
    establecerErrores((actuales) => ({ ...actuales, contrasena: undefined }));
  };

  return (
    <ContenedorAutenticacion tema={tema} titulo="Iniciá sesión" descripcion="Ingresá a tu espacio y mantené tus finanzas en orden.">
      <View style={estilosAutenticacion.formulario}>
        <CampoAutenticacion
          estilosAutenticacion={estilosAutenticacion}
          autoCapitalize="none"
          autoComplete="email"
          blurOnSubmit={false}
          deshabilitado={cargando}
          error={errores.correo}
          estilosGlobales={estilosGlobales}
          icono="mail-outline"
          keyboardType="email-address"
          etiqueta="Correo electrónico"
          alCambiarTexto={cambiarCorreo}
          onSubmitEditing={() => referenciaContrasena.current?.focus()}
          placeholder="Ingresá tu correo electrónico"
          returnKeyType="next"
          textContentType="emailAddress"
          valor={correo}
          tema={tema}
        />

        <CampoContrasena
          ref={referenciaContrasena}
          estilosAutenticacion={estilosAutenticacion}
          deshabilitado={cargando}
          error={errores.contrasena}
          estilosGlobales={estilosGlobales}
          icono="lock-closed-outline"
          etiqueta="Contraseña"
          alCambiarTexto={cambiarContrasena}
          onSubmitEditing={manejarInicioSesion}
          placeholder="Ingresá tu contraseña"
          returnKeyType="go"
          textContentType="password"
          valor={contrasena}
          tema={tema}
        />

        <View style={estilosAutenticacion.opcionesContrasena}>
          <Pressable
            accessibilityLabel="Recordarme"
            accessibilityRole="switch"
            accessibilityState={{ checked: recordarme, disabled: cargando }}
            disabled={cargando}
            onPress={alternarRecordarme}
            style={estilosAutenticacion.recordarme}
          >
            <Animated.View style={[estilosAutenticacion.conmutadorRecordarme, { backgroundColor: colorFondoRecordarme }]}>
              <Animated.View
                style={[
                  estilosAutenticacion.controlConmutadorRecordarme,
                  { backgroundColor: colorControlRecordarme, transform: [{ translateX: moverControlRecordarme }] },
                ]}
              />
            </Animated.View>
            <Text style={estilosAutenticacion.textoRecordarme}>Recordarme</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={estilosAutenticacion.accionRecuperar}>
            <Text style={estilosAutenticacion.textoRecuperar}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        <BotonPrincipal
          estilosAutenticacion={estilosAutenticacion}
          estilosGlobales={estilosGlobales}
          cargando={cargando}
          alPresionar={manejarInicioSesion}
          titulo="Iniciar sesión"
        />
      </View>

      <View style={estilosAutenticacion.pie}>
        <Text style={estilosAutenticacion.textoPie}>¿Todavía no tenés una cuenta?</Text>
        <Pressable
          accessibilityRole="button"
          disabled={cargando}
          onPress={() => navegacion.navigate(RUTAS.REGISTRO)}
          style={estilosAutenticacion.accionPie}
        >
          <Text style={estilosAutenticacion.textoAccionPie}>Ir a Registro</Text>
        </Pressable>
      </View>
    </ContenedorAutenticacion>
  );
}
