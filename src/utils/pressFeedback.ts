import type {GestureResponderEvent} from 'react-native';
// La navegación y las selecciones responden inmediatamente. La secuencia de
// carga y confirmación pertenece únicamente a la operación asíncrona.
export function conRespuestaVisual(accion:((evento:GestureResponderEvent)=>unknown)|undefined){
 return(evento:GestureResponderEvent)=>accion?.(evento);
}
