import { useDatosSociales } from '../../social/SocialDataContext';
import { useRef, useState } from 'react';
import { generarIdentificador } from '../../database/identifiers';
import { previsualizarDeudaPersonal, crearDeudaPersonal } from '../../social/socialService';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccionesFormulario from './SocialFormActions';
import MontoSocial from './SocialAmountInput';
import CampoFormulario from './SocialTextField';
import SelectorPersonas from './PeopleSelector';
import OpcionesSeleccion from './SocialChoiceGroup';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioRegistrarDeuda({
  parametros,
  abrirRegistro,
  ...aspecto
}) {
  const {
    personasActivas: personasSociales,
    obtenerPersona
  } = useDatosSociales();
  const {
    tema,
    estilosGlobales
  } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  const [personaId, establecerPersonaId] = useState(parametros.personaId || null);
  const [direccion, establecerDireccion] = useState('me_deben');
  const [monto, establecerMonto] = useState('');
  const [descripcion, establecerDescripcion] = useState('');
  const id = useRef(generarIdentificador());
  const solicitud = useRef(null);
  const persona = obtenerPersona(personaId);
  return <>
    <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
      <View style={estilos.filaCampos}><Ionicons color={direccion === 'debo' ? tema.error : tema.foco} name="swap-horizontal-outline" size={22} /><Text style={estilosGlobales.encabezadoSeccion}>¿Quién debe?</Text></View>
      <OpcionesSeleccion enLinea opciones={[{
        id: 'me_deben',
        nombre: 'Me debe'
      }, {
        id: 'debo',
        nombre: 'Le debo'
      }]} elegida={direccion} alElegir={establecerDireccion} {...aspecto} />
      <SelectorPersonas etiqueta="Persona" personas={personasSociales} seleccionadas={personaId ? [personaId] : []} alCambiar={ids => establecerPersonaId(ids[0])} alRegistrar={() => abrirRegistro('persona')} {...aspecto} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{persona ? direccion === 'debo' ? `Vos le debés a ${nombreCompletoPersona(persona)}.` : `${nombreCompletoPersona(persona)} te debe a vos.` : 'Elegí una persona de tu agenda o registrá una nueva.'}</Text>
    </View>
    <MontoSocial etiqueta="Monto de la deuda" valor={monto} alCambiar={establecerMonto} {...aspecto} />
    <CampoFormulario etiqueta="Descripción" ejemplo="Ej.: Almuerzo, compra, préstamo" valor={descripcion} alCambiar={establecerDescripcion} limite={500} {...aspecto} />
    {direccion === 'me_deben' ? <>
      <Text style={estilosGlobales.textoAyuda}>Registraremos el dinero que adelantaste como un egreso. Podés elegir el depósito o vincular un egreso existente para no duplicarlo.</Text>
    </> : <Text style={estilosGlobales.textoAyuda}>Registrar lo que debés no genera un ingreso ni modifica tus depósitos. Al pagar, elegirás el depósito y se registrará el egreso.</Text>}
    <AccionesFormulario texto="Registrar deuda" preparar={() => {
      solicitud.current = { id: id.current, personaId, direccion, monto, descripcion };
      return previsualizarDeudaPersonal(solicitud.current);
    }} alGuardar={financiaciones => crearDeudaPersonal(solicitud.current, financiaciones.origen)} {...aspecto} />
  </>;
}
