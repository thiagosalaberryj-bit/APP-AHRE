import {conEstiloDePulsacion} from '../styles/globalStyles';
import {conRespuestaVisual} from '../utils/pressFeedback';
import {useAccionEnCurso} from '../hooks/useActionInProgress';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import {reinicioEnCurso} from '../development/testResetState';
import {observarSocialOnline} from '../social/online/onlineStore';
import {useContext,useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,AppState,Pressable,StyleSheet,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {ContextoApariencia} from '../contexts/AppearanceContext';
import {ContextoAvisos} from '../contexts/ToastContext';
import {observarSincronizacion,obtenerVistaSincronizacion,sincronizarSesion,actualizarCantidadPendientes,comprobarConexionServidor} from '../sync/syncService';
import {consultarPendientes,formatearCantidadPendientes} from '../sync/pendingService';
import {observarCambiosLocales} from '../sync/journal';
import {RUTAS} from '../constants/routes';
import {BORDES,TIPOGRAFIA} from '../styles/globalStyles';
import {crearProgramadorSincronizacion} from '../sync/syncScheduler';
import ControladorSocialOnline from '../social/online/onlineController';
import {procesarRecurrencias} from '../recurrences/recurrenceService';
import {registrarTareaRecurrencias} from '../recurrences/recurrenceTask';

export const TEXTOS_SYNC={local:'Solo local',comprobando:'Comprobando conexión',sincronizando:'Sincronizando',offline:'Sin conexión con el servidor',online:'Sincronizado',sesion:'Iniciá sesión para sincronizar',conflicto:'Error de sincronización',revocado:'Instalación desvinculada'};

export function ControladorSincronizacion({alRevocar}:{alRevocar:()=>void}){
  const {mostrarAviso}=useContext(ContextoAvisos);
  useEffect(()=>{
    let anterior='',activo=true;
    let procesandoRecurrencias=false;
    const procesar=async()=>{if(procesandoRecurrencias)return;procesandoRecurrencias=true;try{await procesarRecurrencias();}catch(error){mostrarAviso(error instanceof Error?error.message:'No se pudieron registrar las recurrencias.',{tipo:'error'});}finally{procesandoRecurrencias=false;}};
    void registrarTareaRecurrencias().catch(()=>{});
    void procesar();
    const programador=crearProgramadorSincronizacion({sincronizar:sincronizarSesion,obtenerVista:obtenerVistaSincronizacion,estaActiva:()=>AppState.currentState==='active'&&!reinicioEnCurso()});
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
      if(estado==='active'){void procesar().then(()=>programador.activar());}else programador.suspender();
    });
    const conexion=setInterval(()=>{
      if(AppState.currentState!=='active')return;
      void procesar();
      void comprobarConexionServidor().then(recuperada=>{
        if(activo&&recuperada&&AppState.currentState==='active')programador.solicitar(false,0);
      }).catch(()=>{});
    },5000);
    programador.activar();
    return()=>{activo=false;clearInterval(conexion);dejar();dejarCambios();escucha.remove();programador.cerrar();};
  },[mostrarAviso,alRevocar]);
  return <ControladorSocialOnline/>;
}

export default function EstadoSincronizacion({soloIcono=false}:{soloIcono?:boolean}={}){
  const accionOcupada=useAccionEnCurso();
  const {tema}=useContext(ContextoApariencia);
  const navegacion=useNavigation<import('../navigation/types').NavegacionRaiz>();
  const [vistaPrivada,establecerVista]=useState(obtenerVistaSincronizacion);
  const [cantidadVisible,establecerCantidad]=useState<number|null>(null);
  const vista={...vistaPrivada,pendientes:cantidadVisible??vistaPrivada.pendientes};
  useEffect(()=>{let activo=true,consulta=0;const recargar=()=>{const numero=++consulta;void consultarPendientes(1).then(d=>{if(activo&&numero===consulta)establecerCantidad(d.total);}).catch(()=>{});};recargar();const dejar=observarSocialOnline(recargar),dejarPrivado=observarSincronizacion(recargar);return()=>{activo=false;dejar();dejarPrivado();};},[]);
  const progreso=useRef(new Animated.Value(1)).current;
  const [reducirMovimiento,establecerReducirMovimiento]=useState(false);
  useEffect(()=>{
    let activo=true;
    void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(activo)establecerReducirMovimiento(v);}).catch(()=>{});
    const escucha=AccessibilityInfo.addEventListener('reduceMotionChanged',establecerReducirMovimiento);
    return()=>{activo=false;escucha.remove();};
  },[]);
  useEffect(()=>observarSincronizacion(establecerVista),[]);
  useEffect(()=>{
    progreso.stopAnimation();
    progreso.setValue(1);
    if(reducirMovimiento||!['comprobando','sincronizando'].includes(vista.estado))return;
    const animacion=Animated.loop(Animated.sequence([
      Animated.timing(progreso,{toValue:0.35,duration:650,useNativeDriver:true}),
      Animated.timing(progreso,{toValue:1,duration:650,useNativeDriver:true}),
    ]));
    animacion.start();
    return()=>{animacion.stop();progreso.setValue(1);};
  },[vista.estado,reducirMovimiento,progreso]);
  const error=['conflicto','sesion','revocado'].includes(vista.estado);
  const iconoNube=['offline','local'].includes(vista.estado)?'cloud-offline-outline'
    :vista.estado==='sincronizando'?'cloud-upload-outline'
    :vista.estado==='online'&&vista.pendientes===0?'cloud-done-outline':'cloud-outline';
  const fondoMarca=soloIcono?tema.encabezado:tema.botonEncabezado;
  return <Pressable disabled={accionOcupada} android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={`${TEXTOS_SYNC[vista.estado]}. ${vista.pendientes} registros pendientes. Ver sincronización.`}
    onPress={conRespuestaVisual(()=>navegacion.navigate(RUTAS.SINCRONIZACION))} style={conEstiloDePulsacion([estilos.boton,soloIcono&&estilos.soloIcono,{backgroundColor:soloIcono?'transparent':tema.botonEncabezado}])}>
    <View style={estilos.icono}>
      <Animated.View style={{opacity:progreso,transform:[{translateY:vista.estado==='sincronizando'&&!reducirMovimiento?progreso.interpolate({inputRange:[0.35,1],outputRange:[-2,1]}):0}]}}>
        <Ionicons name={iconoNube} size={26} color={tema.botonPrincipal}/>
      </Animated.View>
      {error?<Ionicons name="close-circle" size={14} color={tema.error} style={[estilos.marca,{backgroundColor:fondoMarca}]}/>:null}
    </View>
    {vista.pendientes>0?<View style={[estilos.insignia,soloIcono&&{top:6},{backgroundColor:tema.botonPrincipal,borderColor:tema.encabezado}]}><Text numberOfLines={1} style={[estilos.cantidad,{color:tema.botonPrincipalTexto}]}>{formatearCantidadPendientes(vista.pendientes)}</Text></View>:null}
  </Pressable>;
}
const estilos=StyleSheet.create({
  boton:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:BORDES.radios.boton,flexShrink:0},
  soloIcono:{width:44,height:44,borderRadius:0},
  icono:{height:32,width:32,alignItems:'center',justifyContent:'center'},
  marca:{position:'absolute',right:0,bottom:0,borderRadius:BORDES.radios.circular},
  insignia:{position:'absolute',right:-4,top:-5,minWidth:18,height:18,paddingHorizontal:3,borderRadius:BORDES.radios.circular,borderWidth:2,alignItems:'center',justifyContent:'center'},
  cantidad:{fontSize:TIPOGRAFIA.tamanos.auxiliar-2,lineHeight:12,fontWeight:TIPOGRAFIA.pesos.seminegrita,textAlign:'center'},
});
