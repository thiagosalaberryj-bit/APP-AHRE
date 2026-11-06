import {useContext,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,AccessibilityInfo,Animated,AppState,Pressable,StyleSheet,Text,View} from 'react-native';
import Svg,{Circle,Path} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {ContextoApariencia} from '../contexts/AppearanceContext';
import {ContextoAvisos} from '../contexts/ToastContext';
import {observarSincronizacion,obtenerVistaSincronizacion,sincronizarSesion,actualizarCantidadPendientes,comprobarConexionServidor} from '../sync/syncService';
import {formatearCantidadPendientes} from '../sync/pendingService';
import {observarCambiosLocales} from '../sync/journal';
import {RUTAS} from '../constants/routes';
import {BORDES,TIPOGRAFIA} from '../styles/globalStyles';
import {crearProgramadorSincronizacion} from '../sync/syncScheduler';
const ArcoAnimado=Animated.createAnimatedComponent(Path);

export const TEXTOS_SYNC={local:'Solo local',comprobando:'Comprobando conexión',sincronizando:'Sincronizando',offline:'Sin conexión con el servidor',online:'Sincronizado',sesion:'Iniciá sesión para sincronizar',conflicto:'Error de sincronización',revocado:'Instalación desvinculada'};

export function ControladorSincronizacion({alRevocar}:{alRevocar:()=>void}){
  const {mostrarAviso}=useContext(ContextoAvisos);
  useEffect(()=>{
    let anterior='',activo=true;
    const programador=crearProgramadorSincronizacion({sincronizar:sincronizarSesion,obtenerVista:obtenerVistaSincronizacion,estaActiva:()=>AppState.currentState==='active'});
    const dejar=observarSincronizacion(v=>{
      if(v.estado==='revocado'&&anterior!=='revocado'){
        mostrarAviso('Esta instalación fue desvinculada. Los pendientes se conservaron.',{tipo:'informacion'});alRevocar();
      }
      if(v.estado==='offline'&&anterior!=='offline')mostrarAviso('Sin conexión con el servidor.');
      if(v.estado==='online'&&anterior==='offline')mostrarAviso('Conexión recuperada. Tus datos están sincronizados.');
      // Las comprobaciones silenciosas no cambian el estado visual online.
      if(!['comprobando','sincronizando'].includes(v.estado))anterior=v.estado;
      programador.actualizar();
    });
    const dejarCambios=observarCambiosLocales(()=>{
      void actualizarCantidadPendientes().catch(()=>{});
      programador.solicitar(false);
    });
    const escucha=AppState.addEventListener('change',estado=>{
      if(estado==='active')programador.activar();else programador.suspender();
    });
    const conexion=setInterval(()=>{
      if(AppState.currentState!=='active')return;
      void comprobarConexionServidor().then(recuperada=>{
        if(activo&&recuperada&&AppState.currentState==='active')programador.solicitar(false,0);
      }).catch(()=>{});
    },5000);
    programador.activar();
    return()=>{activo=false;clearInterval(conexion);dejar();dejarCambios();escucha.remove();programador.cerrar();};
  },[mostrarAviso,alRevocar]);
  return null;
}

export default function EstadoSincronizacion(){
  const {tema}=useContext(ContextoApariencia);
  const navegacion=useNavigation<import('../navigation/types').NavegacionRaiz>();
  const [vista,establecerVista]=useState(obtenerVistaSincronizacion);
  const progreso=useRef(new Animated.Value(3)).current;
  const [reducirMovimiento,establecerReducirMovimiento]=useState(false);
  const [reconectando,establecerReconectando]=useState(false);
  const estadoActual=useRef(vista.estado);estadoActual.current=vista.estado;
  const animacion=useRef<Animated.CompositeAnimation|null>(null),animando=useRef(false),montado=useRef(true);
  useEffect(()=>{montado.current=true;return()=>{montado.current=false;animacion.current?.stop();animando.current=false;};},[]);
  useEffect(()=>{
    let activo=true;
    void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(activo)establecerReducirMovimiento(v);}).catch(()=>{});
    const escucha=AccessibilityInfo.addEventListener('reduceMotionChanged',establecerReducirMovimiento);
    return()=>{activo=false;escucha.remove();};
  },[]);
  useEffect(()=>observarSincronizacion(establecerVista),[]);
  useEffect(()=>{
    if(reducirMovimiento){animacion.current?.stop();animando.current=false;progreso.setValue(3);establecerReconectando(false);return;}
    if(vista.estado!=='comprobando'||animando.current)return;
    animando.current=true;establecerReconectando(true);
    const ciclo=()=>{
      progreso.setValue(0);
      animacion.current=Animated.sequence([
        Animated.timing(progreso,{toValue:1,duration:220,useNativeDriver:false}),Animated.delay(90),
        Animated.timing(progreso,{toValue:2,duration:220,useNativeDriver:false}),Animated.delay(90),
        Animated.timing(progreso,{toValue:3,duration:220,useNativeDriver:false}),Animated.delay(120),
      ]);
      animacion.current.start(({finished})=>{
        if(!montado.current||!finished)return;
        if(estadoActual.current==='comprobando')ciclo();
        else{animando.current=false;establecerReconectando(false);}
      });
    };
    ciclo();
  },[vista.estado,reducirMovimiento,progreso]);
  const estadoMostrado=reconectando?'comprobando':vista.estado;
  const error=['conflicto','sesion','revocado'].includes(vista.estado);
  const arcos=['M9.17 14.92 A4 4 0 0 1 14.83 14.92','M6.34 12.09 A8 8 0 0 1 17.66 12.09','M3.51 9.26 A12 12 0 0 1 20.49 9.26'];
  return <Pressable accessibilityRole="button" accessibilityLabel={`${TEXTOS_SYNC[vista.estado]}. ${vista.pendientes} registros pendientes. Ver sincronización.`}
    onPress={()=>navegacion.navigate(RUTAS.SINCRONIZACION)} style={[estilos.boton,{backgroundColor:tema.contenedorVerde}]}>
    <View style={estilos.icono}>
      <Svg width={24} height={24} viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
        {arcos.map((d,i)=><ArcoAnimado key={d} d={d} fill="none" stroke={tema.botonPrincipal} strokeWidth={2} strokeLinecap="round" strokeOpacity={reconectando?progreso.interpolate({inputRange:[i,i+1],outputRange:[0.15,1],extrapolate:'clamp'}):1}/>)}
        <Circle cx={12} cy={17.75} r={1.5} fill={tema.botonPrincipal}/>
      </Svg>
      {estadoMostrado==='sincronizando'?<ActivityIndicator style={[StyleSheet.absoluteFill,estilos.centrar]} size={32} color={tema.botonPrincipal}/>:null}
      {estadoMostrado==='online'&&vista.pendientes===0?<Ionicons name="checkmark-circle" size={14} color={tema.botonPrincipal} style={[estilos.marca,{backgroundColor:tema.contenedorVerde}]}/>:null}
      {!reconectando&&error?<Ionicons name="close-circle" size={14} color={tema.error} style={[estilos.marca,{backgroundColor:tema.contenedorVerde}]}/>:null}
      {['offline','local'].includes(estadoMostrado)?<View style={[estilos.tachado,{backgroundColor:tema.botonPrincipal}]}/>:null}
    </View>
    {vista.pendientes>0?<View style={[estilos.insignia,{backgroundColor:tema.botonPrincipal,borderColor:tema.encabezado}]}><Text numberOfLines={1} style={[estilos.cantidad,{color:tema.botonPrincipalTexto}]}>{formatearCantidadPendientes(vista.pendientes)}</Text></View>:null}
  </Pressable>;
}
const estilos=StyleSheet.create({
  boton:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:BORDES.radios.boton,flexShrink:0},
  icono:{height:32,width:32,alignItems:'center',justifyContent:'center'},
  centrar:{alignItems:'center',justifyContent:'center'},
  marca:{position:'absolute',right:0,bottom:0,borderRadius:BORDES.radios.circular},
  tachado:{position:'absolute',height:2,width:30,transform:[{rotate:'-45deg'}]},
  insignia:{position:'absolute',right:-4,top:-5,minWidth:18,height:18,paddingHorizontal:3,borderRadius:BORDES.radios.circular,borderWidth:2,alignItems:'center',justifyContent:'center'},
  cantidad:{fontSize:TIPOGRAFIA.tamanos.auxiliar-2,lineHeight:12,fontWeight:TIPOGRAFIA.pesos.seminegrita,textAlign:'center'},
});
