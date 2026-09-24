import { useRef, useState } from 'react';
import { Animated, Pressable, Text, useColorScheme, View } from 'react-native';

import ContenedorAutenticacion from '../components/AuthContainer';
import CampoAutenticacion from '../components/AuthInput';
import MensajeError from '../components/ErrorMessage';
import CampoContrasena from '../components/PasswordInput';
import BotonPrincipal from '../components/PrimaryButton';
import { RUTAS } from '../constants/routes';
import { crearEstilosAutenticacion } from '../styles/authStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { TEMAS } from '../styles/colors';

export default function PantallaInicioSesion({ navigation: navegacion }) {
  const tema = useColorScheme() === 'dark' ? TEMAS.oscuro : TEMAS.claro;
  const estilosGlobales = crearEstilosGlobales(tema);
  const estilosAutenticacion = crearEstilosAutenticacion(tema);
  const referenciaContrasena = useRef(null);
  const progresoRecordarme = useRef(new Animated.Value(0)).current;
  const [correo, establecerCorreo] = useState('');
  const [contrasena, establecerContrasena] = useState('');
  const [recordarme, establecerRecordarme] = useState(false);
  const moverControlRecordarme = progresoRecordarme.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });
  const colorFondoRecordarme = progresoRecordarme.interpolate({
    inputRange: [0, 1],
    outputRange: [tema.nombre === 'oscuro' ? tema.fondoDeshabilitado : '#D6D6D6', tema.encabezado],
  });
  const colorControlRecordarme = progresoRecordarme.interpolate({
    inputRange: [0, 1],
    outputRange: [tema.nombre === 'oscuro' ? tema.textoSecundario : tema.superficie, tema.botonPrincipal],
  });

  const alternarRecordarme = () => {
    const nuevoEstado = !recordarme;
    establecerRecordarme(nuevoEstado);
    Animated.spring(progresoRecordarme, {
      toValue: nuevoEstado ? 1 : 0,
      damping: 16,
      stiffness: 180,
      useNativeDriver: false,
    }).start();
  };

  return (
    <ContenedorAutenticacion
      tema={tema}
      titulo="Iniciá sesión"
      descripcion="Ingresá a tu espacio y mantené tus finanzas en orden."
    >
      <View style={estilosAutenticacion.formulario}>
        <CampoAutenticacion
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
          estilosGlobales={estilosGlobales}
          icono="lock-closed-outline"
          etiqueta="Contraseña"
          alCambiarTexto={establecerContrasena}
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
            accessibilityState={{ checked: recordarme }}
            onPress={alternarRecordarme}
            style={estilosAutenticacion.recordarme}
          >
              <Animated.View style={[estilosAutenticacion.conmutadorRecordarme, { backgroundColor: colorFondoRecordarme }]}>
              <Animated.View
                style={[
                  estilosAutenticacion.controlConmutadorRecordarme,
                  {
                    backgroundColor: colorControlRecordarme,
                    transform: [{ translateX: moverControlRecordarme }],
                  },
                ]}
              />
            </Animated.View>
            <Text style={estilosAutenticacion.textoRecordarme}>Recordarme</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={estilosAutenticacion.accionRecuperar}>
            <Text style={estilosAutenticacion.textoRecuperar}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        <MensajeError estilosAutenticacion={estilosAutenticacion} tema={tema} />

        <BotonPrincipal
          estilosAutenticacion={estilosAutenticacion}
          estilosGlobales={estilosGlobales}
          alPresionar={() => navegacion.replace(RUTAS.PRINCIPAL)}
          titulo="Iniciar sesión"
        />
      </View>

      <View style={estilosAutenticacion.pie}>
        <Text style={estilosAutenticacion.textoPie}>¿Todavía no tenés una cuenta?</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navegacion.navigate(RUTAS.REGISTRO)}
          style={estilosAutenticacion.accionPie}
        >
          <Text style={estilosAutenticacion.textoAccionPie}>Ir a Registro</Text>
        </Pressable>
      </View>
    </ContenedorAutenticacion>
  );
}
