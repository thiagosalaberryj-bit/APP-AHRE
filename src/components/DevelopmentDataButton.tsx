import BotonAccion from './ActionButton';
import { useContext, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import { prepararDatosPrueba } from '../development/seedDevelopmentData';
import { cargarPreferenciasActuales } from '../profile/profileService';
import { crearEstilosGlobales } from '../styles/globalStyles';
import crearEstilosDatosPrueba from '../styles/DevelopmentDataButtonStyles';

export default function BotonDatosPrueba({ deshabilitado, alCambiarCarga, alEntrar, alAbrirVista }: {
  deshabilitado: boolean;
  alCambiarCarga?: (cargando: boolean) => void;
  alEntrar: () => void;
  alAbrirVista: () => void;
}) {
  const { tema, establecerApariencia } = useContext(ContextoApariencia);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const accionEnCurso = useRef(false);
  const [cargando, establecerCargando] = useState(false);
  const [volumenEnCurso, establecerVolumenEnCurso] = useState(false);
  const estilos = crearEstilosDatosPrueba();
  const estilosGlobales = crearEstilosGlobales(tema);

  const entrar = async (volumenMovimientos = false) => {
    if (!__DEV__ || accionEnCurso.current || deshabilitado) return;
    accionEnCurso.current = true;
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
      console.error('[AHRE] No se pudieron preparar los datos de prueba', { modo: volumenMovimientos ? '10000-movimientos' : 'datos-prueba', etapa, codigo, mensaje, pasoSQLite: detalle?.pasoSQLite });
      mostrarAviso(mensaje, { tipo: 'error' });
    } finally {
      accionEnCurso.current = false;
      establecerCargando(false);
      alCambiarCarga?.(false);
    }
  };

  if (!__DEV__) return null;
  return <View style={estilos.contenedor}>
    <BotonAccion tema={tema} texto={'Entrar con datos de prueba'} variante="secundario" cargando={cargando && !volumenEnCurso} deshabilitado={deshabilitado || cargando} alPresionar={() => entrar()} estilo={[estilosGlobales.botonSecundario,estilos.boton]} etiquetaAccesibilidad="Entrar con datos de prueba"/>
    <BotonAccion tema={tema} texto={'Entrar con 10.000 movimientos'} variante="secundario" cargando={cargando && volumenEnCurso} deshabilitado={deshabilitado || cargando} alPresionar={() => entrar(true)} estilo={[estilosGlobales.botonSecundario,estilos.boton]} etiquetaAccesibilidad="Entrar con 10.000 movimientos"/>
    <Text style={[estilosGlobales.textoAyuda, estilos.texto]}>Vistas de prueba · Solo desarrollo</Text>
    <BotonAccion tema={tema} texto="Recuperar contraseña" variante="secundario"
      deshabilitado={deshabilitado || cargando} alPresionar={alAbrirVista} />
  </View>;
}
