import { useCallback, useContext, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, AppState, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MarcoEncabezado from '../components/ScreenHeaderFrame';
import { DesplazamientoEncabezado } from '../components/HeaderScrollView';
import EncabezadoSeccion from '../components/SectionHeader';
import SelectorSegmentado from '../components/SegmentedSelector';
import Conmutador from '../components/Toggle';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';
import { cargarAjustesAvisos, consultarAvisos, guardarAjustesAvisos, marcarAvisoVisto } from '../notifications/notificationService';
import { NOMBRES_AVISO, TIPOS_AVISO, type AjustesAvisos, type Aviso } from '../notifications/types';
import { consultarCanalesAvisos, consultarPermisoAvisos, solicitarPermisoAvisos } from '../notifications/nativeAdapter';
import { navegarAviso } from '../notifications/notificationNavigation';
import { observarIntegraciones } from '../integrations/integrationStore';
import { sincronizarIntegraciones } from '../integrations/integrationSync';

export default function PantallaNotificaciones({ navigation: navegacion }: import('../navigation/types').PropiedadesPantalla) {
  const { tema } = useContext(ContextoApariencia), { bottom } = useSafeAreaInsets();
  const g = crearEstilosGlobales(tema), e = crearEstilosNotificaciones(tema, bottom);
  const [filtro, establecerFiltro] = useState<'todas' | 'pendientes' | 'no_vistas'>('todas');
  const [limite, establecerLimite] = useState(30), [vista, establecerVista] = useState<{ avisos: Aviso[]; total: number; noVistas: number }>({ avisos: [], total: 0, noVistas: 0 });
  const [ajustes, establecerAjustes] = useState<AjustesAvisos | null>(null), [permiso, establecerPermiso] = useState('Comprobando permisos');
  const [canales, establecerCanales] = useState<Record<string, boolean>>({});
  const [cargando, establecerCargando] = useState(true), [error, establecerError] = useState(''), [guardando, establecerGuardando] = useState(false);
  useEffect(() => {
    let activa = true;
    const cargar = () => { void Promise.all([consultarPermisoAvisos(), consultarCanalesAvisos()]).then(([p, c]) => { if (activa) { establecerPermiso(p); establecerCanales(c); } }).catch(() => {}); };
    cargar(); const escucha = AppState.addEventListener('change', estado => { if (estado === 'active') cargar(); });
    return () => { activa = false; escucha.remove(); };
  }, []);
  useFocusEffect(useCallback(() => {
    let activa = true;
    const cargar = () => { void consultarAvisos(filtro, limite).then(v => { if (activa) { establecerVista(v); establecerCargando(false); } }).catch(err => { if (activa) { establecerError(err instanceof Error ? err.message : 'No se pudo cargar el historial.'); establecerCargando(false); } }); };
    cargar(); void consultarPermisoAvisos().then(v => { if (activa) establecerPermiso(v); });
    const dejar = observarIntegraciones(cargar); return () => { activa = false; dejar(); };
  }, [filtro, limite]));
  const abrir = async (aviso: Aviso) => { await marcarAvisoVisto(aviso.id); navegarAviso(navegacion, aviso.destino); };
  const guardar = async () => { if (!ajustes || guardando) return; establecerGuardando(true); try { await guardarAjustesAvisos(ajustes); establecerAjustes(null); } catch (err) { Alert.alert('Revisá los ajustes', err instanceof Error ? err.message : 'No se pudieron guardar.'); } finally { establecerGuardando(false); } };
  return <SafeAreaView edges={['top']} style={g.areaSegura}>
    <MarcoEncabezado style={g.pantalla} tema={tema} encabezado={<EncabezadoSeccion tema={tema} titulo="Notificaciones" descripcion="Tus avisos, recordatorios y pendientes." alVolver={() => navegacion.goBack()} />}>
      <DesplazamientoEncabezado contentContainerStyle={e.contenido}>
        <View style={e.filaEncabezado}><Text style={e.textoNuevas}>{vista.noVistas ? `${vista.noVistas} sin ver` : 'Estás al día'}</Text><Pressable style={e.botonAjustes} accessibilityRole="button" accessibilityLabel="Ajustes de notificaciones" onPress={() => { void cargarAjustesAvisos().then(establecerAjustes); }}><Ionicons name="settings-outline" color={tema.textoPrincipal} size={22} /></Pressable></View>
        <SelectorSegmentado tema={tema} opciones={[{ id: 'todas', nombre: 'Todas' }, { id: 'pendientes', nombre: 'Pendientes' }, { id: 'no_vistas', nombre: 'No vistas' }]} valor={filtro} alSeleccionar={v => { establecerFiltro(v as typeof filtro); establecerLimite(30); }} etiqueta="Filtrar notificaciones" />
        <Text style={g.textoAyuda}>Avisos del teléfono: {permiso}. El historial sigue disponible aunque los desactives.</Text>
        <Pressable accessibilityRole="button" style={g.botonSecundario} onPress={() => { establecerError(''); void sincronizarIntegraciones().catch(() => establecerError('No se pudo actualizar. Conservamos el historial guardado.')); }}><Text style={g.textoBotonSecundario}>Actualizar historial</Text></Pressable>
        {error ? <Text accessibilityRole="alert" style={g.textoError}>{error}</Text> : null}
        {cargando ? <ActivityIndicator color={tema.foco} /> : !vista.avisos.length ? <Text style={g.textoAyuda}>No tenés notificaciones en este filtro.</Text> : vista.avisos.map((aviso, indice) => {
          const dia = new Date(aviso.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
          const previo = indice > 0 ? new Date(vista.avisos[indice - 1].fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
          return <View key={aviso.id} style={e.grupoDia}>{dia !== previo ? <Text style={e.tituloDia}>{dia}</Text> : null}<Pressable accessibilityRole="button" accessibilityLabel={`${aviso.vista ? 'Vista' : 'Nueva'}: ${aviso.titulo}. ${aviso.resuelta ? 'Resuelta' : 'Pendiente'}`} onPress={() => { void abrir(aviso).catch(() => establecerError('El recurso ya no está disponible. Podés continuar desde el historial.')); }} style={[e.tarjetaNotificacion, !aviso.vista && e.tarjetaNueva]}>
            <View style={e.iconoNotificacion}><Ionicons name={aviso.tipo === 'mercado_pago' ? 'wallet-outline' : 'notifications-outline'} color={tema.botonPrincipal} size={26} /></View>
            <View style={e.contenidoNotificacion}><Text style={[g.etiqueta, !aviso.vista && e.tituloNuevo]}>{aviso.titulo}</Text><Text style={g.textoAyuda}>{aviso.mensaje}</Text><Text style={g.textoAyuda}>{aviso.vista ? 'Vista' : 'Nueva'} · {aviso.resuelta ? 'Resuelta' : 'Pendiente'} · {new Date(aviso.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text><Text style={g.textoBotonTexto}>Abrir detalle ›</Text></View>
          </Pressable></View>;
        })}
        {vista.total > vista.avisos.length ? <Pressable style={g.botonSecundario} onPress={() => establecerLimite(v => v + 30)}><Text style={g.textoBotonSecundario}>Cargar más</Text></Pressable> : null}
      </DesplazamientoEncabezado>
      <Modal transparent visible={!!ajustes} animationType="fade" onRequestClose={() => { if (!guardando) establecerAjustes(null); }}>
        <View style={e.fondoSuperpuesto}><View style={e.tarjetaSuperpuesta}><Text style={e.tituloModal}>Ajustes de notificaciones</Text><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={e.listaNotificaciones}>
          <Text style={g.textoAyuda}>{permiso}. Podés usar el historial sin permitir avisos del teléfono.</Text>
          <Pressable style={g.botonSecundario} onPress={() => Alert.alert('Recordatorios de AHRE', 'Permití los avisos para recibir recordatorios incluso sin conexión y con la app cerrada.', [{ text: 'Ahora no', style: 'cancel' }, { text: 'Permitir', onPress: () => { void solicitarPermisoAvisos().then(establecerPermiso); } }])}><Text style={g.textoBotonSecundario}>Permitir notificaciones</Text></Pressable>
          <Pressable style={g.botonSecundario} onPress={() => { void Linking.openSettings(); }}><Text style={g.textoBotonSecundario}>Abrir Ajustes del teléfono</Text></Pressable>
          {ajustes ? <><Text style={g.etiqueta}>Zona horaria</Text><TextInput accessibilityLabel="Zona horaria de recordatorios" value={ajustes.zona} onChangeText={zona => establecerAjustes({ ...ajustes, zona })} style={g.campo} autoCapitalize="none" />
            <View style={e.filaAjuste}><Text style={e.textoAjuste}>Mostrar nombres e importes en el teléfono</Text><Conmutador tema={tema} valor={ajustes.mostrarDetalles} alCambiar={mostrarDetalles => establecerAjustes({ ...ajustes, mostrarDetalles })} /></View>
            {TIPOS_AVISO.map(tipo => <View key={tipo} style={e.grupoDia}><View style={e.filaAjuste}><Text style={e.textoAjuste}>{NOMBRES_AVISO[tipo]}</Text><Conmutador tema={tema} valor={ajustes.tipos[tipo].activo} etiquetaAccesibilidad={NOMBRES_AVISO[tipo]} alCambiar={activo => establecerAjustes({ ...ajustes, tipos: { ...ajustes.tipos, [tipo]: { ...ajustes.tipos[tipo], activo } } })} /></View>
              {canales[tipo] === false ? <Text style={g.textoError}>Este canal está desactivado en Ajustes de Android.</Text> : null}
              {!['social', 'cuenta'].includes(tipo) ? <TextInput accessibilityLabel={`Hora de ${NOMBRES_AVISO[tipo]}`} value={ajustes.tipos[tipo].hora} placeholder="HH:mm" style={g.campo} onChangeText={hora => establecerAjustes({ ...ajustes, tipos: { ...ajustes.tipos, [tipo]: { ...ajustes.tipos[tipo], hora } } })} /> : null}
              {['debo', 'me_deben', 'recurrencias'].includes(tipo) ? <><Text style={g.textoAyuda}>Anticipación en días (0 a 30)</Text><TextInput keyboardType="number-pad" accessibilityLabel={`Anticipación de ${NOMBRES_AVISO[tipo]}`} value={String(ajustes.tipos[tipo].anticipacion)} style={g.campo} onChangeText={valor => establecerAjustes({ ...ajustes, tipos: { ...ajustes.tipos, [tipo]: { ...ajustes.tipos[tipo], anticipacion: Number(valor) } } })} /></> : null}
            </View>)}
          </> : null}
        </ScrollView><Pressable disabled={guardando} style={g.botonPrincipal} onPress={() => { void guardar(); }}><Text style={g.textoBotonPrincipal}>{guardando ? 'Guardando…' : 'Guardar ajustes'}</Text></Pressable><Pressable disabled={guardando} onPress={() => establecerAjustes(null)}><Text style={g.textoBotonSecundario}>Cancelar</Text></Pressable></View></View>
      </Modal>
    </MarcoEncabezado>
  </SafeAreaView>;
}
