import {useAccionConfirmada} from '../hooks/useConfirmedAction';
import {actualizarTrasOperacion} from '../social/financialOperation';
import {conRespuestaVisual} from '../utils/pressFeedback';
import {iniciarOperacionFinanciera} from '../social/financialOperation';
import BotonAccion from '../components/ActionButton';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import PuntosCarga from '../components/LoadingDots';
import { AvisosEnModal } from '../contexts/ToastContext';
import { useAvisoError, useErrorNotificado } from '../hooks/useErrorNotice';
import { useRegresoProtegido } from '../navigation/useSafeGoBack';
import AccionesSeleccionMp from '../components/MercadoPagoSelectionActions';
import EtiquetaImporte from '../components/AmountLabel';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, AppState, Linking, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
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
import { consultaMpEnCurso, vistaPreviaMp, type BorradorMp, type ConsultaMp, type EstadoMp, type OperacionMp } from '../mercadoPago/types';
import { seguirConsultaMp } from '../mercadoPago/mercadoPagoRealtime';
import { agruparMovimientosMp, alternarSeleccionMp, ordenarMovimientosMp } from '../mercadoPago/mercadoPagoPresentation';
import { observarIntegraciones } from '../integrations/integrationStore';
import { sincronizarIntegraciones } from '../integrations/integrationSync';

const nombreEstado = (estado: string) => ({ completo: 'Completa', fallido: 'Fallida', cancelado: 'Cancelada', pendiente: 'En espera', procesando: 'Buscando' }[estado] || 'En curso');
const importe = (op: OperacionMp, tipo = op.tipo) => `${op.monto > 0 ? tipo === 'egreso' ? '−' : tipo === 'ingreso' ? '+' : '' : ''}${op.moneda === 'ARS' ? '$ ' : op.moneda + ' '}${op.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PantallaMercadoPago({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
 const respuesta=useAccionConfirmada();
 const [movimientoAsociar,cambiarMovimientoAsociar]=useState('');
 const [focoEntrada,cambiarFocoEntrada]=useState<string|null>(null);


  const volverProtegido = useRegresoProtegido(navegacion,()=>operando.current);
  const { tema } = useContext(ContextoApariencia), g = crearEstilosGlobales(tema), e = crearEstilosMercadoPago(tema);
 const estilosEntrada=crearEstilosGlobales(tema);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [estado, establecerEstado] = useState<EstadoMp>(ESTADO_MP_INICIAL), [operaciones, establecerOperaciones] = useState<OperacionMp[]>([]);
  const [borradores, establecerBorradores] = useState<Record<string, BorradorMp>>({}), [seleccionadas, establecerSeleccionadas] = useState<string[]>([]);
  const [filtro, establecerFiltro] = useState('pendiente'), [limite, establecerLimite] = useState(30), [meses, establecerMeses] = useState('1');
  const [error, establecerError] = useErrorNotificado('');
  const [cargando, establecerCargando] = useState(true), [ocupada, establecerOcupada] = useState(false), [refrescando, establecerRefrescando] = useState(false);
  const [enfocada, establecerEnfocada] = useState(false), [activa, establecerActiva] = useState(AppState.currentState === 'active'), [conectada, establecerConectada] = useState(false);
  const [historialVisible, establecerHistorialVisible] = useState(false), [historial, establecerHistorial] = useState<ConsultaMp[]>([]), [cargandoHistorial, establecerCargandoHistorial] = useState(false);
  const [categoriaId, establecerCategoriaId] = useState<string | null>(null);
  const [editandoId, establecerEditandoId] = useState<string | null>(null);
  const [asociacion, establecerAsociacion] = useState<{ op: OperacionMp; filas: { id: string; descripcion: string; fecha_hora: string }[] } | null>(null);
  const operando = useRef(false), montada = useRef(true);
  const consultaObservada = useRef<{ id: string; estado: string } | null>(null);
  useEffect(() => { if (error) Alert.alert('No se pudo completar la acción', error); }, [error]);
  useEffect(() => { montada.current = true; return () => { montada.current = false; }; }, []);
  const cargar = useCallback(async () => {
    const [datos, guardados] = await Promise.all([cargarMercadoPago(), cargarBorradoresMp()]);
    actualizarTrasOperacion(()=>{if (montada.current) {
      establecerEstado(datos.estado); establecerOperaciones(datos.operaciones); establecerBorradores(prev => ({ ...guardados, ...prev }));
      establecerSeleccionadas(prev => prev.filter(id => datos.operaciones.some(op => op.id === id && !op.revisionPendiente && op.decision !== 'registrado'))); establecerCargando(false);
    }});
    return datos;
  }, []);
  useFocusEffect(useCallback(() => {
    let vigente = true; establecerEnfocada(true); establecerActiva(AppState.currentState === 'active');
    const actualizar = () => { void sincronizarIntegraciones().catch(() => { if (vigente) establecerError('No pudimos actualizar. Tus datos descargados siguen disponibles.'); }); };
    void cargar().catch(() => { if (vigente) { establecerError('No se pudo cargar la revisión.'); establecerCargando(false); } }); actualizar();
    const dejar = observarIntegraciones(() => { if (vigente) void cargar().catch(() => {}); });
    const retorno = AppState.addEventListener('change', valor => { establecerActiva(valor === 'active'); if (valor === 'active') actualizar(); });
    return () => { vigente = false; establecerEnfocada(false); dejar(); retorno.remove(); };
  }, [cargar]));
  const vinculada = estado.vinculacion, depositoId = ruta.params?.depositoId || vinculada?.deposito_id;
  useAvisoError(vinculada?.error ? vinculada.error + ' Gestioná la conexión desde las opciones del depósito.' : null);
  const otraVinculacion = vinculada && ruta.params?.depositoId && vinculada.deposito_id !== ruta.params.depositoId;
  const consultaEnCurso = consultaMpEnCurso(estado.trabajo), trabajoId = estado.trabajo?.id, version = vinculada?.version;
  const vistaPrevia = vistaPreviaMp(estado.trabajo);
  const avance = estado.trabajo?.settlement;
  const reintentar = !!avance && estado.trabajo?.estado === 'fallido';
  const mostrarConsulta = !estado.settlement || reintentar;
  const puedeConsultar = !ocupada && !consultaEnCurso && (estado.settlement ? reintentar : estado.manualesRestantes > 0);
  const proximaAutomatica = estado.automatica?.proximaDisponible;
  const pagosProcesados = Number(estado.trabajo?.procesados ?? estado.trabajo?.total ?? 0);
  const porcentaje = !avance ? 0 : estado.trabajo?.estado === 'completo' ? 100
    : avance.etapa === 'search' ? 0 : Math.round(100 * (1 + avance.conciliados) / (2 + avance.tramos));
  const textoEtapa = reintentar ? 'Consulta en pausa. Podés retomarla.'
    : estado.trabajo?.estado === 'completo' ? 'Consulta conciliada'
    : avance?.etapa === 'search' ? 'Buscando pagos en Search'
    : avance?.etapa === 'conciliacion' ? 'Conciliando movimientos' : 'Corroborando con el reporte de Mercado Pago';
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
  const refrescar = async () => { establecerRefrescando(true); try { await ejecutar(() => sincronizarIntegraciones(false, false)); } finally { if (montada.current) establecerRefrescando(false); } };
  const pendientes = operaciones.filter(op => op.decision === 'pendiente' || op.revisionPendiente);
  const visibles = ordenarMovimientosMp(operaciones.filter(op => filtro === 'pendiente' ? op.decision === 'pendiente' || op.revisionPendiente : op.decision === filtro && !op.revisionPendiente));
  const elegibles = vistaPrevia ? [] : visibles.filter(op => !op.revisionPendiente && !op.provisional && !op.pendienteConfirmacion), seleccionActual = seleccionadas.filter(id => elegibles.some(op => op.id === id));
  const todasSeleccionadas = elegibles.length > 0 && elegibles.slice(0, 500).every(op => seleccionActual.includes(op.id));
  const secciones = avance && trabajoId ? [
    {titulo: 'Resultados de Search', vacio: consultaEnCurso && avance.etapa === 'search' ? 'Buscando pagos del período…' : 'No hay pagos de Search para este filtro.', filas: visibles.filter(op => op.consultaSettlement === trabajoId && op.origenSettlement !== 'reporte')},
    {titulo: 'Movimientos aportados por Settlement', vacio: vistaPrevia ? 'Los movimientos del reporte aparecerán cuando termine la conciliación.' : 'No hay movimientos adicionales del reporte para este filtro.', filas: visibles.filter(op => op.consultaSettlement === trabajoId && op.origenSettlement === 'reporte')},
    {titulo: 'Historial anterior', vacio: '', filas: visibles.filter(op => op.consultaSettlement !== trabajoId)},
  ] : [{titulo: '', vacio: 'No hay movimientos para este filtro.', filas: visibles}];
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
  const invalidos = operaciones.filter(op => seleccionActual.includes(op.id) && (!op.registrable || op.moneda !== 'ARS' || !op.tipo));
  const motivoRegistroBloqueado = !seleccionActual.length ? 'Seleccioná al menos un movimiento con su casilla derecha.' : invalidos.length ? `${invalidos.length} seleccionado(s) no se pueden registrar: ${invalidos.slice(0, 3).map(op => `${op.descripcion}: ${op.monto === 0 ? 'importe cero' : op.moneda !== 'ARS' ? 'moneda distinta de pesos' : !op.tipo ? 'sentido sin identificar' : 'pago todavía no aprobado'}`).join('; ')}. Desmarcalos para registrar los demás. Podés ignorarlos por separado.` : '';
  const proxima = estado.automatica ? new Date(estado.automatica.proximaDisponible).toLocaleString('es-AR', { timeZone: estado.automatica.zona, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
  const fechaPeriodo = (fecha: string) => new Date(fecha).toLocaleDateString('es-AR', { timeZone: estado.settlement ? estado.automatica?.zona : undefined });
  const automaticaDisponible = estado.automatica && Date.parse(estado.automatica.proximaDisponible) <= Date.now();
  return <SafeAreaView edges={['top', 'bottom']} style={g.areaSegura}><MarcoEncabezado style={g.pantalla} tema={tema} encabezado={<EncabezadoSeccion tema={tema} titulo="Mercado Pago" descripcion="Revisá e incorporá tus movimientos." alVolver={() => volverProtegido()} />}>
    {vinculada && !otraVinculacion && filtro !== 'registrado' && !cargando && !vistaPrevia ? <AccionesSeleccionMp tema={tema} cantidad={seleccionActual.length} todas={todasSeleccionadas} disponibles={!!elegibles.length} completado={respuesta.completado} ocupada={ocupada||respuesta.ocupado} recuperando={filtro==='ignorado'} motivoBloqueo={motivoRegistroBloqueado} alAlternar={()=>establecerSeleccionadas(alternarSeleccionMp(elegibles,seleccionActual))} alRegistrar={()=>decidir(filtro==='ignorado'?'recuperado':'registrado')} alIgnorar={()=>decidir('ignorado')}/> : null}
    <DesplazamientoEncabezado pointerEvents={ocupada?'none':'auto'} contentContainerStyle={e.contenido} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { void refrescar(); }} tintColor={tema.foco} />}>
      {cargando ? <PuntosCarga color={tema.foco} /> : otraVinculacion ? <Text style={g.textoError}>Ya tenés otro depósito vinculado. Gestioná la conexión desde sus opciones.</Text> : !vinculada ? <View style={e.resumen}>
        <Text style={g.subtitulo}>Conectá tu cuenta</Text><Text style={e.textoSecundario}>Elegí qué pagos incorporar a este depósito.</Text><Text style={g.etiqueta}>Historial inicial</Text>
        <SelectorSegmentado tema={tema} valor={meses} alSeleccionar={establecerMeses}
          opciones={[{ id: '1', nombre: '1 mes' }, { id: '2', nombre: '2 meses' }, { id: '3', nombre: '3 meses' }]} etiqueta="Historial inicial" />
        <Text style={e.textoSecundario}>{estado.settlement ? 'Período anterior a la creación de este depósito.' : 'Hasta 500 pagos recientes del período elegido.'}</Text>
        {!depositoId ? <Text style={e.textoSecundario}>Abrí un depósito para vincular tu cuenta.</Text> : <BotonAccion tema={tema} texto="Autorizar en Mercado Pago" variante="principal" cargando={ocupada} deshabilitado={ocupada} alPresionar={()=>ejecutar(async () => { await sincronizarIntegraciones(true); const respuesta = await iniciarVinculacion(depositoId, Number(meses)); await Linking.openURL(respuesta.url); })} estilo={[e.botonConsulta]} />}
      </View> : <>
        <View style={e.resumen}>
          <View style={e.identidadResumen}><View style={e.emblemaCuenta}><Ionicons name="wallet-outline" size={24} color={tema.foco}/></View><View style={e.flexible}><Text style={e.tituloResumen}>Tu cuenta de Mercado Pago</Text><Text style={e.aclaracion}>Conectada a este depósito</Text></View><Ionicons name="checkmark-circle" size={18} color={tema.exito}/></View>
          <View style={e.balanceResumen}><Text style={e.contador}>{pendientes.length}<Text style={e.etiquetaContador}> pendientes</Text></Text><Text style={e.textoSecundario}>{operaciones.length} obtenidos</Text></View>
          <View style={e.filaConsulta}>
            <View style={e.proximaConsulta}>
              <View style={e.automaticas}><Ionicons name="time-outline" size={17} color={tema.foco}/><Text style={e.textoEnlace}>Consulta automática</Text></View>
              <Text style={e.textoSecundario}>{estado.settlement ? 'Todos los días a las 12:00 (Argentina)' :
                estado.automatica ? !automaticaDisponible ? proxima : 'Disponible al entrar con conexión' : 'Una vez al día al entrar con conexión'}</Text>
              {estado.settlement ? <Text style={e.aclaracion}>Movimientos del día anterior</Text> :
                estado.automatica && !automaticaDisponible ? <Text style={e.aclaracion}>Al entrar con conexión</Text> : null}
              {consultaEnCurso && (!avance || avance.etapa === 'search') ? <Text style={e.aclaracion}>{estado.trabajo?.soloIdentificacion
                ? 'Completando identificación de pagos guardados…' : conectada ? 'Resultados en vivo' : 'Conectando para actualizar…'}</Text> : null}
            </View>
            {mostrarConsulta ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" disabled={!puedeConsultar}
              style={[e.buscarDeNuevo, !puedeConsultar && e.deshabilitada]}
              onPress={conRespuestaVisual(() => { void ejecutar(async () => { await solicitarConsultaMp('manual'); await sincronizarIntegraciones(false, false); }); })}>
              <Ionicons name={reintentar ? 'refresh-outline' : 'search-outline'} size={24} color={tema.botonPrincipalTexto}/>
              <Text style={e.textoBoton}>{reintentar ? 'Retomar consulta' : 'Buscar de nuevo'}</Text>
              {!estado.settlement ? <Text style={e.usosDisponibles}>{estado.manualesRestantes} de 2 usos disponibles</Text> : null}
            </Pressable> : null}
          </View>
          {avance && estado.trabajo ? <View>
            <Text style={e.textoSecundario}>{textoEtapa}</Text>
            <View accessible accessibilityRole="progressbar" accessibilityLabel={textoEtapa}
              accessibilityValue={{min: 0, max: 100, now: porcentaje, text: avance.conciliados + ' de ' + avance.tramos + ' tramos de reporte'}}
              style={e.pistaProgreso}>
              <View style={[e.rellenoProgreso, {width: (porcentaje + '%') as import('react-native').DimensionValue}]} />
            </View>
            {consultaEnCurso && avance.etapa === 'search' ? <PuntosCarga size="small" color={tema.foco} /> : null}
            <Text style={e.aclaracion}>{fechaPeriodo(estado.trabajo.desde)} – {fechaPeriodo(estado.trabajo.hasta)}</Text>
          </View> : consultaEnCurso ? <PuntosCarga size="small" color={tema.foco} /> : null}
          {vistaPrevia ? <Text accessibilityLiveRegion="polite" style={e.textoSecundario}>
            Solo lectura{avance && avance.etapa !== 'search' && !reintentar ? ' · Corroborando con el reporte' : ''}
            {pagosProcesados > 0 ? ' · Pagos de Search: ' + pagosProcesados : ''}
            {avance && avance.etapa !== 'search' ? ' · ' + avance.conciliados + ' de ' + avance.tramos + ' tramos conciliados' : ''}
          </Text> : null}
          {estado.trabajo?.estado === 'completo' && !estado.trabajo.soloIdentificacion && estado.trabajo.total === 0 ? <Text style={e.textoSecundario}>No tenés movimientos nuevos.</Text> : null}


          <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityState={{ expanded: historialVisible }} style={e.enlace} onPress={conRespuestaVisual(() => { if (!historialVisible) establecerCargandoHistorial(true); establecerHistorialVisible(v => !v); })}><Text style={e.textoEnlace}>Historial de consultas</Text><Ionicons name="time-outline" size={16} color={tema.foco} /></Pressable>

        </View>
        <SelectorSegmentado tema={tema} valor={filtro} alSeleccionar={valor => { establecerFiltro(valor); establecerSeleccionadas([]); establecerLimite(30); }} etiqueta="Filtrar movimientos" opciones={[{id:'pendiente',nombre:'Pendientes',contador:pendientes.length},{id:'ignorado',nombre:'Ignorados',contador:operaciones.filter(op=>op.decision==='ignorado'&&!op.revisionPendiente).length},{id:'registrado',nombre:'Registrados',contador:operaciones.filter(op=>op.decision==='registrado'&&!op.revisionPendiente).length}]} />
        {secciones.map(({titulo, vacio, filas}) => titulo === 'Historial anterior' && !filas.length ? null : <View key={titulo} style={e.grupoDia}>
          {titulo ? <Text style={g.subtitulo}>{titulo}</Text> : null}
          {!filas.length ? <Text style={e.textoSecundario}>{vacio}</Text> : agruparMovimientosMp(filas, limite).map(grupo => <View key={grupo.dia} style={e.grupoDia}><Text style={e.tituloDia}>{grupo.titulo}</Text>{grupo.operaciones.map(op => {
          const borrador = resolverBorradorMp(op,borradores[op.id]), categoria = (borrador.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).find(c => c.id === borrador.categoria);
          const soloLectura = vistaPrevia || op.provisional || op.pendienteConfirmacion;const seleccionable = !soloLectura && filtro !== 'registrado' && !op.revisionPendiente, seleccionada = seleccionActual.includes(op.id);
          const colorTipo = borrador.tipo === 'ingreso' ? tema.exito : borrador.tipo === 'egreso' ? tema.error : tema.textoSecundario;
          const contenidoMovimiento = <>
              <View style={e.contenidoMovimiento}><Text numberOfLines={1} style={e.tituloMovimiento}>{borrador.descripcion || op.descripcion}</Text><View style={e.metadatos}><Text numberOfLines={1} style={[e.fecha,e.flexible]}>{op.pendienteConfirmacion ? 'Pendiente de confirmar' : op.revisionPendiente ? 'Cambio para revisar' : !op.registrable ? op.monto===0?'Sin importe':'No registrable' : categoria?.nombre || 'Sin categoría'}</Text><Text style={e.fecha}>{new Date(op.fecha).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</Text></View></View>
              <View style={e.finalMovimiento}><EtiquetaImporte enFila={false} style={[e.tipoMovimiento,{color:colorTipo}]}>{borrador.tipo==='ingreso'?'Ingreso':borrador.tipo==='egreso'?'Egreso':'Sin identificar'}</EtiquetaImporte><Text numberOfLines={1} adjustsFontSizeToFit style={e.importe}>{importe(op,borrador.tipo)}</Text></View>
          </>;
          return <View key={op.id} style={[e.movimiento, seleccionada && e.movimientoSeleccionado]}>
            <View style={[e.iconoMovimiento,{backgroundColor:colorTipo+'18'}]}><Ionicons name={categoria?.icono || 'wallet-outline'} size={18} color={colorTipo}/></View>
            {soloLectura ? <View style={e.cuerpoMovimiento}>{contenidoMovimiento}</View> :
              <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={op.descripcion + '. Ver categoría y detalle'} style={e.cuerpoMovimiento} onPress={conRespuestaVisual(() => { if(op.decision==='pendiente'&&op.registrable&&borrador.tipo&&!op.revisionPendiente) establecerCategoriaId(op.id); else establecerEditandoId(op.id); })}>
                {contenidoMovimiento}
              </Pressable>}
            {seleccionable?<Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="checkbox" accessibilityState={{checked:seleccionada}} accessibilityLabel={'Seleccionar '+op.descripcion} disabled={ocupada} style={e.controlMovimiento} onPress={conRespuestaVisual(()=>elegir(op.id))}><Ionicons name={seleccionada?'checkbox':'square-outline'} size={22} color={tema.foco}/></Pressable>:null}
          </View>;
        })}</View>)}</View>)}
        {secciones.some(seccion => seccion.filas.length > limite) ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" style={e.enlace} onPress={conRespuestaVisual(() => establecerLimite(v => v + 30))}><Text style={e.textoEnlace}>Ver más movimientos</Text></Pressable> : null}
      </>}
    </DesplazamientoEncabezado>

    <Modal transparent animationType="fade" visible={historialVisible} onRequestClose={()=>establecerHistorialVisible(false)}><AvisosEnModal visible={historialVisible}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}><View style={e.filaEntre}><Text style={[g.subtitulo,e.flexible]}>Historial de consultas</Text><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Cerrar historial" style={e.casilla} onPress={conRespuestaVisual(()=>establecerHistorialVisible(false))}><Ionicons name="close" size={22} color={tema.textoPrincipal}/></Pressable></View><ScrollView contentContainerStyle={e.historialModal}><Text style={e.aclaracion}>Últimas 20 consultas</Text>{cargandoHistorial ? <PuntosCarga size="small" color={tema.foco} /> : !historial.length ? <Text style={e.textoSecundario}>Todavía no hay consultas guardadas.</Text> : historial.map(consulta => <View key={consulta.id} style={e.consultaHistorial}><View style={e.filaEntre}><Text style={e.textoCategoria}>{consulta.clase === 'automatica' ? 'Automática' : 'Manual'} · {nombreEstado(consulta.estado)}</Text><Text style={e.fecha}>{new Date(Number(consulta.creado)).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View><Text style={e.fecha}>{new Date(consulta.truncado && consulta.primera_fecha ? consulta.primera_fecha : consulta.desde).toLocaleDateString('es-AR')} – {new Date(consulta.hasta).toLocaleDateString('es-AR')} · {consulta.total} nuevos</Text>{consulta.truncado ? <Text style={e.fecha}>Límite inicial de 500 alcanzado.</Text> : null}{consulta.error ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" onPress={conRespuestaVisual(()=>mostrarAviso(consulta.error!,{tipo:'error'}))} style={e.enlace}><Text style={e.textoEnlace}>Ver error de consulta</Text></Pressable> : null}</View>)}</ScrollView></View></View></AvisosEnModal></Modal>
    <Modal transparent animationType="fade" visible={!!editando} onRequestClose={() => {if(!respuesta.ocupado)establecerEditandoId(null);}}><AvisosEnModal visible={!!editando}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}>
      <View style={e.filaEntre}><Text style={[g.subtitulo,e.flexible]}>Opciones del movimiento</Text><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Cerrar" disabled={respuesta.ocupado} style={e.casilla} onPress={conRespuestaVisual(() => establecerEditandoId(null))}><Ionicons name="close" size={22} color={tema.textoPrincipal} /></Pressable></View><Text style={e.tituloMovimiento}>{editando?.descripcion}</Text>{editando ? <Text style={e.textoSecundario}>{importe(editando, borradorEditando?.tipo)} · {new Date(editando.fecha).toLocaleString('es-AR')}{editando.contraparte ? ` · ${editando.contraparte}` : ''}</Text> : null}
      <ScrollView keyboardShouldPersistTaps="handled">{editando && borradorEditando ? <>
        {!editando.registrable ? <Text style={e.textoSecundario}>{editando.monto === 0 ? 'Mercado Pago informó este pago con $0. No se registra ni afecta tu saldo. Podés ignorarlo.' : 'Solo se registran pagos aprobados en pesos con importe mayor a cero.'}</Text> : !borradorEditando.tipo ? <Text style={e.textoSecundario}>Mercado Pago no informó datos suficientes para identificar quién paga y quién cobra. Este pago no se incorporará hasta poder determinar su sentido.</Text> : editando.decision === 'pendiente' && !editando.revisionPendiente ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" style={e.enlace} onPress={conRespuestaVisual(()=>{establecerEditandoId(null);establecerCategoriaId(editando.id);})}><Ionicons name="pricetags-outline" size={22} color={tema.foco}/><Text style={e.textoEnlace}>Cambiar categoría</Text><Ionicons name="chevron-forward" size={18} color={tema.foco}/></Pressable> : null}
        {editando.revisionPendiente ? <Text style={e.textoSecundario}>Mercado Pago actualizó este pago. Revisá el movimiento original: AHRE no modificó su saldo.</Text> : null}
      </> : null}</ScrollView>
      {editando?.revisionPendiente ? <BotonAccion tema={tema} texto={"Ya revisé el cambio"} variante="principal" cargando={respuesta.ocupado} completado={respuesta.completado} deshabilitado={ocupada||respuesta.ocupado} alPresionar={()=>respuesta.ejecutar(()=>decidirMovimientosMp([editando.id], 'revisado'),async()=>{establecerEditandoId(null);await cargar();})} estilo={e.botonConsulta} /> : editando?.registrable && editando.decision === 'pendiente' ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" disabled={ocupada || !borradorEditando?.tipo} style={e.enlace} onPress={conRespuestaVisual(() => { if (borradorEditando) { const op = { ...editando, ...borradorEditando }; void ejecutar(async () => { const filas = await consultarCompatiblesMp(op); establecerEditandoId(null); cambiarMovimientoAsociar('');establecerAsociacion({ op, filas }); }); } })}><Text style={e.textoEnlace}>Ya lo registré: asociar movimiento</Text></Pressable> : null}
    </View></View></AvisosEnModal></Modal>
    <SelectorCategoria tema={tema} estilosGlobales={g} categorias={borradorCategoria?.tipo==='ingreso'?CATEGORIAS_INGRESO:CATEGORIAS_EGRESO} tipoMovimiento={borradorCategoria?.tipo || 'egreso'} seleccionadaId={borradorCategoria?.categoria} contenidoAntesDeCategorias={categorizando ? <View style={e.grupoDia}><Text style={g.etiqueta}>Descripción</Text><TextInput onFocus={()=>cambiarFocoEntrada("0")} onBlur={()=>cambiarFocoEntrada(null)} accessibilityLabel="Descripción del movimiento" value={borradorCategoria?.descripcion??categorizando.descripcion} maxLength={500} multiline style={[e.descripcionEditable,estilosEntrada.campo,focoEntrada==="0"&&estilosEntrada.campoEnfocado]} onChangeText={descripcion=>cambiarBorrador(categorizando,{descripcion})}/>{categorizando.contraparte ? <Text style={e.aclaracion}>{categorizando.tipo === 'ingreso' ? 'De ' : 'A '}{categorizando.contraparte}</Text> : null}</View>:null} modalAbierto={!!categorizando} alCerrarModal={()=>establecerCategoriaId(null)} alSeleccionar={categoria=>{if(categorizando)cambiarBorrador(categorizando,{categoria});establecerCategoriaId(null);}} />
    <Modal transparent animationType="fade" visible={!!asociacion && !vistaPrevia} onRequestClose={()=>{if(!respuesta.ocupado)establecerAsociacion(null);}}><AvisosEnModal visible={!!asociacion && !vistaPrevia}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}>
      <Text style={g.subtitulo}>Elegí un movimiento existente</Text><Text style={e.textoSecundario}>Se vinculará sin crear otro movimiento ni modificar el saldo.</Text>
      <ScrollView>{asociacion?.filas.length?asociacion.filas.map(fila=><Pressable key={fila.id} accessibilityRole="radio" accessibilityState={{checked:movimientoAsociar===fila.id}} disabled={respuesta.ocupado} style={[e.consultaHistorial,movimientoAsociar===fila.id&&g.campoEnfocado]} onPress={()=>cambiarMovimientoAsociar(fila.id)}><Text style={e.tituloMovimiento}>{fila.descripcion}</Text><Text style={e.fecha}>{new Date(fila.fecha_hora).toLocaleString('es-AR')}</Text></Pressable>):<Text style={e.textoSecundario}>No hay movimientos compatibles.</Text>}</ScrollView>
      <BotonAccion tema={tema} texto="Asociar movimiento" cargando={respuesta.ocupado} completado={respuesta.completado} deshabilitado={ocupada||respuesta.ocupado||!movimientoAsociar} alPresionar={()=>{if(!asociacion)return;return respuesta.ejecutar(()=>decidirMovimientosMp([asociacion.op.id],'registrado',borradores,movimientoAsociar),async()=>{establecerAsociacion(null);await cargar();});}}/>
      <BotonAccion tema={tema} texto="Cerrar" variante="cancelar" deshabilitado={respuesta.ocupado} alPresionar={()=>establecerAsociacion(null)}/>
    </View></View></AvisosEnModal></Modal>
  </MarcoEncabezado></SafeAreaView>;
}
