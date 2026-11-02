import type { AspectoSocial } from '../../social/types';
import type { NombreIcono } from '../../constants/movimientos';
import { useEffect, useState } from 'react';
import { COLORES_DEPOSITOS, COLOR_ICONO_DEPOSITO } from '../../styles/colors';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import SelectorCategoria from '../CategorySelector';
import { CATEGORIAS_EGRESO } from '../../constants/movimientos';
import { ICONOS_SALA, NOMBRES_COLORES_SALA } from "../../social/socialConstants";
import { Ionicons } from '@expo/vector-icons';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/RoomAppearanceFormStyles';
export default function PersonalizacionSala(propiedades: import('../../social/types').AspectoSocial & ({alCambiar:(datos:{categoriaId:string;icono:string;color:string})=>void})) {
  const {
    alCambiar,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales,
    estilosMovimiento,
    tema
  } = aspecto;
  const [categoriaId, establecerCategoriaId] = useState('alimentacion');
  const [icono, establecerIcono] = useState('restaurant-outline');
  const [color, establecerColor] = useState(COLORES_DEPOSITOS[0]);
  const [mostrarIconos, establecerMostrarIconos] = useState(false);
  useEffect(() => { alCambiar?.({ categoriaId, icono, color }); }, [alCambiar, categoriaId, icono, color]);
  return <View style={estilos.grupo}>
      <SelectorCategoria categorias={CATEGORIAS_EGRESO} seleccionadaId={categoriaId} alSeleccionar={establecerCategoriaId} {...aspecto} />
      <View style={estilos.grupoCampo}>
        <Text style={estilosGlobales.etiqueta}>Icono de la sala</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Elegir icono de la sala" accessibilityState={{
        expanded: mostrarIconos
      }} accessibilityValue={{
        text: ICONOS_SALA.find(opcion => opcion.id === icono)?.nombre
      }} onPress={() => establecerMostrarIconos(true)} style={estilosMovimiento.botonDeposito}>
          <View style={[estilos.iconoLista, {
          backgroundColor: color
        }]}><Ionicons color={COLOR_ICONO_DEPOSITO} name={icono as NombreIcono} size={24} /></View>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.texto, estilos.textoFlexible]}>{ICONOS_SALA.find(opcion => opcion.id === icono)?.nombre}</Text>
          <Ionicons color={tema.textoSecundario} name="chevron-forward" size={20} />
        </Pressable>
      </View>
      <View style={estilos.grupoCampo}>
        <Text style={estilosGlobales.etiqueta}>Color de la sala</Text>
        <View style={estilos.coloresSala}>
          {COLORES_DEPOSITOS.map((valor, indice) => <Pressable key={valor} accessibilityRole="radio" accessibilityLabel={`Color de sala: ${NOMBRES_COLORES_SALA[indice]}`} accessibilityState={{
          checked: color === valor
        }} onPress={() => establecerColor(valor)} style={estilos.opcionColorSala}><View style={[estilos.muestraColorSala, {
            backgroundColor: valor
          }]}>{color === valor ? <Ionicons color={COLOR_ICONO_DEPOSITO} name="checkmark" size={22} /> : null}</View></Pressable>)}
        </View>
        <Text style={estilosGlobales.textoSecundario}>{NOMBRES_COLORES_SALA[COLORES_DEPOSITOS.indexOf(color)]}</Text>
      </View>
      <Modal transparent animationType="fade" visible={mostrarIconos} onRequestClose={() => establecerMostrarIconos(false)}>
        <View style={estilos.fondoModal}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancelar selección de icono" onPress={() => establecerMostrarIconos(false)} style={estilos.cierreFondo} />
          <View accessibilityViewIsModal style={estilos.tarjetaModal}>
            <View style={estilos.filaModal}><Text accessibilityRole="header" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>Icono de la sala</Text><Pressable accessibilityRole="button" accessibilityLabel="Cerrar selector de iconos" onPress={() => establecerMostrarIconos(false)} style={estilos.botonCerrar}><Ionicons color={tema.textoPrincipal} name="close" size={24} /></Pressable></View>
            <ScrollView style={estilos.desplazamientoModal} contentContainerStyle={estilos.opciones}>
              {ICONOS_SALA.map(opcion => <Pressable key={opcion.id} accessibilityRole="radio" accessibilityLabel={`Icono de sala: ${opcion.nombre}`} accessibilityState={{
              checked: icono === opcion.id
            }} onPress={() => {
              establecerIcono(opcion.id);
              establecerMostrarIconos(false);
            }} style={[estilos.opcionIconoSala, icono === opcion.id && estilos.iconoSalaSeleccionado]}><Ionicons color={tema.foco} name={opcion.id as NombreIcono} size={24} /><Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.textoSecundario, estilos.textoCentrado]}>{opcion.nombre}</Text></Pressable>)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>;
}
