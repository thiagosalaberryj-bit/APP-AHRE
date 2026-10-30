import { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccionesFormulario from './SocialFormActions';
import MontoSocial from './SocialAmountInput';
import CampoFormulario from './SocialTextField';
import SelectorPersonas from './PeopleSelector';
import OpcionesSeleccion from './SocialChoiceGroup';
import { PERSONAS_SIMULADAS } from '../../social/socialMockData';
import { obtenerPersona, nombreCompletoPersona } from '../../social/socialHelpers';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function FormularioRegistrarDeuda({ parametros, abrirRegistro, ...aspecto }) {
  const { tema, estilosGlobales } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  const [personaId, establecerPersonaId] = useState(parametros.personaId || null);
  const [direccion, establecerDireccion] = useState('me_deben');
  const persona = obtenerPersona(personaId);
  return <>
    <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
      <View style={estilos.filaCampos}><Ionicons color={direccion === 'debo' ? tema.error : tema.foco} name="swap-horizontal-outline" size={22} /><Text style={estilosGlobales.encabezadoSeccion}>¿Quién debe?</Text></View>
      <OpcionesSeleccion enLinea opciones={[{ id: 'me_deben', nombre: 'Me debe' }, { id: 'debo', nombre: 'Le debo' }]} elegida={direccion} alElegir={establecerDireccion} {...aspecto} />
      <SelectorPersonas etiqueta="Persona" personas={PERSONAS_SIMULADAS} seleccionadas={personaId ? [personaId] : []} alCambiar={ids => establecerPersonaId(ids[0])} alRegistrar={() => abrirRegistro('persona')} {...aspecto} />
      <Text style={estilosGlobales.textoSecundario}>{persona ? direccion === 'debo' ? `Vos le debés a ${nombreCompletoPersona(persona)}.` : `${nombreCompletoPersona(persona)} te debe a vos.` : 'Elegí una persona de tu agenda o registrá una nueva.'}</Text>
    </View>
    <MontoSocial etiqueta="Monto de la deuda" {...aspecto} />
    <CampoFormulario etiqueta="Descripción" ejemplo="Ej.: Almuerzo, compra, préstamo" {...aspecto} />
    <AccionesFormulario texto="Registrar deuda" {...aspecto} />
  </>;
}
