import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { NombreIcono } from '../constants/movimientos';
import type { Tema } from '../styles/colors';
import type { crearEstilosPerfil } from '../styles/ProfileScreenStyles';

export default function ListaOpcionesPerfil<Identificador extends string>({
  tema, estilos, opciones, valor, alSeleccionar,
}: {
  tema: Tema;
  estilos: ReturnType<typeof crearEstilosPerfil>;
  opciones: readonly { id: Identificador; nombre: string; descripcion: string; icono: NombreIcono }[];
  valor: string;
  alSeleccionar: (id: Identificador) => void;
}) {
  return (
    <View style={estilos.listaOpcionesModal}>
      {opciones.map(opcion => {
        const activo = valor === opcion.id;
        return (
          <View key={opcion.id} style={estilos.contenedorOpcionModal}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              onPress={() => alSeleccionar(opcion.id)}
              style={[estilos.opcionSelector, activo && estilos.opcionSelectorActiva]}
            >
              <View style={[estilos.iconoSelectorModal, activo && estilos.iconoSelectorModalActivo]}>
                <Ionicons color={activo ? tema.contenedorVerdeTexto : tema.textoSecundario} name={opcion.icono} size={21} />
              </View>
              <View style={estilos.contenidoOpcionSelector}>
                <Text style={estilos.textoOpcionSelector}>{opcion.nombre}</Text>
                <Text style={estilos.descripcionOpcionSelector}>{opcion.descripcion}</Text>
              </View>
              <Ionicons color={activo ? tema.foco : tema.textoSecundario} name={activo ? 'checkmark-circle' : 'ellipse-outline'} size={22} />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
