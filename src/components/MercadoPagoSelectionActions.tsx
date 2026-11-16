import BotonAccion from './ActionButton';
import {conRespuestaVisual} from '../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import PuntosCarga from './LoadingDots';
import { AvisosEnModal, ContextoAvisos } from '../contexts/ToastContext';
import { useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Tema } from '../styles/colors';
import { crearEstilosMercadoPago } from '../styles/MercadoPagoScreenStyles';

export default function AccionesSeleccionMp({tema,cantidad,todas,disponibles,ocupada,completado=false,recuperando,motivoBloqueo,alAlternar,alRegistrar,alIgnorar}:{tema:Tema;cantidad:number;todas:boolean;disponibles:boolean;ocupada:boolean;completado?:boolean;recuperando:boolean;motivoBloqueo:string;alAlternar:()=>void;alRegistrar:()=>unknown;alIgnorar:()=>unknown}){
 const { mostrarAviso } = useContext(ContextoAvisos);
 const [abierto,establecerAbierto]=useState(false),e=crearEstilosMercadoPago(tema);
 const [accion,cambiarAccion]=useState('');
 const confirmar=async(tipo:string)=>{if(ocupada)return;cambiarAccion(tipo);try{const resultado=await (tipo==='registrar'?alRegistrar():alIgnorar());if(resultado!==false)establecerAbierto(false);}finally{cambiarAccion('');}};
 const cerrar=()=>{if(!ocupada)establecerAbierto(false);};
 return <>
  <View style={e.barraSeleccion}>
   <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="checkbox" accessibilityLabel={todas?'Deseleccionar todos los movimientos':'Seleccionar todos los movimientos (máximo 500)'} accessibilityState={{checked:todas}} disabled={ocupada||!disponibles} style={e.seleccionarTodo} onPress={conRespuestaVisual(alAlternar)}><Ionicons name={todas?'checkbox':'square-outline'} size={22} color={tema.foco}/><Text style={e.textoEnlace}>{todas?'Ninguno':'Todos'}</Text></Pressable>
   <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={`Revisar ${cantidad} movimientos seleccionados`} disabled={ocupada} style={[e.revisarSeleccion,!cantidad&&e.deshabilitada]} onPress={conRespuestaVisual(()=>{if(!cantidad){mostrarAviso('Marcá las casillas de los movimientos que quieras registrar o ignorar. No consume búsquedas.',{tipo:'informacion'});return;}establecerAbierto(true);})}><Text style={e.textoBoton}>Revisar · {cantidad}</Text>{ocupada?<PuntosCarga size="small" color={tema.botonPrincipalTexto}/>:<Ionicons name="chevron-forward" size={18} color={tema.botonPrincipalTexto}/>}</Pressable>
  </View>
  <Modal transparent animationType="fade" visible={abierto} onRequestClose={cerrar}><AvisosEnModal visible={abierto}>
   <View style={e.fondoModal}>
    <Pressable android_ripple={RETROALIMENTACION_PULSACION} style={StyleSheet.absoluteFill} accessibilityLabel="Cerrar revisión de seleccionados" onPress={cerrar}/>
    <View style={e.modal} accessibilityViewIsModal>
     <View style={e.filaEntre}><Text style={e.tituloResumen}>Revisar selección</Text><Pressable android_ripple={RETROALIMENTACION_PULSACION} style={e.casilla} accessibilityRole="button" accessibilityLabel="Cerrar selección" disabled={ocupada} onPress={conRespuestaVisual(cerrar)}><Ionicons name="close" size={22} color={tema.textoPrincipal}/></Pressable></View>
     <Text style={e.contador}>{cantidad} {cantidad===1?'movimiento':'movimientos'}</Text>
     <Text style={e.textoSecundario}>{recuperando?'Volverán a pendientes para que puedas revisarlos.':'Se registrarán en el depósito con sus categorías y descripciones. Los demás quedarán pendientes.'}</Text>
     <BotonAccion tema={tema} texto={recuperando?'Volver a pendientes':'Registrar seleccionados'} cargando={ocupada&&accion==='registrar'} completado={completado&&accion==='registrar'} deshabilitado={ocupada||!cantidad||!!motivoBloqueo&&!recuperando} alPresionar={()=>confirmar('registrar')} estilo={e.botonAccion}/>
     {!recuperando?<BotonAccion tema={tema} texto="Ignorar seleccionados" variante="texto" cargando={ocupada&&accion==='ignorar'} completado={completado&&accion==='ignorar'} deshabilitado={ocupada||!cantidad} alPresionar={()=>confirmar('ignorar')} estilo={e.ignorar}/>:null}
    </View>
   </View>
  </AvisosEnModal></Modal>
 </>;
}
