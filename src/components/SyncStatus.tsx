import { useContext,useEffect,useRef,useState } from 'react';
import { AppState,Pressable,StyleSheet,Text,View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContextoApariencia } from '../contexts/AppearanceContext';
import { ContextoAvisos } from '../contexts/ToastContext';
import { observarSincronizacion,sincronizarSesion,type VistaSync } from '../sync/syncService';
import { observarCambiosLocales } from '../sync/journal';

export default function EstadoSincronizacion() {
  const {tema}=useContext(ContextoApariencia),{mostrarAviso}=useContext(ContextoAvisos);
  const margenes=useSafeAreaInsets();
  const [vista,establecerVista]=useState<VistaSync>({estado:'local',pendientes:0});
  const anterior=useRef('');
  useEffect(()=>{
    const dejar=observarSincronizacion(v=>{
      establecerVista(v);
      if(['offline','online'].includes(v.estado)&&v.estado!==anterior.current) {
        if(v.estado==='offline')mostrarAviso('Sin conexión con el servidor. Tus cambios se guardan en este dispositivo.');
        else if(anterior.current==='offline')mostrarAviso('Conexión recuperada. Tus datos están sincronizados.');
        anterior.current=v.estado;
      }
    });
    let espera:ReturnType<typeof setTimeout>|undefined;
    const comprobar=()=>{if(AppState.currentState==='active')void sincronizarSesion().catch(()=>{});};comprobar();
    const dejarCambios=observarCambiosLocales(()=>{clearTimeout(espera);espera=setTimeout(comprobar,300);});
    const intervalo=setInterval(comprobar,10000);
    const escucha=AppState.addEventListener('change',estado=>{if(estado==='active')comprobar();});
    return()=>{dejar();dejarCambios();clearTimeout(espera);clearInterval(intervalo);escucha.remove();};
  },[mostrarAviso]);
  if(vista.estado==='local')return null;
  const texto={local:'Solo local',comprobando:'Comprobando servidor',sincronizando:'Sincronizando',offline:'Sin conexión · guardado local',online:'Sincronizado',sesion:'Servidor disponible · iniciá sesión para sincronizar',conflicto:'Revisar sincronización · datos locales conservados'}[vista.estado];
  return <View style={[estilos.barra,{backgroundColor:tema.superficie,borderColor:tema.borde,paddingBottom:Math.max(6,margenes.bottom)}]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${texto}. Comprobar conexión`} onPress={()=>void sincronizarSesion()} style={estilos.boton}>
      <Text accessibilityLiveRegion="polite" style={{color:tema.textoPrincipal,fontSize:12}}>{texto}{vista.pendientes?` · ${vista.pendientes} pendientes`:''} ↻</Text>
      {vista.estado==='conflicto'&&vista.detalle?<Text style={{color:tema.textoSecundario,fontSize:11}}>{vista.detalle}</Text>:null}
    </Pressable>
  </View>;
}
const estilos=StyleSheet.create({barra:{borderBottomWidth:1,paddingHorizontal:16,paddingVertical:6},boton:{minHeight:32,justifyContent:'center'}});
