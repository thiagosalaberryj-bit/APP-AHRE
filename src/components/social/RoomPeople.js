import { useState } from 'react';
import { normalizarNombrePersona, obtenerPersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { PERSONA_ACTUAL } from '../../social/socialMockData';
import { View, TextInput, Pressable, Text, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModalAgregarPersonasSala from './AddRoomPeopleModal';
import AvatarPersona from './PersonAvatar';
import { COLORES_NEUTROS } from '../../styles/colors';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/RoomPeopleStyles';
export default function PersonasSala(propiedades) {
  const {
    personasSala,
    gastos,
    alCambiar,
    cerrada,
    alCrearPersona,
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
  const [busqueda, establecerBusqueda] = useState('');
  const [agregando, establecerAgregando] = useState(false);
  const [personaAQuitar, establecerPersonaAQuitar] = useState(null);
  const [personaQuitada, establecerPersonaQuitada] = useState(null);
  const gastosVinculados = personaAQuitar ? gastos.filter(gasto => gasto.pagadorId === personaAQuitar.id || gasto.partes.some(parte => parte.personaId === personaAQuitar.id)) : [];
  const tienePendientes = gastosVinculados.some(gasto => gasto.partes.some(parte => parte.tipo !== 'saldado' && (parte.personaId === personaAQuitar.id || gasto.pagadorId === personaAQuitar.id)));
  const consulta = normalizarNombrePersona(busqueda);
  const personas = [PERSONA_ACTUAL, ...personasSala.map(obtenerPersona)].filter(persona => normalizarNombrePersona(`${nombreCompletoPersona(persona)} ${persona.apodo || ''}`).includes(consulta));
  return <View style={estilos.grupo}>
      <View style={estilos.filaCampos}>
        <View style={[estilosMovimiento.botonDeposito, estilos.columnaCampo, estilos.busquedaAgenda]}>
          <Ionicons color={tema.textoSecundario} name="search-outline" size={22} />
          <TextInput accessibilityLabel="Buscar personas de la sala" value={busqueda} onChangeText={establecerBusqueda} placeholder="Nombre, apellido o apodo" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosMovimiento.entradaDescripcion, estilos.entradaBusquedaAgenda]} />
          {busqueda ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda en la sala" onPress={() => establecerBusqueda('')} style={estilos.accionIcono}><Ionicons color={tema.textoSecundario} name="close-circle-outline" size={22} /></Pressable> : null}
        </View>
        {!cerrada ? <Pressable accessibilityRole="button" accessibilityLabel="Agregar personas a la sala" accessibilityState={{
        expanded: agregando
      }} onPress={() => establecerAgregando(true)} style={estilos.agregarPersonaAgenda}><Ionicons color={tema.botonPrincipalTexto} name="add" size={28} /></Pressable> : null}
      </View>
      <Text style={estilosGlobales.textoSecundario}>{personasSala.length + 1} personas en esta sala</Text>
      <View style={estilos.agenda}>
        {personas.length ? personas.map(persona => <View key={persona.id} style={estilos.personaAgenda}>
            <View style={estilos.avatarAgenda}><Text style={estilos.textoAvatar}>{persona.iniciales}</Text></View>
            <View style={estilos.textoFlexible}><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.texto}>{nombreCompletoPersona(persona)}</Text>{persona.apodo ? <Text numberOfLines={1} style={estilosGlobales.textoSecundario}>{persona.apodo}</Text> : null}</View>
            {!cerrada && persona.id !== 'vos' ? <Pressable accessibilityRole="button" accessibilityLabel={`Quitar a ${nombreCompletoPersona(persona)} de la sala`} onPress={() => establecerPersonaAQuitar(persona)} style={estilos.accionIcono}><Ionicons color={tema.error} name="remove-circle-outline" size={24} /></Pressable> : null}
          </View>) : <Text style={estilosGlobales.textoSecundario}>No encontramos personas con esos datos.</Text>}
      </View>
      {agregando ? <ModalAgregarPersonasSala personasSala={personasSala} alAgregar={ids => {
      alCambiar([...personasSala, ...ids]);
      establecerPersonaQuitada(null);
      establecerAgregando(false);
    }} alCerrar={() => establecerAgregando(false)} alCrear={() => {
      establecerAgregando(false);
      alCrearPersona();
    }} {...aspecto} /> : null}
      {personaQuitada ? <Text accessibilityLiveRegion="polite" style={estilosGlobales.textoAyuda}>{nombreCompletoPersona(personaQuitada)} ya no figura en las personas de la sala. Su agenda, gastos y pagos se conservaron en este ejemplo.</Text> : null}
      {!cerrada ? <Text style={estilosGlobales.textoAyuda}>Cambios de ejemplo, sin guardado. Los gastos y las deudas conservan sus datos simulados.</Text> : null}
      <Modal transparent animationType="fade" visible={Boolean(personaAQuitar)} onRequestClose={() => establecerPersonaAQuitar(null)}>
        <View style={estilos.fondoModal}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancelar eliminación de persona" onPress={() => establecerPersonaAQuitar(null)} style={estilos.cierreFondo} />
          <View accessibilityViewIsModal style={estilos.tarjetaModal}>
            <View style={estilos.filaModal}>
              <View style={estilos.iconoConfirmacionEliminar}><Ionicons color={tema.error} name="trash-outline" size={25} /></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar confirmación de quitar persona" onPress={() => establecerPersonaAQuitar(null)} style={estilos.botonCerrar}><Ionicons color={tema.textoSecundario} name="close" size={22} /></Pressable>
            </View>
            <ScrollView style={estilos.desplazamientoModal}>
              <View style={estilos.grupo}>
                <View style={estilos.grupoCampo}><Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Quitar persona de la sala</Text><Text style={estilosGlobales.textoSecundario}>¿Querés quitar a esta persona?</Text></View>
                {personaAQuitar ? <View style={estilos.resumenPersonaEliminar}><AvatarPersona persona={personaAQuitar} estilos={estilos} /><View style={estilos.textoFlexible}><Text style={estilosGlobales.etiqueta}>{nombreCompletoPersona(personaAQuitar)}</Text><Text style={estilosGlobales.textoSecundario}>{personaAQuitar.apodo}</Text></View></View> : null}
                <Text style={estilosGlobales.textoSecundario}>{gastosVinculados.length ? `Participa en ${gastosVinculados.length} ítems de esta sala. Su nombre, importes y pagos seguirán en esos registros.` : 'No tiene gastos registrados en esta sala. Seguirá en tu agenda y podrás volver a agregarla.'}</Text>
                {gastosVinculados.length ? <View style={estilos.avisoPersonaEliminar}><Ionicons color={tema.error} name="information-circle-outline" size={20} /><Text style={[estilosGlobales.textoSecundario, estilos.textoFlexible, {
                  color: tema.error
                }]}>{tienePendientes ? 'Tiene partes pendientes de pagar o cobrar. Quitarla no las cancela ni cambia el reparto: se conservarán al cerrar la sala.' : 'Sus partes ya están pagadas. Quitarla no borra ni vuelve a generar esos pagos.'}</Text></View> : null}
                <Text style={estilosGlobales.textoSecundario}>Dejará de figurar en la lista para nuevos ítems. Para incluirla otra vez, usá + y agregala desde tu agenda.</Text>
              </View>
            </ScrollView>
            <View style={estilos.filaCampos}>
              <Pressable accessibilityRole="button" onPress={() => establecerPersonaAQuitar(null)} style={estilos.cancelarQuitarPersona}><Text style={estilosGlobales.etiqueta}>Cancelar</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => {
              alCambiar(personasSala.filter(id => id !== personaAQuitar.id));
              establecerPersonaQuitada(personaAQuitar);
              establecerPersonaAQuitar(null);
            }} style={estilos.confirmarQuitarPersona}><Text style={[estilosGlobales.etiqueta, {
                color: COLORES_NEUTROS.superficie
              }]}>Quitar de la sala</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>;
}
