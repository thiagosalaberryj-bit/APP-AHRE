import { Text, View } from 'react-native';
import type { Tema } from '../../styles/colors';
import crearEstilos from '../../styles/social/RoomPendingStyles';

export default function IndicadorPendientesSala({ cantidad, tema, etiqueta = 'movimientos por registrar' }: { cantidad: number; tema: Tema; etiqueta?: string }) {
  if (cantidad <= 0) return null;
  const estilos = crearEstilos(tema);
  return <View accessibilityLabel={`${cantidad} ${etiqueta}`} style={estilos.indicador}>
    <Text style={estilos.texto}>{cantidad > 99 ? '99+' : cantidad}</Text>
  </View>;
}
