import { crearEstilosDetalleSocial } from '../../styles/social/SocialDetailStyles';
import type { AspectoSocial } from '../../social/types';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AvatarPersona from './PersonAvatar';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import { Ionicons } from '@expo/vector-icons';
import TarjetaDeuda from './DebtCard';
import ModalPersona from './PersonModal';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function DetallePersona(propiedades: import('../../social/types').AspectoSocial & ({persona:import('../../social/types').PersonaVista} & import('../../social/types').AccionesSociales)) {
  const {
    deudas: deudasSociales
  } = useDatosSociales();
  const {
    persona,
    abrirSala,
    abrirRegistro,
    abrirPersona,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosDetalleSocial(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  const [editando, establecerEditando] = useState(false);
  const deudas = deudasSociales.filter(deuda => deuda.personaId === persona.id);
  return <View style={estilos.pagina}>
      <View style={estilos.tarjeta}>
        <View style={estilos.cabecera}>
          <AvatarPersona persona={persona} />
          <View style={estilos.identidad}><Text accessibilityLabel={nombreCompletoPersona(persona)} style={estilos.nombre}>{nombreCompletoPersona(persona)}</Text>{persona.apodo ? <Text accessibilityLabel={persona.apodo} style={estilos.secundario}>{persona.apodo}</Text> : null}</View>
          <Pressable accessibilityRole="button" accessibilityLabel="Editar persona" onPress={() => establecerEditando(true)} style={estilos.editar}><Ionicons color={tema.foco} name="create-outline" size={20} /></Pressable>
        </View>
        {!persona.activa ? <Text style={estilos.secundario}>Persona inactiva · Su historial se conserva.</Text> : null}
        <View style={estilos.cifras}>
          <View style={estilos.cifra}><Text style={estilos.secundario}>Te debe</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.valor, estilos.valorPersona, { color: tema.exito }]}>{persona.porCobrar}</Text></View>
          <View style={estilos.cifra}><Text style={estilos.secundario}>Le debés</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[estilos.valor, estilos.valorPersona, { color: tema.error }]}>{persona.porPagar}</Text></View>
        </View>
        <View style={estilos.encabezadoSeccion}><Text style={estilos.secundario}>{deudas.filter(deuda => !deuda.saldada).length} pendientes</Text><Text style={estilos.secundario}>{deudas.filter(deuda => deuda.saldada).length} saldadas</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Registrar deuda" disabled={!persona.activa} onPress={() => abrirRegistro('deuda', { personaId: persona.id })} style={[estilos.registrar, !persona.activa && estilos.deshabilitado]}><Text style={estilos.textoRegistrar}>Registrar deuda</Text></Pressable>
      </View>
      {['me_deben', 'debo'].map(tipo => <View key={tipo} style={estilos.seccion}>
          <Text accessibilityRole="header" style={estilos.tituloSeccion}>{tipo === 'me_deben' ? 'Lo que te debe' : 'Lo que le debés'}</Text>
          {deudas.some(deuda => deuda.tipo === tipo && !deuda.saldada) ? deudas.filter(deuda => deuda.tipo === tipo && !deuda.saldada).map(deuda => <TarjetaDeuda key={deuda.id} deuda={deuda} abrirSala={abrirSala} abrirRegistro={abrirRegistro} {...aspecto} />) : <Text style={estilos.vacio}>Sin deudas pendientes en esta dirección.</Text>}
        </View>)}
      {deudas.some(deuda => deuda.saldada) ? <View style={estilos.seccion}><Text accessibilityRole="header" style={estilos.tituloSeccion}>Pagos saldados</Text>{deudas.filter(deuda => deuda.saldada).map(deuda => <TarjetaDeuda key={deuda.id} deuda={deuda} abrirSala={abrirSala} abrirRegistro={abrirRegistro} {...aspecto} />)}</View> : null}
      <ModalPersona visible={editando} personaInicial={persona} alCerrar={() => establecerEditando(false)} abrirPersona={abrirPersona} {...aspecto} />
    </View>;
}
