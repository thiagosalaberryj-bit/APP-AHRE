import AccesoSala from './RoomAccessControl';
import useSalaOnline from '../../social/online/useRoomOnline';
import PanelSalaOnline from './OnlineRoomPanel';
import SelectorSegmentado from '../SegmentedSelector';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useEffect,useState } from 'react';
import { leerDatosOnline,observarSocialOnline,consultarMovimientosSociales,obtenerVistaSincronizacion, cambiarPersonasSala } from '../../social/socialService';
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
export default function DetalleSala(propiedades: import('../../social/types').AspectoSocial & ({sala:import('../../social/types').SalaVista;alAbrirGasto:(id:string)=>void} & Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  const {
    usuarioId,personaActual,
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
  useEffect(()=>{let activo=true;const cargar=async()=>{try{const [ops,locales]=await Promise.all([leerDatosOnline<import('../../social/online/types').OperacionPersonal[]>(usuarioId,'operaciones',[]),consultarMovimientosSociales()]);if(activo)cambiarPendientes(ops.filter(o=>o.salaId===sala.id&&!o.incorporada&&!locales.some(l=>l.clave===o.clave)));}catch{}};void cargar();const dejar=observarSocialOnline(()=>{void cargar();});return()=>{activo=false;dejar();};},[usuarioId,sala.id]);
  const contador=(detalleOnline?.solicitudes.filter(s=>s.estado==='pendiente').length||0)+(detalleOnline?.admisiones?.filter(s=>s.estado==='pendiente').length||0);
  const [seccion, establecerSeccion] = useState('balances');
  const personasSala = sala.participantes;
  const cerrada = sala.estado === 'cerrada'||!sala.administrador||sala.cierrePendiente||sala.publicacionPendiente;
  const cierreSinConexion=!sala.demo&&sala.online&&['offline','revocado','sesion'].includes(obtenerVistaSincronizacion().estado);
  const participantes = [personaActual, ...personasSala.map(obtenerPersona)];
  return <>
      {sala.demo?<Text style={estilosGlobales.textoAyuda}>Demo interactiva · Los cambios y pagos se guardan solo en tu cuenta de prueba.</Text>:null}
      <View style={[estilosGlobales.tarjeta, estilos.tarjetaSala, estilos.grupo]}>
        <View style={estilos.filaCampos}><View style={[estilos.iconoSala, {
          backgroundColor: sala.color
        }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={sala.icono as import('../../constants/movimientos').NombreIcono} size={20} /></View><View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.tituloSala}>{sala.nombre}</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.textoSala}>{sala.gastos.length} gastos · Categoría por gasto</Text></View></View>
        <Text style={estilos.textoSala}>{sala.fecha} · {sala.estado==='cerrada'?'Cerrada · Solo lectura':sala.puedeEditarGastos&&!sala.cierrePendiente&&!sala.publicacionPendiente?'Activa':'Abierta · Solo lectura'} · {participantes.length} participantes</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.textoSala}>{sala.descripcion}</Text>
        <View style={estilos.resumenGastosSala}>
          <ResumenImporteSocial etiqueta="Total gastado" valor={sala.totalGastado} icono="receipt-outline" compacto estiloValor={estilos.importeSala} {...aspecto} />
          {sala.puedeEditarGastos&&sala.estado==='abierta'&&!sala.cierrePendiente&&!sala.publicacionPendiente ? <Pressable accessibilityRole="button" accessibilityLabel="Agregar gasto" onPress={() => abrirRegistro('gasto', {
          salaId: sala.id
        })} style={estilos.accionPanel}><Ionicons color={tema.botonPrincipalTexto} name="add-circle-outline" size={20} /><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.textoAccionPanel}>Agregar gasto</Text></Pressable> : null}
        </View>
        <Text style={estilos.textoSala}>{sala.gastos.length} gastos</Text>
        {sala.publicacionPendiente?<Text style={estilosGlobales.textoAyuda}>Publicación pendiente. Reintentá compartir con conexión.</Text>:null}
      {sala.online&&sala.estado==='cerrada'?<Text accessibilityLiveRegion="polite" style={pendientes.length?estilosGlobales.etiqueta:estilosGlobales.textoAyuda}>{pendientes.length?pendientes.length+' movimientos por registrar en tus depósitos':'Todos tus movimientos están incorporados'}</Text>:null}
      <AccesoSala sala={sala} {...aspecto}/>
      </View>


      <SelectorSegmentado tema={tema} opciones={SECCIONES_SALA.map(s=>s.id==='participantes'?{...s,contador}:s)} valor={seccion} alSeleccionar={establecerSeccion} etiqueta="Sección de sala" />
      {seccion === 'balances' ? <BalancesSala sala={sala} alAbrirGasto={alAbrirGasto} {...aspecto} /> : seccion === 'participantes' ? <>{sala.online?<PanelSalaOnline sala={sala} alAbrirPersona={personaId=>abrirRegistro('personaSala',{salaId:sala.id,personaId})} alCrearPersona={()=>abrirRegistro('persona')} {...aspecto}/>:<PersonasSala personasSala={personasSala} gastos={sala.gastos} alCambiar={async ids => { await cambiarPersonasSala(sala.id, ids); await recargar(); }} cerrada={cerrada} alCrearPersona={() => abrirRegistro('persona')} {...aspecto} />}</> : <View style={estilos.grupo}>
          {sala.gastos.length ? sala.gastos.map(gasto => <View key={gasto.id}><TarjetaGastoSala gasto={gasto} alAbrir={() => alAbrirGasto(gasto.id)} {...aspecto}/>{pendientes.some(o=>o.gastoId===gasto.id)?<Text style={estilosGlobales.textoAyuda}>Pendiente de registrar en tu depósito</Text>:null}</View>) : <EstadoVacio icono="receipt-outline" titulo="Todavía no hay gastos" descripcion="Registrá quién pagó y cómo se reparten las partes." {...aspecto} />}
        </View>}
      {!cerrada ? <View style={estilos.grupoCampo}>
        <Pressable accessibilityRole="button" disabled={cierreSinConexion} accessibilityLabel="Cerrar sala" accessibilityHint="Abre la revisión del cierre y del reparto pendiente." onPress={() => abrirRegistro('cerrar', {
        salaId: sala.id
      })} style={({
        pressed: presionado
      }) => [estilosGlobales.botonSecundario, estilos.cerrarSala, estilos.filaSimple, presionado && estilos.deudaHistorialPresionada]}>
          <Ionicons color={tema.botonSecundarioTexto} name="lock-closed-outline" size={22} />
          <Text style={estilosGlobales.textoBotonSecundario}>Cerrar sala</Text>
        </Pressable>
        <Text style={[estilosGlobales.textoAyuda, estilos.textoCentrado]}>{cierreSinConexion?'El cierre de una sala compartida requiere conexión.':'Confirmá el reparto para pasar la sala al historial.'}</Text>
      </View> : null}
    </>;
}
