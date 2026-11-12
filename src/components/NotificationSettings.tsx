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

export default function AjustesNotificaciones({tema,ajustes,alCambiar,alCerrar,alGuardar,guardando,permiso,alCambiarPermiso,canales}:{tema:Tema;ajustes:AjustesAvisos|null;alCambiar:(a:AjustesAvisos)=>void;alCerrar:()=>void;alGuardar:()=>void;guardando:boolean;permiso:string;alCambiarPermiso:(p:string)=>void;canales:Record<string,boolean>}) {
 const permisoSolicitado=useRef(false);
 useEffect(()=>{if(ajustes&&permiso==='Sin permiso'&&!permisoSolicitado.current){permisoSolicitado.current=true;void solicitarPermisoAvisos().then(alCambiarPermiso).catch(()=>{});}},[!!ajustes,permiso,alCambiarPermiso]);
 const g=crearEstilosGlobales(tema),e=crearEstilosNotificaciones(tema),p=crearEstilosPerfil(tema),campos=crearEstilosEgreso(tema);
 return <ModalPerfil visible={!!ajustes} alCerrar={()=>{if(!guardando)alCerrar();}} estilos={p} separarFondo estiloTarjeta={{height:'85%'}} estiloDesplazamiento={{flex:1}} tema={tema} titulo="Notificaciones" descripcion="Elegí qué recordar y a qué hora." icono="notifications-outline" etiquetaCerrar="Cerrar ajustes de notificaciones" etiquetaCerrarFondo="Cerrar ajustes tocando afuera" desplazable>
  {ajustes?<>
   {permiso!=='Permitidas'?<Text style={g.textoAyuda}>Avisos del teléfono: {permiso}</Text>:null}
   {['Sin permiso','Desactivadas en Ajustes'].includes(permiso)?<Pressable accessibilityRole="button" style={e.accesoPermisos} onPress={()=>{if(permiso==='Desactivadas en Ajustes')void Linking.openSettings();else void solicitarPermisoAvisos().then(alCambiarPermiso);}}><Text style={g.textoBotonTexto}>{permiso==='Desactivadas en Ajustes'?'Abrir Ajustes del teléfono':'Permitir avisos del teléfono'}</Text></Pressable>:null}
   <View pointerEvents={guardando?'none':'auto'}>
    {TIPOS_AVISO.map(tipo=>{const valor=ajustes.tipos[tipo];const cambiar=(v:Partial<typeof valor>)=>alCambiar({...ajustes,tipos:{...ajustes.tipos,[tipo]:{...valor,...v}}});return <View key={tipo} style={e.filaTipoAjuste}>
     <View style={e.filaAjuste}><Text style={e.textoAjuste}>{NOMBRES_AVISO[tipo]}</Text><Conmutador tema={tema} valor={valor.activo} etiquetaAccesibilidad={NOMBRES_AVISO[tipo]} alCambiar={activo=>cambiar({activo})}/></View>
     {valor.activo&&!['social','cuenta'].includes(tipo)?<View style={e.controlesAjuste}>
      <View style={e.horaAjuste}><SelectorHora tema={tema} valor={valor.hora} etiquetaAccesibilidad={'Hora de '+NOMBRES_AVISO[tipo]} alSeleccionar={hora=>cambiar({hora})} estilosMovimiento={{...campos,filaInformacion:e.campoHora}}/></View>
      {tipo==='recurrencias'?<View style={e.anticipacion}><Pressable accessibilityRole="button" accessibilityLabel={'Reducir anticipación de '+NOMBRES_AVISO[tipo]} disabled={valor.anticipacion===0} style={e.pasoAnticipacion} onPress={()=>cambiar({anticipacion:Math.max(0,valor.anticipacion-1)})}><Text style={g.textoBotonTexto}>−</Text></Pressable><Text style={g.textoAyuda}>{valor.anticipacion===0?'Mismo día':valor.anticipacion+' d antes'}</Text><Pressable accessibilityRole="button" accessibilityLabel={'Aumentar anticipación de '+NOMBRES_AVISO[tipo]} disabled={valor.anticipacion===30} style={e.pasoAnticipacion} onPress={()=>cambiar({anticipacion:Math.min(30,valor.anticipacion+1)})}><Text style={g.textoBotonTexto}>+</Text></Pressable></View>:null}
     </View>:null}
     {canales[tipo]===false?<Text style={g.textoError}>Canal desactivado en Android</Text>:null}
    </View>;})}
    <View style={e.filaAjuste}><Text style={e.textoAjuste}>Mostrar nombres e importes</Text><Conmutador tema={tema} valor={ajustes.mostrarDetalles} alCambiar={mostrarDetalles=>alCambiar({...ajustes,mostrarDetalles})}/></View>
   </View>
   <Pressable accessibilityRole="button" disabled={guardando} style={[g.botonPrincipal,guardando&&g.botonDeshabilitado]} onPress={alGuardar}><Text style={g.textoBotonPrincipal}>{guardando?'Guardando…':'Guardar ajustes'}</Text></Pressable>
  </>:null}
 </ModalPerfil>;
}
