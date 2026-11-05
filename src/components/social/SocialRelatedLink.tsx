import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { crearEstilosDetalleSocial } from '../../styles/social/SocialDetailStyles';

export default function EnlaceRelacionadoSocial({ texto, icono, alAbrir, tema }: Omit<import('../../social/types').AspectoSocial, 'estilosMovimiento'> & { texto: string; icono: import('../../constants/movimientos').NombreIcono; alAbrir: () => void }) {
  const estilos = crearEstilosDetalleSocial(tema);
  return <Pressable accessibilityRole="button" accessibilityLabel={texto} onPress={alAbrir} style={estilos.enlace}>
    <Ionicons name={icono} color={tema.textoSecundario} size={20} />
    <Text style={estilos.textoEnlace}>{texto}</Text>
    <Ionicons name="chevron-forward" color={tema.textoSecundario} size={18} />
  </Pressable>;
}
