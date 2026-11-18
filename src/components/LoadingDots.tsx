import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useMovimientoReducido } from '../hooks/useReducedMotion';
import type {StyleProp, ViewStyle} from 'react-native';
import { ANIMACION_ACCION, crearEstilosGlobales } from '../styles/globalStyles';

export default function PuntosCarga({color,accessibilityLabel='Procesando',style,animado=true}:{animado?:boolean;style?:StyleProp<ViewStyle>;color?:string;size?:'small'|'large'|number;accessibilityLabel?:string}) {
  const reducido=useMovimientoReducido(),estilos=crearEstilosGlobales();
  const progreso=useRef(new Animated.Value(0)).current;
  const duracion=ANIMACION_ACCION.punto*2+ANIMACION_ACCION.separacionPuntos*2;
  useEffect(()=>{
    if(reducido||!animado)return;
    // Un único timing permite repetir el ciclo en el hilo nativo sin secuencias JS.
    const animacion=Animated.loop(Animated.timing(progreso,{toValue:1,duration:duracion,easing:Easing.linear,useNativeDriver:true,isInteraction:false}));
    animacion.start();return()=>{animacion.stop();progreso.setValue(0);};
  },[reducido,animado,progreso,duracion]);
  return <View accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} style={[estilos.accionPuntos,style]}>{[0,1,2].map(indice=>{
    const inicio=indice*ANIMACION_ACCION.separacionPuntos;
    const tiempos=[inicio,inicio+ANIMACION_ACCION.punto,inicio+ANIMACION_ACCION.punto*2];
    const alturas=[0,-4,0];
    if(inicio>0){tiempos.unshift(0);alturas.unshift(0);}
    if(tiempos[tiempos.length-1]<duracion){tiempos.push(duracion);alturas.push(0);}
    return <Animated.View key={indice} style={[estilos.accionPunto,{backgroundColor:color||estilos.texto.color,transform:[{translateY:progreso.interpolate({inputRange:tiempos.map(tiempo=>tiempo/duracion),outputRange:alturas})}]}]}/>;
  })}</View>;
}
