import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Tema } from '../styles/colors';
import { crearEstilosMercadoPago } from '../styles/MercadoPagoScreenStyles';

export default function AccionesSeleccionMp({tema,cantidad,todas,disponibles,ocupada,recuperando,motivoBloqueo,alAlternar,alRegistrar,alIgnorar}:{tema:Tema;cantidad:number;todas:boolean;disponibles:boolean;ocupada:boolean;recuperando:boolean;motivoBloqueo:string;alAlternar:()=>void;alRegistrar:()=>void;alIgnorar:()=>void}){
 const [abierto,establecerAbierto]=useState(false),e=crearEstilosMercadoPago(tema);
 const cerrar=()=>{if(!ocupada)establecerAbierto(false);};
 return <>
  <View style={e.barraSeleccion}>
   <Pressable accessibilityRole="checkbox" accessibilityLabel={todas?'Deseleccionar todos los movimientos':'Seleccionar todos los movimientos (máximo 500)'} accessibilityState={{checked:todas}} disabled={ocupada||!disponibles} style={e.seleccionarTodo} onPress={alAlternar}><Ionicons name={todas?'checkbox':'square-outline'} size={22} color={tema.foco}/><Text style={e.textoEnlace}>{todas?'Ninguno':'Todos'}</Text></Pressable>
   <Pressable accessibilityRole="button" accessibilityLabel={`Revisar ${cantidad} movimientos seleccionados`} disabled={ocupada} style={[e.revisarSeleccion,!cantidad&&e.deshabilitada]} onPress={()=>{if(!cantidad){Alert.alert('Seleccioná movimientos','Marcá las casillas de los movimientos que quieras registrar o ignorar. No consume búsquedas.');return;}establecerAbierto(true);}}><Text style={e.textoBoton}>Revisar · {cantidad}</Text>{ocupada?<ActivityIndicator size="small" color={tema.botonPrincipalTexto}/>:<Ionicons name="chevron-forward" size={18} color={tema.botonPrincipalTexto}/>}</Pressable>
  </View>
  <Modal transparent animationType="fade" visible={abierto} onRequestClose={cerrar}>
   <View style={e.fondoModal}>
    <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Cerrar revisión de seleccionados" onPress={cerrar}/>
    <View style={e.modal} accessibilityViewIsModal>
     <View style={e.filaEntre}><Text style={e.tituloResumen}>Revisar selección</Text><Pressable style={e.casilla} accessibilityRole="button" accessibilityLabel="Cerrar selección" disabled={ocupada} onPress={cerrar}><Ionicons name="close" size={22} color={tema.textoPrincipal}/></Pressable></View>
     <Text style={e.contador}>{cantidad} {cantidad===1?'movimiento':'movimientos'}</Text>
     <Text style={e.textoSecundario}>{recuperando?'Volverán a pendientes para que puedas revisarlos.':'Se registrarán en el depósito con sus categorías y descripciones. Los demás quedarán pendientes.'}</Text>
     {motivoBloqueo&&!recuperando?<Text accessibilityRole="alert" style={e.errorSeleccion}>{motivoBloqueo}</Text>:null}
     <Pressable accessibilityRole="button" disabled={ocupada} style={[e.botonAccion,(!cantidad||!!motivoBloqueo&&!recuperando)&&e.deshabilitada]} onPress={()=>{if(!cantidad)return;if(motivoBloqueo&&!recuperando){Alert.alert('No se pueden registrar los seleccionados',motivoBloqueo);return;}cerrar();alRegistrar();}}><Text style={e.textoBoton}>{recuperando?'Volver a pendientes':'Registrar seleccionados'}</Text></Pressable>
     {!recuperando?<Pressable accessibilityRole="button" disabled={ocupada||!cantidad} style={e.ignorar} onPress={()=>{cerrar();alIgnorar();}}><Text style={e.textoEnlace}>Ignorar seleccionados</Text></Pressable>:null}
    </View>
   </View>
  </Modal>
 </>;
}
