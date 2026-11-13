import { cargarPreferenciasActuales } from '../profile/profileService';
import { activarAvisosTelefono } from '../notifications/nativeAdapter';
import { RUTAS } from '../constants/routes';
import TarjetaNotificacion from '../components/NotificationCard';
import { guardarYProgramarAvisos } from '../notifications/reminderService';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, AppState, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MarcoEncabezado from '../components/ScreenHeaderFrame';
import { DesplazamientoEncabezado } from '../components/HeaderScrollView';
import EncabezadoSeccion from '../components/SectionHeader';
import SelectorSegmentado from '../components/SegmentedSelector';
import AjustesNotificaciones from '../components/NotificationSettings';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';
import { cargarAjustesAvisos, cargarPaginaAvisos, contarAvisosNoVistos, marcarAvisoVisto } from '../notifications/notificationService';
import { type AjustesAvisos, type Aviso } from '../notifications/types';
import { consultarCanalesAvisos, consultarPermisoAvisos } from '../notifications/nativeAdapter';
import { navegarAviso } from '../notifications/notificationNavigation';
import { observarIntegraciones } from '../integrations/integrationStore';

export default function PantallaNotificaciones({ navigation: navegacion }: import('../navigation/types').PropiedadesPantalla) {
  const { tema } = useContext(ContextoApariencia), { bottom } = useSafeAreaInsets();
  const g = crearEstilosGlobales(tema), e = crearEstilosNotificaciones(tema, bottom);
  const [filtro, establecerFiltro] = useState<'todas' | 'pendientes' | 'no_vistas'>('todas');
  const [vista, establecerVista] = useState<{avisos:Aviso[];noVistas:number;siguiente:string|null}>({avisos:[],noVistas:0,siguiente:null});
  const generacion=useRef(0);
  const [generales,establecerGenerales]=useState<boolean|null>(null);
  const [cargandoMas,establecerCargandoMas]=useState(false);
  const [ajustes, establecerAjustes] = useState<AjustesAvisos | null>(null), [permiso, establecerPermiso] = useState('Comprobando permisos');
  const [canales, establecerCanales] = useState<Record<string, boolean>>({});
  const [cargando, establecerCargando] = useState(true), [error, establecerError] = useState(''), [guardando, establecerGuardando] = useState(false);
  useEffect(() => {
    let activa = true;
    const cargar = () => { void Promise.all([consultarPermisoAvisos(), consultarCanalesAvisos(),cargarPreferenciasActuales()]).then(([p, c,preferencias]) => { if (activa) { establecerPermiso(p); establecerCanales(c);establecerGenerales(!!preferencias.notificaciones_activas); } }).catch(() => {}); };
    cargar(); const escucha = AppState.addEventListener('change', estado => { if (estado === 'active') cargar(); });
    return () => { activa = false; escucha.remove(); };
  }, []);
  useFocusEffect(useCallback(() => {
    let activa = true; ++generacion.current;
    const cargar = () => { void cargarPaginaAvisos(filtro).then(async pagina=>({...pagina,noVistas:await contarAvisosNoVistos()})).then(v => { if (activa) { establecerVista(v); establecerCargando(false); } }).catch(err => { if (activa) { establecerError(err instanceof Error ? err.message : 'No se pudo cargar el historial.'); establecerCargando(false); } }); };
    cargar(); void Promise.all([consultarPermisoAvisos(),cargarPreferenciasActuales()]).then(([p,v])=>{if(activa){establecerPermiso(p);establecerGenerales(!!v.notificaciones_activas);}}).catch(()=>{});
    const dejar = observarIntegraciones(cargar); return () => { activa = false; ++generacion.current; dejar(); };
  }, [filtro]));
  const abrir = async (aviso: Aviso) => { await marcarAvisoVisto(aviso.id); navegarAviso(navegacion, aviso.destino); };
  const gruposPorFecha = new Map<string, Aviso[]>();
  for (const aviso of vista.avisos) {
    const fecha = new Date(aviso.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    const grupo = gruposPorFecha.get(fecha) ?? [];
    grupo.push(aviso);
    gruposPorFecha.set(fecha, grupo);
  }
  const guardar = async () => { if (!ajustes || guardando || generales!==true) return; establecerGuardando(true); try { await guardarYProgramarAvisos({...ajustes,zona:Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Argentina/Buenos_Aires'}); establecerAjustes(null); } catch (err) { Alert.alert('No se pudieron programar los recordatorios', err instanceof Error ? err.message : 'Intentá guardar de nuevo.'); } finally { establecerGuardando(false); } };
  return <SafeAreaView edges={['top']} style={g.areaSegura}>
    <MarcoEncabezado style={g.pantalla} tema={tema} encabezado={<EncabezadoSeccion tema={tema} titulo="Notificaciones" descripcion="Tus avisos, recordatorios y pendientes." alVolver={() => navegacion.goBack()} />}>
      <DesplazamientoEncabezado contentContainerStyle={e.contenido}>
        <View style={e.filaEncabezado}><Text style={e.textoNuevas}>{vista.noVistas ? `${vista.noVistas} sin ver` : 'Estás al día'}</Text><Pressable style={e.botonAjustes} accessibilityRole="button" accessibilityLabel="Ajustes de notificaciones" onPress={() => { void Promise.all([cargarAjustesAvisos(),consultarPermisoAvisos(),cargarPreferenciasActuales()]).then(([a,p,v])=>{establecerPermiso(p);establecerGenerales(!!v.notificaciones_activas);establecerAjustes(a);}).catch(()=>Alert.alert('No se pudieron cargar los ajustes')); }}><Ionicons name="settings-outline" color={tema.textoPrincipal} size={22} /></Pressable></View>
        <SelectorSegmentado tema={tema} opciones={[{ id: 'todas', nombre: 'Todas' }, { id: 'pendientes', nombre: 'Pendientes' }, { id: 'no_vistas', nombre: 'No vistas' }]} valor={filtro} alSeleccionar={v => { establecerFiltro(v as typeof filtro); establecerCargando(true); }} etiqueta="Filtrar notificaciones" />
        {generales===false?<View><Text style={g.textoAyuda}>Notificaciones desactivadas en AHRE.</Text><Pressable accessibilityRole="button" style={g.botonSecundario} onPress={()=>navegacion.navigate(RUTAS.PERFIL)}><Text style={g.textoBotonSecundario}>Activar en Perfil</Text></Pressable></View>:generales&&['Sin permiso','Desactivadas en Ajustes'].includes(permiso)?<View><Text style={g.textoError}>Android bloquea las notificaciones de AHRE.</Text><Pressable accessibilityRole="button" style={g.botonSecundario} onPress={()=>{void activarAvisosTelefono().then(establecerPermiso).catch(()=>Alert.alert('No se pudieron abrir los permisos'));}}><Text style={g.textoBotonSecundario}>Activar en Android</Text></Pressable></View>:null}
        {error ? <Text accessibilityRole="alert" style={g.textoError}>{error}</Text> : null}
        {cargando ? <ActivityIndicator color={tema.foco} /> : !vista.avisos.length ? <Text style={g.textoAyuda}>No tenés notificaciones en este filtro.</Text> : [...gruposPorFecha].map(([fecha, avisos]) =>
          <View key={fecha} style={e.grupoDia}>
            <View style={e.encabezadoDia}><Text style={e.tituloDia}>{fecha}</Text><View style={e.lineaDia}/></View>
            <View style={e.notificacionesDia}>{avisos.map(aviso=><TarjetaNotificacion key={aviso.id} aviso={aviso} tema={tema} alAbrir={()=>{void abrir(aviso).catch(()=>establecerError('El recurso ya no está disponible. Podés continuar desde el historial.'));}}/>)}</View>
          </View>
        )}
        {vista.siguiente?<Pressable accessibilityRole="button" disabled={cargandoMas} style={g.botonSecundario} onPress={()=>{if(cargandoMas)return;establecerCargandoMas(true);const cursor=vista.siguiente!,version=generacion.current;void cargarPaginaAvisos(filtro,cursor).then(pagina=>{if(version!==generacion.current)return;establecerVista(prev=>({...prev,avisos:[...prev.avisos,...pagina.avisos.filter(a=>!prev.avisos.some(p=>p.id===a.id))],siguiente:pagina.siguiente}));}).catch(()=>establecerError('No se pudieron cargar más avisos.')).finally(()=>establecerCargandoMas(false));}}><Text style={g.textoBotonSecundario}>{cargandoMas?'Cargando…':'Cargar 10 más'}</Text></Pressable>:null}
      </DesplazamientoEncabezado>
      <AjustesNotificaciones generales={generales===true} alActivarGenerales={()=>{establecerAjustes(null);navegacion.navigate(RUTAS.PERFIL);}} tema={tema} ajustes={ajustes} alCambiar={establecerAjustes} alCerrar={()=>establecerAjustes(null)} alGuardar={()=>{void guardar();}} guardando={guardando} permiso={permiso} alCambiarPermiso={establecerPermiso} canales={canales}/>
    </MarcoEncabezado>
  </SafeAreaView>;
}
