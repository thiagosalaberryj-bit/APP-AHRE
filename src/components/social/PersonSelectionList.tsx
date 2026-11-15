import {useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial,PersonaVista} from '../../social/types';
import {nombreCompletoPersona,normalizarNombrePersona} from '../../social/socialHelpers';
import crearEstilos from '../../styles/social/PeopleAgendaStyles';
export default function ListaSeleccionPersona({personas,elegida,alElegir,ocupado=false,...aspecto}:AspectoSocial&{personas:PersonaVista[];elegida:string;alElegir:(id:string)=>void;ocupado?:boolean}){
 const [busqueda,cambiarBusqueda]=useState(''),estilos=crearEstilos(aspecto.tema);
 const visibles=personas.filter(p=>normalizarNombrePersona(nombreCompletoPersona(p)+' '+p.apodo).includes(normalizarNombrePersona(busqueda)));
 return <View><TextInput accessibilityLabel="Buscar persona existente" placeholder="Buscar nombre, apellido o apodo" value={busqueda} onChangeText={cambiarBusqueda} editable={!ocupado} style={aspecto.estilosMovimiento.entradaDescripcion} placeholderTextColor={aspecto.tema.textoSecundario}/>
 {visibles.map((p,indice)=><Pressable key={p.id} accessibilityRole="radio" accessibilityLabel={'Seleccionar a '+nombreCompletoPersona(p)} accessibilityState={{checked:p.id===elegida,disabled:ocupado}} disabled={ocupado} onPress={()=>alElegir(p.id)} style={[estilos.contactoAgenda,indice>0&&estilos.separadorPersona]}><Ionicons name={p.id===elegida?'radio-button-on':'radio-button-off'} size={22} color={aspecto.tema.foco}/><View><Text style={aspecto.estilosGlobales.etiqueta}>{nombreCompletoPersona(p)}</Text><Text style={aspecto.estilosGlobales.textoSecundario}>{p.apodo}</Text></View></Pressable>)}
 {!visibles.length?<Text style={aspecto.estilosGlobales.textoAyuda}>No encontramos personas con esos datos.</Text>:null}</View>;
}
