import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export default function Conmutador({ tema, valor, alCambiar, etiquetaAccesibilidad = 'Conmutador' }) {
  const progreso = useRef(new Animated.Value(valor ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progreso, {
      toValue: valor ? 1 : 0,
      damping: 16,
      stiffness: 180,
      useNativeDriver: false,
    }).start();
  }, [progreso, valor]);

  const moverControl = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });
  const colorFondo = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [tema.nombre === 'oscuro' ? tema.fondoDeshabilitado : '#D6D6D6', tema.foco],
  });
  const colorControl = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [
      tema.nombre === 'oscuro' ? tema.textoSecundario : tema.superficie,
      tema.nombre === 'oscuro' ? tema.encabezadoTexto : tema.superficie,
    ],
  });

  return (
    <Pressable
      accessibilityLabel={etiquetaAccesibilidad}
      accessibilityRole="switch"
      accessibilityState={{ checked: valor }}
      onPress={() => alCambiar(!valor)}
      style={{ minWidth: 56, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={{
          width: 56,
          height: 32,
          justifyContent: 'center',
          padding: 4,
          borderRadius: 999,
          backgroundColor: colorFondo,
        }}
      >
        <Animated.View
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            backgroundColor: colorControl,
            transform: [{ translateX: moverControl }],
            elevation: 2,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.18,
            shadowRadius: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
