import type { Tema } from '../colors';
import { StyleSheet } from 'react-native';
import { BORDES, ESPACIADO } from '../globalStyles';
export default function crearEstilosPropios(tema: Tema) {
  return StyleSheet.create({
    separadorPersona:{borderTopWidth:BORDES.anchos.fino,borderTopColor:tema.borde},
    accionDesarchivar:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center',borderWidth:BORDES.anchos.fino,borderColor:tema.borde,borderRadius:BORDES.radios.boton},
    contactoAgenda: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.medio,
      padding: ESPACIADO.medio
    },
    avatarContactoAgenda: {
      width: 40,
      height: 40,
      borderRadius: BORDES.radios.circular,
      backgroundColor: `${tema.foco}18`,
      alignItems: 'center',
      justifyContent: 'center'
    },
    accesoPerfilAgenda: {
      width: 28,
      height: 28,
      borderRadius: BORDES.radios.campo,
      backgroundColor: tema.fondo,
      alignItems: 'center',
      justifyContent: 'center'
    }
  });
}
