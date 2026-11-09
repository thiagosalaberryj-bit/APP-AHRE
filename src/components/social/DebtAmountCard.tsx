import {useState} from 'react';
import {Pressable,ScrollView,Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial} from '../../social/types';
import type {NombreIcono} from '../../constants/movimientos';
import crearEstilosDetalle from '../../styles/social/DebtDetailsStyles';
import DialogoInvitacion from './InvitationDialog';

export default function ImporteDeuda({etiqueta,valor,icono,color,...aspecto}:AspectoSocial&{etiqueta:string;valor:string;icono:NombreIcono;color:string}){
  const [abierto,abrir]=useState(false),estilos=crearEstilosDetalle(aspecto.tema);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={'Ver importe '+etiqueta} accessibilityValue={{text:valor}} onPress={()=>abrir(true)} style={estilos.tarjetaImporte}>
      <Ionicons name={icono} color={color} size={17}/><Text numberOfLines={1} style={estilos.detalle}>{etiqueta}</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.8} style={estilos.importe}>{valor}</Text>
    </Pressable>
    {abierto?<DialogoInvitacion {...aspecto} titulo={etiqueta} descripcion="Importe completo" icono={icono} etiquetaCerrar="Cerrar importe" alCerrar={()=>abrir(false)}>
      <ScrollView horizontal><Text selectable style={aspecto.estilosGlobales.monto}>{valor}</Text></ScrollView>
    </DialogoInvitacion>:null}
  </>;
}
