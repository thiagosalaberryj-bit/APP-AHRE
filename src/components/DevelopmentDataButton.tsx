import { useContext, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
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
  const [volumenEnCurso, establecerVolumenEnCurso] = useState(false);
  const [errorVisible, establecerErrorVisible] = useState('');
  const estilos = crearEstilosDatosPrueba();
  const estilosGlobales = crearEstilosGlobales(tema);

  const entrar = async (volumenMovimientos = false) => {
    if (!__DEV__ || accionEnCurso.current || deshabilitado) return;
    accionEnCurso.current = true;
    establecerErrorVisible('');
    establecerCargando(true);
    establecerVolumenEnCurso(volumenMovimientos);
    alCambiarCarga?.(true);
    try {
      await prepararDatosPrueba({vistaSocialOnline:true,volumenMovimientos});
      try {
        const preferencias = await cargarPreferenciasActuales();
        establecerApariencia(preferencias.apariencia);
      } catch {
        mostrarAviso('No se pudo cargar la apariencia de pruebas. Se usará el modo actual.', { tipo: 'informacion' });
      }
      alEntrar();
    } catch (error) {
      const detalle = error as { message?: unknown; name?: unknown; codigo?: unknown; code?: unknown; etapaDatosPrueba?: unknown; pasoSQLite?: unknown } | null;
      const mensaje = String(detalle?.message || 'No se pudieron preparar los datos de prueba.');
      const etapa = String(detalle?.etapaDatosPrueba || 'entrada-datos-prueba');
      const codigo = String(detalle?.codigo || detalle?.code || detalle?.name || 'sin-codigo');
      const diagnostico = `${mensaje}\n\nEtapa: ${etapa}\nCódigo: ${codigo}${detalle?.pasoSQLite ? '\nSQLite: '+String(detalle.pasoSQLite) : ''}`;
      console.error('[AHRE] No se pudieron preparar los datos de prueba', { modo: volumenMovimientos ? '10000-movimientos' : 'datos-prueba', etapa, codigo, mensaje, pasoSQLite: detalle?.pasoSQLite });
      establecerErrorVisible(diagnostico);
      Alert.alert('Error al preparar datos de prueba', diagnostico);
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
      disabled={deshabilitado || cargando} onPress={() => entrar()}
      style={[estilosGlobales.botonSecundario, estilos.boton, (deshabilitado || cargando) && estilosGlobales.botonDeshabilitado]}>
      <Ionicons name="flask-outline" size={20} color={deshabilitado || cargando ? tema.deshabilitado : tema.botonSecundarioTexto} />
      <Text style={[deshabilitado || cargando ? estilosGlobales.textoDeshabilitado : estilosGlobales.textoBotonSecundario, estilos.texto]}>{cargando && !volumenEnCurso ? 'Preparando datos…' : 'Entrar con datos de prueba'}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Entrar con 10.000 movimientos"
      accessibilityHint="Carga un depósito ficticio en la cuenta local de pruebas, sin sincronizar con el servidor."
      accessibilityState={{ disabled: deshabilitado || cargando, busy: cargando && volumenEnCurso }}
      disabled={deshabilitado || cargando} onPress={() => entrar(true)}
      style={[estilosGlobales.botonSecundario, estilos.boton, (deshabilitado || cargando) && estilosGlobales.botonDeshabilitado]}>
      <Ionicons name="bar-chart-outline" size={20} color={deshabilitado || cargando ? tema.deshabilitado : tema.botonSecundarioTexto} />
      <Text style={[deshabilitado || cargando ? estilosGlobales.textoDeshabilitado : estilosGlobales.textoBotonSecundario, estilos.texto]}>{cargando && volumenEnCurso ? 'Preparando 10.000 movimientos…' : 'Entrar con 10.000 movimientos'}</Text>
    </Pressable>
    <Text style={[estilosGlobales.textoAyuda, estilos.texto]}>Solo desarrollo · Cuenta local independiente</Text>
    {errorVisible ? <Text selectable accessibilityRole="alert" style={estilosGlobales.textoError}>{errorVisible}</Text> : null}
  </View>;
}
