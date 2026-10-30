import AccionesFormulario from './SocialFormActions';
import { useState } from 'react';
import CampoFormulario from './SocialTextField';
import PersonalizacionSala from './RoomAppearanceForm';
import SelectorPersonas from './PeopleSelector';
import { PERSONAS_SIMULADAS, LIMITE_SALAS_ACTIVAS } from '../../social/socialMockData';
import { Text, View } from 'react-native';
import SelectorFecha from '../DateSelector';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioCrearSala(propiedades) {
  const {
    abrirRegistro,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    estilosGlobales,
    estilosMovimiento,
    tema
  } = aspecto;
  const [fecha, establecerFecha] = useState(() => new Date());
  const [seleccionadas, establecerSeleccionadas] = useState([]);
  const registrarPersona = () => abrirRegistro('persona');
  const etiqueta = 'Crear sala';
  return <>
          <CampoFormulario etiqueta="Nombre de la ocasión" ejemplo="Ej.: Cena del viernes" {...aspecto} /><CampoFormulario etiqueta="Descripción (opcional)" {...aspecto} /><PersonalizacionSala {...aspecto} />
          <SelectorPersonas etiqueta="Participantes" personas={PERSONAS_SIMULADAS} seleccionadas={seleccionadas} multiple alCambiar={establecerSeleccionadas} alRegistrar={registrarPersona} {...aspecto} />
          <Text style={estilosGlobales.textoAyuda}>Vos ya estás incluido. Elegí del listado o registrá una persona desde el selector.</Text>
          <View style={estilosMovimiento.tarjetaInformacion}><SelectorFecha etiqueta="Fecha de la ocasión" valor={fecha} alSeleccionar={establecerFecha} tema={tema} estilosMovimiento={estilosMovimiento} /></View>
          <Text style={estilosGlobales.textoAyuda}>Máximo de {LIMITE_SALAS_ACTIVAS} salas activas por vez.</Text>
      <AccionesFormulario texto={etiqueta} {...aspecto} />
    </>;
}
