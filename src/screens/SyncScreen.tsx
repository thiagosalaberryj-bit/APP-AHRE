import {conRespuestaVisual} from '../utils/pressFeedback';
import BotonAccion from '../components/ActionButton';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import PuntosCarga from '../components/LoadingDots';
import { ContextoAvisos } from '../contexts/ToastContext';
import { useAvisoError, useErrorNotificado } from '../hooks/useErrorNotice';
import { useRegresoProtegido } from '../navigation/useSafeGoBack';
import MarcoEncabezado from '../components/ScreenHeaderFrame';
import { SeccionesEncabezado } from '../components/HeaderScrollView';
import {useCallback,useContext,useMemo,useRef,useState} from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import EncabezadoSeccion from '../components/SectionHeader';
import EncabezadoSeccionPlegable from '../components/CollapsibleSectionHeader';
import {TEXTOS_SYNC} from '../components/SyncStatus';
import {ContextoApariencia} from '../contexts/AppearanceContext';
import {observarSincronizacion,obtenerVistaSincronizacion,sincronizarSesion,consultarReparacionPerfil,repararPerfilPendiente} from '../sync/syncService';
import {consultarPendientes,type DatosPendientes,type RegistroPendiente} from '../sync/pendingService';
import {obtenerSesionActual} from '../authentication/sessionService';
import {RUTAS} from '../constants/routes';
import type {ReparacionPerfil} from '../sync/protocol';
import {consultarSaldoOculto} from '../profile/balanceVisibilityService';
import {crearEstilosGlobales} from '../styles/globalStyles';
import {crearEstilosSincronizacion} from '../styles/SyncScreenStyles';
import {observarSocialOnline} from '../social/online/onlineStore';
import {sincronizarSocialOnline} from '../social/online/onlineService';

const fechaValida=(valor:string)=>{const fecha=new Date(valor);return Number.isNaN(fecha.getTime())?null:fecha;};
const formatearFecha=(valor:string)=>fechaValida(valor)?.toLocaleString('es-AR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})??'Fecha no disponible';

export default function PantallaSincronizacion({navigation:navegacion}:import('../navigation/types').PropiedadesPantalla){
  const { mostrarAviso } = useContext(ContextoAvisos);
  const volverProtegido = useRegresoProtegido(navegacion);
  const {tema}=useContext(ContextoApariencia),{bottom}=useSafeAreaInsets();
  const globales=crearEstilosGlobales(tema),estilos=crearEstilosSincronizacion(tema,bottom);
  const [vista,establecerVista]=useState(obtenerVistaSincronizacion);
  const [datos,establecerDatos]=useState<DatosPendientes>({total:0,registros:[],soloLocal:false,ultimaSincronizacion:null});
  const [cargando,establecerCargando]=useState(true),[error,establecerError]=useErrorNotificado(''),[oculto,establecerOculto]=useState(true);
  const [mesesAbiertos,establecerMesesAbiertos]=useState<string[]>([]);
  const [errorReparacion,establecerErrorReparacion]=useErrorNotificado('');
  const [reparacion,establecerReparacion]=useState<ReparacionPerfil|null>(null);
  const [reparando,establecerReparando]=useState(false);
  const [enviando,establecerEnviando]=useState(false);
  const secuencia=useRef(0),datosActuales=useRef(datos),cargaActiva=useRef(false),recargaPendiente=useRef(false);
  const cargar=useCallback(async(reemplazar=true,mostrarCarga=true)=>{
    if(cargaActiva.current){if(reemplazar)recargaPendiente.current=true;return;}
    const peticion=++secuencia.current;cargaActiva.current=true;if(mostrarCarga)establecerCargando(true);
    try{
      const actuales=datosActuales.current;
      const resultado=await consultarPendientes(30,reemplazar?0:actuales.registros.length);
      const propuesta=await consultarReparacionPerfil();
      if(peticion!==secuencia.current)return;
      establecerReparacion(propuesta);
      const nuevos={...resultado,registros:reemplazar?resultado.registros:[...actuales.registros,...resultado.registros]};
      datosActuales.current=nuevos;establecerDatos(nuevos);establecerError('');
    }catch{if(peticion===secuencia.current)establecerError('No se pudieron consultar los pendientes. Volvé a intentar.');}
    finally{if(peticion===secuencia.current){
      cargaActiva.current=false;establecerCargando(false);
      if(recargaPendiente.current){recargaPendiente.current=false;void cargar(true,false);}
    }}
  },[]);
  useFocusEffect(useCallback(()=>{
    let activa=true;
    void obtenerSesionActual().then(async({usuario})=>{
      const privado=usuario?await consultarSaldoOculto(usuario.id):true;
      if(activa)establecerOculto(privado);
    }).catch(()=>{if(activa)establecerOculto(true);});
    const dejar=observarSincronizacion(v=>{establecerVista(v);void cargar(true,false);});
    const dejarSocial=observarSocialOnline(()=>{void cargar(true,false);});
    return()=>{activa=false;secuencia.current++;cargaActiva.current=false;recargaPendiente.current=false;dejar();dejarSocial();};
  },[cargar]));
  useAvisoError(['conflicto','sesion','revocado'].includes(vista.estado) ? vista.detalle : null);
  useAvisoError(reparacion ? 'El servidor rechazó el correo de un cambio pendiente. Corregilo en Perfil y volvé aquí para confirmarlo.' : null);
  const secciones=useMemo(()=>{
    const grupos=new Map<string,{titulo:string;data:RegistroPendiente[]}>();
    for(const registro of datos.registros){
      const fecha=fechaValida(registro.fecha);
      const clave=fecha?`${fecha.getFullYear()}-${fecha.getMonth()}`:'sin-fecha';
      if(!grupos.has(clave))grupos.set(clave,{titulo:fecha?fecha.toLocaleDateString('es-AR',{month:'long',year:'numeric'}).replace(/^./,letra=>letra.toUpperCase()):'Fecha no disponible',data:[]});
      grupos.get(clave)!.data.push(registro);
    }
    return [...grupos].map(([key,grupo])=>({key,titulo:grupo.titulo,data:mesesAbiertos.includes(key)?grupo.data:[]}));
  },[datos.registros,mesesAbiertos]);
  const ocupado=enviando||reparando||['comprobando','sincronizando'].includes(vista.estado);
  const deshabilitado=ocupado||datos.soloLocal;
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
  return <SafeAreaView edges={['top']} style={globales.areaSegura}><MarcoEncabezado style={globales.pantalla} tema={tema} encabezado={<EncabezadoSeccion tema={tema} titulo="Sincronización" descripcion="Tus cambios, del teléfono a la nube." alVolver={()=>volverProtegido()} mostrarSincronizacion={false}/>}>

    <SeccionesEncabezado sections={secciones} keyExtractor={r=>r.id} contentContainerStyle={estilos.contenido} stickySectionHeadersEnabled={false}
      ListHeaderComponent={<View style={estilos.resumen}>
        <View style={estilos.fila}>
          <View style={estilos.iconoEstado}>{ocupado?<PuntosCarga color={tema.foco}/>:<Ionicons name={datos.soloLocal?'phone-portrait-outline':vista.estado==='online'?'cloud-done-outline':vista.estado==='offline'?'cloud-offline-outline':'cloud-upload-outline'} size={24} color={tema.foco}/>}</View>
          <View style={estilos.flexible}>
            <Text style={estilos.etiqueta}>ESTADO ACTUAL</Text>
            <Text accessibilityLiveRegion="polite" style={estilos.titulo}>{vista.estado==='online'&&datos.total?'Cambios pendientes de confirmar':TEXTOS_SYNC[vista.estado]}</Text>
          </View>
        </View>
        <View style={estilos.metricas}>
          <View style={estilos.contador}><Text style={estilos.numero}>{cargando&&!datos.registros.length?'—':datos.total}</Text><Text style={estilos.texto}>pendientes</Text></View>
          <View style={estilos.ultima}>
            <Text style={estilos.etiqueta}>Última sincronización exitosa</Text>
            <Text style={estilos.valor}>{datos.soloLocal?'Solo en este teléfono':datos.ultimaSincronizacion?formatearFecha(datos.ultimaSincronizacion):'Sin sincronizaciones registradas'}</Text>
          </View>
        </View>
        {datos.soloLocal?<Text style={estilos.texto}>Esta cuenta contiene ejemplos locales y no se envía al servidor.</Text>:null}

        <BotonAccion tema={tema} texto={'Sincronizar ahora'} variante="principal" cargando={ocupado} deshabilitado={deshabilitado} alPresionar={()=>{establecerEnviando(true);void sincronizarSesion().then(()=>sincronizarSocialOnline()).then(async()=>{await cargar();const actual=obtenerVistaSincronizacion();if(actual.estado==='online'&&!actual.pendientes)mostrarAviso('Sincronización completada.',{tipo:'exito'});}).catch(async fallo=>{await cargar();establecerError(fallo instanceof Error?fallo.message:'No se pudo sincronizar. Volvé a intentar.');}).finally(()=>establecerEnviando(false));}} estilo={[estilos.boton]} />
        {reparacion?<View style={estilos.reparacion}>

          <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" disabled={ocupado} onPress={conRespuestaVisual(()=>navegacion.navigate(RUTAS.PERFIL))} style={estilos.boton}><Text style={estilos.textoBoton}>Corregir en Perfil</Text></Pressable>
          <BotonAccion tema={tema} texto={"Aplicar correo corregido"} variante="principal" cargando={false} deshabilitado={ocupado||reparacion.correoAnterior===reparacion.correoNuevo} alPresionar={confirmarReparacion} estilo={[estilos.boton]} />
        </View>:null}
        {errorReparacion||error?<View><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" onPress={conRespuestaVisual(()=>{void cargar();})} style={estilos.reintentar}><Text style={estilos.valor}>Volver a intentar</Text></Pressable></View>:null}
        {datos.total>0?<View style={estilos.encabezadoLista}><Text style={estilos.titulo}>Cambios pendientes</Text><Text style={estilos.ayuda}>Más recientes primero · Hora local</Text></View>:null}
      </View>}
      renderSectionHeader={({section})=><EncabezadoSeccionPlegable tema={tema} titulo={section.titulo} expandido={mesesAbiertos.includes(section.key)}
        alAlternar={()=>establecerMesesAbiertos(anteriores=>anteriores.includes(section.key)?anteriores.filter(clave=>clave!==section.key):[...anteriores,section.key])}/>}
      renderItem={({item})=>{
        const fecha=fechaValida(item.fecha);
        return <View accessible accessibilityLabel={`${item.titulo}. ${item.accion}. Registro local: ${formatearFecha(item.fecha)}${item.importe===null?'':oculto?'. Importe oculto':`. $ ${item.importe.toLocaleString('es-AR')}`}`} style={estilos.tarjeta}>
          <View style={estilos.fila}>
            <View style={estilos.iconoRegistro}><Ionicons name="cloud-upload-outline" size={18} color={tema.foco}/></View>
            <View style={estilos.flexible}>
              <View style={estilos.filaTitulo}>
                <Text numberOfLines={1} style={estilos.nombre}>{item.titulo}</Text>
                {item.importe!==null?<Text style={estilos.importe}>{oculto?'Importe oculto':`$ ${item.importe.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2})}`}</Text>:null}
              </View>
              <View style={estilos.metadatos}><Text style={estilos.ayuda}>{item.accion}</Text><Text style={estilos.ayuda}>{fecha?fecha.toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'Fecha no disponible'}</Text></View>
            </View>
          </View>
        </View>;
      }}
      ItemSeparatorComponent={()=> <View style={estilos.separador}/>}
      ListEmptyComponent={!cargando&&!error?<View style={estilos.vacio}><View style={estilos.iconoEstado}><Ionicons name={datos.soloLocal?'phone-portrait-outline':'checkmark-done-outline'} size={28} color={tema.foco}/></View><Text style={estilos.titulo}>{datos.soloLocal?'Datos de prueba':'Sin pendientes'}</Text><Text style={estilos.texto}>{datos.soloLocal?'Los ejemplos se guardan solo en este teléfono.':'Todos los cambios locales están confirmados.'}</Text></View>:null}
      ListFooterComponent={cargando?<PuntosCarga style={estilos.carga} color={tema.foco}/>:!error&&datos.registros.length<datos.total?<Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" onPress={conRespuestaVisual(()=>{void cargar(false);})} style={estilos.reintentar}><Text style={estilos.valor}>Cargar más pendientes</Text></Pressable>:null}
    />
  </MarcoEncabezado></SafeAreaView>;
}
