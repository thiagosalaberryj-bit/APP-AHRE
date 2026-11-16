import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { useMovimientoReducido } from '../hooks/useReducedMotion';
import { ANIMACION_ACCION, crearEstilosGlobales } from '../styles/globalStyles';
import PuntosCarga from './LoadingDots';

type EstadoContenido = {etiqueta:string;tipo:'carga'|'exito'|'texto'};

export default function ContenidoAccion({texto,color,cargando=false,completado=false,estiloTexto}:{texto:string;color:string;cargando?:boolean;completado?:boolean;estiloTexto?:StyleProp<TextStyle>}) {
  const reducido=useMovimientoReducido(),estilos=crearEstilosGlobales();
  const tipo=cargando?'carga':completado?'exito':'texto';
  const etiqueta=cargando?'Procesando':completado?'Listo':texto;
  const mostrado=useRef<EstadoContenido>({etiqueta,tipo});
  const [contenido,cambiarContenido]=useState<{actual:EstadoContenido;anterior:EstadoContenido|null}>({actual:mostrado.current,anterior:null});
  const progreso=useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    const anterior=mostrado.current,actual:EstadoContenido={etiqueta,tipo};
    if(anterior.etiqueta===etiqueta&&anterior.tipo===tipo){if(reducido)progreso.setValue(1);return;}
    mostrado.current=actual;
    if(reducido){progreso.setValue(1);cambiarContenido({actual,anterior:null});return;}
    progreso.setValue(0);
    cambiarContenido({actual,anterior});
  },[etiqueta,tipo,reducido,progreso]);
  useEffect(()=>{
    if(reducido||!contenido.anterior)return;
    // Arranca después del commit de ambas filas, sin intercambios a mitad del recorrido.
    const animacion=Animated.timing(progreso,{toValue:1,duration:ANIMACION_ACCION.transicion,useNativeDriver:true,isInteraction:false});
    animacion.start();
    return()=>animacion.stop();
  },[contenido,reducido,progreso]);
  const representar=(estado:EstadoContenido,anterior=false)=><>
    {estado.tipo==='carga'?<PuntosCarga color={color} animado={!anterior}/>:estado.tipo==='exito'?<Ionicons name="checkmark" size={20} color={color}/>:null}
    <Text style={[estilos.accionTexto,estiloTexto,{color}]}>{estado.etiqueta}</Text>
  </>;
  return <View style={estilos.accionContenido} accessibilityLiveRegion="polite" accessibilityLabel={contenido.actual.etiqueta}>
    {contenido.anterior?<Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[estilos.accionFila,estilos.accionAnterior,{opacity:progreso.interpolate({inputRange:[0,1],outputRange:[1,0]}),transform:[{translateY:progreso.interpolate({inputRange:[0,1],outputRange:[0,-24]})}]}]}>{representar(contenido.anterior,true)}</Animated.View>:null}
    <Animated.View style={[estilos.accionFila,{opacity:progreso,transform:[{translateY:progreso.interpolate({inputRange:[0,1],outputRange:[24,0]})}]}]}>{representar(contenido.actual)}</Animated.View>
  </View>;
}
