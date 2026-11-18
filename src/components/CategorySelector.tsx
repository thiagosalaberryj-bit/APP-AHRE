import {conRespuestaVisual} from '../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
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
  modalAbierto,
  alCerrarModal,
  contenidoAntesDeCategorias,
}: import('../types/ui').SelectorCategoriaProps) {
  const [modalLocal, establecerModalLocal] = useState(false);
  const modalVisible = modalAbierto ?? modalLocal;
  const establecerModalVisible = (valor: boolean) => { establecerModalLocal(valor); if (!valor) alCerrarModal?.(); };
  const bordeCampo = {
    borderColor: estilosMovimiento.filaDescripcion?.borderColor ?? tema.borde,
    borderWidth: estilosMovimiento.filaDescripcion?.borderWidth ?? BORDES.anchos.fino,
    borderStyle: 'solid' as const,
  };
  const enGrilla = variante === 'grilla';
  const enLista = variante === 'lista';
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

  const mostrarOpcion = (categoria: (typeof categorias)[number]) => {
    const activa=categoriaActiva(categoria.id);
    const color=obtenerColorCategoria(categoria.id,tema,tipoMovimiento);
    return <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={categoria.id} accessibilityRole={seleccionMultiple?'checkbox':'button'} accessibilityLabel={categoria.nombre} accessibilityState={seleccionMultiple?{checked:activa}:{selected:activa}} onPress={conRespuestaVisual(()=>seleccionarCategoria(categoria.id))} style={[estilosMovimiento.opcionCategoria,{backgroundColor:activa?tema.seleccion:crearFondoCategoria(color,tema)},bordeCampo]}>
      <Ionicons name={categoria.icono} size={22} color={activa?tema.seleccionTexto:obtenerTintaCategoria(categoria.id,tema,tipoMovimiento)}/>
      <Text style={[estilosMovimiento.textoOpcionCategoria,{color:activa?tema.seleccionTexto:tema.textoPrincipal}]}>{categoria.nombre}</Text>
      <Ionicons name={activa?'checkbox':'square-outline'} size={20} color={activa?tema.seleccionTexto:tema.textoSecundario}/>
    </Pressable>;
  };

  const mostrarTarjeta = (categoria: NonNullable<import('../types/ui').SelectorCategoriaProps['categorias']>[number], abrirSelector = false) => {
    const activa = categoriaActiva(categoria.id);
    const color = obtenerColorCategoria(categoria.id, tema, tipoMovimiento);
    const colorFondo = activa ? tema.seleccion : crearFondoCategoria(color, tema);
    const colorIcono = activa ? tema.seleccionTexto : obtenerTintaCategoria(categoria.id, tema, tipoMovimiento);
    return (
      <Pressable android_ripple={RETROALIMENTACION_PULSACION}
        key={categoria.id}
        accessibilityLabel={abrirSelector ? `${categoria.nombre}. Ver más categorías` : categoria.nombre}
        accessibilityRole="button"
        accessibilityState={{ selected: activa, ...(abrirSelector ? { expanded: modalVisible } : {}) }}
        onPress={conRespuestaVisual(() => abrirSelector ? establecerModalVisible(true) : seleccionarCategoria(categoria.id))}
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
            activa && { color: tema.seleccionTexto },
          ]}
        >
          {categoria.nombreCorto || categoria.nombre}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={estilosMovimiento.grupo}>
      {modalAbierto === undefined ? <>
      {etiqueta ? <Text style={estilosGlobales.etiqueta}>{etiqueta}</Text> : null}
      {enLista ? <View style={estilosMovimiento.listaOpcionesCategoria}>{categoriasOrdenadas.map(mostrarOpcion)}</View> : carrusel ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={estilosMovimiento.listaCategorias}>
          {categoriasOrdenadas.map((categoria) => mostrarTarjeta(categoria))}
        </View>
      </ScrollView>
      ) : (
      <View style={[estilosMovimiento.listaCategorias, enGrilla ? { flexWrap: 'wrap' } : null]}>
        {categoriasPrincipales.map((categoria) => mostrarTarjeta(categoria))}
        {enGrilla ? null : seleccionFueraDeVista && !seleccionMultiple ? mostrarTarjeta(seleccionada, true) : (
        <Pressable android_ripple={RETROALIMENTACION_PULSACION}
          accessibilityLabel="Ver más categorías"
          accessibilityRole="button"
          accessibilityState={{ expanded: modalVisible }}
          onPress={conRespuestaVisual(() => establecerModalVisible(true))}
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

      </> : null}
      {enGrilla || enLista ? null : (
      <Modal statusBarTranslucent navigationBarTranslucent
        animationType="fade"
        onRequestClose={() => establecerModalVisible(false)}
        transparent
        visible={modalVisible}
      >
        <Pressable android_ripple={RETROALIMENTACION_PULSACION}
          accessibilityLabel="Cerrar selector de categorías"
          onPress={conRespuestaVisual(() => establecerModalVisible(false))}
          style={estilosMovimiento.fondoSuperpuesto}
        >
          <Pressable android_ripple={RETROALIMENTACION_PULSACION} onPress={conRespuestaVisual(() => {})} style={estilosMovimiento.tarjetaSuperpuesta}>
            <View style={estilosMovimiento.encabezadoModal}>
              <Text style={estilosMovimiento.tituloModal}>Todas las categorías</Text>
              <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                accessibilityLabel="Cerrar"
                accessibilityRole="button"
                hitSlop={8}
                onPress={conRespuestaVisual(() => establecerModalVisible(false))}
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
              {contenidoAntesDeCategorias}
              {categoriasModal.map((categoria) => {
                const activa = categoria.id === seleccionadaId;
                const color = obtenerColorCategoria(categoria.id, tema, tipoMovimiento);
                return (
                  <Pressable android_ripple={RETROALIMENTACION_PULSACION}
                    key={categoria.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activa }}
                    onPress={conRespuestaVisual(() => seleccionarCategoria(categoria.id))}
                    style={[
                      estilosMovimiento.opcionCategoria,
                      { backgroundColor: activa ? tema.seleccion : crearFondoCategoria(color, tema) },
                      bordeCampo,
                    ]}
                  >
                    <Ionicons
                      color={activa ? tema.seleccionTexto : obtenerTintaCategoria(categoria.id, tema, tipoMovimiento)}
                      name={categoria.icono}
                      size={22}
                    />
                    <Text style={[estilosMovimiento.textoOpcionCategoria, { color: activa ? tema.seleccionTexto : tema.textoPrincipal }]}>{categoria.nombre}</Text>
                    <Ionicons
                      color={activa ? tema.seleccionTexto : tema.textoSecundario}
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
