import type { AspectoSocial } from '../../social/types';
import { useDatosSociales } from '../../social/SocialDataContext';
import AccionesFormulario from './SocialFormActions';
import { useRef, useState } from 'react';
import { generarIdentificador } from '../../database/identifiers';
import { crearSala } from '../../social/socialService';
import { COLORES_DEPOSITOS } from '../../styles/colors';
import CampoFormulario from './SocialTextField';
import PersonalizacionSala from './RoomAppearanceForm';
import SelectorPersonas from './PeopleSelector';
import { LIMITE_SALAS_ACTIVAS } from "../../social/socialConstants";
import { Text, View } from 'react-native';
import SelectorFecha from '../DateSelector';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioCrearSala(propiedades: import('../../social/types').AspectoSocial & (Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  const {
    personasActivas: personasSociales,
    alCrearSala
  } = useDatosSociales();
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
  const [seleccionadas, establecerSeleccionadas] = useState<string[]>([]);
  const id = useRef(generarIdentificador());
  const [nombre, establecerNombre] = useState('');
  const [descripcion, establecerDescripcion] = useState('');
  const [apariencia, establecerApariencia] = useState({ categoriaId: 'alimentacion', icono: 'restaurant-outline', color: COLORES_DEPOSITOS[0] });
  const registrarPersona = () => abrirRegistro('persona');
  const etiqueta = 'Crear sala';
  return <>
          <CampoFormulario etiqueta="Nombre de la ocasión" ejemplo="Ej.: Cena del viernes" valor={nombre} alCambiar={establecerNombre} limite={100} {...aspecto} /><CampoFormulario etiqueta="Descripción (opcional)" valor={descripcion} alCambiar={establecerDescripcion} limite={500} {...aspecto} /><PersonalizacionSala alCambiar={establecerApariencia} {...aspecto} />
          <SelectorPersonas etiqueta="Participantes" personas={personasSociales} seleccionadas={seleccionadas} multiple alCambiar={establecerSeleccionadas} alRegistrar={registrarPersona} {...aspecto} />
          <Text style={estilosGlobales.textoAyuda}>Vos ya estás incluido. Elegí del listado o registrá una persona desde el selector.</Text>
          <View style={estilosMovimiento.tarjetaInformacion}><SelectorFecha etiqueta="Fecha de la ocasión" valor={fecha} alSeleccionar={establecerFecha} tema={tema} estilosMovimiento={estilosMovimiento} /></View>
          <Text style={estilosGlobales.textoAyuda}>Máximo de {LIMITE_SALAS_ACTIVAS} salas activas por vez.</Text>
      <AccionesFormulario texto={etiqueta} alGuardar={() => crearSala({ id: id.current, nombre, descripcion, ...apariencia, personasIds: seleccionadas,
        fecha: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` })} alExito={alCrearSala} {...aspecto} />
    </>;
}
