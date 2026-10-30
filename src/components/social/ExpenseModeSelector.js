import { View, Text, Pressable } from 'react-native';
import { crearEstilosEstadisticas } from '../../styles/StatisticsScreenStyles';

export default function SelectorModoGasto({ modo, alElegir, tema }) {
  const estilos = crearEstilosEstadisticas(tema);
  return <View accessibilityRole="tablist" style={estilos.filaTipoMovimiento}>
    {[{ id: 'uno', nombre: 'Un ítem' }, { id: 'lista', nombre: 'Registrar lista' }].map(opcion => <Pressable key={opcion.id} accessibilityRole="tab" accessibilityLabel={opcion.nombre} accessibilityState={{ selected: modo === opcion.id }} onPress={() => alElegir(opcion.id)} style={[estilos.botonTipoMovimiento, modo === opcion.id && estilos.botonTipoMovimientoActivo]}>
      <Text style={[estilos.textoBotonTipo, modo === opcion.id && estilos.textoBotonTipoActivo]}>{opcion.nombre}</Text>
    </Pressable>)}
  </View>;
}
