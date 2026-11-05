import { useId, useRef, useState, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { Tema } from '../styles/colors';
import { estilosFilaFiltros } from '../styles/HorizontalFilterRowStyles';

export default function FilaFiltrosHorizontal({ tema, children, estiloContenido, colorFondo = tema.fondo }: {
  tema:Tema; children:ReactNode; estiloContenido?:StyleProp<ViewStyle>; colorFondo?:string;
}) {
  const identificador = useId().replace(/[^a-zA-Z0-9]/g, '');
  const medidas = useRef({ contenido:0, visible:0, desplazamiento:0 });
  const [bordes, establecerBordes] = useState({ izquierda:false, derecha:false });
  const actualizar = (cambios:Partial<typeof medidas.current>) => {
    Object.assign(medidas.current, cambios);
    const { contenido, visible, desplazamiento } = medidas.current;
    const sobra = visible > 0 && contenido > visible + 2;
    const izquierda = sobra && desplazamiento > 2;
    const derecha = sobra && desplazamiento + visible < contenido - 2;
    establecerBordes(actuales => actuales.izquierda === izquierda && actuales.derecha === derecha ? actuales : { izquierda, derecha });
  };
  return <View style={estilosFilaFiltros.contenedor}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEventThrottle={16}
      onLayout={evento => actualizar({ visible:evento.nativeEvent.layout.width })}
      onContentSizeChange={contenido => actualizar({ contenido })}
      onScroll={evento => actualizar({ desplazamiento:evento.nativeEvent.contentOffset.x })}
      contentContainerStyle={[estilosFilaFiltros.fila, estiloContenido]}>
      {children}
    </ScrollView>
    {(['izquierda', 'derecha'] as const).map(lado => bordes[lado] ? <View key={lado} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[estilosFilaFiltros.borde, estilosFilaFiltros[lado]]}>
      <Svg width="100%" height="100%">
        <Defs><LinearGradient id={identificador + lado} x1="0%" x2="100%" y1="0%" y2="0%">
          <Stop offset="0%" stopColor={colorFondo} stopOpacity={lado === 'izquierda' ? 1 : 0}/>
          <Stop offset="100%" stopColor={colorFondo} stopOpacity={lado === 'izquierda' ? 0 : 1}/>
        </LinearGradient></Defs>
        <Rect width="100%" height="100%" fill={'url(#' + identificador + lado + ')'}/>
      </Svg>
    </View> : null)}
  </View>;
}
