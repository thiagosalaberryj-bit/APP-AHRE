import {useEffect,useState} from 'react';
import {operacionFinancieraEnCurso,observarOperacionFinanciera} from '../../social/financialOperation';
import BotonAccion from '../ActionButton';
export default function BotonSocial({texto,alPresionar,secundario,peligro=false,simple,completado,mostrarActividad=true,cargando=false,deshabilitado=false,...aspecto}:Omit<import('../../social/types').AspectoSocial,'estilosMovimiento'>&{texto:string;alPresionar:()=>unknown;secundario?:boolean;peligro?:boolean;simple?:boolean;deshabilitado?:boolean;cargando?:boolean;completado?:boolean;mostrarActividad?:boolean}){
 const [bloqueado,cambiarBloqueado]=useState(operacionFinancieraEnCurso());
 useEffect(()=>observarOperacionFinanciera(()=>cambiarBloqueado(operacionFinancieraEnCurso())),[]);
 return <BotonAccion mostrarActividad={mostrarActividad} tema={aspecto.tema} texto={texto} completado={completado} variante={peligro?'peligro':simple?'texto':secundario?'secundario':'principal'} cargando={cargando} deshabilitado={deshabilitado||bloqueado} alPresionar={()=>{if(!operacionFinancieraEnCurso())return alPresionar();}}/>;
}
