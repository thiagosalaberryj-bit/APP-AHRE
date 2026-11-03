import {useCallback,useContext,useRef,useState} from 'react';
import {Alert,ActivityIndicator,FlatList,Pressable,Text,View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import EncabezadoSeccion from '../components/SectionHeader';
import TarjetaNotificacion from '../components/NotificationCard';
import {TEXTOS_SYNC} from '../components/SyncStatus';
import {ContextoApariencia} from '../contexts/AppearanceContext';
import {observarSincronizacion,obtenerVistaSincronizacion,sincronizarSesion,consultarReparacionPerfil,repararPerfilPendiente} from '../sync/syncService';
import {consultarPendientes,type RegistroPendiente} from '../sync/pendingService';
import {obtenerSesionActual} from '../authentication/sessionService';
import {RUTAS} from '../constants/routes';
import type {ReparacionPerfil} from '../sync/protocol';
import {consultarSaldoOculto} from '../profile/balanceVisibilityService';
import {crearEstilosGlobales} from '../styles/globalStyles';
import {crearEstilosNotificaciones} from '../styles/NotificationsScreenStyles';
import {crearEstilosSincronizacion} from '../styles/SyncScreenStyles';

export default function PantallaSincronizacion({navigation:navegacion}:import('../navigation/types').PropiedadesPantalla){
  const {tema}=useContext(ContextoApariencia),{bottom}=useSafeAreaInsets();
  const globales=crearEstilosGlobales(tema),tarjetas=crearEstilosNotificaciones(tema,bottom),estilos=crearEstilosSincronizacion(tema);
  const [vista,establecerVista]=useState(obtenerVistaSincronizacion);
  const [datos,establecerDatos]=useState<{total:number;registros:RegistroPendiente[];soloLocal:boolean}>({total:0,registros:[],soloLocal:false});
  const [cargando,establecerCargando]=useState(true),[error,establecerError]=useState(''),[oculto,establecerOculto]=useState(true);
  const [expandido,establecerExpandido]=useState<string|null>(null);
  const [errorReparacion,establecerErrorReparacion]=useState('');
  const [reparacion,establecerReparacion]=useState<ReparacionPerfil|null>(null);
  const [reparando,establecerReparando]=useState(false);
  const secuencia=useRef(0),datosActuales=useRef(datos),cargaActiva=useRef(false);
  const cargar=useCallback(async(reemplazar=true)=>{
    if(!reemplazar&&cargaActiva.current)return;
    const peticion=++secuencia.current;cargaActiva.current=true;establecerCargando(true);
    try{
      const actuales=datosActuales.current;
      const resultado=await consultarPendientes(30,reemplazar?0:actuales.registros.length);
      const propuesta=await consultarReparacionPerfil();
      if(peticion!==secuencia.current)return;
      establecerReparacion(propuesta);
      const nuevos={...resultado,registros:reemplazar?resultado.registros:[...actuales.registros,...resultado.registros]};
      datosActuales.current=nuevos;establecerDatos(nuevos);establecerError('');
    }catch{if(peticion===secuencia.current)establecerError('No se pudieron consultar los pendientes. Volvé a intentar.');}
    finally{if(peticion===secuencia.current){cargaActiva.current=false;establecerCargando(false);}}
  },[]);
  useFocusEffect(useCallback(()=>{
    let activa=true;
    void obtenerSesionActual().then(async({usuario})=>{
      const privado=usuario?await consultarSaldoOculto(usuario.id):true;
      if(activa)establecerOculto(privado);
    }).catch(()=>{if(activa)establecerOculto(true);});
    const dejar=observarSincronizacion(v=>{establecerVista(v);void cargar();});
    return()=>{activa=false;secuencia.current++;cargaActiva.current=false;dejar();};
  },[cargar]));
  const ocupado=reparando||['comprobando','sincronizando'].includes(vista.estado);
  const confirmarReparacion=()=>{
    if(!reparacion)return;
    const propuesta=reparacion;
    Alert.alert('Corregir correo pendiente',`Se reemplazará ${propuesta.correoAnterior} por ${propuesta.correoNuevo} en los cambios de perfil sin confirmar. Los movimientos y sus importes se conservan.`,[
      {text:'Cancelar',style:'cancel'},
      {text:'Aplicar corrección',onPress:()=>{
        establecerErrorReparacion('');establecerReparando(true);
        void repararPerfilPendiente(propuesta).catch(fallo=>establecerErrorReparacion(fallo instanceof Error?fallo.message:'No se pudo reparar.')).finally(()=>{establecerReparando(false);void cargar();});
      }},
    ]);
  };
  return <SafeAreaView edges={['top']} style={globales.areaSegura}><View style={globales.pantalla}>
    <EncabezadoSeccion tema={tema} titulo="Sincronización" descripcion="Los datos guardados en este teléfono que faltan confirmar." alVolver={()=>navegacion.goBack()} mostrarSincronizacion={false}/>
    <FlatList data={datos.registros} keyExtractor={r=>r.id} contentContainerStyle={tarjetas.contenido}
      ListHeaderComponent={<View style={estilos.estado}>
        <Text accessibilityLiveRegion="polite" style={estilos.titulo}>{TEXTOS_SYNC[vista.estado]}</Text>
        <Text style={estilos.texto}>{datos.soloLocal?'Esta cuenta contiene ejemplos locales y no se envía al servidor.':`${datos.total} registro${datos.total===1?'':'s'} pendiente${datos.total===1?'':'s'}.`}</Text>
        {!datos.soloLocal?<Text style={estilos.texto}>Los registros salen de esta lista cuando el servidor los confirma.</Text>:null}
        {vista.detalle?<Text style={estilos.texto}>{vista.detalle}</Text>:null}
        <Pressable accessibilityRole="button" disabled={ocupado||datos.soloLocal} onPress={()=>{void sincronizarSesion().then(()=>cargar());}} style={[estilos.boton,(ocupado||datos.soloLocal)&&{opacity:0.5}]}>
          <Text style={estilos.textoBoton}>{ocupado?'Sincronizando…':'Sincronizar ahora'}</Text>
        </Pressable>
        {reparacion?<View style={estilos.estado}>
          <Text style={estilos.texto}>El servidor rechazó el correo de un cambio pendiente. Corregilo en Perfil y volvé aquí para confirmarlo.</Text>
          <Pressable accessibilityRole="button" disabled={ocupado} onPress={()=>navegacion.navigate(RUTAS.PERFIL)} style={estilos.boton}><Text style={estilos.textoBoton}>Corregir en Perfil</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={ocupado||reparacion.correoAnterior===reparacion.correoNuevo} onPress={confirmarReparacion} style={[estilos.boton,(ocupado||reparacion.correoAnterior===reparacion.correoNuevo)&&{opacity:0.5}]}><Text style={estilos.textoBoton}>Aplicar correo corregido</Text></Pressable>
        </View>:null}
        {errorReparacion||error?<Text accessibilityRole="alert" style={estilos.texto}>{errorReparacion||error}</Text>:null}
      </View>}
      renderItem={({item})=>{
        const importe=item.importe===null?'':oculto?' · Importe oculto':` · $ ${item.importe.toLocaleString('es-AR',{maximumFractionDigits:2})}`;
        return <TarjetaNotificacion tema={tema} estilos={tarjetas} nueva={false} expandida={expandido===item.id} etiquetaAccesibilidad={`Registro pendiente: ${item.titulo}`} alPresionar={()=>establecerExpandido(v=>v===item.id?null:item.id)}
          notificacion={{id:item.id,titulo:item.titulo,mensaje:item.descripcion+importe,fechaHora:item.fecha,icono:'cloud-upload-outline'}}/>;
      }}
      ItemSeparatorComponent={()=> <View style={estilos.separador}/>}
      ListEmptyComponent={!cargando&&!error?<View style={tarjetas.estadoVacio}><Text style={tarjetas.textoEstadoVacio}>{datos.soloLocal?'Datos de prueba guardados solo aquí.':'No hay registros pendientes.'}</Text></View>:null}
      ListFooterComponent={cargando?<ActivityIndicator color={tema.foco}/>:null}
      onEndReached={()=>{if(!cargando&&datos.registros.length<datos.total)void cargar(false);}} onEndReachedThreshold={0.3}
    />
  </View></SafeAreaView>;
}
