import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { COLORES_GRAFICOS } from '../styles/colors';

const crearFondoCategoria = (color, tema) => {
  const [rojo, verde, azul] = color.slice(1).match(/.{2}/g).map((valor) => parseInt(valor, 16));
  const opacidad = tema.nombre === 'oscuro' ? 0.22 : 0.12;
  return `rgba(${rojo}, ${verde}, ${azul}, ${opacidad})`;
};

export default function SelectorCategoria({
  estilosGlobales,
  estilosMovimiento,
  tema,
  etiqueta = 'Categoría',
  categorias,
  seleccionadaId,
  alSeleccionar = () => {},
  seleccionMultiple = false,
  seleccionadasIds = [],
  alCambiarMulti = () => {},
  variante = 'tarjetas',
  cantidadPrincipales = 4,
  carrusel = false,
  error,
}) {
  const [modalVisible, establecerModalVisible] = useState(false);
  const enGrilla = variante === 'grilla';
  const categoriasPrincipales = enGrilla ? categorias : categorias.slice(0, cantidadPrincipales);
  const categoriasAdicionales = enGrilla ? [] : categorias.slice(cantidadPrincipales);
  const seleccionada = categorias.find((categoria) => categoria.id === seleccionadaId);
  const seleccionFueraDeVista = seleccionada
    && !categoriasPrincipales.some((categoria) => categoria.id === seleccionadaId);

  const seleccionarCategoria = (categoriaId) => {
    if (seleccionMultiple) {
      const activa = seleccionadasIds.includes(categoriaId);
      alCambiarMulti(activa
        ? seleccionadasIds.filter((id) => id !== categoriaId)
        : [...seleccionadasIds, categoriaId]);
      return;
    }
    alSeleccionar(categoriaId);
    establecerModalVisible(false);
  };

  const categoriaActiva = (categoriaId) => (seleccionMultiple
    ? seleccionadasIds.includes(categoriaId)
    : seleccionadaId === categoriaId);

  const mostrarTarjeta = (categoria) => {
    const activa = categoriaActiva(categoria.id);
    const indiceCategoria = categorias.findIndex(
      (elemento) => elemento.id === categoria.id,
    );
    const color = COLORES_GRAFICOS[indiceCategoria % COLORES_GRAFICOS.length];
    return (
      <Pressable
        key={categoria.id}
        accessibilityLabel={categoria.nombre}
        accessibilityRole="button"
        accessibilityState={{ selected: activa }}
        onPress={() => seleccionarCategoria(categoria.id)}
        style={({ pressed: presionado }) => [
          estilosMovimiento.tarjetaCategoria,
          { backgroundColor: crearFondoCategoria(color, tema) },
          activa ? estilosMovimiento.tarjetaCategoriaSeleccionada : null,
          { borderColor: activa ? color : tema.borde },
          presionado ? { opacity: 0.82 } : null,
        ]}
      >
        <Ionicons
          color={color}
          name={categoria.icono}
          size={22}
        />
        <Text numberOfLines={1} style={estilosMovimiento.nombreCategoria}>
          {categoria.nombreCorto || categoria.nombre}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={estilosMovimiento.grupo}>
      <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text>
      {carrusel ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={estilosMovimiento.listaCategorias}>
          {categorias.map((categoria) => mostrarTarjeta(categoria))}
        </View>
      </ScrollView>
      ) : (
      <View style={[estilosMovimiento.listaCategorias, enGrilla ? { flexWrap: 'wrap' } : null]}>
        {categoriasPrincipales.map((categoria) => mostrarTarjeta(categoria))}
        {enGrilla ? null : (
        <Pressable
          accessibilityLabel="Ver más categorías"
          accessibilityRole="button"
          accessibilityState={{ expanded: modalVisible }}
          onPress={() => establecerModalVisible(true)}
          style={({ pressed: presionado }) => [
            estilosMovimiento.tarjetaCategoria,
            estilosMovimiento.tarjetaMasCategorias,
            presionado ? { opacity: 0.82 } : null,
          ]}
        >
          <Ionicons color={tema.foco} name="add-outline" size={24} />
          <Text style={estilosMovimiento.nombreCategoria}>Más</Text>
        </Pressable>
        )}
      </View>
      )}
      {seleccionFueraDeVista ? (
        <Text style={estilosGlobales.textoAyuda}>
          Seleccionada: {seleccionada.nombre}
        </Text>
      ) : null}
      {error ? (
        <Text style={[estilosGlobales.textoError, estilosMovimiento.errorCampo]}>{error}</Text>
      ) : null}

      {enGrilla ? null : (
      <Modal
        animationType="fade"
        onRequestClose={() => establecerModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <Pressable
          accessibilityLabel="Cerrar selector de categorías"
          onPress={() => establecerModalVisible(false)}
          style={estilosMovimiento.fondoSuperpuesto}
        >
          <Pressable onPress={() => {}} style={estilosMovimiento.tarjetaSuperpuesta}>
            <View style={estilosMovimiento.encabezadoModal}>
              <Text style={estilosMovimiento.tituloModal}>Más categorías</Text>
              <Pressable
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => establecerModalVisible(false)}
                style={estilosMovimiento.botonCerrarModal}
              >
                <Ionicons color={tema.textoPrincipal} name="close" size={22} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={estilosMovimiento.listaOpcionesCategoria}
              showsVerticalScrollIndicator={false}
              style={estilosMovimiento.scrollCategorias}
            >
              {categoriasAdicionales.map((categoria) => {
                const activa = categoria.id === seleccionadaId;
                const indiceCategoria = categorias.findIndex(
                  (elemento) => elemento.id === categoria.id,
                );
                const color = COLORES_GRAFICOS[indiceCategoria % COLORES_GRAFICOS.length];
                return (
                  <Pressable
                    key={categoria.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    onPress={() => seleccionarCategoria(categoria.id)}
                    style={[
                      estilosMovimiento.opcionCategoria,
                      { backgroundColor: crearFondoCategoria(color, tema) },
                      activa ? estilosMovimiento.opcionCategoriaSeleccionada : null,
                      { borderColor: activa ? color : 'transparent' },
                    ]}
                  >
                    <Ionicons
                      color={color}
                      name={categoria.icono}
                      size={22}
                    />
                    <Text style={estilosMovimiento.textoOpcionCategoria}>{categoria.nombre}</Text>
                    <Ionicons
                      color={activa ? color : tema.borde}
                      name={activa ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      )}
    </View>
  );
}
