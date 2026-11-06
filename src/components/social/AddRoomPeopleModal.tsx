import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { Modal, KeyboardAvoidingView, Platform, Pressable, View, Text, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosModal from '../../styles/social/AddRoomPeopleModalStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function ModalAgregarPersonasSala(propiedades: import('../../social/types').AspectoSocial & ({personasSala:string[]; guardando?:boolean; alAgregar:(ids:string[])=>void; alCerrar:()=>void; alCrear:()=>void; seleccionInicial?:string[]; titulo?:string; textoConfirmar?:string; permitirVacia?:boolean})) {
  const {
    personasActivas: personasSociales
  } = useDatosSociales();
  const {
    personasSala,
    guardando,
    alAgregar,
    alCerrar,
    alCrear,
    seleccionInicial = [],
    titulo = 'Agregar personas',
    textoConfirmar = 'Agregar',
    permitirVacia = false,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosModal(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales,
    tema
  } = aspecto;
  const [enfocado, establecerEnfocado] = useState(false);
  const [busqueda, establecerBusqueda] = useState('');
  const [seleccionadas, establecerSeleccionadas] = useState<string[]>(seleccionInicial);
  const disponibles = personasSociales.filter(persona => !personasSala.includes(persona.id));
  const consulta = normalizarNombrePersona(busqueda);
  const personas = disponibles.filter((persona) => normalizarNombrePersona(`${nombreCompletoPersona(persona)} ${persona.apodo}`).includes(consulta));
  return <Modal statusBarTranslucent navigationBarTranslucent transparent animationType="fade" visible onRequestClose={alCerrar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.fondoModal}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar selección de personas" onPress={alCerrar} style={estilos.cierreFondo} />
        <View accessibilityViewIsModal style={estilos.tarjetaModal}>
          <View style={estilos.filaModal}>
            <Text accessibilityRole="header" style={[estilosGlobales.encabezadoSeccion, estilos.textoFlexible]}>{titulo}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar selección de personas" onPress={alCerrar} style={estilos.botonCerrar}><Ionicons color={tema.textoPrincipal} name="close" size={24} /></Pressable>
          </View>
          <View style={[estilos.buscador, enfocado && estilos.buscadorEnfocado]}>
            <Ionicons color={tema.textoSecundario} name="search-outline" size={22} />
            <TextInput accessibilityLabel="Buscar personas para agregar" value={busqueda} onChangeText={establecerBusqueda} onFocus={() => establecerEnfocado(true)} onBlur={() => establecerEnfocado(false)} placeholder="Nombre, apellido o apodo" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={estilos.entradaBusqueda} />
          </View>
          <Text accessibilityLiveRegion="polite" style={estilos.contador}>{seleccionadas.length} seleccionadas</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={estilos.desplazamientoModal}>
            {personas.length ? personas.map((persona) => <Pressable key={persona.id} accessibilityRole="checkbox" accessibilityLabel={`Seleccionar a ${nombreCompletoPersona(persona)}`} accessibilityState={{
            checked: seleccionadas.includes(persona.id)
          }} onPress={() => establecerSeleccionadas(anteriores => anteriores.includes(persona.id) ? anteriores.filter(id => id !== persona.id) : [...anteriores, persona.id])} style={[estilos.personaAgenda, seleccionadas.includes(persona.id) && estilos.personaSeleccionada]}>
                <Ionicons color={tema.foco} name={seleccionadas.includes(persona.id) ? 'checkbox' : 'square-outline'} size={20} />
                <View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.nombrePersona}>{nombreCompletoPersona(persona)}</Text><Text ellipsizeMode="tail" numberOfLines={1} style={estilos.apodo}>{persona.apodo}</Text></View>
              </Pressable>) : <Text style={estilosGlobales.textoSecundario}>{disponibles.length ? 'No encontramos personas con esos datos.' : titulo === 'Agregar personas' ? 'Todas las personas registradas ya están en la sala.' : 'Todavía no hay personas registradas. Podés crear una desde aquí.'}</Text>}
          </ScrollView>
          <View style={estilos.acciones}>
            <Pressable accessibilityRole="button" accessibilityLabel="Crear una persona" disabled={guardando} onPress={alCrear} style={[estilos.crear, guardando && estilos.deshabilitado]}>
              <Ionicons name="person-add-outline" color={tema.foco} size={18} /><Text style={estilos.textoCrear}>Crear persona</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={textoConfirmar === 'Agregar' ? 'Agregar seleccionadas' : textoConfirmar} disabled={(!permitirVacia && !seleccionadas.length) || guardando} onPress={() => alAgregar(seleccionadas)} style={[estilos.agregar, ((!permitirVacia && !seleccionadas.length) || guardando) && estilos.deshabilitado]}>
              <Text style={estilos.textoAgregar}>{guardando ? 'Agregando…' : textoConfirmar + (seleccionadas.length ? ' · ' + seleccionadas.length : '')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>;
}
