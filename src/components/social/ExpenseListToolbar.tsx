import type { NombreIcono } from '../../constants/movimientos';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosBarra from '../../styles/social/ExpenseListToolbarStyles';
export default function BarraListaGastos({ alAgregar, alOpciones, alEscanear, llena, tema }: Pick<import('../../social/types').AspectoSocial,'tema'> & ({alAgregar:()=>void;alOpciones:()=>void;alEscanear:()=>void;llena:boolean})) {
  const estilos = crearEstilosBarra(tema);
  return <View style={estilos.fila}>
    {[{ texto: 'Agregar', etiqueta: 'Agregar otro ítem', icono: 'add-outline', accion: alAgregar, bloqueado: llena }, { texto: 'Opciones', etiqueta: 'Opciones rápidas · Aplicar a todos', icono: 'options-outline', accion: alOpciones }, { texto: 'Escanear', etiqueta: 'Escanear ticket', icono: 'scan-outline', accion: alEscanear }].map(opcion => <Pressable key={opcion.texto} accessibilityRole="button" accessibilityLabel={opcion.etiqueta} accessibilityState={{ disabled: Boolean(opcion.bloqueado) }} disabled={opcion.bloqueado} onPress={opcion.accion} style={estilos.boton}>
      <Ionicons name={opcion.icono as NombreIcono} size={23} color={opcion.bloqueado ? tema.deshabilitado : tema.foco} /><Text numberOfLines={1} style={estilos.texto}>{opcion.texto}</Text>
    </Pressable>)}
  </View>;
}
