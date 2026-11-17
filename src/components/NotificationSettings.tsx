import AvisoFormulario from './FormNotice';
import {conRespuestaVisual} from '../utils/pressFeedback';
import BotonAccion from './ActionButton';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import { useEffect, useRef } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import ModalPerfil from './ProfileModal';
import SelectorHora from './TimeSelector';
import Conmutador from './Toggle';
import { crearEstilosPerfil } from '../styles/ProfileScreenStyles';
import { crearEstilosEgreso } from '../styles/expenseStyles';
import { crearEstilosNotificaciones } from '../styles/NotificationsScreenStyles';
import { crearEstilosGlobales } from '../styles/globalStyles';
import { TIPOS_AVISO,NOMBRES_AVISO,type AjustesAvisos } from '../notifications/types';
import { solicitarPermisoAvisos } from '../notifications/nativeAdapter';
import type { Tema } from '../styles/colors';
import AjustesAlarmasExactas from './ExactAlarmSettings';

export default function AjustesNotificaciones({tema,ajustes,alCambiar,alCerrar,alGuardar,guardando,completado=false,permiso,alCambiarPermiso,canales,generales=true,alActivarGenerales}:{tema:Tema;ajustes:AjustesAvisos|null;alCambiar:(a:AjustesAvisos)=>void;alCerrar:()=>void;alGuardar:()=>void;guardando:boolean;completado?:boolean;permiso:string;alCambiarPermiso:(p:string)=>void;canales:Record<string,boolean>;generales?:boolean;alActivarGenerales?:()=>void}) {
 const permisoSolicitado=useRef(false);
 useEffect(()=>{if(generales&&ajustes&&permiso==='Sin permiso'&&!permisoSolicitado.current){permisoSolicitado.current=true;void solicitarPermisoAvisos().then(alCambiarPermiso).catch(()=>{});}},[!!ajustes,permiso,alCambiarPermiso,generales]);
 const bloqueados=guardando||!generales;
 const g=crearEstilosGlobales(tema),e=crearEstilosNotificaciones(tema),p=crearEstilosPerfil(tema),campos=crearEstilosEgreso(tema);
 return <ModalPerfil visible={!!ajustes} alCerrar={()=>{if(!guardando)alCerrar();}} estilos={p} separarFondo estiloTarjeta={{height:'85%'}} estiloDesplazamiento={{flex:1}} tema={tema} titulo="Notificaciones" descripcion="Elegí qué recordar y a qué hora." icono="notifications-outline" etiquetaCerrar="Cerrar ajustes de notificaciones" etiquetaCerrarFondo="Cerrar ajustes tocando afuera" desplazable>
  {ajustes?<>
   {!generales?<><AvisoFormulario tema={tema}>Activá las notificaciones en Perfil para editar estas opciones. Tu configuración se conserva.</AvisoFormulario>{alActivarGenerales?<BotonAccion tema={tema} texto={"Ir a Perfil"} variante="secundario" cargando={false} deshabilitado={false} alPresionar={alActivarGenerales} estilo={g.botonSecundario} />:null}</>:null}

   {generales&&['Sin permiso','Desactivadas en Ajustes'].includes(permiso)?<Text style={g.textoError}>Android bloquea las notificaciones de AHRE.</Text>:null}
   {generales&&['Sin permiso','Desactivadas en Ajustes'].includes(permiso)?<BotonAccion tema={tema} texto={"Activar en Android"} variante="secundario" cargando={false} deshabilitado={false} alPresionar={()=>{if(permiso==='Desactivadas en Ajustes')void Linking.openSettings();else void solicitarPermisoAvisos().then(alCambiarPermiso);}} estilo={g.botonSecundario} />:null}
   <View pointerEvents={bloqueados?'none':'auto'} accessibilityState={{disabled:bloqueados}} style={e.opcionesAjuste}>
    {TIPOS_AVISO.map(tipo=>{const valor=ajustes.tipos[tipo];const cambiar=(v:Partial<typeof valor>)=>{if(!bloqueados)alCambiar({...ajustes,tipos:{...ajustes.tipos,[tipo]:{...valor,...v}}});};return <View key={tipo} style={e.filaTipoAjuste}>
     <View style={e.filaAjuste}><Text style={e.textoAjuste}>{NOMBRES_AVISO[tipo]}</Text><Conmutador deshabilitado={bloqueados} tema={tema} valor={valor.activo} etiquetaAccesibilidad={NOMBRES_AVISO[tipo]} alCambiar={activo=>cambiar({activo})}/></View>
     {valor.activo&&!['social','cuenta'].includes(tipo)?<View style={e.controlesAjuste}>
      <View style={e.horaAjuste}><SelectorHora deshabilitado={bloqueados} tema={tema} valor={valor.hora} etiquetaAccesibilidad={'Hora de '+NOMBRES_AVISO[tipo]} alSeleccionar={hora=>cambiar({hora})} estilosMovimiento={{...campos,filaInformacion:e.campoHora}}/></View>
      {tipo==='recurrencias'?<View style={e.anticipacion}><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={'Reducir anticipación de '+NOMBRES_AVISO[tipo]} disabled={bloqueados||valor.anticipacion===0} style={e.pasoAnticipacion} onPress={conRespuestaVisual(()=>cambiar({anticipacion:Math.max(0,valor.anticipacion-1)}))}><Text style={g.textoBotonTexto}>−</Text></Pressable><AvisoFormulario tema={tema}>{valor.anticipacion===0?'Mismo día':valor.anticipacion+' d antes'}</AvisoFormulario><Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={'Aumentar anticipación de '+NOMBRES_AVISO[tipo]} disabled={bloqueados||valor.anticipacion===30} style={e.pasoAnticipacion} onPress={conRespuestaVisual(()=>cambiar({anticipacion:Math.min(30,valor.anticipacion+1)}))}><Text style={g.textoBotonTexto}>+</Text></Pressable></View>:null}
     </View>:null}
     {canales[tipo]===false?<Text style={g.textoError}>Canal desactivado en Android</Text>:null}
    </View>;})}
   </View>
   {generales?<AvisoFormulario tema={tema}>Si la hora elegida ya pasó, el aviso se programa para el próximo día que corresponda.</AvisoFormulario>:null}
   <BotonAccion tema={tema} texto={'Guardar ajustes'} variante="principal" cargando={guardando} completado={completado} deshabilitado={bloqueados} alPresionar={()=>{if(!bloqueados)return alGuardar();return false;}} estilo={[g.botonPrincipal]} />
   {generales&&permiso==='Permitidas'?<AjustesAlarmasExactas tema={tema} visible={!!ajustes} deshabilitado={bloqueados}/>:null}
  </>:null}
 </ModalPerfil>;
}
