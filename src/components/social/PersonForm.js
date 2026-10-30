import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import AccionesFormulario from './SocialFormActions';
import { guardarPersona, cambiarActividadPersona } from '../../social/socialService';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { View, Text } from 'react-native';
import CampoFormulario from './SocialTextField';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioPersona(propiedades) {
  const {
    personas: personasSociales,
    irAgenda
  } = useDatosSociales();
  const {
    abrirPersona,
    alCerrar,
    personaInicial,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales
  } = aspecto;
  const [nombre, establecerNombre] = useState(personaInicial?.nombre || '');
  const [apellido, establecerApellido] = useState(personaInicial?.apellido || '');
  const [apodo, establecerApodo] = useState(personaInicial?.apodo || '');
  const nombreNormalizado = normalizarNombrePersona(nombre);
  const apellidoNormalizado = normalizarNombrePersona(apellido);
  const apodoNormalizado = normalizarNombrePersona(apodo);
  const existente = personasSociales.find(persona => persona.id !== personaInicial?.id && (nombreNormalizado && apellidoNormalizado && normalizarNombrePersona(persona.nombre) === nombreNormalizado && normalizarNombrePersona(persona.apellido) === apellidoNormalizado || apodoNormalizado && normalizarNombrePersona(persona.apodo || '') === apodoNormalizado));
  const cambiar = establecer => valor => {
    establecer(valor);
  };
  return <View style={estilos.grupo}>
      <CampoFormulario etiqueta="Nombre" ejemplo="Ej.: Ana" valor={nombre} alCambiar={cambiar(establecerNombre)} {...aspecto} />
      <CampoFormulario etiqueta="Apellido" ejemplo="Ej.: Pérez" valor={apellido} alCambiar={cambiar(establecerApellido)} {...aspecto} />
      <CampoFormulario etiqueta="Apodo" ejemplo="Ej.: Ani" valor={apodo} limite={20} alCambiar={valor => cambiar(establecerApodo)(valor.slice(0, 20))} {...aspecto} />
      <Text style={estilosGlobales.textoAyuda}>{apodo.length}/20 caracteres</Text>
      <Text style={estilosGlobales.textoAyuda}>Nombre, apellido y apodo son obligatorios.</Text>
      {existente ? <View style={estilos.grupo}>
          <Text numberOfLines={1} ellipsizeMode="tail" accessibilityLiveRegion="polite" style={estilosGlobales.texto}>Estos datos coinciden con {nombreCompletoPersona(existente)}{existente.apodo ? ` (${existente.apodo})` : ''}, que ya está en tu listado.</Text>
          <BotonSocial texto="Ver persona existente" secundario alPresionar={() => abrirPersona(existente.id)} {...aspecto} />
          <Text style={estilosGlobales.textoAyuda}>Revisá su ficha antes de intentar registrarla nuevamente.</Text>
        </View> : null}
      <AccionesFormulario texto={personaInicial ? "Guardar cambios" : "Registrar persona"} mostrarNota={false}
        deshabilitado={!nombreNormalizado || !apellidoNormalizado || !apodoNormalizado || Boolean(existente)}
        recargarAntesDeCerrar alGuardar={() => guardarPersona({ nombre, apellido, apodo }, personaInicial?.id)} alExito={alCerrar} {...aspecto} />
      {personaInicial ? <AccionesFormulario texto={personaInicial.activa ? 'Eliminar persona' : 'Reactivar persona'} peligro={personaInicial.activa} mostrarNota={false}
        confirmacion={personaInicial.activa ? { titulo: '¿Eliminar esta persona?', descripcion: 'Se desactivará su ficha. Sus salas, pagos y deudas anteriores se conservarán y podrán saldarse.', textoConfirmar: 'Sí, eliminar persona' } : undefined}
        recargarAntesDeCerrar alGuardar={() => cambiarActividadPersona(personaInicial.id, !personaInicial.activa)}
        alExito={persona => { alCerrar(); if (!persona.activa) irAgenda(); }} {...aspecto} /> : null}
      {!personaInicial ? <BotonSocial texto="Cancelar" simple alPresionar={alCerrar} {...aspecto} /> : null}
    </View>;
}
