import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';
import { useMovimientoReducido } from '../hooks/useReducedMotion';
import { ANIMACION_ACCION, crearEstilosGlobales } from '../styles/globalStyles';
import type {NombreIcono} from '../constants/movimientos';
import PuntosCarga from './LoadingDots';

type EstadoContenido = {etiqueta:string;tipo:'carga'|'exito'|'texto'};

export default function ContenidoAccion({texto,color,cargando=false,completado=false,estiloTexto,icono,ocultarTexto=false,animarCambios=true}:{icono?:NombreIcono;ocultarTexto?:boolean;animarCambios?:boolean;texto:string;color:string;cargando?:boolean;completado?:boolean;estiloTexto?:StyleProp<TextStyle>}) {
  const reducido=useMovimientoReducido()||!animarCambios,estilos=crearEstilosGlobales();
  const tipo=cargando?'carga':completado?'exito':'texto';
  const etiqueta=cargando?'Procesando':completado?'Listo':texto;
  const mostrado=useRef<EstadoContenido>({etiqueta,tipo});
  const [contenido,cambiarContenido]=useState<{actual:EstadoContenido;anterior:EstadoContenido|null}>({actual:mostrado.current,anterior:null});
  const progreso=useRef(new Animated.Value(1)).current;
  useLayoutEffect(()=>{
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
    animacion.start(({finished})=>{
      if(finished)cambiarContenido(actual=>actual===contenido?{...actual,anterior:null}:actual);
    });
    return()=>animacion.stop();
  },[contenido,reducido,progreso]);
  const representar=(estado:EstadoContenido)=><>
    {estado.tipo==='carga'?<PuntosCarga color={color} animado/>:estado.tipo==='exito'?<Ionicons name="checkmark" size={20} color={color}/>:icono?<Ionicons name={icono} size={22} color={color}/>:null}
    {!ocultarTexto?<Text style={[estilos.accionTexto,estiloTexto,{color}]}>{estado.etiqueta}</Text>:null}
  </>;
  return <View style={estilos.accionContenido} accessibilityLiveRegion="polite" accessibilityLabel={contenido.actual.etiqueta}>
    {[contenido.anterior,contenido.actual].map((estado,indice)=>{
      if(!estado)return null;
      const anterior=indice===0;
      // La clave conserva la fila y sus puntos al pasar de actual a saliente.
      return <Animated.View key={estado.tipo+':'+estado.etiqueta}
        accessibilityElementsHidden={anterior} importantForAccessibility={anterior?'no-hide-descendants':'auto'} pointerEvents={anterior?'none':'auto'}
        style={[estilos.accionFila,anterior&&estilos.accionAnterior,{
          opacity:anterior?progreso.interpolate({inputRange:[0,1],outputRange:[1,0]}):progreso,
          transform:[{translateY:progreso.interpolate({inputRange:[0,1],outputRange:anterior?[0,-24]:[24,0]})}],
        }]}>{representar(estado)}</Animated.View>;
    })}
  </View>;
}
