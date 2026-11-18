import {Text,View} from 'react-native';
import type {Tema} from '../../styles/colors';
import crearEstilosAvatar from '../../styles/social/PersonAvatarStyles';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';

export default function IdentidadSolicitud({tema,nombre,apellido,detalle}:{tema:Tema;nombre:string|null;apellido?:string|null;detalle:string}){
 const estilos=crearEstilosSocialOnline(tema),avatar=crearEstilosAvatar(tema);
 const partes=(nombre||'').trim().split(/\s+/);
 const inicialApellido=apellido?.trim().charAt(0)||(partes.length>1?partes.at(-1)?.charAt(0):'');
 const iniciales=(partes[0].charAt(0)+(inicialApellido||'')).toLocaleUpperCase('es');
 const completo=[nombre?.trim(),apellido?.trim()].filter(Boolean).join(' ')||'Cuenta sin nombre';
 return <View style={estilos.identidadSolicitud}>
  <View accessible={false} style={[avatar.avatar,estilos.avatarSolicitud]}><Text style={estilos.inicialesSolicitud}>{iniciales||'?'}</Text></View>
  <View style={estilos.flexible}>
   <Text numberOfLines={2} ellipsizeMode="tail" style={estilos.nombreSolicitud}>{completo}</Text>
   <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.detalleSolicitud}>{detalle}</Text>
  </View>
 </View>;
}
