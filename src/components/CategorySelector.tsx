import { crearEstilosEgreso } from '../styles/expenseStyles';
import type { Tema } from '../styles/colors';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { BORDES } from '../styles/globalStyles';

import { obtenerColorIconoCategoria, obtenerColorCategoria, ordenarCategoriasPorColor } from '../styles/categoryColors';

const obtenerTintaCategoria = (id: string, tema: Tema, tipo?: string) => {
  const color = obtenerColorIconoCategoria(id, tema, tipo);
  if (tema.nombre === 'oscuro') return color;
  return '#' + color.slice(1).match(/.{2}/g)!.map(canal =>
    Math.round(parseInt(canal, 16) * 0.65).toString(16).padStart(2, '0'),
  ).join('');
};

const crearFondoCategoria = (color: string, tema: Tema) => {
  const canales = color.slice(1).match(/.{2}/g)!.map(valor => parseInt(valor, 16));
  const superficie = tema.superficie.slice(1).match(/.{2}/g)!.map(valor => parseInt(valor, 16));
  const esOscuro = tema.nombre === 'oscuro';
  const intensidad = esOscuro ? 0.36 : 0.8;
  const centro = (Math.max(...canales) + Math.min(...canales)) / 2;
  return '#' + canales.map((canal, indice) => {
    const tono = esOscuro ? canal : Math.max(0, Math.min(255, centro + (canal - centro) * 1.45));
    return Math.round(tono * intensidad + superficie[indice] * (1 - intensidad)).toString(16).padStart(2, '0');
  }).join('');
};

export default function SelectorCategoria({
  estilosGlobales,
  tema,
  estilosMovimiento = crearEstilosEgreso(tema),
  etiqueta = 'Categoría',
  categorias = [],
  tipoMovimiento,
  categoriasPrincipalesIds = [],
  seleccionadaId = undefined,
  alSeleccionar = (_valor?) => {},
  seleccionMultiple = false,
  seleccionadasIds = [],
  alCambiarMulti = (_valor?) => {},
  variante = 'tarjetas',
  cantidadPrincipales = 4,
  carrusel = false,
  estiloTarjeta = null,
  error = undefined,
}: import('../types/ui').SelectorCategoriaProps) {
  const [modalVisible, establecerModalVisible] = useState(false);
  const bordeCampo = {
    borderColor: estilosMovimiento.filaDescripcion?.borderColor ?? tema.borde,
    borderWidth: estilosMovimiento.filaDescripcion?.borderWidth ?? BORDES.anchos.fino,
    borderStyle: 'solid' as const,
  };
  const enGrilla = variante === 'grilla';
  const categoriasOrdenadas = ordenarCategoriasPorColor(categorias, tema, tipoMovimiento);
  const categoriasPrioritarias = [
    ...categoriasPrincipalesIds.flatMap(id => categoriasOrdenadas.filter(categoria => categoria.id === id)),
    ...categoriasOrdenadas.filter(categoria => !categoriasPrincipalesIds.includes(categoria.id)),
  ];
  const categoriasPrincipales = enGrilla ? ordenarCategoriasPorColor(categorias, tema, tipoMovimiento) : categoriasPrioritarias.slice(0, cantidadPrincipales);
  const categoriasModal = ordenarCategoriasPorColor(categorias, tema, tipoMovimiento);
  const seleccionada = categorias.find((categoria) => categoria.id === seleccionadaId);
  const seleccionFueraDeVista = seleccionada
    && !categoriasPrincipales.some((categoria) => categoria.id === seleccionadaId);

  const seleccionarCategoria = (categoriaId: string) => {
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

  const categoriaActiva = (categoriaId: string) => (seleccionMultiple
    ? seleccionadasIds.includes(categoriaId)
    : seleccionadaId === categoriaId);

  const mostrarTarjeta = (categoria: NonNullable<import('../types/ui').SelectorCategoriaProps['categorias']>[number], abrirSelector = false) => {
    const activa = categoriaActiva(categoria.id);
    const color = obtenerColorCategoria(categoria.id, tema, tipoMovimiento);
    const colorFondo = activa ? tema.encabezado : crearFondoCategoria(color, tema);
    const colorIcono = activa ? tema.encabezadoTexto : obtenerTintaCategoria(categoria.id, tema, tipoMovimiento);
    return (
      <Pressable
        key={categoria.id}
        accessibilityLabel={abrirSelector ? `${categoria.nombre}. Ver más categorías` : categoria.nombre}
        accessibilityRole="button"
        accessibilityState={{ selected: activa, ...(abrirSelector ? { expanded: modalVisible } : {}) }}
        onPress={() => abrirSelector ? establecerModalVisible(true) : seleccionarCategoria(categoria.id)}
        style={({ pressed: presionado }) => [
          estiloTarjeta || estilosMovimiento.tarjetaCategoria,
          { backgroundColor: colorFondo },
          bordeCampo,
          presionado ? { opacity: 0.82 } : null,
        ]}
      >
        <Ionicons
          color={colorIcono}
          name={categoria.icono}
          size={22}
        />
        <Text
          numberOfLines={1}
          style={[
            estilosMovimiento.nombreCategoria,
            { color: tema.textoPrincipal },
            activa && { color: tema.encabezadoTexto },
          ]}
        >
          {categoria.nombreCorto || categoria.nombre}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={estilosMovimiento.grupo}>
      {etiqueta ? <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text> : null}
      {carrusel ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={estilosMovimiento.listaCategorias}>
          {categoriasOrdenadas.map((categoria) => mostrarTarjeta(categoria))}
        </View>
      </ScrollView>
      ) : (
      <View style={[estilosMovimiento.listaCategorias, enGrilla ? { flexWrap: 'wrap' } : null]}>
        {categoriasPrincipales.map((categoria) => mostrarTarjeta(categoria))}
        {enGrilla ? null : seleccionFueraDeVista && !seleccionMultiple ? mostrarTarjeta(seleccionada, true) : (
        <Pressable
          accessibilityLabel="Ver más categorías"
          accessibilityRole="button"
          accessibilityState={{ expanded: modalVisible }}
          onPress={() => establecerModalVisible(true)}
          style={({ pressed: presionado }) => [
            estilosMovimiento.tarjetaCategoria,
            estilosMovimiento.tarjetaMasCategorias,
            bordeCampo,
            presionado ? { opacity: 0.82 } : null,
          ]}
        >
          <Ionicons color={tema.foco} name="add-outline" size={24} />
          <Text style={estilosMovimiento.nombreCategoria}>Más</Text>
        </Pressable>
        )}
      </View>
      )}
      {!seleccionMultiple ? (
        <Text accessibilityLiveRegion="polite" style={estilosGlobales.textoAyuda}>
          Categoría seleccionada: {seleccionada?.nombre || 'Ninguna'}
        </Text>
      ) : null}
      {error ? (
        <Text style={[estilosGlobales.textoError, estilosMovimiento.errorCampo]}>{error}</Text>
      ) : null}

      {enGrilla ? null : (
      <Modal statusBarTranslucent navigationBarTranslucent
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
              <Text style={estilosMovimiento.tituloModal}>Todas las categorías</Text>
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
              {categoriasModal.map((categoria) => {
                const activa = categoria.id === seleccionadaId;
                const color = obtenerColorCategoria(categoria.id, tema, tipoMovimiento);
                return (
                  <Pressable
                    key={categoria.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    onPress={() => seleccionarCategoria(categoria.id)}
                    style={[
                      estilosMovimiento.opcionCategoria,
                      { backgroundColor: activa ? tema.encabezado : crearFondoCategoria(color, tema) },
                      bordeCampo,
                    ]}
                  >
                    <Ionicons
                      color={activa ? tema.encabezadoTexto : obtenerTintaCategoria(categoria.id, tema, tipoMovimiento)}
                      name={categoria.icono}
                      size={22}
                    />
                    <Text style={[estilosMovimiento.textoOpcionCategoria, { color: activa ? tema.encabezadoTexto : tema.textoPrincipal }]}>{categoria.nombre}</Text>
                    <Ionicons
                      color={activa ? tema.encabezadoTexto : tema.textoSecundario}
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
