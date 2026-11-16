import {conRespuestaVisual} from '../../utils/pressFeedback';
import {crearEstilosGlobales} from '../../styles/globalStyles';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import SolicitudesVinculo from './AccountLinkRequests';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useContext, useRef, useState } from 'react';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { cambiarActividadPersona } from '../../social/socialService';
import Dialogo from './InvitationDialog';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EstadoVacio from './SocialEmptyState';
import ModalPersona from './PersonModal';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/PeopleAgendaStyles';
export default function AgendaPersonas(propiedades: import('../../social/types').AspectoSocial & ({abrirAltaInicial?:boolean} & Pick<import('../../social/types').AccionesSociales,'abrirPersona'>)) {
 const [focoEntrada,cambiarFocoEntrada]=useState<string|null>(null);
 const estilosEntrada=crearEstilosGlobales(propiedades.tema);

  const {
    personas: personasSociales, recargar
  } = useDatosSociales();
  const {
    abrirPersona,
    abrirAltaInicial = false,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales,
    estilosMovimiento
  } = aspecto;
  const [busqueda, establecerBusqueda] = useState('');
  const [archivadas,cambiarArchivadas]=useState(false);
  const [busquedaArchivadas,cambiarBusquedaArchivadas]=useState('');
  const [ocupado,cambiarOcupado]=useState(false),bloqueo=useRef(false);
  const {mostrarAviso}=useContext(ContextoAvisos);
  const desarchivar=async(id:string)=>{if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);try{await cambiarActividadPersona(id,true);await recargar();mostrarAviso('Persona desarchivada.',{tipo:'exito'});}catch(error){mostrarAviso(error instanceof Error?error.message:'No se pudo desarchivar.',{tipo:'error'});}finally{bloqueo.current=false;cambiarOcupado(false);}};
  const [mostrarFormulario, establecerMostrarFormulario] = useState(abrirAltaInicial);
  const personas = [...personasSociales].filter(persona=>persona.activa).filter(persona => normalizarNombrePersona(`${nombreCompletoPersona(persona)} ${persona.apodo || ''}`).includes(normalizarNombrePersona(busqueda))).sort((a, b) => nombreCompletoPersona(a).localeCompare(nombreCompletoPersona(b), 'es'));
  const cerrarFormulario = (persona?: Pick<import('../../database/types').Persona,'id'> | null) => { if (persona?.id) establecerBusqueda(''); establecerMostrarFormulario(false); };
  return <>
      <SolicitudesVinculo {...aspecto}/>
      <View style={estilos.filaTitulo}>
        <Text accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>Personas registradas</Text>
        <Text style={estilosGlobales.textoAyuda}>{personas.length} de {personasSociales.length}</Text>
      </View>
      <View style={estilos.filaCampos}>
        <View style={[[estilosMovimiento.botonDeposito, estilos.columnaCampo, estilos.busquedaAgenda],estilosEntrada.superficieCampo,focoEntrada==="0"&&estilosEntrada.campoEnfocado]}>
          <Ionicons color={focoEntrada==="0"?tema.foco:tema.textoSecundario} name="search-outline" size={22} />
          <TextInput onFocus={()=>cambiarFocoEntrada("0")} onBlur={()=>cambiarFocoEntrada(null)} accessibilityLabel="Buscar persona registrada" value={busqueda} onChangeText={establecerBusqueda} placeholder="Nombre, apellido o apodo" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosMovimiento.entradaDescripcion, estilos.entradaBusquedaAgenda]} />
          {busqueda ? <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Limpiar búsqueda de personas" onPress={conRespuestaVisual(() => establecerBusqueda(''))} style={estilos.accionIcono}><Ionicons color={tema.textoSecundario} name="close-circle-outline" size={22} /></Pressable> : null}
        </View>
        <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Agregar persona" onPress={conRespuestaVisual(() => establecerMostrarFormulario(true))} style={estilos.agregarPersonaAgenda}>
          <Ionicons color={tema.botonPrincipalTexto} name="add" size={28} />
        </Pressable>
      </View>
      <View style={estilos.grupoCampo}>
        {personas.length ? personas.map(persona => <Pressable android_ripple={RETROALIMENTACION_PULSACION} key={persona.id} accessibilityRole="button" accessibilityLabel={`Abrir persona ${nombreCompletoPersona(persona)}`} accessibilityHint="Abre los datos y las deudas de esta persona." onPress={conRespuestaVisual(() => abrirPersona(persona.id))} style={({
        pressed: presionado
      }) => [estilosGlobales.tarjeta, estilos.contactoAgenda, presionado && estilos.deudaHistorialPresionada]}>
            <View style={estilos.avatarContactoAgenda}><Text style={[estilos.textoAvatar, {
            color: tema.avatarTexto
          }]}>{persona.iniciales}</Text></View>
            <View style={estilos.textoFlexible}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{nombreCompletoPersona(persona)}</Text>
              <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{persona.apodo}</Text>
            </View>
            <View style={estilos.accesoPerfilAgenda}><Ionicons color={tema.foco} name="chevron-forward" size={18} /></View>
          </Pressable>) : <EstadoVacio icono="people-outline" titulo="No encontramos personas" descripcion="Probá con otro nombre, apellido o apodo, o usá + para agregar una persona." {...aspecto} />}
      </View>
      <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Ver personas archivadas" onPress={conRespuestaVisual(()=>{cambiarBusquedaArchivadas('');cambiarArchivadas(true);})} style={[estilosGlobales.botonSecundario,estilos.filaCampos]}><Ionicons name="archive-outline" size={20} color={tema.foco}/><Text style={estilosGlobales.textoBotonSecundario}>Ver personas archivadas</Text></Pressable>
      {archivadas?<Dialogo titulo="Personas archivadas" descripcion="Conservan su historial. Podés abrir su ficha o desarchivarlas." icono="archive-outline" etiquetaCerrar="Cerrar personas archivadas" ocupado={ocupado} alCerrar={()=>cambiarArchivadas(false)} {...aspecto}>
        <TextInput onFocus={()=>cambiarFocoEntrada("1")} onBlur={()=>cambiarFocoEntrada(null)} accessibilityLabel="Buscar personas archivadas" value={busquedaArchivadas} onChangeText={cambiarBusquedaArchivadas} placeholder="Nombre, apellido o apodo" placeholderTextColor={tema.textoSecundario} style={[[estilosMovimiento.entradaDescripcion,estilosGlobales.campo],estilosEntrada.campo,focoEntrada==="1"&&estilosEntrada.campoEnfocado]}/>
        {personasSociales.filter(p=>!p.activa&&normalizarNombrePersona(nombreCompletoPersona(p)+' '+p.apodo).includes(normalizarNombrePersona(busquedaArchivadas))).sort((a,b)=>nombreCompletoPersona(a).localeCompare(nombreCompletoPersona(b),'es')).map(persona=><View key={persona.id} style={[estilosGlobales.tarjeta,estilos.contactoAgenda]}>
          <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={'Abrir persona archivada '+nombreCompletoPersona(persona)} disabled={ocupado} style={estilos.textoFlexible} onPress={conRespuestaVisual(()=>{cambiarArchivadas(false);abrirPersona(persona.id);})}><Text style={estilosGlobales.etiqueta}>{nombreCompletoPersona(persona)}</Text><Text style={estilosGlobales.textoSecundario}>{persona.apodo}</Text></Pressable>
          <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={'Desarchivar a '+nombreCompletoPersona(persona)} disabled={ocupado} style={estilos.accionDesarchivar} onPress={conRespuestaVisual(()=>{void desarchivar(persona.id);})}><Ionicons name="refresh-outline" size={22} color={tema.foco}/></Pressable>
        </View>)}
        {!personasSociales.some(p=>!p.activa&&normalizarNombrePersona(nombreCompletoPersona(p)+' '+p.apodo).includes(normalizarNombrePersona(busquedaArchivadas)))?<Text style={estilosGlobales.textoAyuda}>{busquedaArchivadas?'No encontramos personas archivadas con esos datos.':'No tenés personas archivadas.'}</Text>:null}
      </Dialogo>:null}
      <ModalPersona visible={mostrarFormulario} alCerrar={cerrarFormulario} abrirPersona={abrirPersona} {...aspecto} />
    </>;
}
