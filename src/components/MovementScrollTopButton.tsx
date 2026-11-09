import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Tema } from '../styles/colors';
import { crearEstilosMesesMovimientos } from '../styles/MovementMonthListStyles';

export default function BotonSubirMovimientos({ visible, alSubir, tema }: { visible: boolean; alSubir: () => void; tema: Tema }) {
  if (!visible) return null;
  const estilos = crearEstilosMesesMovimientos(tema);
  return <View style={estilos.filaSubir}>
    <Pressable accessibilityRole="button" accessibilityLabel="Volver arriba" accessibilityHint="Vuelve al comienzo de los movimientos."
      onPress={alSubir} style={estilos.botonSubir}>
      <Ionicons name="arrow-up" color={tema.foco} size={22}/>
    </Pressable>
  </View>;
}
