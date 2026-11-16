import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useMovimientoReducido } from '../hooks/useReducedMotion';
import type {StyleProp, ViewStyle} from 'react-native';
import { ANIMACION_ACCION, crearEstilosGlobales } from '../styles/globalStyles';

export default function PuntosCarga({color,accessibilityLabel='Procesando',style}:{style?:StyleProp<ViewStyle>;color?:string;size?:'small'|'large'|number;accessibilityLabel?:string}) {
  const reducido=useMovimientoReducido(),estilos=crearEstilosGlobales();
  const valores=useRef([new Animated.Value(0),new Animated.Value(0),new Animated.Value(0)]).current;
  useEffect(()=>{
    if(reducido)return;
    const animacion=Animated.loop(Animated.stagger(ANIMACION_ACCION.separacionPuntos,valores.map(valor=>Animated.sequence([
      Animated.timing(valor,{toValue:1,duration:ANIMACION_ACCION.punto,useNativeDriver:true}),
      Animated.timing(valor,{toValue:0,duration:ANIMACION_ACCION.punto,useNativeDriver:true}),
    ]))));
    animacion.start();return()=>{animacion.stop();valores.forEach(valor=>valor.setValue(0));};
  },[reducido,valores]);
  return <View accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} style={[estilos.accionPuntos,style]}>{valores.map((valor,indice)=><Animated.View key={indice} style={[estilos.accionPunto,{backgroundColor:color||estilos.texto.color,transform:[{translateY:valor.interpolate({inputRange:[0,1],outputRange:[0,-4]})}]}]}/>)}</View>;
}
