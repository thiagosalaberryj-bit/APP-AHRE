import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import type { Tema } from '../styles/colors';
import { crearEstilosSelectorSegmentado } from '../styles/SegmentedSelectorStyles';

export default function SelectorSegmentado({ tema, opciones, valor, alSeleccionar, etiqueta }: {
  tema:Tema; opciones:readonly {id:string;nombre:string}[]; valor:string; alSeleccionar:(id:string)=>void; etiqueta:string;
}) {
  const estilos = crearEstilosSelectorSegmentado(tema);
  const [ancho, establecerAncho] = useState(0);
  const [reducirMovimiento, establecerReducirMovimiento] = useState(false);
  const desplazamiento = useRef(new Animated.Value(0)).current;
  const medido = useRef(false);
  const indice = Math.max(0, opciones.findIndex(opcion => opcion.id === valor));
  const anchoOpcion = opciones.length ? ancho / opciones.length : 0;

  useEffect(() => {
    let vigente = true;
    AccessibilityInfo.isReduceMotionEnabled().then(valor => { if (vigente) establecerReducirMovimiento(valor); }).catch(() => {});
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', establecerReducirMovimiento);
    return () => { vigente = false; suscripcion.remove(); };
  }, []);

  useEffect(() => {
    if (!anchoOpcion) return;
    const destino = indice * anchoOpcion;
    if (!medido.current || reducirMovimiento) {
      desplazamiento.setValue(destino);
      medido.current = true;
      return;
    }
    const animacion = Animated.timing(desplazamiento, { toValue:destino, duration:200, useNativeDriver:true });
    animacion.start();
    return () => animacion.stop();
  }, [indice, anchoOpcion, reducirMovimiento, desplazamiento]);

  return <View style={estilos.contenedor}>
    <View style={estilos.fila} onLayout={evento => establecerAncho(evento.nativeEvent.layout.width)}>
      {anchoOpcion > 0 ? <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[estilos.indicador, { width:anchoOpcion, transform:[{ translateX:desplazamiento }] }]}/> : null}
      {opciones.map(opcion => <Pressable key={opcion.id} accessibilityRole="button" accessibilityLabel={etiqueta + ': ' + opcion.nombre}
        accessibilityState={{ selected:valor === opcion.id }} onPress={() => alSeleccionar(opcion.id)} style={estilos.opcion}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.texto, valor === opcion.id && estilos.textoActivo]}>{opcion.nombre}</Text>
      </Pressable>)}
    </View>
  </View>;
}
