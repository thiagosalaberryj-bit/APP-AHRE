import {useAccionConfirmada} from '../../hooks/useConfirmedAction';
import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import Confirmacion from './SocialConfirmationModal';
import {revisarSalidaSala} from '../../social/socialService';
import {useContext,useRef} from 'react';
import {ContextoAvisos} from '../../contexts/ToastContext';
import {pendientesCierreLocales} from '../../social/roomClosing';
import BotonSocial from './SocialButton';
import PendientesCierre from './RoomClosingPending';
import { pendientesSala } from '../../social/roomPending';
import IndicadorPendientesSala from './RoomPendingBadge';
import AccesoSala from './RoomAccessControl';
import useSalaOnline from '../../social/online/useRoomOnline';
import PanelSalaOnline from './OnlineRoomPanel';
import SelectorSegmentado from '../SegmentedSelector';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useEffect,useState } from 'react';
import { leerDatosOnline,observarSocialOnline,consultarMovimientosSociales,obtenerVistaSincronizacion, cambiarPersonasSala,enviarAccionSocial } from '../../social/socialService';
import { SECCIONES_SALA } from "../../social/socialConstants";
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_ICONO_DEPOSITO } from '../../styles/colors';
import BalancesSala from './RoomBalances';
import PersonasSala from './RoomPeople';
import EstadoVacio from './SocialEmptyState';
import TarjetaGastoSala from './RoomExpenseCard';
import ResumenImporteSocial from './SocialAmountSummary';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/RoomDetailsStyles';
export default function DetalleSala(propiedades: import('../../social/types').AspectoSocial & ({sala:import('../../social/types').SalaVista;alAbrirGasto:(id:string)=>void;seccionInicial?:'gastos'|'participantes'|'balances'} & Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
 const respuesta=useAccionConfirmada();
  const {
    usuarioId,personaActual,deudas,
    obtenerPersona,
    recargar
  } = useDatosSociales();
  const {
    sala,
    alAbrirGasto,
    abrirRegistro,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales,
    tema
  } = aspecto;
  const detalleOnline=useSalaOnline(sala.id,sala.online);
  const [pendientes,cambiarPendientes]=useState<import('../../social/online/types').OperacionPersonal[]>([]);
  useEffect(()=>{let activo=true;const cargar=async()=>{try{const [ops,locales]=await Promise.all([leerDatosOnline<import('../../social/online/types').OperacionPersonal[]>(usuarioId,'operaciones',[]),consultarMovimientosSociales()]);if(activo)cambiarPendientes(detalleOnline ? pendientesSala(detalleOnline,ops,new Set(locales.map(l=>l.clave))) : []);}catch{}};void cargar();const dejar=observarSocialOnline(()=>{void cargar();});return()=>{activo=false;dejar();};},[usuarioId,sala.id,detalleOnline]);
  const contador=(detalleOnline?.solicitudes.filter(s=>s.estado==='pendiente').length||0)+(detalleOnline?.admisiones?.filter(s=>s.estado==='pendiente').length||0);
  const [seccion, establecerSeccion] = useState(propiedades.seccionInicial || 'balances');
  useEffect(()=>{if(propiedades.seccionInicial)establecerSeccion(propiedades.seccionInicial);},[propiedades.seccionInicial]);
  const personasSala = sala.participantes;
  const cerrada = sala.estado === 'cerrada'||!sala.administrador||sala.cierrePendiente||sala.publicacionPendiente;
  const cierreSinConexion=!sala.demo&&sala.online&&['offline','revocado','sesion'].includes(obtenerVistaSincronizacion().estado);
  const faltantesCierre=sala.online?detalleOnline?.pendientesCierre||[]:pendientesCierreLocales(sala);
  const [simulando,cambiarSimulando]=useState(false),bloqueoDemo=useRef(false),{mostrarAviso}=useContext(ContextoAvisos);
  const cierreBloqueado=simulando||cierreSinConexion||sala.pendientesOnline>0||(sala.online&&!Array.isArray(detalleOnline?.pendientesCierre))||faltantesCierre.length>0;
  const simularRegistros=async()=>{if(bloqueoDemo.current)return;bloqueoDemo.current=true;cambiarSimulando(true);try{await respuesta.ejecutar(async()=>{await enviarAccionSocial('registros-demo:'+sala.id,'/salas/'+sala.id+'/registrar-integrantes-demo',{});await recargar();},()=>mostrarAviso('Registros de los demás simulados. Tus registros pendientes se conservan.',{tipo:'informacion'}));}catch(e){mostrarAviso(e instanceof Error?e.message:'No se pudo simular.',{tipo:'error'});}finally{bloqueoDemo.current=false;cambiarSimulando(false);}};
  const [confirmarRevision,cambiarConfirmarRevision]=useState<string|null>(null);
  const revisiones=detalleOnline?.sala.salidas?.filter(s=>!s.revisada)||[];
  const participantes = [personaActual, ...personasSala.map(obtenerPersona)];
  return <>
      {sala.demo?<Text style={estilosGlobales.textoAyuda}>Demo interactiva · Los cambios y pagos se guardan solo en tu cuenta de prueba.</Text>:null}
      <View style={[estilosGlobales.tarjeta, estilos.tarjetaSala, estilos.grupo]}>
        <View style={estilos.filaCampos}><View style={[estilos.iconoSala, {
          backgroundColor: sala.color
        }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={sala.icono as import('../../constants/movimientos').NombreIcono} size={20} /></View><View style={estilos.textoFlexible}><View style={estilos.filaCampos}><Text numberOfLines={1} ellipsizeMode="tail" style={[estilos.tituloSala,estilos.textoFlexible]}>{sala.nombre}</Text><Ionicons name={sala.estado==='cerrada'?'lock-closed-outline':'lock-open-outline'} color={sala.estado==='cerrada'?tema.textoSecundario:tema.exito} size={18}/><Text style={estilos.textoSala}>{sala.estado==='cerrada'?'Cerrada':'Abierta'}</Text></View><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.textoSala}>{sala.fecha} · {participantes.length} participantes</Text></View></View>
        <Text style={estilos.textoSala}>{sala.descripcion}</Text>
        <View style={estilos.resumenGastosSala}>
          <ResumenImporteSocial etiqueta="Total gastado" valor={sala.totalGastado} icono="receipt-outline" compacto estiloValor={estilos.importeSala} {...aspecto} />
          {sala.puedeEditarGastos&&sala.estado==='abierta'&&!sala.cierrePendiente&&!sala.publicacionPendiente ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Agregar gasto" onPress={conRespuestaVisual(() => abrirRegistro('gasto', {
          salaId: sala.id
        }))} style={estilos.accionPanel}><Ionicons color={tema.botonPrincipalTexto} name="add-circle-outline" size={20} /><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.textoAccionPanel}>Agregar gasto</Text></Pressable> : null}
        </View>
        {sala.publicacionPendiente?<Text style={estilosGlobales.textoAyuda}>Publicación pendiente. Reintentá compartir con conexión.</Text>:null}
      {sala.online?<View style={estilos.filaCampos}><IndicadorPendientesSala cantidad={pendientes.length} tema={tema}/><View style={estilos.textoFlexible}><Text accessibilityLiveRegion="polite" style={estilosGlobales.etiqueta}>{pendientes.length ? ' movimientos por registrar' : 'Sin movimientos por registrar'}</Text><Text style={estilos.textoSala}>{sala.estado==='abierta'?'Elegí el depósito en cada gasto; se aplicará al cerrar.':'Movimientos confirmados al cerrar la sala.'}</Text></View></View>:null}
      <AccesoSala sala={sala} {...aspecto}/>
      </View>


      <SelectorSegmentado tema={tema} opciones={SECCIONES_SALA.map(s=>s.id==='participantes'?{...s,contador}:s.id==='gastos'?{...s,contador:pendientes.length}:s)} valor={seccion} alSeleccionar={valor=>establecerSeccion(valor as 'gastos'|'participantes'|'balances')} etiqueta="Sección de sala" />
      {seccion === 'balances' ? <BalancesSala sala={sala} alAbrirGasto={alAbrirGasto} {...aspecto} /> : seccion === 'participantes' ? <>{sala.online?<PanelSalaOnline sala={sala} alAbrirPersona={personaId=>abrirRegistro('personaSala',{salaId:sala.id,personaId})} alCrearPersona={()=>abrirRegistro('persona')} {...aspecto}/>:<PersonasSala personasSala={personasSala} gastos={sala.gastos} alCambiar={async ids => { await cambiarPersonasSala(sala.id, ids); await recargar(); }} cerrada={cerrada} alCrearPersona={() => abrirRegistro('persona')} {...aspecto} />}</> : <View style={estilos.grupo}>
          {sala.gastos.length ? sala.gastos.map(gasto => <TarjetaGastoSala key={gasto.id} gasto={gasto} pendientesPorRegistrar={pendientes.filter(o=>o.gastoId===gasto.id).length} alAbrir={() => alAbrirGasto(gasto.id)} {...aspecto}/>) : <EstadoVacio icono="receipt-outline" titulo="Todavía no hay gastos" descripcion="Registrá quién pagó y cómo se reparten las partes." {...aspecto} />}
        </View>}
      {seccion === 'gastos' && pendientes.some(o=>!o.gastoId) ? <View style={estilos.grupo}><Text style={estilosGlobales.etiqueta}>Pagos por registrar</Text><Text style={estilos.textoSala}>Estos movimientos pertenecen a deudas de la sala.</Text>{pendientes.filter(o=>!o.gastoId).map(op=>{const deuda=deudas.find(d=>d.id===op.deudaId||d.acuerdoOnlineId===op.deudaId);return <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={op.clave} accessibilityRole="button" accessibilityLabel={'Registrar '+op.descripcion} style={[estilosGlobales.tarjeta,estilos.tarjetaSala,estilos.filaCampos]} onPress={conRespuestaVisual(()=>{if(deuda)abrirRegistro('pago',{deudaId:deuda.id,pagoId:op.pagoId,operacionClave:op.clave});})} disabled={!deuda}><Ionicons name="wallet-outline" color={tema.foco} size={20}/><View style={estilos.textoFlexible}><Text style={estilosGlobales.texto}>{op.descripcion}</Text><Text style={estilos.textoSala}>Elegir depósito · {op.monto.toLocaleString('es-AR',{style:'currency',currency:'ARS'})}</Text></View><Ionicons name="chevron-forward" color={tema.textoSecundario} size={16}/></Pressable>;})}</View>:null}
      {sala.administrador&&sala.estado==='abierta'?revisiones.map(salida=><View key={salida.personaId} style={[estilosGlobales.tarjeta,estilos.grupo]}><Text style={estilosGlobales.encabezadoSeccion}>{'Revisión pendiente por salida de '+salida.nombre}</Text><Text style={estilosGlobales.textoAyuda}>Revisá quién pagó y los avisos pendientes. Los importes no se trasladan a otra persona.</Text>{salida.gastoIds.map(id=>{const gasto=sala.gastos.find(g=>g.id===id);return gasto?<Pressable android_ripple={RETROALIMENTACION_PULSACION} key={id} accessibilityRole="button" accessibilityLabel={'Revisar gasto: '+gasto.descripcion} style={estilos.filaCampos} onPress={conRespuestaVisual(()=>alAbrirGasto(id))}><Text style={[estilosGlobales.texto,estilos.textoFlexible]}>{gasto.descripcion}</Text><Ionicons name="chevron-forward" size={20} color={tema.foco}/></Pressable>:null;})}<BotonSocial secundario texto={'Confirmar revisión de '+salida.nombre} deshabilitado={simulando} alPresionar={()=>cambiarConfirmarRevision(salida.personaId)} {...aspecto}/></View>):null}
      {confirmarRevision?<Confirmacion {...aspecto} titulo="Confirmar revisión" descripcion="Confirmás que revisaste los gastos y pagos de esta persona. Los registros financieros propios pendientes seguirán siendo obligatorios para cerrar." textoConfirmar="Sí, revisé los gastos" alCerrar={()=>cambiarConfirmarRevision(null)} cargando={simulando} completado={respuesta.completado} alConfirmar={()=>{const personaId=confirmarRevision;if(bloqueoDemo.current)return;bloqueoDemo.current=true;cambiarSimulando(true);return respuesta.ejecutar(async()=>{await revisarSalidaSala(sala.id,personaId);await recargar();},()=>cambiarConfirmarRevision(null)).catch(e=>mostrarAviso(e instanceof Error?e.message:'No se pudo confirmar la revisión.',{tipo:'error'})).finally(()=>{bloqueoDemo.current=false;cambiarSimulando(false);});}}/>:null}
      {sala.estado==='abierta'&&!sala.cierrePendiente&&!sala.publicacionPendiente?<PendientesCierre pendientes={faltantesCierre.filter(p=>!p.clave.startsWith('revision-salida:'))} personaPropiaId={sala.online?detalleOnline?.personaPropiaId:'vos'} gastos={sala.gastos} alAbrirGasto={alAbrirGasto} {...aspecto}/>:null}
      {!cerrada&&sala.demo&&detalleOnline?.pendientesCierre?.some(p=>p.personaId!==detalleOnline.personaPropiaId&&!p.clave.startsWith('solicitud:'))?<BotonSocial cargando={simulando} completado={respuesta.completado} secundario texto="Simular registros de los demás" deshabilitado={simulando} alPresionar={()=>simularRegistros()} {...aspecto}/>:null}
      {!cerrada ? <View style={estilos.grupoCampo}>
        <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" disabled={cierreBloqueado} accessibilityState={{disabled:cierreBloqueado}} accessibilityLabel="Cerrar sala" accessibilityHint="Abre la revisión del cierre y del reparto pendiente." onPress={conRespuestaVisual(() => abrirRegistro('cerrar', {
        salaId: sala.id
      }))} style={({
        pressed: presionado
      }) => [estilosGlobales.botonSecundario, estilos.cerrarSala, estilos.filaSimple, cierreBloqueado && estilosGlobales.botonDeshabilitado, presionado && estilos.deudaHistorialPresionada]}>
          <Ionicons color={tema.botonSecundarioTexto} name="lock-closed-outline" size={22} />
          <Text style={estilosGlobales.textoBotonSecundario}>Cerrar sala</Text>
        </Pressable>
        <Text style={[estilosGlobales.textoAyuda, estilos.textoCentrado]}>{cierreSinConexion?'El cierre de una sala compartida requiere conexión.':faltantesCierre.length?'Completá los registros pendientes para habilitar el cierre.':cierreBloqueado?'Esperá a confirmar los registros de todos los integrantes.':'Confirmá el reparto para pasar la sala al historial.'}</Text>
      </View> : null}
    </>;
}
