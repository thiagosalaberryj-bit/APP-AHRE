import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function SelectorCategoria({
  estilosGlobales,
  estilosMovimiento,
  tema,
  etiqueta = 'Categoría',
  categorias,
  seleccionadaId,
  alSeleccionar,
  error,
}) {
  return (
    <View style={estilosMovimiento.grupo}>
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={estilosMovimiento.listaCategorias}>
          {categorias.map((categoria) => {
            const activa = categoria.id === seleccionadaId;
            return (
              <Pressable
                key={categoria.id}
                accessibilityRole="button"
                accessibilityState={{ selected: activa }}
                onPress={() => alSeleccionar(categoria.id)}
                style={[
                  estilosMovimiento.tarjetaCategoria,
                  activa ? estilosMovimiento.tarjetaCategoriaSeleccionada : null,
                ]}
              >
                <Ionicons
                  color={activa ? tema.foco : tema.textoSecundario}
                  name={categoria.icono}
                  size={28}
                />
                <Text style={estilosMovimiento.nombreCategoria}>{categoria.nombre}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {error ? (
        <Text style={[estilosGlobales.textoError, estilosMovimiento.errorCampo]}>{error}</Text>
      ) : null}
    </View>
  );
}
