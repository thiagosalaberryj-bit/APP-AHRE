import { useState } from 'react';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { PERSONAS_SIMULADAS } from '../../social/socialMockData';
import { View, Text } from 'react-native';
import CampoFormulario from './SocialTextField';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioPersona(propiedades) {
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
  const [aviso, establecerAviso] = useState(false);
  const nombreNormalizado = normalizarNombrePersona(nombre);
  const apellidoNormalizado = normalizarNombrePersona(apellido);
  const apodoNormalizado = normalizarNombrePersona(apodo);
  const existente = PERSONAS_SIMULADAS.find(persona => persona.id !== personaInicial?.id && (nombreNormalizado && apellidoNormalizado && normalizarNombrePersona(persona.nombre) === nombreNormalizado && normalizarNombrePersona(persona.apellido) === apellidoNormalizado || apodoNormalizado && normalizarNombrePersona(persona.apodo || '') === apodoNormalizado));
  const cambiar = establecer => valor => {
    establecer(valor);
    establecerAviso(false);
  };
  return <View style={estilos.grupo}>
      <CampoFormulario etiqueta="Nombre" ejemplo="Ej.: Ana" valor={nombre} alCambiar={cambiar(establecerNombre)} {...aspecto} />
      <CampoFormulario etiqueta="Apellido" ejemplo="Ej.: Pérez" valor={apellido} alCambiar={cambiar(establecerApellido)} {...aspecto} />
      <CampoFormulario etiqueta="Apodo" ejemplo="Ej.: Ani" valor={apodo} limite={20} alCambiar={valor => cambiar(establecerApodo)(valor.slice(0, 20))} {...aspecto} />
      <Text style={estilosGlobales.textoAyuda}>{apodo.length}/20 caracteres</Text>
      <Text style={estilosGlobales.textoAyuda}>Nombre, apellido y apodo son obligatorios.</Text>
      {existente ? <View style={estilos.grupo}>
          <Text accessibilityLiveRegion="polite" style={estilosGlobales.texto}>Estos datos coinciden con {nombreCompletoPersona(existente)}{existente.apodo ? ` (${existente.apodo})` : ''}, que ya está en tu listado.</Text>
          <BotonSocial texto="Ver persona existente" secundario alPresionar={() => abrirPersona(existente.id)} {...aspecto} />
          <Text style={estilosGlobales.textoAyuda}>Revisá su ficha antes de intentar registrarla nuevamente.</Text>
        </View> : null}
      <BotonSocial texto={personaInicial ? "Guardar cambios" : "Registrar persona"} deshabilitado={!nombreNormalizado || !apellidoNormalizado || !apodoNormalizado || Boolean(existente)} alPresionar={() => establecerAviso(true)} {...aspecto} />
      {aviso ? <Text accessibilityRole="alert" style={estilosGlobales.textoAyuda}>Vista de ejemplo: no se guardaron cambios. El listado sigue usando datos simulados.</Text> : null}
      {!personaInicial ? <BotonSocial texto="Cancelar" simple alPresionar={alCerrar} {...aspecto} /> : null}
    </View>;
}
