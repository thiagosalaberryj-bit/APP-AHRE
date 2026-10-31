import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EstadoVacio from './SocialEmptyState';
import ModalPersona from './PersonModal';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/PeopleAgendaStyles';
export default function AgendaPersonas(propiedades) {
  const {
    personasActivas: personasSociales
  } = useDatosSociales();
  const {
    abrirPersona,
    abrirAltaInicial = false,
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
  const [busqueda, establecerBusqueda] = useState('');
  const [mostrarFormulario, establecerMostrarFormulario] = useState(abrirAltaInicial);
  const personas = [...personasSociales].filter(persona => normalizarNombrePersona(`${nombreCompletoPersona(persona)} ${persona.apodo || ''}`).includes(normalizarNombrePersona(busqueda))).sort((a, b) => nombreCompletoPersona(a).localeCompare(nombreCompletoPersona(b), 'es'));
  const cerrarFormulario = persona => { if (persona?.id) establecerBusqueda(''); establecerMostrarFormulario(false); };
  return <>
      <View style={estilos.filaTitulo}>
        <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Personas registradas</Text>
        <Text style={estilosGlobales.textoAyuda}>{personas.length} de {personasSociales.length}</Text>
      </View>
      <View style={estilos.filaCampos}>
        <View style={[estilosMovimiento.botonDeposito, estilos.columnaCampo, estilos.busquedaAgenda]}>
          <Ionicons color={tema.textoSecundario} name="search-outline" size={22} />
          <TextInput accessibilityLabel="Buscar persona registrada" value={busqueda} onChangeText={establecerBusqueda} placeholder="Nombre, apellido o apodo" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosMovimiento.entradaDescripcion, estilos.entradaBusquedaAgenda]} />
          {busqueda ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda de personas" onPress={() => establecerBusqueda('')} style={estilos.accionIcono}><Ionicons color={tema.textoSecundario} name="close-circle-outline" size={22} /></Pressable> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Agregar persona" onPress={() => establecerMostrarFormulario(true)} style={estilos.agregarPersonaAgenda}>
          <Ionicons color={tema.botonPrincipalTexto} name="add" size={28} />
        </Pressable>
      </View>
      <View style={estilos.grupoCampo}>
        {personas.length ? personas.map(persona => <Pressable key={persona.id} accessibilityRole="button" accessibilityLabel={`Abrir persona ${nombreCompletoPersona(persona)}`} accessibilityHint="Abre los datos y las deudas de esta persona." onPress={() => abrirPersona(persona.id)} style={({
        pressed: presionado
      }) => [estilosGlobales.tarjeta, estilos.contactoAgenda, presionado && estilos.deudaHistorialPresionada]}>
            <View style={estilos.avatarContactoAgenda}><Text style={[estilos.textoAvatar, {
            color: tema.foco
          }]}>{persona.iniciales}</Text></View>
            <View style={estilos.textoFlexible}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{nombreCompletoPersona(persona)}</Text>
              <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{persona.apodo}</Text>
            </View>
            <View style={estilos.accesoPerfilAgenda}><Ionicons color={tema.foco} name="chevron-forward" size={18} /></View>
          </Pressable>) : <EstadoVacio icono="people-outline" titulo="No encontramos personas" descripcion="Probá con otro nombre, apellido o apodo, o usá + para agregar una persona." {...aspecto} />}
      </View>
      <ModalPersona visible={mostrarFormulario} alCerrar={cerrarFormulario} abrirPersona={abrirPersona} {...aspecto} />
    </>;
}
