import {useAccionConfirmada} from '../hooks/useConfirmedAction';
import {actualizarTrasOperacion} from '../social/financialOperation';
import {conRespuestaVisual} from '../utils/pressFeedback';
import {iniciarOperacionFinanciera} from '../social/financialOperation';
import BotonAccion from '../components/ActionButton';
import AvisoFormulario from '../components/FormNotice';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import PuntosCarga from '../components/LoadingDots';
import { AvisosEnModal } from '../contexts/ToastContext';
import { useAvisoError, useErrorNotificado } from '../hooks/useErrorNotice';
import { useMovimientoReducido } from '../hooks/useReducedMotion';
import { useRegresoProtegido } from '../navigation/useSafeGoBack';
import AccionesSeleccionMp from '../components/MercadoPagoSelectionActions';
import EtiquetaImporte from '../components/AmountLabel';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Animated, AppState, Easing, Linking, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MarcoEncabezado from '../components/ScreenHeaderFrame';
import { DesplazamientoEncabezado } from '../components/HeaderScrollView';
import EncabezadoSeccion from '../components/SectionHeader';
import SelectorSegmentado from '../components/SegmentedSelector';
import SelectorCategoria from '../components/CategorySelector';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import { CATEGORIAS_EGRESO, CATEGORIAS_INGRESO } from '../constants/movimientos';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { crearEstilosMercadoPago } from '../styles/MercadoPagoScreenStyles';
import { resolverBorradorMp, cargarBorradoresMp, cargarMercadoPago, consultarCompatiblesMp, consultarHistorialMp, decidirMovimientosMp, ESTADO_MP_INICIAL, guardarBorradorMp, iniciarVinculacion, solicitarConsultaMp } from '../mercadoPago/mercadoPagoService';
import { admiteSentidoManualMp, consultaMpEnCurso, resultadoVisibleMp, sentidoManualMp, vistaPreviaMp, type BorradorMp, type ConsultaMp, type EstadoMp, type OperacionMp } from '../mercadoPago/types';
import { seguirConsultaMp } from '../mercadoPago/mercadoPagoRealtime';
import { agruparMovimientosMp, alternarSeleccionMp, ordenarMovimientosMp } from '../mercadoPago/mercadoPagoPresentation';
import { observarIntegraciones } from '../integrations/integrationStore';
import { sincronizarIntegraciones } from '../integrations/integrationSync';
import { ErrorRemoto } from '../sync/remote';

const nombreEstado = (estado: string) => ({ completo: 'Completa', fallido: 'Fallida', cancelado: 'Cancelada', pendiente: 'En espera', procesando: 'Buscando' }[estado] || 'En curso');
const importe = (op: OperacionMp, tipo = op.tipo) => `${op.monto > 0 ? tipo === 'egreso' ? '−' : tipo === 'ingreso' ? '+' : '' : ''}${op.moneda === 'ARS' ? '$ ' : op.moneda + ' '}${op.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ESPERAS_VINCULACION = [1000, 2000, 4000, 6000, 8000];
const appEnPrimerPlano = () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive';

export default function PantallaMercadoPago({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
 const respuesta=useAccionConfirmada();
 const [movimientoAsociar,cambiarMovimientoAsociar]=useState('');
 const [focoEntrada,cambiarFocoEntrada]=useState<string|null>(null);


  const volverProtegido = useRegresoProtegido(navegacion,()=>operando.current);
  const { tema } = useContext(ContextoApariencia), g = crearEstilosGlobales(tema), e = crearEstilosMercadoPago(tema);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [estado, establecerEstado] = useState<EstadoMp>(ESTADO_MP_INICIAL), [operaciones, establecerOperaciones] = useState<OperacionMp[]>([]);
  const [borradores, establecerBorradores] = useState<Record<string, BorradorMp>>({}), [seleccionadas, establecerSeleccionadas] = useState<string[]>([]);
  const [filtro, establecerFiltro] = useState('pendiente'), [limite, establecerLimite] = useState(30), [meses, establecerMeses] = useState('1');
  const [error, establecerError] = useErrorNotificado('');
  const [cargando, establecerCargando] = useState(true), [ocupada, establecerOcupada] = useState(false), [refrescando, establecerRefrescando] = useState(false);
  const [enfocada, establecerEnfocada] = useState(false), [activa, establecerActiva] = useState(appEnPrimerPlano), [conectada, establecerConectada] = useState(false);
  const [verificandoVinculo, establecerVerificandoVinculo] = useState(false);
  const [revisionVinculo, establecerRevisionVinculo] = useState(0);
  const [historialVisible, establecerHistorialVisible] = useState(false), [historial, establecerHistorial] = useState<ConsultaMp[]>([]), [cargandoHistorial, establecerCargandoHistorial] = useState(false);
  const [categoriaId, establecerCategoriaId] = useState<string | null>(null);
  const [editandoId, establecerEditandoId] = useState<string | null>(null);
  const [asociacion, establecerAsociacion] = useState<{ op: OperacionMp; filas: { id: string; descripcion: string; fecha_hora: string }[] } | null>(null);
  const operando = useRef(false), montada = useRef(true);
  const autorizacionPendiente = useRef(false);
  const secuenciaCarga = useRef(0);
  const animacionConsulta = useRef(new Animated.Value(0)).current;
  const [anchoPista, establecerAnchoPista] = useState(0);
  const movimientoReducido = useMovimientoReducido();
  const consultaObservada = useRef<{ id: string; estado: string } | null>(null);
  useEffect(() => { if (error) Alert.alert('No se pudo completar la acción', error); }, [error]);
  useEffect(() => { montada.current = true; return () => { montada.current = false; }; }, []);
  const cargar = useCallback(async () => {
    const secuencia = ++secuenciaCarga.current;
    const [datos, guardados] = await Promise.all([cargarMercadoPago(), cargarBorradoresMp()]);
    actualizarTrasOperacion(()=>{if (montada.current && secuencia === secuenciaCarga.current) {
      const visibles = datos.operaciones.filter(resultadoVisibleMp);
      establecerEstado(datos.estado); establecerOperaciones(visibles); establecerBorradores(prev => ({ ...guardados, ...prev }));
      establecerSeleccionadas(prev => prev.filter(id => visibles.some(op => op.id === id && !op.revisionPendiente && op.decision !== 'registrado'))); establecerCargando(false);
    }});
    return datos;
  }, []);
  useFocusEffect(useCallback(() => {
    let vigente = true; establecerEnfocada(true); establecerActiva(appEnPrimerPlano());
    const actualizar = () => { void sincronizarIntegraciones().catch(() => { if (vigente) establecerError('No pudimos actualizar. Tus datos descargados siguen disponibles.'); }); };
    const alVolver = () => {
      if (autorizacionPendiente.current) {
        establecerVerificandoVinculo(true);
        establecerRevisionVinculo(revision => revision + 1);
      } else actualizar();
    };
    void cargar().catch(() => { if (vigente) { establecerError('No se pudo cargar la revisión.'); establecerCargando(false); } });
    alVolver();
    const dejar = observarIntegraciones(() => { if (vigente) void cargar().catch(() => {}); });
    const retorno = AppState.addEventListener('change', valor => { establecerActiva(valor === 'active'); if (valor === 'active') alVolver(); });
    const focoAndroid = AppState.addEventListener('focus', () => {
      if (autorizacionPendiente.current && appEnPrimerPlano()) { establecerActiva(true); alVolver(); }
    });
    const enlace = Linking.addEventListener('url', ({url}) => {
      if (/^ahre:\/\/mercado-pago\/?(?:[?#].*)?$/.test(url)) alVolver();
    });
    return () => { vigente = false; establecerEnfocada(false); dejar(); retorno.remove(); focoAndroid.remove(); enlace.remove(); };
  }, [cargar]));
  const vinculada = estado.vinculacion, depositoId = ruta.params?.depositoId || vinculada?.deposito_id;
  useEffect(() => {
    if (vinculada) {
      autorizacionPendiente.current = false;
      establecerVerificandoVinculo(false);
      return;
    }
    if (!verificandoVinculo || !activa || !enfocada) return;
    let vigente = true;
    let intento = 0;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    const comprobar = async () => {
      try {
        await sincronizarIntegraciones(false, false);
        if (!vigente) return;
        const datos = await cargar();
        if (!vigente || datos.estado.vinculacion) return;
      } catch { if (!vigente) return; }
      const demora = ESPERAS_VINCULACION[intento++];
      if (demora === undefined) establecerVerificandoVinculo(false);
      else reintento = setTimeout(() => { void comprobar(); }, demora);
    };
    void comprobar();
    return () => { vigente = false; clearTimeout(reintento); };
  }, [activa, cargar, enfocada, revisionVinculo, verificandoVinculo, vinculada]);
  useAvisoError(vinculada?.error ? vinculada.error + ' Gestioná la conexión desde las opciones del depósito.' : null);
  const otraVinculacion = vinculada && ruta.params?.depositoId && vinculada.deposito_id !== ruta.params.depositoId;
  const consultaEnCurso = consultaMpEnCurso(estado.trabajo), trabajoId = estado.trabajo?.id, version = vinculada?.version;
  const vistaPrevia = vistaPreviaMp(estado.trabajo);
  const trabajo = estado.trabajo;
  const avance = trabajo?.settlement;
  const consultaCompleta = trabajo?.estado === 'completo';
  const reintentar = !!avance && trabajo?.estado === 'fallido';
  const puedeConsultar = !ocupada && !consultaEnCurso && (estado.settlement ? reintentar : estado.manualesRestantes > 0);
  const proximaAutomatica = estado.automatica?.proximaDisponible;
  const pagosProcesados = Number(estado.trabajo?.procesados ?? estado.trabajo?.total ?? 0);
  const porcentaje = consultaCompleta ? 100 : !avance || avance.etapa === 'search' ? 0
    : Math.round(100 * (1 + avance.conciliados) / (2 + avance.tramos));
  const etapa = reintentar ? 'pausa' : consultaCompleta ? 'lista' : avance?.etapa ?? 'search';
  const etapas = {
    search: {titulo: trabajo?.soloIdentificacion ? 'Actualizando pagos guardados' : 'Buscando movimientos', icono: 'search-outline'},
    configuracion: {titulo: 'Solicitando el reporte', icono: 'document-text-outline'},
    reporte: {titulo: avance?.fuenteReporte === 'liquidaciones' ? 'Esperando Liquidaciones' : 'Esperando el reporte', icono: 'hourglass-outline'},
    conciliacion: {titulo: 'Verificando los movimientos', icono: 'document-text-outline'},
    pausa: {titulo: 'Consulta en pausa', icono: 'pause-circle-outline'},
    lista: {titulo: 'Consulta completada', icono: 'checkmark-circle-outline'},
  } as const;
  const {titulo: tituloEtapa, icono: iconoEtapa} = etapas[etapa];
  const mostrarAvance = !!trabajo && (consultaEnCurso || !!avance);
  const detalleEtapa = etapa === 'search'
    ? conectada ? 'Los resultados aparecen a medida que llegan.' : 'Conectando para recibir los resultados…'
    : etapa === 'reporte' ? 'Mercado Pago está generando el archivo. Podés cerrar la app y volver más tarde.'
    : etapa === 'conciliacion' ? 'Estamos comprobando los importes y completando los datos de los resultados.'
    : etapa === 'pausa' ? 'Podés retomar la consulta desde el último tramo guardado.' : null;
  const tramoRestante = anchoPista * (100 - porcentaje) / 100;
  const anchoIndicador = Math.min(60, tramoRestante / 3);
  const mostrarActividad = consultaEnCurso && activa && enfocada && !movimientoReducido && anchoIndicador > 0;
  useEffect(() => {
    if (!mostrarActividad) return;
    animacionConsulta.setValue(0);
    const ciclo = Animated.loop(Animated.timing(animacionConsulta, {
      toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true, isInteraction: false,
    }));
    ciclo.start();
    return () => { ciclo.stop(); animacionConsulta.setValue(0); };
  }, [animacionConsulta, mostrarActividad, trabajoId]);
  useEffect(() => {
    const trabajo = estado.trabajo;
    if (!trabajo) { consultaObservada.current = null; return; }
    const anterior = consultaObservada.current;
    consultaObservada.current = { id: trabajo.id, estado: trabajo.estado };
    if (trabajo.estado === 'fallido' && (!anterior || anterior.id !== trabajo.id)) { establecerError(trabajo.error || 'No se completó la consulta. Tus movimientos se conservaron.'); return; }
    if (!anterior || anterior.id !== trabajo.id || !['pendiente', 'procesando'].includes(anterior.estado)) return;
    if (trabajo.estado === 'fallido') establecerError(trabajo.error || 'No se completó la consulta. Tus movimientos se conservaron.');
    if (trabajo.estado === 'completo') mostrarAviso(trabajo.soloIdentificacion ? 'Tus movimientos guardados ya están actualizados.' : 'La búsqueda de Mercado Pago terminó. Ya podés revisar los resultados.', { tipo: 'exito' });
  }, [estado.trabajo, mostrarAviso]);
  useEffect(() => {
    if (!enfocada || !activa || otraVinculacion || !consultaEnCurso || !trabajoId || !version) { establecerConectada(false); return; }
    return seguirConsultaMp(trabajoId, version, async () => {
      await sincronizarIntegraciones(false, false); const datos = await cargar();
      return datos.estado.vinculacion?.version === version && datos.estado.trabajo?.id === trabajoId && ['pendiente', 'procesando'].includes(datos.estado.trabajo.estado);
    }, establecerConectada);
  }, [enfocada, activa, otraVinculacion, consultaEnCurso, trabajoId, version, cargar]);
  useEffect(() => {
    if (!enfocada || !activa || !estado.settlement || !version || otraVinculacion || consultaEnCurso || reintentar || vinculada?.error || !proximaAutomatica) return;
    const prevista = Date.parse(proximaAutomatica);
    if (!Number.isFinite(prevista)) return;
    let vigente = true;
    let temporizador: ReturnType<typeof setTimeout>;
    const comprobar = async () => {
      try { await sincronizarIntegraciones(false, false); } catch { /* Se conserva la copia local. */ }
      if (vigente) temporizador = setTimeout(() => { void comprobar(); }, 30000);
    };
    temporizador = setTimeout(() => { void comprobar(); }, Math.max(1000, prevista - Date.now() + 1000));
    return () => { vigente = false; clearTimeout(temporizador); };
  }, [activa, consultaEnCurso, enfocada, estado.settlement, otraVinculacion, proximaAutomatica, reintentar, version, vinculada?.error]);
  useEffect(() => {
    if (!historialVisible) return;
    let vigente = true; establecerCargandoHistorial(true);
    void consultarHistorialMp().then(filas => { if (vigente) establecerHistorial(filas); }).catch(() => { if (vigente) establecerError('No pudimos actualizar el historial de consultas.'); }).finally(() => { if (vigente) establecerCargandoHistorial(false); });
    return () => { vigente = false; };
  }, [historialVisible]);
  const ejecutar = async (accion: () => Promise<unknown>, exito = '') => {
    if (operando.current) return;
    const liberarAccion=iniciarOperacionFinanciera();if(!liberarAccion)return;
    operando.current = true; establecerOcupada(true); establecerError('');
    try { await accion(); if (montada.current) { mostrarAviso(exito,{tipo:'exito'}); await cargar(); } }
    catch (err) { if (montada.current) establecerError(err instanceof Error ? err.message : 'No se pudo completar la operación.'); }
    finally { liberarAccion();operando.current = false; if (montada.current) establecerOcupada(false); }
  };
  const autorizar = async () => {
    if (!depositoId || verificandoVinculo) return;
    await ejecutar(async () => {
      await sincronizarIntegraciones(true);
      try {
        const autorizacion = await iniciarVinculacion(depositoId, Number(meses));
        if (!montada.current) return;
        autorizacionPendiente.current = true;
        establecerVerificandoVinculo(true);
        await Linking.openURL(autorizacion.url);
      } catch (fallo) {
        autorizacionPendiente.current = false;
        if (montada.current) establecerVerificandoVinculo(false);
        if (fallo instanceof ErrorRemoto && fallo.estado === 409) {
          await sincronizarIntegraciones(false, false);
          if ((await cargar()).estado.vinculacion) return;
        }
        throw fallo;
      }
    });
  };
  const refrescar = async () => { establecerRefrescando(true); try { await ejecutar(() => sincronizarIntegraciones(false, false)); } finally { if (montada.current) establecerRefrescando(false); } };
  const pendientes = operaciones.filter(op => op.decision === 'pendiente' || op.revisionPendiente);
  const visibles = ordenarMovimientosMp(operaciones.filter(op => filtro === 'pendiente' ? op.decision === 'pendiente' || op.revisionPendiente : op.decision === filtro && !op.revisionPendiente));
  const puedeElegirSentido = (op: OperacionMp) => !!estado.sentidoManual && admiteSentidoManualMp(op);
  const sentidoElegido = (op: OperacionMp) => puedeElegirSentido(op) && !!sentidoManualMp(op, borradores[op.id]);
  const elegibles = vistaPrevia ? [] : visibles.filter(op => !op.revisionPendiente && !op.provisional && (!op.pendienteConfirmacion || sentidoElegido(op)));
  const seleccionActual = seleccionadas.filter(id => elegibles.some(op => op.id === id));
  const todasSeleccionadas = elegibles.length > 0 && elegibles.slice(0, 500).every(op => seleccionActual.includes(op.id));
  useEffect(() => {
    if (!vistaPrevia) return;
    establecerSeleccionadas([]);
    establecerCategoriaId(null);
    establecerEditandoId(null);
    establecerAsociacion(null);
  }, [vistaPrevia]);
  const categorizando = vistaPrevia ? undefined : operaciones.find(op => op.id === categoriaId);
  const borradorCategoria = categorizando ? resolverBorradorMp(categorizando,borradores[categorizando.id]) : null;
  const editando = vistaPrevia ? undefined : operaciones.find(op => op.id === editandoId), borradorEditando = editando ? resolverBorradorMp(editando,borradores[editando.id]) : null;
  const cambiarBorrador = (op: OperacionMp, cambios: Partial<BorradorMp>) => {
    const valor = { ...(resolverBorradorMp(op,borradores[op.id])), ...cambios }; establecerBorradores(prev => ({ ...prev, [op.id]: valor }));
    void guardarBorradorMp(op.id, valor).catch(() => establecerError('No se pudieron guardar los cambios del movimiento.'));
  };
  const elegir = (id: string) => {
    if (seleccionActual.includes(id)) establecerSeleccionadas(prev => prev.filter(valor => valor !== id));
    else if (seleccionActual.length >= 500) establecerError('Podés seleccionar hasta 500 movimientos por vez.');
    else establecerSeleccionadas(prev => [...prev, id]);
  };
  const decidir = async (decision: 'registrado' | 'ignorado' | 'recuperado') => {
    const ids = seleccionActual;
    if (!ids.length) { Alert.alert('Seleccioná movimientos', 'Marcá la casilla derecha de uno o varios movimientos. Registrar no consume usos de búsqueda.'); return false; }
    if (decision === 'registrado' && motivoRegistroBloqueado) { Alert.alert('No se pueden registrar los seleccionados', motivoRegistroBloqueado); return false; }
    try{return await respuesta.ejecutar(()=>decidirMovimientosMp(ids,decision,borradores),async()=>{establecerSeleccionadas([]);await cargar();mostrarAviso('Decisión guardada.',{tipo:'exito'});});}
    catch(error){establecerError(error instanceof Error?error.message:'No se pudo guardar la decisión.');return false;}
  };
  const invalidos = operaciones.filter(op => seleccionActual.includes(op.id) && (!op.registrable || op.moneda !== 'ARS' || !op.tipo && !sentidoElegido(op)));
  const motivoRegistroBloqueado = !seleccionActual.length ? 'Seleccioná al menos un movimiento con su casilla derecha.' : invalidos.length ? `${invalidos.length} seleccionado(s) no se pueden registrar: ${invalidos.slice(0, 3).map(op => `${op.descripcion}: ${op.monto === 0 ? 'importe cero' : op.moneda !== 'ARS' ? 'moneda distinta de pesos' : !op.tipo ? 'sentido sin identificar' : 'pago todavía no aprobado'}`).join('; ')}. Desmarcalos para registrar los demás. Podés ignorarlos por separado.` : '';
  const proxima = estado.automatica ? new Date(estado.automatica.proximaDisponible).toLocaleString('es-AR', { timeZone: estado.automatica.zona, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
  const fechaPeriodo = (fecha: string) => new Date(fecha).toLocaleDateString('es-AR', { timeZone: estado.settlement ? estado.automatica?.zona : undefined });
  const automaticaDisponible = estado.automatica && Date.parse(estado.automatica.proximaDisponible) <= Date.now();
  const solicitarDeNuevo = () => ejecutar(async () => {
    await solicitarConsultaMp('manual');
    await sincronizarIntegraciones(false, false);
  });
  return <SafeAreaView edges={['top', 'bottom']} style={g.areaSegura}><MarcoEncabezado style={g.pantalla} tema={tema} encabezado={<EncabezadoSeccion tema={tema} titulo="Mercado Pago" descripcion="Revisá e incorporá tus movimientos." alVolver={() => volverProtegido()} />}>
    {vinculada && !otraVinculacion && filtro !== 'registrado' && !cargando && !vistaPrevia ? <AccionesSeleccionMp tema={tema} cantidad={seleccionActual.length} todas={todasSeleccionadas} disponibles={!!elegibles.length} completado={respuesta.completado} ocupada={ocupada||respuesta.ocupado} recuperando={filtro==='ignorado'} motivoBloqueo={motivoRegistroBloqueado} alAlternar={()=>establecerSeleccionadas(alternarSeleccionMp(elegibles,seleccionActual,sentidoElegido))} alRegistrar={()=>decidir(filtro==='ignorado'?'recuperado':'registrado')} alIgnorar={()=>decidir('ignorado')}/> : null}
    <DesplazamientoEncabezado pointerEvents={ocupada?'none':'auto'} contentContainerStyle={e.contenido} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { void refrescar(); }} tintColor={tema.foco} />}>
      {cargando ? <PuntosCarga color={tema.foco} /> : otraVinculacion ? <Text style={g.textoError}>Ya tenés otro depósito vinculado. Gestioná la conexión desde sus opciones.</Text> : !vinculada ? <>
        <View style={[e.resumen, e.panelConexion]}>
          <View style={e.filaConexion}>
            <View style={e.emblemaCuenta}><Ionicons name="wallet-outline" size={24} color={tema.foco} /></View>
            <View style={[e.flexible, e.textosConexion]}>
              <Text accessibilityRole="header" style={g.subtitulo}>Conectá tu cuenta</Text>
              <Text style={e.textoSecundario}>Traé tus movimientos a este depósito.</Text>
            </View>
          </View>
          <View style={e.periodoConexion}>
            <Text style={g.etiqueta}>Historial inicial</Text>
            <Text style={e.textoSecundario}>{estado.settlement ? 'Elegí cuántos meses buscar antes de la creación del depósito.' : 'Elegí el período de búsqueda. Se incluyen hasta 500 pagos recientes.'}</Text>
            <SelectorSegmentado tema={tema} valor={meses} alSeleccionar={establecerMeses}
              opciones={[{ id: '1', nombre: '1 mes' }, { id: '2', nombre: '2 meses' }, { id: '3', nombre: '3 meses' }]} etiqueta="Historial inicial" />
          </View>
        </View>
        <AvisoFormulario tema={tema} titulo="Cuánto puede tardar">
          {estado.settlement
            ? 'Vas a ver los primeros resultados a medida que lleguen. Con un historial largo, la revisión del reporte puede tardar unos 10 minutos o más.'
            : 'La búsqueda puede tardar unos minutos, según la cantidad de pagos.'}
          {'\n\n'}Podés cerrar la app y volver para ver el avance.
        </AvisoFormulario>
        {!depositoId ? <Text style={e.textoSecundario}>Abrí un depósito para vincular tu cuenta.</Text> : <BotonAccion tema={tema}
          texto={verificandoVinculo ? 'Verificando conexión' : 'Autorizar en Mercado Pago'} icono="open-outline"
          cargando={ocupada || verificandoVinculo} deshabilitado={ocupada || verificandoVinculo} alPresionar={autorizar} />}
      </> : <>
        {mostrarAvance && trabajo ? <View style={e.avanceConsulta}>
          <View style={e.cabeceraAvance}>
            <View style={e.emblemaAvance}><Ionicons name={iconoEtapa} size={22} color={consultaCompleta ? tema.exito : tema.foco} /></View>
            <View style={e.flexible}>
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={e.tituloAvance}>{tituloEtapa}</Text>
              <Text style={e.aclaracion}>{fechaPeriodo(trabajo.desde)} – {fechaPeriodo(trabajo.hasta)}</Text>
            </View>
          </View>
          <View accessible accessibilityRole="progressbar" accessibilityLabel={tituloEtapa}
            accessibilityValue={porcentaje > 0 ? {min: 0, max: 100, now: porcentaje, text: tituloEtapa} : {text: tituloEtapa}}
            onLayout={evento => establecerAnchoPista(evento.nativeEvent.layout.width)} style={e.pistaProgreso}>
            <View style={[e.rellenoProgreso, {width: `${porcentaje}%`}, consultaCompleta && {backgroundColor: tema.exito}]} />
            {mostrarActividad ? <Animated.View style={[e.actividadProgreso, {
              left: `${porcentaje}%`, width: anchoIndicador,
              opacity: animacionConsulta.interpolate({inputRange: [0, 0.16, 0.8, 1], outputRange: [0, 1, 1, 0]}),
              transform: [{translateX: animacionConsulta.interpolate({inputRange: [0, 1], outputRange: [0, tramoRestante - anchoIndicador]})}],
            }]} /> : null}
          </View>
          {etapa === 'search' ? <Text style={e.datoConsulta}>
            {pagosProcesados === 1 ? '1 pago encontrado' : `${pagosProcesados} pagos encontrados`}
          </Text> : avance && avance.conciliados > 0 ? <Text style={e.datoConsulta}>
            {avance.conciliados} de {avance.tramos} {avance.tramos === 1 ? 'tramo conciliado' : 'tramos conciliados'}
          </Text> : null}
          {detalleEtapa ? <Text style={e.textoSecundario}>{detalleEtapa}</Text> : null}
          {reintentar ? <BotonAccion tema={tema} texto="Retomar consulta" icono="refresh-outline"
            deshabilitado={!puedeConsultar} alPresionar={solicitarDeNuevo} /> : null}
        </View> : null}
        <View style={e.grupoDia}>
          <View style={e.filaEntre}>
            <Text accessibilityRole="header" style={g.subtitulo}>Resultados</Text>
            <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Historial de consultas"
              accessibilityState={{expanded: historialVisible}} style={e.enlace}
              onPress={conRespuestaVisual(() => { establecerCargandoHistorial(true); establecerHistorialVisible(true); })}>
              <Ionicons name="time-outline" size={18} color={tema.foco} />
              <Text style={e.textoEnlace}>Historial</Text>
            </Pressable>
          </View>
          {vistaPrevia ? <View style={e.avisoSoloLectura}>
            <Ionicons name="lock-closed-outline" size={16} color={tema.foco} />
            <Text style={[e.textoSecundario, e.flexible]}>Solo lectura hasta que termine la consulta.</Text>
          </View> : null}
          {consultaCompleta && trabajo && !trabajo.soloIdentificacion && trabajo.total === 0 ? <Text style={e.textoSecundario}>La última consulta no encontró movimientos nuevos.</Text> : null}
          <SelectorSegmentado tema={tema} valor={filtro} alSeleccionar={valor => { establecerFiltro(valor); establecerSeleccionadas([]); establecerLimite(30); }} etiqueta="Filtrar movimientos" opciones={[{id:'pendiente',nombre:'Pendientes',contador:pendientes.length},{id:'ignorado',nombre:'Ignorados',contador:operaciones.filter(op=>op.decision==='ignorado'&&!op.revisionPendiente).length},{id:'registrado',nombre:'Registrados',contador:operaciones.filter(op=>op.decision==='registrado'&&!op.revisionPendiente).length}]} />
          {!visibles.length ? <Text style={e.textoSecundario}>{consultaEnCurso && filtro === 'pendiente' ? 'Los movimientos aparecerán a medida que estén disponibles.' : 'No hay movimientos para este filtro.'}</Text> : agruparMovimientosMp(visibles, limite).map(grupo => <View key={grupo.dia} style={e.grupoDia}><Text style={e.tituloDia}>{grupo.titulo}</Text>{grupo.operaciones.map(op => {
          const borrador = resolverBorradorMp(op,borradores[op.id]), categoria = (borrador.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).find(c => c.id === borrador.categoria);
          const sinDetalle = vistaPrevia || op.provisional;
          const pendienteBloqueado = op.pendienteConfirmacion && !sentidoElegido(op);
          const seleccionable = !sinDetalle && !pendienteBloqueado && filtro !== 'registrado' && !op.revisionPendiente;
          const seleccionada = seleccionActual.includes(op.id);
          const editable = op.decision === 'pendiente' && (seleccionable && op.registrable && !!borrador.tipo || puedeElegirSentido(op));
          const titulo = borrador.descripcion || op.descripcion;
          const colorTipo = borrador.tipo === 'ingreso' ? tema.exito : borrador.tipo === 'egreso' ? tema.error : tema.textoSecundario;
          const contenidoMovimiento = <>
              <View style={e.contenidoMovimiento}>
                <Text numberOfLines={1} style={e.tituloMovimiento}>{titulo}</Text>
                <View style={e.metadatos}>
                  <Text numberOfLines={1} style={[e.fecha,e.flexible]}>{op.revisionPendiente ? 'Cambio para revisar' : pendienteBloqueado ? 'Pendiente de confirmar' : categoria?.nombre || 'Sin categoría'}</Text>
                  <Text style={e.fecha}>{new Date(op.fecha).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</Text>
                </View>
              </View>
              <View style={e.finalMovimiento}><EtiquetaImporte enFila={false} style={[e.tipoMovimiento,{color:colorTipo}]}>{borrador.tipo==='ingreso'?'Ingreso':borrador.tipo==='egreso'?'Egreso':'Sin identificar'}</EtiquetaImporte><Text numberOfLines={1} adjustsFontSizeToFit style={e.importe}>{importe(op,borrador.tipo)}</Text></View>
          </>;
          return <View key={op.id} style={[e.movimiento, seleccionada && e.movimientoSeleccionado]}>
            <View style={[e.iconoMovimiento,{backgroundColor:colorTipo+'18'}]}><Ionicons name={categoria?.icono || 'wallet-outline'} size={18} color={colorTipo}/></View>
            {sinDetalle ? <View style={e.cuerpoMovimiento}>{contenidoMovimiento}</View> :
              <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={editable ? `Editar descripción y categoría de ${titulo}` : `Ver detalle de ${titulo}`} style={e.cuerpoMovimiento} onPress={conRespuestaVisual(() => { if (editable) establecerCategoriaId(op.id); else establecerEditandoId(op.id); })}>
                {contenidoMovimiento}
              </Pressable>}
            {seleccionable?<Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="checkbox" accessibilityState={{checked:seleccionada}} accessibilityLabel={'Seleccionar '+op.descripcion} disabled={ocupada} style={e.controlMovimiento} onPress={conRespuestaVisual(()=>elegir(op.id))}><Ionicons name={seleccionada?'checkbox':'square-outline'} size={22} color={tema.foco}/></Pressable>:null}
          </View>;
        })}</View>)}
        </View>
        {visibles.length > limite ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" style={e.enlace} onPress={conRespuestaVisual(() => establecerLimite(v => v + 30))}><Text style={e.textoEnlace}>Ver más movimientos</Text></Pressable> : null}
        <View style={e.resumen}>
          <View style={e.filaConsulta}>
            <View style={e.proximaConsulta}>
              <View style={e.automaticas}><Ionicons name="time-outline" size={17} color={tema.foco}/><Text style={e.textoEnlace}>Consulta automática</Text></View>
              <Text style={e.textoSecundario}>{estado.settlement ? 'Todos los días a las 12:00 (Argentina)' :
                estado.automatica ? !automaticaDisponible ? proxima : 'Disponible al entrar con conexión' : 'Una vez al día al entrar con conexión'}</Text>
              {estado.settlement ? <Text style={e.aclaracion}>Movimientos del día anterior, de 00:00 a 23:59, hora argentina.</Text> :
                estado.automatica && !automaticaDisponible ? <Text style={e.aclaracion}>Al entrar con conexión</Text> : null}
            </View>
            {!estado.settlement ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" disabled={!puedeConsultar}
              style={[e.buscarDeNuevo, !puedeConsultar && e.deshabilitada]} onPress={conRespuestaVisual(() => { void solicitarDeNuevo(); })}>
              <Ionicons name="search-outline" size={24} color={tema.botonPrincipalTexto}/>
              <Text style={e.textoBoton}>Buscar de nuevo</Text>
              <Text style={e.usosDisponibles}>{estado.manualesRestantes} de 2 usos disponibles</Text>
            </Pressable> : null}
          </View>
        </View>
      </>}
    </DesplazamientoEncabezado>

    <Modal transparent animationType="fade" visible={historialVisible} onRequestClose={()=>establecerHistorialVisible(false)}><AvisosEnModal visible={historialVisible}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}><View style={e.filaEntre}><Text style={[g.subtitulo,e.flexible]}>Historial de consultas</Text><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Cerrar historial" style={e.casilla} onPress={conRespuestaVisual(()=>establecerHistorialVisible(false))}><Ionicons name="close" size={22} color={tema.textoPrincipal}/></Pressable></View><ScrollView contentContainerStyle={e.historialModal}><Text style={e.aclaracion}>Últimas 20 consultas</Text>{cargandoHistorial ? <PuntosCarga size="small" color={tema.foco} /> : !historial.length ? <Text style={e.textoSecundario}>Todavía no hay consultas guardadas.</Text> : historial.map(consulta => <View key={consulta.id} style={e.consultaHistorial}><View style={e.filaEntre}><Text style={e.textoCategoria}>{consulta.clase === 'automatica' ? 'Automática' : 'Manual'} · {nombreEstado(consulta.estado)}</Text><Text style={e.fecha}>{new Date(Number(consulta.creado)).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View><Text style={e.fecha}>{new Date(consulta.truncado && consulta.primera_fecha ? consulta.primera_fecha : consulta.desde).toLocaleDateString('es-AR')} – {new Date(consulta.hasta).toLocaleDateString('es-AR')} · {consulta.total} nuevos</Text>{consulta.truncado ? <Text style={e.fecha}>Límite inicial de 500 alcanzado.</Text> : null}{consulta.error ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" onPress={conRespuestaVisual(()=>mostrarAviso(consulta.error!,{tipo:'error'}))} style={e.enlace}><Text style={e.textoEnlace}>Ver error de consulta</Text></Pressable> : null}</View>)}</ScrollView></View></View></AvisosEnModal></Modal>
    <Modal transparent animationType="fade" visible={!!editando} onRequestClose={() => {if(!respuesta.ocupado)establecerEditandoId(null);}}><AvisosEnModal visible={!!editando}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}>
      <View style={e.filaEntre}><Text style={[g.subtitulo,e.flexible]}>Opciones del movimiento</Text><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Cerrar" disabled={respuesta.ocupado} style={e.casilla} onPress={conRespuestaVisual(() => establecerEditandoId(null))}><Ionicons name="close" size={22} color={tema.textoPrincipal} /></Pressable></View><Text style={e.tituloMovimiento}>{editando?.descripcion}</Text>{editando ? <Text style={e.textoSecundario}>{importe(editando, borradorEditando?.tipo)} · {new Date(editando.fecha).toLocaleString('es-AR')}{editando.contraparte ? ` · ${editando.contraparte}` : ''}</Text> : null}
      <ScrollView keyboardShouldPersistTaps="handled">{editando && borradorEditando ? <>
        {editando.pendienteConfirmacion ? <Text style={e.textoSecundario}>Mercado Pago no aportó datos suficientes para confirmar esta operación. Queda pendiente y no modifica el saldo del depósito.</Text>
          : !borradorEditando.tipo ? <Text style={e.textoSecundario}>Mercado Pago no informó datos suficientes para identificar quién paga y quién cobra. Este pago no se incorporará hasta poder determinar su sentido.</Text> : null}
        {editando.revisionPendiente ? <Text style={e.textoSecundario}>Mercado Pago actualizó este pago. Revisá el movimiento original: AHRE no modificó su saldo.</Text> : null}
      </> : null}</ScrollView>
      {editando && !editando.pendienteConfirmacion && (editando.revisionPendiente ? <BotonAccion tema={tema} texto="Ya revisé el cambio" variante="principal" cargando={respuesta.ocupado} completado={respuesta.completado} deshabilitado={ocupada||respuesta.ocupado} alPresionar={()=>respuesta.ejecutar(()=>decidirMovimientosMp([editando.id], 'revisado'),async()=>{establecerEditandoId(null);await cargar();})} estilo={e.botonConsulta} /> : editando.registrable && editando.decision === 'pendiente' ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" disabled={ocupada || !borradorEditando?.tipo} style={e.enlace} onPress={conRespuestaVisual(() => { if (borradorEditando) { const op = { ...editando, ...borradorEditando }; void ejecutar(async () => { const filas = await consultarCompatiblesMp(op); establecerEditandoId(null); cambiarMovimientoAsociar('');establecerAsociacion({ op, filas }); }); } })}><Text style={e.textoEnlace}>Ya lo registré: asociar movimiento</Text></Pressable> : null)}
    </View></View></AvisosEnModal></Modal>
    <SelectorCategoria tema={tema} estilosGlobales={g} tituloModal="Editar movimiento"
      categorias={borradorCategoria?.tipo === 'ingreso' ? CATEGORIAS_INGRESO : borradorCategoria?.tipo === 'egreso' ? CATEGORIAS_EGRESO : []}
      tipoMovimiento={borradorCategoria?.tipo ?? undefined} seleccionadaId={borradorCategoria?.categoria}
      contenidoAntesDeCategorias={categorizando ? <View style={e.grupoDia}>
        {puedeElegirSentido(categorizando) ? <>
          <Text style={g.etiqueta}>¿La plata entró o salió del depósito?</Text>
          <View style={e.selectorSentido}>
            {(['ingreso', 'egreso'] as const).map(tipo => <BotonAccion key={tipo} tema={tema}
              texto={tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} estilo={e.flexible}
              variante={tipo === borradorCategoria?.tipo ? 'principal' : 'secundario'}
              alPresionar={() => {
                if (tipo !== borradorCategoria?.tipo) cambiarBorrador(categorizando, {tipo, sentidoManual: tipo, categoria: tipo === 'ingreso' ? 'otros_ingresos' : 'otros_gastos'});
              }} />)}
          </View>
        </> : null}
        <Text style={g.etiqueta}>Descripción</Text>
        <TextInput accessibilityLabel="Descripción del movimiento" value={borradorCategoria?.descripcion ?? categorizando.descripcion}
          onFocus={() => cambiarFocoEntrada('descripcion')} onBlur={() => cambiarFocoEntrada(null)} maxLength={500} multiline
          placeholder="Ingresá una descripción" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco}
          returnKeyType="done" submitBehavior="blurAndSubmit"
          style={[e.descripcionEditable, focoEntrada === 'descripcion' && g.campoEnfocado]}
          onChangeText={descripcion => cambiarBorrador(categorizando, {descripcion})} />
        {categorizando.contraparte ? <Text style={e.aclaracion}>{borradorCategoria?.tipo === 'ingreso' ? 'De ' : 'A '}{categorizando.contraparte}</Text> : null}
        {borradorCategoria?.tipo ? <Text style={g.etiqueta}>Categoría</Text> : null}
      </View> : null}
      modalAbierto={!!categorizando} alCerrarModal={() => establecerCategoriaId(null)}
      alSeleccionar={categoria => { if (categorizando) cambiarBorrador(categorizando, {categoria}); }} />
    <Modal transparent animationType="fade" visible={!!asociacion && !vistaPrevia} onRequestClose={()=>{if(!respuesta.ocupado)establecerAsociacion(null);}}><AvisosEnModal visible={!!asociacion && !vistaPrevia}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}>
      <Text style={g.subtitulo}>Elegí un movimiento existente</Text><Text style={e.textoSecundario}>Se vinculará sin crear otro movimiento ni modificar el saldo.</Text>
      <ScrollView>{asociacion?.filas.length?asociacion.filas.map(fila=><Pressable key={fila.id} accessibilityRole="radio" accessibilityState={{checked:movimientoAsociar===fila.id}} disabled={respuesta.ocupado} style={[e.consultaHistorial,movimientoAsociar===fila.id&&g.campoEnfocado]} onPress={()=>cambiarMovimientoAsociar(fila.id)}><Text style={e.tituloMovimiento}>{fila.descripcion}</Text><Text style={e.fecha}>{new Date(fila.fecha_hora).toLocaleString('es-AR')}</Text></Pressable>):<Text style={e.textoSecundario}>No hay movimientos compatibles.</Text>}</ScrollView>
      <BotonAccion tema={tema} texto="Asociar movimiento" cargando={respuesta.ocupado} completado={respuesta.completado} deshabilitado={ocupada||respuesta.ocupado||!movimientoAsociar} alPresionar={()=>{if(!asociacion)return;return respuesta.ejecutar(()=>decidirMovimientosMp([asociacion.op.id],'registrado',borradores,movimientoAsociar),async()=>{establecerAsociacion(null);await cargar();});}}/>
      <BotonAccion tema={tema} texto="Cerrar" variante="cancelar" deshabilitado={respuesta.ocupado} alPresionar={()=>establecerAsociacion(null)}/>
    </View></View></AvisosEnModal></Modal>
  </MarcoEncabezado></SafeAreaView>;
}
