import { useEffect, useState } from 'react';
import { Text, View, StyleSheet, AppState } from 'react-native';
import { contarAvisosNoVistos } from '../notifications/notificationService';
import { observarIntegraciones } from '../integrations/integrationStore';
import { BORDES, TIPOGRAFIA } from '../styles/globalStyles';
import type { Tema } from '../styles/colors';

export default function IndicadorAvisosNoVistos({ tema }: {tema:Tema}) {
  const [cantidad, establecerCantidad] = useState(0);
  useEffect(()=>{
    let activa=true, solicitud=0;
    const cargar=()=>{const numero=++solicitud;void contarAvisosNoVistos().then(n=>{if(activa&&numero===solicitud)establecerCantidad(n);}).catch(()=>{});};
    cargar();const dejar=observarIntegraciones(cargar);
    const escucha=AppState?.addEventListener?.('change',e=>{if(e==='active')cargar();});
    return()=>{activa=false;dejar();escucha?.remove();};
  },[]);
  return cantidad>0?<View accessible accessibilityLabel={`${cantidad} notificaciones sin ver`} pointerEvents="none" style={[estilos.insignia,{backgroundColor:tema.botonPrincipal,borderColor:tema.encabezado}]}><Text style={[estilos.cantidad,{color:tema.botonPrincipalTexto}]}>{cantidad>99?'99+':cantidad}</Text></View>:null;
}
const estilos=StyleSheet.create({
  insignia:{position:'absolute',right:1,top:1,minWidth:18,height:18,paddingHorizontal:3,borderRadius:BORDES.radios.circular,borderWidth:2,alignItems:'center',justifyContent:'center'},
  cantidad:{fontSize:TIPOGRAFIA.tamanos.auxiliar-2,lineHeight:12,fontWeight:TIPOGRAFIA.pesos.seminegrita,textAlign:'center'},
});
