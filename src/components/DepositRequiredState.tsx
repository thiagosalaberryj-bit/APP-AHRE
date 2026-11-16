import BotonAccion from './ActionButton';
import { RETROALIMENTACION_PULSACION } from '../styles/globalStyles';
import {Ionicons} from '@expo/vector-icons';
import {Pressable,Text,View} from 'react-native';
import type {Tema} from '../styles/colors';
import {crearEstilosGlobales} from '../styles/globalStyles';
import {crearEstilosOcr} from '../styles/OcrScreenStyles';

export default function RequisitoDeposito({tema,descripcion,alCrear}:{tema:Tema;descripcion:string;alCrear:()=>void}){
  const estilos=crearEstilosOcr(tema),globales=crearEstilosGlobales(tema);
  return <View style={estilos.tarjetaEstado}>
    <Ionicons name="wallet-outline" color={tema.foco} size={42}/>
    <Text style={estilos.tituloEstado}>Todavía no tenés depósitos.</Text>
    <Text style={estilos.textoEstado}>{descripcion}</Text>
    <BotonAccion tema={tema} texto={"Nuevo depósito"} variante="principal" cargando={false} deshabilitado={false} alPresionar={alCrear} estilo={globales.botonPrincipal} />
  </View>;
}
