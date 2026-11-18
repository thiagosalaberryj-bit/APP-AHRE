import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import {useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial,PersonaVista} from '../../social/types';
import {nombreCompletoPersona,normalizarNombrePersona} from '../../social/socialHelpers';
import crearEstilos from '../../styles/social/PeopleAgendaStyles';
import Campo from './SocialTextField';
export default function ListaSeleccionPersona({personas,elegida,alElegir,ocupado=false,...aspecto}:AspectoSocial&{personas:PersonaVista[];elegida:string;alElegir:(id:string)=>void;ocupado?:boolean}){
 const [busqueda,cambiarBusqueda]=useState(''),[incluirArchivadas,cambiarArchivadas]=useState(false),estilos=crearEstilos(aspecto.tema);
 const visibles=personas.filter(p=>(p.activa||incluirArchivadas)&&normalizarNombrePersona(nombreCompletoPersona(p)+' '+p.apodo).includes(normalizarNombrePersona(busqueda)));
 return <View><Campo etiqueta="Buscar persona existente" ejemplo="Buscar nombre, apellido o apodo" valor={busqueda} alCambiar={cambiarBusqueda} editable={!ocupado} icono="search-outline" {...aspecto}/>
 {personas.some(p=>!p.activa)?<Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="checkbox" accessibilityLabel="Incluir personas archivadas" accessibilityState={{checked:incluirArchivadas,disabled:ocupado}} disabled={ocupado} onPress={conRespuestaVisual(()=>cambiarArchivadas(v=>!v))} style={estilos.contactoAgenda}><Ionicons name={incluirArchivadas?'checkbox':'square-outline'} size={22} color={aspecto.tema.foco}/><Text style={aspecto.estilosGlobales.texto}>Incluir personas archivadas</Text></Pressable>:null}
 {visibles.map((p,indice)=><Pressable android_ripple={RETROALIMENTACION_PULSACION} key={p.id} accessibilityRole="radio" accessibilityLabel={'Seleccionar a '+nombreCompletoPersona(p)} accessibilityState={{checked:p.id===elegida,disabled:ocupado}} disabled={ocupado} onPress={conRespuestaVisual(()=>alElegir(p.id))} style={[estilos.contactoAgenda,indice>0&&estilos.separadorPersona]}><Ionicons name={p.id===elegida?'radio-button-on':'radio-button-off'} size={22} color={aspecto.tema.foco}/><View><Text style={aspecto.estilosGlobales.etiqueta}>{nombreCompletoPersona(p)}</Text><Text style={aspecto.estilosGlobales.textoSecundario}>{p.apodo}</Text></View></Pressable>)}
 {!visibles.length?<Text style={aspecto.estilosGlobales.textoAyuda}>No encontramos personas con esos datos.</Text>:null}</View>;
}
