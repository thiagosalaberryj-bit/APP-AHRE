import { useContext, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import { prepararDatosPrueba } from '../development/seedDevelopmentData';
import { cargarPreferenciasActuales } from '../profile/profileService';
import { crearEstilosGlobales } from '../styles/globalStyles';
import crearEstilosDatosPrueba from '../styles/DevelopmentDataButtonStyles';

export default function BotonDatosPrueba({ deshabilitado, alCambiarCarga, alEntrar }: {deshabilitado:boolean;alCambiarCarga?:(cargando:boolean)=>void;alEntrar:()=>void}) {
  const { tema, establecerApariencia } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const accionEnCurso = useRef(false);
  const [cargando, establecerCargando] = useState(false);
  const estilos = crearEstilosDatosPrueba();
  const estilosGlobales = crearEstilosGlobales(tema);

  const entrar = async () => {
    if (!__DEV__ || accionEnCurso.current || deshabilitado) return;
    accionEnCurso.current = true;
    establecerCargando(true);
    alCambiarCarga?.(true);
    try {
      await prepararDatosPrueba();
      try {
        const preferencias = await cargarPreferenciasActuales();
        establecerApariencia(preferencias.apariencia);
      } catch {
        mostrarAviso('No se pudo cargar la apariencia de pruebas. Se usará el modo actual.', { tipo: 'informacion' });
      }
      alEntrar();
    } catch (error) {
      mostrarAviso((error instanceof Error ? error.message : "") || 'No se pudieron preparar los datos de prueba.', { tipo: 'error' });
    } finally {
      accionEnCurso.current = false;
      establecerCargando(false);
      alCambiarCarga?.(false);
    }
  };

  if (!__DEV__) return null;
  return <View style={estilos.contenedor}>
    <Pressable accessibilityRole="button" accessibilityLabel="Entrar con datos de prueba"
      accessibilityHint="Abre una cuenta de desarrollo independiente con depósitos y movimientos."
      accessibilityState={{ disabled: deshabilitado || cargando, busy: cargando }}
      disabled={deshabilitado || cargando} onPress={entrar}
      style={[estilosGlobales.botonSecundario, estilos.boton, (deshabilitado || cargando) && estilosGlobales.botonDeshabilitado]}>
      <Ionicons name="flask-outline" size={20} color={deshabilitado || cargando ? tema.deshabilitado : tema.botonSecundarioTexto} />
      <Text style={[deshabilitado || cargando ? estilosGlobales.textoDeshabilitado : estilosGlobales.textoBotonSecundario, estilos.texto]}>{cargando ? 'Preparando datos…' : 'Entrar con datos de prueba'}</Text>
    </Pressable>
    <Text style={[estilosGlobales.textoAyuda, estilos.texto]}>Solo desarrollo · Cuenta independiente</Text>
  </View>;
}
