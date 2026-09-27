import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

export default function TarjetaNotificacion({
  tema,
  estilos,
  notificacion,
  nueva,
  expandida,
  alPresionar,
}) {
  return (
    <Pressable
      accessibilityLabel={`${nueva ? 'Nueva notificación' : 'Notificación'}: ${notificacion.titulo}`}
      accessibilityRole="button"
      accessibilityState={{ expanded: expandida }}
      onPress={alPresionar}
      style={({ pressed: presionado }) => [
        estilos.tarjetaNotificacion,
        nueva ? estilos.tarjetaNueva : null,
        presionado ? { opacity: 0.85 } : null,
      ]}
    >
      <View style={estilos.iconoNotificacion}>
        <Ionicons color={tema.botonPrincipal} name={notificacion.icono} size={26} />
      </View>
      <View style={estilos.contenidoNotificacion}>
        <View style={estilos.filaTitulo}>
          {nueva ? <View style={estilos.puntoNuevo} /> : null}
          <Text style={[estilos.tituloNotificacion, nueva ? estilos.tituloNuevo : null]}>
            {notificacion.titulo}
          </Text>
          <Text style={estilos.fechaNotificacion}>{notificacion.fecha}</Text>
        </View>
        <Text numberOfLines={expandida ? undefined : 2} style={estilos.mensajeNotificacion}>
          {notificacion.mensaje}
        </Text>
        {nueva ? <Text style={estilos.etiquetaNueva}>Nueva</Text> : null}
      </View>
    </Pressable>
  );
}
