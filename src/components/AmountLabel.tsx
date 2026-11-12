import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { estilosEtiquetaImporte as estilos } from '../styles/AmountLabelStyles';

export default function EtiquetaImporte({ children: texto, style: estilo, enFila = true }: { children: string; style?: StyleProp<TextStyle>; enFila?: boolean }) {
  const [ancho, establecerAncho] = useState(0);
  const [medida, establecerMedida] = useState({ clave: '', ancho: 0 });
  const { fontScale } = useWindowDimensions();
  const fuente = StyleSheet.flatten(estilo);
  const clave = JSON.stringify([texto,fontScale,fuente?.fontFamily,fuente?.fontSize,fuente?.fontWeight,fuente?.letterSpacing]);
  const [reducir, establecerReducir] = useState(true);
  const [activa, establecerActiva] = useState(!AppState?.currentState || AppState.currentState === 'active');
  const desplazamiento = useRef(new Animated.Value(0)).current;
  const anchoTexto = medida.clave === clave ? medida.ancho : 0;
  const distancia = Math.max(0, Math.ceil(anchoTexto - ancho));
  useEffect(() => {
    let vigente = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(valor => { if (vigente) establecerReducir(valor); }).catch(() => {});
    const preferencia = AccessibilityInfo.addEventListener('reduceMotionChanged', establecerReducir);
    const estado = AppState?.addEventListener?.('change', valor => establecerActiva(valor === 'active'));
    return () => { vigente = false; preferencia.remove(); estado?.remove(); };
  }, []);
  useEffect(() => {
    desplazamiento.setValue(0);
    if (reducir || !activa || !ancho || distancia <= 1) return;
    let vigente = true;
    let animacion: Animated.CompositeAnimation | undefined;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const repetir = () => {
      if (!vigente) return;
      desplazamiento.setValue(0);
      espera = setTimeout(() => {
        if (!vigente) return;
        animacion = Animated.timing(desplazamiento, { toValue: -distancia, duration: 1000, easing: Easing.linear, useNativeDriver: true, isInteraction: false });
        animacion.start(({ finished }) => { if (finished && vigente) espera = setTimeout(repetir, 2000); });
      }, 2000);
    };
    repetir();
    return () => { vigente = false; clearTimeout(espera); animacion?.stop(); desplazamiento.setValue(0); };
  }, [texto, distancia, ancho, reducir, activa, desplazamiento]);
  const contenido = <Text numberOfLines={1} ellipsizeMode="clip" style={[estilo, estilos.texto]}
    onTextLayout={evento => { const valor = evento.nativeEvent.lines[0]?.width || 0; if (valor > 0) establecerMedida(prev => prev.clave === clave && Math.abs(prev.ancho - valor) < 0.5 ? prev : { clave, ancho: valor }); }}>{texto}</Text>;
  return <View accessible accessibilityLabel={texto} style={[estilos.ventana, !enFila && estilos.columna]}
    onLayout={evento => establecerAncho(evento.nativeEvent.layout.width)}>
    {reducir ? <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={distancia > 1}>
      <View style={{ width: anchoTexto ? Math.ceil(anchoTexto) + 1 : 100000 }}>{contenido}</View>
    </ScrollView> : <Animated.View style={{ width: anchoTexto ? Math.ceil(anchoTexto) + 1 : 100000, transform: [{ translateX: desplazamiento }] }}>{contenido}</Animated.View>}
  </View>;
}
