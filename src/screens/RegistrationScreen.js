import { useContext, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import ContenedorAutenticacion from '../components/AuthContainer';
import CampoAutenticacion from '../components/AuthInput';
import CampoContrasena from '../components/PasswordInput';
import BotonPrincipal from '../components/PrimaryButton';
import { registrarUsuario } from '../authentication/authenticationService';
import { RUTAS } from '../constants/routes';
import { validarRegistro } from '../utils/authenticationValidation';
import { crearEstilosAutenticacion } from '../styles/authStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';

export default function PantallaRegistro({ navigation: navegacion }) {
  const { tema } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosAutenticacion = crearEstilosAutenticacion(tema);
  const referenciaCorreo = useRef(null);
  const referenciaContrasena = useRef(null);
  const referenciaConfirmacion = useRef(null);
  const accionEnCurso = useRef(false);
  const [nombre, establecerNombre] = useState('');
  const [correo, establecerCorreo] = useState('');
  const [contrasena, establecerContrasena] = useState('');
  const [confirmacion, establecerConfirmacion] = useState('');
  const [cargando, establecerCargando] = useState(false);
  const [errores, establecerErrores] = useState({});

  const manejarRegistro = async () => {
    if (accionEnCurso.current) return;

    const nuevosErrores = validarRegistro({ nombre, correo, contrasena, confirmacion });
    establecerErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    accionEnCurso.current = true;
    establecerCargando(true);
    try {
      await registrarUsuario({ nombre, correo, contrasena, confirmacion });
      establecerContrasena('');
      establecerConfirmacion('');
      mostrarAviso('Tu cuenta quedó creada. Iniciá sesión para continuar.', { tipo: 'exito' });
      navegacion.reset({
        index: 0,
        routes: [{ name: RUTAS.INICIO_SESION }],
      });
    } catch (error) {
      if (error.detalles) establecerErrores(error.detalles);
      else mostrarAviso(error.message || 'No se pudo crear la cuenta. Intentá nuevamente.', { tipo: 'error' });
    } finally {
      accionEnCurso.current = false;
      establecerCargando(false);
    }
  };

  const cambiarCampo = (campo, setter) => (valor) => {
    setter(valor);
    establecerErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  };

  return (
    <ContenedorAutenticacion tema={tema} titulo="Creá tu cuenta" descripcion="Un paso más para organizar tu dinero con AHRE.">
      <View style={estilosAutenticacion.formulario}>
        <CampoAutenticacion
          estilosAutenticacion={estilosAutenticacion}
          autoCapitalize="words"
          autoComplete="name"
          blurOnSubmit={false}
          deshabilitado={cargando}
          error={errores.nombre}
          estilosGlobales={estilosGlobales}
          icono="person-outline"
          etiqueta="Nombre"
          alCambiarTexto={cambiarCampo('nombre', establecerNombre)}
          onSubmitEditing={() => referenciaCorreo.current?.focus()}
          placeholder="Ingresá tu nombre"
          returnKeyType="next"
          textContentType="name"
          valor={nombre}
          tema={tema}
        />

        <CampoAutenticacion
          ref={referenciaCorreo}
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
          alCambiarTexto={cambiarCampo('correo', establecerCorreo)}
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
          autoComplete="new-password"
          blurOnSubmit={false}
          deshabilitado={cargando}
          error={errores.contrasena}
          estilosGlobales={estilosGlobales}
          icono="lock-closed-outline"
          etiqueta="Contraseña"
          alCambiarTexto={cambiarCampo('contrasena', establecerContrasena)}
          onSubmitEditing={() => referenciaConfirmacion.current?.focus()}
          placeholder="Ingresá tu contraseña"
          returnKeyType="next"
          textContentType="newPassword"
          valor={contrasena}
          tema={tema}
        />

        <CampoContrasena
          ref={referenciaConfirmacion}
          estilosAutenticacion={estilosAutenticacion}
          autoComplete="new-password"
          deshabilitado={cargando}
          error={errores.confirmacion}
          estilosGlobales={estilosGlobales}
          icono="lock-closed-outline"
          etiqueta="Confirmar contraseña"
          alCambiarTexto={cambiarCampo('confirmacion', establecerConfirmacion)}
          onSubmitEditing={manejarRegistro}
          placeholder="Repetí tu contraseña"
          returnKeyType="go"
          textContentType="newPassword"
          valor={confirmacion}
          tema={tema}
        />

        <BotonPrincipal
          estilosAutenticacion={estilosAutenticacion}
          estilosGlobales={estilosGlobales}
          cargando={cargando}
          alPresionar={manejarRegistro}
          titulo="Registrarse"
        />

        <View style={estilosAutenticacion.avisoLegal}>
          <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={estilosAutenticacion.textoAvisoLegal}>
            Al registrarte, aceptás{' '}
            <Text accessibilityRole="link" style={estilosAutenticacion.enlaceLegal}>Términos</Text>
            {' '}y Política de{' '}
            <Text accessibilityRole="link" style={estilosAutenticacion.enlaceLegal}>privacidad</Text>.
          </Text>
        </View>
      </View>

      <View style={estilosAutenticacion.pie}>
        <Text style={estilosAutenticacion.textoPie}>¿Ya tenés una cuenta?</Text>
        <Pressable
          accessibilityRole="button"
          disabled={cargando}
          onPress={() => navegacion.navigate(RUTAS.INICIO_SESION)}
          style={estilosAutenticacion.accionPie}
        >
          <Text style={estilosAutenticacion.textoAccionPie}>Volver a Login</Text>
        </Pressable>
      </View>
    </ContenedorAutenticacion>
  );
}
