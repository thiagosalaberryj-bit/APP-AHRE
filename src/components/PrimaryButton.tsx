import {useContext} from 'react';
import {ContextoApariencia} from '../contexts/AppearanceContext';
import BotonAccion from './ActionButton';

export default function BotonPrincipal({estilosAutenticacion,titulo,completado,cargando=false,deshabilitado=false,alPresionar}:import('../types/ui').BotonPrincipalProps){
 const {tema}=useContext(ContextoApariencia);
 return <BotonAccion tema={tema} texto={titulo} completado={completado} cargando={cargando} deshabilitado={deshabilitado} alPresionar={alPresionar} estilo={estilosAutenticacion.botonPrincipal}/>;
}
