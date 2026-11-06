import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Tema } from '../styles/colors';
import type { DeudaVista } from '../social/types';
import { crearEstilosTarjetaDeuda } from '../styles/DebtCardStyles';

type PropiedadesTarjetaDeuda = {
  tema: Tema;
  deuda: DeudaVista;
  nombrePersona: string;
  alAbrir?: () => void;
  soloLectura?: boolean;
};

export default function TarjetaDeuda({ tema, deuda, nombrePersona, alAbrir, soloLectura = false }: PropiedadesTarjetaDeuda) {
  const estilos = crearEstilosTarjetaDeuda(tema);
  const colorEstado = deuda.saldada || deuda.tipo !== 'debo' ? tema.exito : tema.error;
  const importe = deuda.saldada ? deuda.monto : deuda.pendiente;
  const estado = deuda.saldada ? 'Saldada' : deuda.tipo === 'debo' ? 'Le debés' : 'Te debe';
  const contenido = <>
    <View style={[estilos.icono, { backgroundColor: colorEstado + '18' }]}>
      <Ionicons color={colorEstado} name={deuda.saldada ? 'checkmark-circle-outline' : 'swap-horizontal-outline'} size={18} />
    </View>
    <View style={estilos.contenido}>
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.titulo}>{deuda.descripcion}</Text>
      <View style={estilos.fila}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.persona}>{nombrePersona}</Text>
        <Text numberOfLines={1} style={estilos.fecha}>{deuda.fecha.split('-').reverse().join('/')}</Text>
      </View>
    </View>
    <View style={estilos.franjaImporte}>
      <View style={estilos.filaTipo}>
        <Text numberOfLines={1} style={[estilos.tipo, { color: colorEstado }]}>{estado}</Text>
        {!soloLectura ? <Ionicons color={tema.textoSecundario} name="chevron-forward" size={16} /> : null}
      </View>
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.importe}>{importe}</Text>
    </View>
  </>;
  const etiqueta = deuda.descripcion + '. ' + nombrePersona + '. ' + (deuda.saldada ? 'Saldada' : 'Pendiente') + '. ' + importe;
  return soloLectura ? <View accessible accessibilityLabel={etiqueta} style={estilos.tarjeta}>{contenido}</View> : (
    <Pressable accessibilityRole="button" accessibilityLabel={etiqueta} accessibilityHint="Abre toda la información de esta deuda."
      onPress={alAbrir} style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}>{contenido}</Pressable>
  );
}
