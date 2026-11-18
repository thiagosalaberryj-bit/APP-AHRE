import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import {useContext,useEffect,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial} from '../../social/types';
import type {OperacionPersonal} from '../../social/online/types';
import {leerDatosOnline,observarSocialOnline} from '../../social/socialService';
import {useDatosSociales} from '../../social/SocialDataContext';
import {ContextoAvisos} from '../../contexts/ToastContext';
import crearEstilos from '../../styles/social/SharedStyles';
import Dialogo from './InvitationDialog';
import Seleccion from './RoomFinanceSelection';

export default function RegistrosPropiosSala(aspecto:AspectoSocial){
 const {usuarioId}=useDatosSociales(),{mostrarAviso}=useContext(ContextoAvisos),estilos=crearEstilos(aspecto.tema);
 const [operaciones,cambiarOperaciones]=useState<OperacionPersonal[]>([]),[seleccion,cambiarSeleccion]=useState<OperacionPersonal|null>(null),[ocupado,cambiarOcupado]=useState(false);
 useEffect(()=>{let vigente=true;const cargar=()=>{void leerDatosOnline<OperacionPersonal[]>(usuarioId,'registros-pendientes',[]).then(datos=>{if(vigente)cambiarOperaciones(datos);}).catch(()=>{if(vigente)mostrarAviso('No se pudieron consultar tus registros pendientes.',{tipo:'error'});});};cargar();const dejar=observarSocialOnline(cargar);return()=>{vigente=false;dejar();};},[usuarioId]);
 if(!operaciones.length&&!seleccion)return null;
 return <View style={estilos.grupo}>
  <Text style={aspecto.estilosGlobales.encabezadoSeccion}>Registros propios pendientes</Text>
  <Text style={aspecto.estilosGlobales.textoAyuda}>Aunque ya no participes en una sala, podés completar tus gastos y pagos para su cierre.</Text>
  {operaciones.map(op=><Pressable android_ripple={RETROALIMENTACION_PULSACION} key={op.salaId+':'+op.clave} accessibilityRole="button" accessibilityLabel={'Completar registro: '+op.descripcion} onPress={conRespuestaVisual(()=>cambiarSeleccion(op))} style={[aspecto.estilosGlobales.tarjeta,estilos.filaCampos]}><Ionicons name="wallet-outline" size={22} color={aspecto.tema.foco}/><View style={estilos.textoFlexible}><Text style={aspecto.estilosGlobales.etiqueta}>{op.salaNombre}</Text><Text style={aspecto.estilosGlobales.texto}>{op.descripcion}</Text></View><Ionicons name="chevron-forward" size={20} color={aspecto.tema.textoSecundario}/></Pressable>)}
  {seleccion?.salaId?<Dialogo {...aspecto} titulo="Completar mi registro" descripcion={seleccion.salaNombre||'Operación propia de una sala'} icono="wallet-outline" ocupado={ocupado} alCerrar={()=>cambiarSeleccion(null)}><Seleccion {...aspecto} operacion={seleccion} salaId={seleccion.salaId} cerrada={false} alCambiarOcupado={cambiarOcupado} alGuardar={()=>cambiarSeleccion(null)}/></Dialogo>:null}
 </View>;
}
