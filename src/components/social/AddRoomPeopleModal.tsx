import type { AspectoSocial } from '../../social/types';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { Modal, KeyboardAvoidingView, Platform, Pressable, View, Text, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function ModalAgregarPersonasSala(propiedades: import('../../social/types').AspectoSocial & ({personasSala:string[]; guardando?:boolean; alAgregar:(ids:string[])=>void; alCerrar:()=>void; alCrear:()=>void})) {
  const {
    personasActivas: personasSociales
  } = useDatosSociales();
  const {
    personasSala,
    guardando,
    alAgregar,
    alCerrar,
    alCrear,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales,
    estilosMovimiento,
    tema
  } = aspecto;
  const [busqueda, establecerBusqueda] = useState('');
  const [seleccionadas, establecerSeleccionadas] = useState<string[]>([]);
  const disponibles = personasSociales.filter(persona => !personasSala.includes(persona.id));
  const consulta = normalizarNombrePersona(busqueda);
  const personas = disponibles.filter((persona) => normalizarNombrePersona(`${nombreCompletoPersona(persona)} ${persona.apodo}`).includes(consulta));
  return <Modal transparent animationType="fade" visible onRequestClose={alCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.fondoModal}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar selección de personas" onPress={alCerrar} style={estilos.cierreFondo} />
        <View accessibilityViewIsModal style={estilos.tarjetaModal}>
          <View style={estilos.filaModal}>
            <Text accessibilityRole="header" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>Agregar personas</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar selección de personas" onPress={alCerrar} style={estilos.botonCerrar}><Ionicons color={tema.textoPrincipal} name="close" size={24} /></Pressable>
          </View>
          <View style={[estilosMovimiento.botonDeposito, estilos.busquedaAgenda]}>
            <Ionicons color={tema.textoSecundario} name="search-outline" size={22} />
            <TextInput accessibilityLabel="Buscar personas para agregar" value={busqueda} onChangeText={establecerBusqueda} placeholder="Nombre, apellido o apodo" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosMovimiento.entradaDescripcion, estilos.entradaBusquedaAgenda]} />
          </View>
          <Text accessibilityLiveRegion="polite" style={estilosGlobales.textoSecundario}>{seleccionadas.length} seleccionadas</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={estilos.desplazamientoModal}>
            {personas.length ? personas.map((persona) => <Pressable key={persona.id} accessibilityRole="checkbox" accessibilityLabel={`Seleccionar a ${nombreCompletoPersona(persona)}`} accessibilityState={{
            checked: seleccionadas.includes(persona.id)
          }} onPress={() => establecerSeleccionadas(anteriores => anteriores.includes(persona.id) ? anteriores.filter(id => id !== persona.id) : [...anteriores, persona.id])} style={estilos.personaAgenda}>
                <Ionicons color={tema.foco} name={seleccionadas.includes(persona.id) ? 'checkbox' : 'square-outline'} size={24} />
                <View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.texto}>{nombreCompletoPersona(persona)}</Text><Text ellipsizeMode="tail" numberOfLines={1} style={estilosGlobales.textoSecundario}>{persona.apodo}</Text></View>
              </Pressable>) : <Text style={estilosGlobales.textoSecundario}>{disponibles.length ? 'No encontramos personas con esos datos.' : 'Todas las personas registradas ya están en la sala.'}</Text>}
          </ScrollView>
          <BotonSocial texto="Agregar seleccionadas" deshabilitado={!seleccionadas.length || guardando} alPresionar={() => alAgregar(seleccionadas)} {...aspecto} />
          <BotonSocial texto="Crear una persona" deshabilitado={guardando} simple alPresionar={alCrear} {...aspecto} />
        </View>
      </KeyboardAvoidingView>
    </Modal>;
}
