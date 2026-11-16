import {conRespuestaVisual} from '../../utils/pressFeedback';
import BotonAccion from '../ActionButton';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import { AvisosEnModal } from '../../contexts/ToastContext';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { Modal, KeyboardAvoidingView, Platform, Pressable, View, Text, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import crearEstilosModal from '../../styles/social/AddRoomPeopleModalStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function ModalAgregarPersonasSala(propiedades: import('../../social/types').AspectoSocial & ({personasSala:string[]; guardando?:boolean;completado?:boolean; alAgregar:(ids:string[])=>void; alCerrar:()=>void; alCrear:()=>void; seleccionInicial?:string[]; titulo?:string; textoConfirmar?:string; permitirVacia?:boolean})) {
  const {
    personas: personasSociales
  } = useDatosSociales();
  const {
    personasSala,
    guardando:guardandoExterno,
    completado,
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
  const guardando=Boolean(guardandoExterno);
  const [enfocado, establecerEnfocado] = useState(false);
  const [busqueda, establecerBusqueda] = useState('');
  const [seleccionadas, establecerSeleccionadas] = useState<string[]>(seleccionInicial);
  const [archivadas,mostrarArchivadas]=useState(false);
  const disponibles = personasSociales.filter(persona => !personasSala.includes(persona.id));
  const consulta = normalizarNombrePersona(busqueda);
  const personas = disponibles.filter((persona) => (persona.activa||archivadas||seleccionadas.includes(persona.id))&&normalizarNombrePersona(`${nombreCompletoPersona(persona)} ${persona.apodo}`).includes(consulta));
  return <Modal statusBarTranslucent navigationBarTranslucent transparent animationType="fade" visible onRequestClose={()=>!guardando&&alCerrar()}><AvisosEnModal>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.fondoModal}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar selección de personas" disabled={guardando} onPress={alCerrar} style={estilos.cierreFondo} />
        <View accessibilityViewIsModal style={estilos.tarjetaModal}>
          <View style={estilos.filaModal}>
            <View style={estilos.iconoTitulo}><Ionicons name="people-outline" size={23} color={tema.foco}/></View>
            <View style={estilos.textoFlexible}><Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>{titulo}</Text><Text style={estilos.contador}>Elegí personas de tu agenda</Text></View>
            <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Cerrar selección de personas" disabled={guardando} onPress={conRespuestaVisual(alCerrar)} style={estilos.botonCerrar}><Ionicons color={tema.textoPrincipal} name="close" size={22} /></Pressable>
          </View>
          <View style={[estilos.buscador, enfocado && estilos.buscadorEnfocado]}>
            <Ionicons color={enfocado?tema.foco:tema.textoSecundario} name="search-outline" size={22} />
            <TextInput accessibilityLabel="Buscar personas para agregar" editable={!guardando} value={busqueda} onChangeText={establecerBusqueda} onFocus={() => establecerEnfocado(true)} onBlur={() => establecerEnfocado(false)} placeholder="Nombre, apellido o apodo" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={estilos.entradaBusqueda} />
          </View>
          {disponibles.some(p=>!p.activa)?<Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="checkbox" accessibilityLabel="Incluir personas archivadas" accessibilityState={{checked:archivadas}} onPress={conRespuestaVisual(()=>mostrarArchivadas(!archivadas))} style={estilos.filaModal}><Ionicons name={archivadas?'checkbox':'square-outline'} size={22} color={tema.foco}/><Text style={estilosGlobales.texto}>Incluir personas archivadas</Text></Pressable>:null}
          <Text accessibilityLiveRegion="polite" style={estilos.contador}>{seleccionadas.length} seleccionadas</Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={estilos.desplazamientoModal} contentContainerStyle={estilos.listaPersonas}>
            {personas.length ? personas.map((persona) => <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={persona.id} accessibilityRole="checkbox" accessibilityLabel={`Seleccionar a ${nombreCompletoPersona(persona)}`} accessibilityState={{
            checked: seleccionadas.includes(persona.id)
          }} disabled={guardando} onPress={conRespuestaVisual(() => establecerSeleccionadas(anteriores => anteriores.includes(persona.id) ? anteriores.filter(id => id !== persona.id) : [...anteriores, persona.id]))} style={[estilos.personaAgenda, seleccionadas.includes(persona.id) && estilos.personaSeleccionada]}>
                <View style={estilos.avatarPersona}><Text style={estilos.inicialesPersona}>{persona.iniciales}</Text></View>
                <View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilos.nombrePersona}>{nombreCompletoPersona(persona)}</Text>{persona.apodo?<Text ellipsizeMode="tail" numberOfLines={1} style={estilos.apodo}>{persona.apodo}</Text>:null}</View>
                <Ionicons color={seleccionadas.includes(persona.id)?tema.foco:tema.textoSecundario} name={seleccionadas.includes(persona.id) ? 'checkmark-circle' : 'ellipse-outline'} size={23} />
              </Pressable>) : <Text style={estilosGlobales.textoSecundario}>{disponibles.length ? 'No encontramos personas con esos datos.' : titulo === 'Agregar personas' ? 'Todas las personas registradas ya están en la sala.' : 'Todavía no hay personas registradas. Podés crear una desde aquí.'}</Text>}
          </ScrollView>

          <View style={estilos.acciones}>
            <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Crear una persona" disabled={guardando} onPress={conRespuestaVisual(alCrear)} style={[estilos.crear, guardando && estilos.deshabilitado]}>
              <Ionicons name="person-add-outline" color={tema.foco} size={18} /><Text style={estilos.textoCrear}>Crear persona</Text>
            </Pressable>
            <BotonAccion completado={completado} tema={tema} texto={textoConfirmar + (seleccionadas.length ? ' · ' + seleccionadas.length : '')} variante="principal" cargando={guardando} deshabilitado={(!permitirVacia && !seleccionadas.length) || guardando} alPresionar={() => alAgregar(seleccionadas)} estilo={[estilos.agregar]} etiquetaAccesibilidad={textoConfirmar === 'Agregar' ? 'Agregar seleccionadas' : textoConfirmar}/>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AvisosEnModal></Modal>;
}
