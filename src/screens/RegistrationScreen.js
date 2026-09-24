import { useRef, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import ContenedorAutenticacion from '../components/AuthContainer';
import CampoAutenticacion from '../components/AuthInput';
import MensajeError from '../components/ErrorMessage';
import CampoContrasena from '../components/PasswordInput';
import BotonPrincipal from '../components/PrimaryButton';
import { crearEstilosAutenticacion } from '../styles/authStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { TEMAS } from '../styles/colors';

export default function PantallaRegistro({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosAutenticacion = crearEstilosAutenticacion(tema);
  const referenciaCorreo = useRef(null);
  const referenciaContrasena = useRef(null);
  const referenciaConfirmacion = useRef(null);
  const [nombre, establecerNombre] = useState('');
  const [correo, establecerCorreo] = useState('');
  const [contrasena, establecerContrasena] = useState('');
  const [confirmacion, establecerConfirmacion] = useState('');

  return (
    <ContenedorAutenticacion
      tema={tema}
      titulo="Creá tu cuenta"
      descripcion="Un paso más para organizar tu dinero con AHRE."
    >
      <View style={estilosAutenticacion.formulario}>
        <CampoAutenticacion
          estilosAutenticacion={estilosAutenticacion}
          autoCapitalize="words"
          autoComplete="name"
          blurOnSubmit={false}
          estilosGlobales={estilosGlobales}
          icono="person-outline"
          etiqueta="Nombre"
          alCambiarTexto={establecerNombre}
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
          estilosGlobales={estilosGlobales}
          icono="mail-outline"
          keyboardType="email-address"
          etiqueta="Correo electrónico"
          alCambiarTexto={establecerCorreo}
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
          estilosGlobales={estilosGlobales}
          icono="lock-closed-outline"
          etiqueta="Contraseña"
          alCambiarTexto={establecerContrasena}
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
          estilosGlobales={estilosGlobales}
          icono="lock-closed-outline"
          etiqueta="Confirmar contraseña"
          alCambiarTexto={establecerConfirmacion}
          placeholder="Repetí tu contraseña"
          returnKeyType="go"
          textContentType="newPassword"
          valor={confirmacion}
          tema={tema}
        />

        <MensajeError estilosAutenticacion={estilosAutenticacion} tema={tema} />

        <BotonPrincipal
          estilosAutenticacion={estilosAutenticacion}
          estilosGlobales={estilosGlobales}
          alPresionar={() => navegacion.goBack()}
          titulo="Registrarse"
        />

        <View style={estilosAutenticacion.avisoLegal}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            numberOfLines={1}
            style={estilosAutenticacion.textoAvisoLegal}
          >
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
          onPress={() => navegacion.goBack()}
          style={estilosAutenticacion.accionPie}
        >
          <Text style={estilosAutenticacion.textoAccionPie}>Volver a Login</Text>
        </Pressable>
      </View>
    </ContenedorAutenticacion>
  );
}
