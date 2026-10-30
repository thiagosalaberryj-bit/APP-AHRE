import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/PeopleSelectorStyles';
export default function SelectorPersonas(propiedades) {
  const {
    etiqueta,
    personas,
    seleccionadas,
    alCambiar,
    multiple = false,
    alRegistrar,
    compacto = false,
    etiquetaCorta,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales,
    estilosMovimiento
  } = aspecto;
  const [visible, establecerVisible] = useState(false);
  const elegidas = personas.filter(persona => seleccionadas.includes(persona.id));
  const nombres = elegidas.map(persona => persona.nombre).join(', ');
  const resumen = elegidas.length ? compacto && multiple ? `${elegidas.length} personas` : nombres : compacto ? 'Elegir' : multiple ? 'Seleccioná participantes' : 'Seleccioná una persona';
  const elegir = id => {
    if (multiple) alCambiar(seleccionadas.includes(id) ? seleccionadas.filter(actual => actual !== id) : [...seleccionadas, id]);else {
      alCambiar([id]);
      establecerVisible(false);
    }
  };
  return <View style={[estilos.grupoCampo, compacto && estilos.columnaCampo]}>
      <Text style={estilosGlobales.etiqueta}>{etiquetaCorta || etiqueta}</Text>
      <Pressable accessibilityLabel={etiqueta} accessibilityValue={{
      text: nombres || resumen
    }} accessibilityRole="button" accessibilityState={{
      expanded: visible
    }} onPress={() => establecerVisible(true)} style={[estilosMovimiento.botonDeposito, compacto && estilos.selectorCompacto, visible && estilosMovimiento.botonDepositoEnfocado]}>
        <Ionicons color={tema.foco} name="people-outline" size={compacto ? 18 : 24} />
        <View style={estilos.textoFlexible}><Text numberOfLines={compacto ? 1 : undefined} style={estilosGlobales.texto}>{resumen}</Text>{multiple && elegidas.length && !compacto ? <Text style={estilosGlobales.textoAyuda}>{elegidas.length} seleccionadas</Text> : null}</View>
        <Ionicons color={tema.textoSecundario} name="chevron-down" size={compacto ? 16 : 22} />
      </Pressable>
      <Modal animationType="fade" transparent visible={visible} onRequestClose={() => establecerVisible(false)}>
        <View style={estilos.fondoModal}>
          <Pressable accessibilityLabel="Cerrar selector" accessibilityRole="button" onPress={() => establecerVisible(false)} style={estilos.cierreFondo} />
          <View accessibilityViewIsModal style={estilos.tarjetaModal}>
            <View style={estilos.filaModal}><Text accessibilityRole="header" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>{etiqueta}</Text><Pressable accessibilityLabel="Cerrar selector" accessibilityRole="button" onPress={() => establecerVisible(false)} style={estilos.botonCerrar}><Ionicons color={tema.textoPrincipal} name="close" size={24} /></Pressable></View>
            <ScrollView style={estilos.desplazamientoModal} keyboardShouldPersistTaps="handled">
              {personas.length ? personas.map(persona => <Pressable key={persona.id} accessibilityLabel={persona.nombre} accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={{
              checked: seleccionadas.includes(persona.id)
            }} onPress={() => elegir(persona.id)} style={estilos.opcionPersona}>
                  <Ionicons color={tema.foco} name={multiple ? seleccionadas.includes(persona.id) ? 'checkbox' : 'square-outline' : seleccionadas.includes(persona.id) ? 'radio-button-on' : 'radio-button-off'} size={24} />
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.texto, estilos.textoFlexible]}>{persona.nombre}</Text>
                </Pressable>) : <Text style={estilosGlobales.textoSecundario}>No hay más personas disponibles en este listado.</Text>}
            </ScrollView>
            {alRegistrar ? <BotonSocial texto="Registrar una persona" secundario alPresionar={() => {
            establecerVisible(false);
            alRegistrar();
          }} {...aspecto} /> : null}
            {multiple ? <BotonSocial texto="Listo" alPresionar={() => establecerVisible(false)} {...aspecto} /> : null}
          </View>
        </View>
      </Modal>
    </View>;
}
