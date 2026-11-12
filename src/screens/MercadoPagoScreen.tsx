import EtiquetaImporte from '../components/AmountLabel';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, AppState, Linking, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
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
import type { BorradorMp, ConsultaMp, EstadoMp, OperacionMp } from '../mercadoPago/types';
import { seguirConsultaMp } from '../mercadoPago/mercadoPagoRealtime';
import { agruparMovimientosMp, alternarSeleccionMp, ordenarMovimientosMp } from '../mercadoPago/mercadoPagoPresentation';
import { observarIntegraciones } from '../integrations/integrationStore';
import { sincronizarIntegraciones } from '../integrations/integrationSync';

const nombreEstado = (estado: string) => ({ completo: 'Completa', fallido: 'Fallida', cancelado: 'Cancelada', pendiente: 'En espera', procesando: 'Buscando' }[estado] || 'En curso');
const importe = (op: OperacionMp, tipo = op.tipo) => `${op.monto > 0 ? tipo === 'egreso' ? '−' : tipo === 'ingreso' ? '+' : '' : ''}${op.moneda === 'ARS' ? '$ ' : op.moneda + ' '}${op.monto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;

export default function PantallaMercadoPago({ navigation: navegacion, route: ruta }: import('../navigation/types').PropiedadesPantalla) {
  const { tema } = useContext(ContextoApariencia), g = crearEstilosGlobales(tema), e = crearEstilosMercadoPago(tema);
  const { mostrarAviso } = useContext(ContextoAvisos);
  const [estado, establecerEstado] = useState<EstadoMp>(ESTADO_MP_INICIAL), [operaciones, establecerOperaciones] = useState<OperacionMp[]>([]);
  const [borradores, establecerBorradores] = useState<Record<string, BorradorMp>>({}), [seleccionadas, establecerSeleccionadas] = useState<string[]>([]);
  const [filtro, establecerFiltro] = useState('pendiente'), [limite, establecerLimite] = useState(30), [meses, establecerMeses] = useState('1');
  const [error, establecerError] = useState(''), [mensaje, establecerMensaje] = useState('');
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
    if (montada.current) {
      establecerEstado(datos.estado); establecerOperaciones(datos.operaciones); establecerBorradores(prev => ({ ...guardados, ...prev }));
      establecerSeleccionadas(prev => prev.filter(id => datos.operaciones.some(op => op.id === id && !op.revisionPendiente && op.decision !== 'registrado'))); establecerCargando(false);
    }
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
  const otraVinculacion = vinculada && ruta.params?.depositoId && vinculada.deposito_id !== ruta.params.depositoId;
  const consultaEnCurso = ['pendiente', 'procesando'].includes(estado.trabajo?.estado || ''), trabajoId = estado.trabajo?.id, version = vinculada?.version;
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
    if (!historialVisible) return;
    let vigente = true; establecerCargandoHistorial(true);
    void consultarHistorialMp().then(filas => { if (vigente) establecerHistorial(filas); }).catch(() => { if (vigente) establecerError('No pudimos actualizar el historial de consultas.'); }).finally(() => { if (vigente) establecerCargandoHistorial(false); });
    return () => { vigente = false; };
  }, [historialVisible]);
  const ejecutar = async (accion: () => Promise<unknown>, exito = '') => {
    if (operando.current) return;
    operando.current = true; establecerOcupada(true); establecerError(''); establecerMensaje('');
    try { await accion(); if (montada.current) { establecerMensaje(exito); await cargar(); } }
    catch (err) { if (montada.current) establecerError(err instanceof Error ? err.message : 'No se pudo completar la operación.'); }
    finally { operando.current = false; if (montada.current) establecerOcupada(false); }
  };
  const refrescar = async () => { establecerRefrescando(true); try { await ejecutar(() => sincronizarIntegraciones(false, false)); } finally { if (montada.current) establecerRefrescando(false); } };
  const pendientes = operaciones.filter(op => op.decision === 'pendiente' || op.revisionPendiente);
  const visibles = ordenarMovimientosMp(operaciones.filter(op => filtro === 'pendiente' ? op.decision === 'pendiente' || op.revisionPendiente : op.decision === filtro && !op.revisionPendiente));
  const elegibles = visibles.filter(op => !op.revisionPendiente), seleccionActual = seleccionadas.filter(id => elegibles.some(op => op.id === id));
  const todasSeleccionadas = elegibles.length > 0 && elegibles.slice(0, 500).every(op => seleccionActual.includes(op.id)), grupos = agruparMovimientosMp(visibles, limite);
  const categorizando = operaciones.find(op => op.id === categoriaId);
  const borradorCategoria = categorizando ? resolverBorradorMp(categorizando,borradores[categorizando.id]) : null;
  const editando = operaciones.find(op => op.id === editandoId), borradorEditando = editando ? resolverBorradorMp(editando,borradores[editando.id]) : null;
  const cambiarBorrador = (op: OperacionMp, cambios: Partial<BorradorMp>) => {
    const valor = { ...(resolverBorradorMp(op,borradores[op.id])), ...cambios }; establecerBorradores(prev => ({ ...prev, [op.id]: valor }));
    void guardarBorradorMp(op.id, valor).catch(() => establecerError('No se pudieron guardar los cambios del movimiento.'));
  };
  const elegir = (id: string) => {
    if (seleccionActual.includes(id)) establecerSeleccionadas(prev => prev.filter(valor => valor !== id));
    else if (seleccionActual.length >= 500) establecerError('Podés seleccionar hasta 500 movimientos por vez.');
    else establecerSeleccionadas(prev => [...prev, id]);
  };
  const decidir = (decision: 'registrado' | 'ignorado' | 'recuperado') => {
    const ids = seleccionActual;
    if (!ids.length) { Alert.alert('Seleccioná movimientos', 'Marcá la casilla derecha de uno o varios movimientos. Registrar no consume usos de búsqueda.'); return; }
    if (decision === 'registrado' && motivoRegistroBloqueado) { Alert.alert('No se pueden registrar los seleccionados', motivoRegistroBloqueado); return; }
    Alert.alert(decision === 'registrado' ? 'Registrar movimientos' : decision === 'ignorado' ? 'Ignorar movimientos' : 'Recuperar movimientos', `${ids.length} seleccionados. ${decision === 'registrado' ? 'Se incorporarán al depósito con las categorías elegidas.' : 'Los demás conservarán su estado.'}`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: () => { void ejecutar(async () => { await decidirMovimientosMp(ids, decision, borradores); establecerSeleccionadas([]); }, 'Decisión guardada.'); } }]);
  };
  const invalidos = operaciones.filter(op => seleccionActual.includes(op.id) && (!op.registrable || op.moneda !== 'ARS' || !op.tipo));
  const motivoRegistroBloqueado = !seleccionActual.length ? 'Seleccioná al menos un movimiento con su casilla derecha.' : invalidos.length ? `${invalidos.length} seleccionado(s) no se pueden registrar: ${invalidos.slice(0, 3).map(op => `${op.descripcion}: ${op.monto === 0 ? 'importe cero' : op.moneda !== 'ARS' ? 'moneda distinta de pesos' : !op.tipo ? 'sentido sin identificar' : 'pago todavía no aprobado'}`).join('; ')}. Desmarcalos para registrar los demás. Podés ignorarlos por separado.` : '';
  const proxima = estado.automatica ? new Date(estado.automatica.proximaDisponible).toLocaleString('es-AR', { timeZone: estado.automatica.zona, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
  const automaticaDisponible = estado.automatica && Date.parse(estado.automatica.proximaDisponible) <= Date.now();
  return <SafeAreaView edges={['top', 'bottom']} style={g.areaSegura}><MarcoEncabezado style={g.pantalla} tema={tema} encabezado={<EncabezadoSeccion tema={tema} titulo="Mercado Pago" descripcion="Revisá e incorporá tus movimientos." alVolver={() => navegacion.goBack()} />}>
    <DesplazamientoEncabezado contentContainerStyle={e.contenido} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { void refrescar(); }} tintColor={tema.foco} />}>
      {mensaje ? <Text style={e.textoSecundario} accessibilityLiveRegion="polite">{mensaje}</Text> : null}
      {cargando ? <ActivityIndicator color={tema.foco} /> : otraVinculacion ? <Text style={g.textoError}>Ya tenés otro depósito vinculado. Gestioná la conexión desde sus opciones.</Text> : !vinculada ? <View style={e.resumen}>
        <Text style={g.subtitulo}>Conectá tu cuenta</Text><Text style={e.textoSecundario}>Elegí qué pagos incorporar a este depósito.</Text><Text style={g.etiqueta}>Historial inicial</Text>
        <SelectorSegmentado tema={tema} valor={meses} alSeleccionar={establecerMeses} opciones={[{ id: '1', nombre: '1 mes' }, { id: '2', nombre: '2 meses' }, { id: '3', nombre: '3 meses' }]} etiqueta="Historial inicial" /><Text style={e.textoSecundario}>Hasta 500 pagos recientes del período elegido.</Text>
        {!depositoId ? <Text style={e.textoSecundario}>Abrí un depósito para vincular tu cuenta.</Text> : <Pressable accessibilityRole="button" disabled={ocupada} style={[e.botonConsulta, ocupada && e.deshabilitada]} onPress={() => { void ejecutar(async () => { await sincronizarIntegraciones(true); const respuesta = await iniciarVinculacion(depositoId, Number(meses)); await Linking.openURL(respuesta.url); }); }}><Text style={e.textoBoton}>Vincular Mercado Pago</Text></Pressable>}
      </View> : <>
        <View style={e.resumen}>
          <View style={e.identidadResumen}><View style={e.emblemaCuenta}><Ionicons name="wallet-outline" size={24} color={tema.foco}/></View><View style={e.flexible}><Text style={e.tituloResumen}>Tu cuenta de Mercado Pago</Text><Text style={e.aclaracion}>Conectada a este depósito</Text></View><Ionicons name="checkmark-circle" size={18} color={tema.exito}/></View>
          <View style={e.balanceResumen}><Text style={e.contador}>{pendientes.length}<Text style={e.etiquetaContador}> pendientes</Text></Text><Text style={e.textoSecundario}>{operaciones.length} obtenidos</Text></View>
          <View style={e.filaConsulta}><View style={e.proximaConsulta}><View style={e.automaticas}><Ionicons name="time-outline" size={17} color={tema.foco}/><Text style={e.textoEnlace}>Próxima búsqueda automática</Text></View><Text style={e.textoSecundario}>{estado.automatica ? !automaticaDisponible ? proxima : 'Disponible al entrar con conexión' : 'Una vez al día al entrar con conexión'}</Text>{estado.automatica && !automaticaDisponible ? <Text style={e.aclaracion}>Al entrar con conexión</Text> : null}{consultaEnCurso ? <Text style={e.aclaracion}>{estado.trabajo?.soloIdentificacion ? 'Completando identificación de pagos guardados…' : conectada ? 'Buscando · en vivo' : 'Buscando · reconectando'}</Text> : null}</View><Pressable accessibilityRole="button" disabled={ocupada || !estado.manualesRestantes || consultaEnCurso} style={[e.buscarDeNuevo, (ocupada || !estado.manualesRestantes || consultaEnCurso) && e.deshabilitada]} onPress={() => { void ejecutar(async () => { await solicitarConsultaMp('manual'); await sincronizarIntegraciones(false, false); }); }}><Ionicons name="search-outline" size={24} color={tema.botonPrincipalTexto}/><Text style={e.textoBoton}>Buscar de nuevo</Text><Text style={e.usosDisponibles}>{estado.manualesRestantes} de 2 usos disponibles</Text></Pressable></View>
          {consultaEnCurso ? <ActivityIndicator size="small" color={tema.foco} /> : null}{estado.trabajo?.error ? <Text style={g.textoError}>{estado.trabajo.error}</Text> : null}
          {estado.trabajo?.estado === 'completo' && !estado.trabajo.soloIdentificacion && estado.trabajo.total === 0 ? <Text style={e.textoSecundario}>No tenés movimientos nuevos.</Text> : null}
          {vinculada.error ? <Text style={g.textoError}>{vinculada.error} Gestioná la conexión desde las opciones del depósito.</Text> : null}

          <Pressable accessibilityRole="button" accessibilityState={{ expanded: historialVisible }} style={e.enlace} onPress={() => { if (!historialVisible) establecerCargandoHistorial(true); establecerHistorialVisible(v => !v); }}><Text style={e.textoEnlace}>Historial de consultas</Text><Ionicons name="time-outline" size={16} color={tema.foco} /></Pressable>

        </View>
        <SelectorSegmentado tema={tema} valor={filtro} alSeleccionar={valor => { establecerFiltro(valor); establecerSeleccionadas([]); establecerLimite(30); }} etiqueta="Filtrar movimientos" opciones={[{id:'pendiente',nombre:'Pendientes',contador:pendientes.length},{id:'ignorado',nombre:'Ignorados',contador:operaciones.filter(op=>op.decision==='ignorado'&&!op.revisionPendiente).length},{id:'registrado',nombre:'Registrados',contador:operaciones.filter(op=>op.decision==='registrado'&&!op.revisionPendiente).length}]} />
        {!visibles.length ? <Text style={e.textoSecundario}>No hay movimientos en este filtro.</Text> : grupos.map(grupo => <View key={grupo.dia} style={e.grupoDia}><Text style={e.tituloDia}>{grupo.titulo}</Text>{grupo.operaciones.map(op => {
          const borrador = resolverBorradorMp(op,borradores[op.id]), categoria = (borrador.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).find(c => c.id === borrador.categoria);
          const seleccionable = filtro !== 'registrado' && !op.revisionPendiente, seleccionada = seleccionActual.includes(op.id);
          const colorTipo = borrador.tipo === 'ingreso' ? tema.exito : borrador.tipo === 'egreso' ? tema.error : tema.textoSecundario;
          return <View key={op.id} style={[e.movimiento, seleccionada && e.movimientoSeleccionado]}>
            <View style={[e.iconoMovimiento,{backgroundColor:colorTipo+'18'}]}><Ionicons name={categoria?.icono || 'wallet-outline'} size={18} color={colorTipo}/></View>
            <Pressable accessibilityRole="button" accessibilityLabel={op.descripcion + '. Ver categoría y detalle'} style={e.cuerpoMovimiento} onPress={() => { if(op.decision==='pendiente'&&op.registrable&&borrador.tipo&&!op.revisionPendiente) establecerCategoriaId(op.id); else establecerEditandoId(op.id); }}>
              <View style={e.contenidoMovimiento}><Text numberOfLines={1} style={e.tituloMovimiento}>{borrador.descripcion || op.descripcion}</Text><View style={e.metadatos}><Text numberOfLines={1} style={[e.fecha,e.flexible]}>{op.revisionPendiente ? 'Cambio para revisar' : !op.registrable ? op.monto===0?'Sin importe':'No registrable' : categoria?.nombre || 'Sin categoría'}</Text><Text style={e.fecha}>{new Date(op.fecha).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</Text></View></View>
              <View style={e.finalMovimiento}><EtiquetaImporte enFila={false} style={[e.tipoMovimiento,{color:colorTipo}]}>{borrador.tipo==='ingreso'?'Ingreso':borrador.tipo==='egreso'?'Egreso':'Sin identificar'}</EtiquetaImporte><Text numberOfLines={1} adjustsFontSizeToFit style={e.importe}>{importe(op,borrador.tipo)}</Text></View>
            </Pressable>
            {seleccionable?<Pressable accessibilityRole="checkbox" accessibilityState={{checked:seleccionada}} accessibilityLabel={'Seleccionar '+op.descripcion} disabled={ocupada} style={e.controlMovimiento} onPress={()=>elegir(op.id)}><Ionicons name={seleccionada?'checkbox':'square-outline'} size={22} color={tema.foco}/></Pressable>:null}
          </View>;
        })}</View>)}
        {visibles.length > limite ? <Pressable accessibilityRole="button" style={e.enlace} onPress={() => establecerLimite(v => v + 30)}><Text style={e.textoEnlace}>Ver más movimientos</Text></Pressable> : null}
      </>}
    </DesplazamientoEncabezado>
    {error ? <View style={e.avisoError} accessibilityRole="alert"><Ionicons name="alert-circle" size={24} color={tema.error}/><Text style={[g.textoError,e.flexible]}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar error" style={e.casilla} onPress={()=>establecerError('')}><Ionicons name="close" size={22} color={tema.error}/></Pressable></View>:null}
    {vinculada && !otraVinculacion && filtro !== 'registrado' ? <View style={e.barraAcciones}><View style={e.filaEntre}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: todasSeleccionadas, disabled: ocupada || !elegibles.length }} disabled={ocupada || !elegibles.length} style={e.seleccionarTodo} onPress={() => establecerSeleccionadas(alternarSeleccionMp(visibles, seleccionActual))}><Ionicons name={todasSeleccionadas ? 'checkbox' : 'square-outline'} color={tema.foco} size={20} /><Text style={e.textoEnlace}>{todasSeleccionadas ? 'Deseleccionar' : 'Seleccionar todo'}</Text></Pressable><Text style={e.fecha}>{seleccionActual.length} seleccionados{visibles.length > 500 ? ' · máximo 500' : ''}</Text></View>{!seleccionActual.length ? <Text style={e.aclaracion}>Marcá la casilla derecha para habilitar el registro. No consume búsquedas.</Text>:null}<Pressable accessibilityRole="button" disabled={ocupada} accessibilityHint={filtro === 'pendiente' ? motivoRegistroBloqueado || 'Registrar los movimientos seleccionados' : undefined} style={[e.botonAccion, (ocupada || !seleccionActual.length || filtro === 'pendiente' && !!motivoRegistroBloqueado) && e.deshabilitada]} onPress={() => decidir(filtro === 'ignorado' ? 'recuperado' : 'registrado')}><Text style={e.textoBoton}>{filtro === 'ignorado' ? 'Volver a pendientes' : 'Registrar seleccionados'}</Text>{ocupada ? <ActivityIndicator size="small" color={tema.botonPrincipalTexto} /> : null}</Pressable>{filtro === 'pendiente' ? <Pressable accessibilityRole="button" disabled={ocupada || !seleccionActual.length} style={[e.ignorar, (!seleccionActual.length || ocupada) && e.deshabilitada]} onPress={() => decidir('ignorado')}><Text style={e.textoEnlace}>Ignorar seleccionados</Text></Pressable> : null}</View> : null}
    <Modal transparent animationType="fade" visible={historialVisible} onRequestClose={()=>establecerHistorialVisible(false)}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}><View style={e.filaEntre}><Text style={[g.subtitulo,e.flexible]}>Historial de consultas</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar historial" style={e.casilla} onPress={()=>establecerHistorialVisible(false)}><Ionicons name="close" size={22} color={tema.textoPrincipal}/></Pressable></View><ScrollView contentContainerStyle={e.historialModal}><Text style={e.aclaracion}>Últimas 20 consultas</Text>{cargandoHistorial ? <ActivityIndicator size="small" color={tema.foco} /> : !historial.length ? <Text style={e.textoSecundario}>Todavía no hay consultas guardadas.</Text> : historial.map(consulta => <View key={consulta.id} style={e.consultaHistorial}><View style={e.filaEntre}><Text style={e.textoCategoria}>{consulta.clase === 'automatica' ? 'Automática' : 'Manual'} · {nombreEstado(consulta.estado)}</Text><Text style={e.fecha}>{new Date(Number(consulta.creado)).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text></View><Text style={e.fecha}>{new Date(consulta.truncado && consulta.primera_fecha ? consulta.primera_fecha : consulta.desde).toLocaleDateString('es-AR')} – {new Date(consulta.hasta).toLocaleDateString('es-AR')} · {consulta.total} nuevos</Text>{consulta.truncado ? <Text style={e.fecha}>Límite inicial de 500 alcanzado.</Text> : null}{consulta.error ? <Text style={e.fecha}>{consulta.error}</Text> : null}</View>)}</ScrollView></View></View></Modal>
    <Modal transparent animationType="fade" visible={!!editando} onRequestClose={() => establecerEditandoId(null)}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}>
      <View style={e.filaEntre}><Text style={[g.subtitulo,e.flexible]}>Opciones del movimiento</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar" style={e.casilla} onPress={() => establecerEditandoId(null)}><Ionicons name="close" size={22} color={tema.textoPrincipal} /></Pressable></View><Text style={e.tituloMovimiento}>{editando?.descripcion}</Text>{editando ? <Text style={e.textoSecundario}>{importe(editando, borradorEditando?.tipo)} · {new Date(editando.fecha).toLocaleString('es-AR')}{editando.contraparte ? ` · ${editando.contraparte}` : ''}</Text> : null}
      <ScrollView keyboardShouldPersistTaps="handled">{editando && borradorEditando ? <>
        {!editando.registrable ? <Text style={e.textoSecundario}>{editando.monto === 0 ? 'Mercado Pago informó este pago con $0. No se registra ni afecta tu saldo. Podés ignorarlo.' : 'Solo se registran pagos aprobados en pesos con importe mayor a cero.'}</Text> : !borradorEditando.tipo ? <Text style={e.textoSecundario}>Mercado Pago no informó datos suficientes para identificar quién paga y quién cobra. Este pago no se incorporará hasta poder determinar su sentido.</Text> : editando.decision === 'pendiente' && !editando.revisionPendiente ? <Pressable accessibilityRole="button" style={e.enlace} onPress={()=>{establecerEditandoId(null);establecerCategoriaId(editando.id);}}><Ionicons name="pricetags-outline" size={22} color={tema.foco}/><Text style={e.textoEnlace}>Cambiar categoría</Text><Ionicons name="chevron-forward" size={18} color={tema.foco}/></Pressable> : null}
        {editando.revisionPendiente ? <Text style={e.textoSecundario}>Mercado Pago actualizó este pago. Revisá el movimiento original: AHRE no modificó su saldo.</Text> : null}
      </> : null}</ScrollView>
      {editando?.revisionPendiente ? <Pressable accessibilityRole="button" disabled={ocupada} style={e.botonConsulta} onPress={() => { void ejecutar(async () => { await decidirMovimientosMp([editando.id], 'revisado'); establecerEditandoId(null); }); }}><Text style={e.textoBoton}>Ya revisé el cambio</Text></Pressable> : editando?.registrable && editando.decision === 'pendiente' ? <Pressable accessibilityRole="button" disabled={ocupada || !borradorEditando?.tipo} style={e.enlace} onPress={() => { if (borradorEditando) { const op = { ...editando, ...borradorEditando }; void ejecutar(async () => { const filas = await consultarCompatiblesMp(op); establecerEditandoId(null); establecerAsociacion({ op, filas }); }); } }}><Text style={e.textoEnlace}>Ya lo registré: asociar movimiento</Text></Pressable> : null}
    </View></View></Modal>
    <SelectorCategoria tema={tema} estilosGlobales={g} categorias={borradorCategoria?.tipo==='ingreso'?CATEGORIAS_INGRESO:CATEGORIAS_EGRESO} tipoMovimiento={borradorCategoria?.tipo || 'egreso'} seleccionadaId={borradorCategoria?.categoria} contenidoAntesDeCategorias={categorizando ? <View style={e.grupoDia}><Text style={g.etiqueta}>Descripción</Text><TextInput accessibilityLabel="Descripción del movimiento" value={borradorCategoria?.descripcion??categorizando.descripcion} maxLength={500} multiline style={e.descripcionEditable} onChangeText={descripcion=>cambiarBorrador(categorizando,{descripcion})}/><Text style={e.aclaracion}>Se guarda para este movimiento de AHRE.</Text></View>:null} modalAbierto={!!categorizando} alCerrarModal={()=>establecerCategoriaId(null)} alSeleccionar={categoria=>{if(categorizando)cambiarBorrador(categorizando,{categoria});establecerCategoriaId(null);}} />
    <Modal transparent visible={!!asociacion} onRequestClose={() => establecerAsociacion(null)}><View style={e.fondoModal}><View accessibilityViewIsModal style={e.modal}><Text style={g.subtitulo}>Elegí un movimiento existente</Text><ScrollView>{asociacion?.filas.length ? asociacion.filas.map(fila => <Pressable key={fila.id} disabled={ocupada} style={e.consultaHistorial} onPress={() => Alert.alert('Asociar movimiento', 'Se vinculará sin crear otro movimiento ni modificar el saldo.', [{ text: 'Cancelar' }, { text: 'Asociar', onPress: () => { const op = asociacion.op; void ejecutar(async () => { await decidirMovimientosMp([op.id], 'registrado', borradores, fila.id); establecerAsociacion(null); }); } }])}><Text style={e.tituloMovimiento}>{fila.descripcion}</Text><Text style={e.fecha}>{new Date(fila.fecha_hora).toLocaleString('es-AR')}</Text></Pressable>) : <Text style={e.textoSecundario}>No hay movimientos compatibles.</Text>}</ScrollView><Pressable accessibilityRole="button" style={e.enlace} onPress={() => establecerAsociacion(null)}><Text style={e.textoEnlace}>Cerrar</Text></Pressable></View></View></Modal>
  </MarcoEncabezado></SafeAreaView>;
}
