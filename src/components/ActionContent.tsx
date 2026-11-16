import { useEffect, useRef, useState } from 'react';
import { Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { useMovimientoReducido } from '../hooks/useReducedMotion';
import { ANIMACION_ACCION, crearEstilosGlobales } from '../styles/globalStyles';
import PuntosCarga from './LoadingDots';

export default function ContenidoAccion({texto,color,cargando=false,completado=false,estiloTexto}:{texto:string;color:string;cargando?:boolean;completado?:boolean;estiloTexto?:StyleProp<TextStyle>}) {
  const reducido=useMovimientoReducido(),estilos=crearEstilosGlobales();
  const siguiente=cargando?'Procesando':completado?'Listo':texto;
  const [etiqueta,cambiarEtiqueta]=useState(siguiente);
  const desplazamiento=useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    if(reducido||etiqueta===siguiente){cambiarEtiqueta(siguiente);desplazamiento.setValue(0);return;}
    const salida=Animated.timing(desplazamiento,{toValue:-24,duration:ANIMACION_ACCION.transicion/2,useNativeDriver:true});
    let entrada:Animated.CompositeAnimation|undefined;
    salida.start(({finished})=>{if(!finished)return;cambiarEtiqueta(siguiente);desplazamiento.setValue(24);entrada=Animated.timing(desplazamiento,{toValue:0,duration:ANIMACION_ACCION.transicion/2,useNativeDriver:true});entrada.start();});
    return()=>{salida.stop();entrada?.stop();};
  },[siguiente,reducido,desplazamiento]);
  return <Animated.View style={[estilos.accionContenido,{transform:[{translateY:desplazamiento}]}]}>
    {cargando?<PuntosCarga color={color}/>:completado?<Ionicons name="checkmark" size={20} color={color}/>:null}
    <Text accessibilityLiveRegion="polite" style={[estilos.accionTexto,estiloTexto,{color}]}>{etiqueta}</Text>
  </Animated.View>;
}
