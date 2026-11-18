import AvisoFormulario from '../FormNotice';
import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import { useDatosSociales } from '../../social/SocialDataContext';
import AccionesFormulario from './SocialFormActions';
import { useRef, useState } from 'react';
import { generarIdentificador } from '../../database/identifiers';
import { crearSala,publicarSalaOnline,configurarAccesoSala } from '../../social/socialService';
import { COLORES_DEPOSITOS } from '../../styles/colors';
import CampoFormulario from './SocialTextField';
import PersonalizacionSala from './RoomAppearanceForm';
import ModalAgregarPersonasSala from './AddRoomPeopleModal';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import { Ionicons } from '@expo/vector-icons';
import { LIMITE_SALAS_ACTIVAS } from "../../social/socialConstants";
import { Pressable, Text, View } from 'react-native';
import SelectorFecha from '../DateSelector';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function FormularioCrearSala(propiedades: import('../../social/types').AspectoSocial & (Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  const {
    personas: personasSociales,
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
  const [seleccionandoPersonas, establecerSeleccionandoPersonas] = useState(false);
  const id = useRef(generarIdentificador());
  const [nombre, establecerNombre] = useState('');
  const [errores,cambiarErrores]=useState<Record<string,string>>({});
  const [compartir,cambiarCompartir]=useState(false),[contrasena,cambiarContrasena]=useState('');
  const [descripcion, establecerDescripcion] = useState('');
  const [apariencia, establecerApariencia] = useState({ icono: 'restaurant-outline', color: COLORES_DEPOSITOS[0] });
  const registrarPersona = () => abrirRegistro('persona');
  const etiqueta = 'Crear sala';
  return <>
          <CampoFormulario etiqueta="Nombre de la ocasión" ejemplo="Ej.: Cena del viernes" valor={nombre} error={errores.nombre} alCambiar={establecerNombre} limite={100} {...aspecto} /><CampoFormulario etiqueta="Descripción (opcional)" multilinea valor={descripcion} error={errores.descripcion} alCambiar={establecerDescripcion} limite={500} {...aspecto} />
          <View style={aspecto.estilos.grupoCampo}>
            <Text style={estilosGlobales.etiqueta}>Participantes</Text>
            <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Participantes" accessibilityState={{ expanded: seleccionandoPersonas }} onPress={conRespuestaVisual(() => establecerSeleccionandoPersonas(true))} style={estilosMovimiento.botonDeposito}>
              <Ionicons name="people-outline" size={24} color={tema.foco} />
              <Text style={[estilosGlobales.texto, aspecto.estilos.textoFlexible]}>{seleccionadas.length ? personasSociales.filter(persona => seleccionadas.includes(persona.id)).map(nombreCompletoPersona).join(', ') : 'Seleccioná participantes'}</Text>
              <Ionicons name="chevron-down" size={22} color={tema.textoSecundario} />
            </Pressable>
          </View>
          {seleccionandoPersonas ? <ModalAgregarPersonasSala personasSala={[]} seleccionInicial={seleccionadas} titulo="Participantes" textoConfirmar="Listo" permitirVacia
            alAgregar={ids => { establecerSeleccionadas(ids); establecerSeleccionandoPersonas(false); }} alCerrar={() => establecerSeleccionandoPersonas(false)}
            alCrear={() => { establecerSeleccionandoPersonas(false); registrarPersona(); }} {...aspecto} /> : null}
          <AvisoFormulario tema={aspecto.tema} titulo="Tu participación">Vos ya estás incluido. Elegí del listado o registrá una persona desde el selector.</AvisoFormulario>
          <PersonalizacionSala alCambiar={establecerApariencia} {...aspecto} />
          <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="checkbox" accessibilityState={{checked:compartir}} onPress={conRespuestaVisual(()=>cambiarCompartir(!compartir))} style={aspecto.estilos.filaCampos}><Ionicons name={compartir?'checkbox':'square-outline'} size={24} color={tema.foco}/><Text style={estilosGlobales.etiqueta}>Compartir online</Text></Pressable>
          {compartir?<><CampoFormulario secreto etiqueta="Contraseña de la sala" valor={contrasena} error={errores.contrasena} alCambiar={cambiarContrasena} limite={128} {...aspecto}/><AvisoFormulario tema={aspecto.tema} titulo="Contraseña de la sala">Mínimo 8 caracteres. Tendrás un enlace y QR para todas las personas; tus amigos pueden entrar directamente; las demás personas esperan tu aprobación. Se requiere conexión.</AvisoFormulario></>:null}
          <View style={estilosMovimiento.tarjetaInformacion}><SelectorFecha etiqueta="Fecha de la ocasión" valor={fecha} alSeleccionar={establecerFecha} tema={tema} estilosMovimiento={estilosMovimiento} /></View>
          <AvisoFormulario tema={aspecto.tema} titulo="Cupos de salas">Máximo de {LIMITE_SALAS_ACTIVAS} salas activas por vez.</AvisoFormulario>
      <AccionesFormulario texto={compartir?'Crear y compartir sala':etiqueta} alGuardar={async() => {const campos:Record<string,string>={};if(!nombre.trim()||nombre.trim().length>100)campos.nombre='Completá un nombre de hasta 100 caracteres.';if(descripcion.trim().length>500)campos.descripcion='La descripción admite hasta 500 caracteres.';if(compartir&&contrasena.length<8)campos.contrasena='La contraseña requiere al menos 8 caracteres.';cambiarErrores(campos);if(Object.keys(campos).length)throw new Error('Revisá los campos marcados.');const sala=await crearSala({ id: id.current, nombre, descripcion, ...apariencia, personasIds: seleccionadas,
        fecha: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` });if(compartir){await publicarSalaOnline(sala.id);await configurarAccesoSala(sala.id,contrasena);}return sala;}} alExito={alCrearSala} {...aspecto} />
    </>;
}
