import AvisoFormulario from '../FormNotice';
import {useFinalizacionAccion} from '../../hooks/useActionCompletion';
import { useContext } from 'react';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useErrorNotificado } from '../../hooks/useErrorNotice';
import {iniciarOperacionFinanciera} from '../../social/financialOperation';
import {mensajeErrorSocial} from '../../social/socialHelpers';
import {useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import type {AspectoSocial} from '../../social/types';
import type {OperacionPersonal} from '../../social/online/types';
import {useDatosSociales} from '../../social/SocialDataContext';
import {elegirFinanciacionSala,consultarMovimientosOnline,incorporarOperacionPersonal} from '../../social/socialService';
import SelectorDeposito from '../DepositSelector';
import SelectorSegmentado from '../SegmentedSelector';
import OpcionesSeleccion from './SocialChoiceGroup';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import {formatearMontoSocial} from '../../social/socialHelpers';
export default function SeleccionFinanciera({operacion,salaId,cerrada,alGuardar,alCambiarOcupado,...aspecto}:AspectoSocial&{operacion:OperacionPersonal;salaId:string;cerrada:boolean;alGuardar?:(quitar?:boolean)=>void|Promise<void>;alCambiarOcupado?:(ocupado:boolean)=>void}){
  const finalizacion=useFinalizacionAccion();
  const { mostrarAviso } = useContext(ContextoAvisos);
  const social=useDatosSociales(),estilos=crearEstilosCompartidos(aspecto.tema),bloqueo=useRef(false);
  const [deposito,cambiarDeposito]=useState<string|null>(operacion.seleccion?.depositoId||null),[movimiento,cambiarMovimiento]=useState<string|null>(operacion.seleccion?.movimientoId||null),[modo,cambiarModo]=useState(operacion.seleccion?.movimientoId?'existente':'deposito');
  const [compatibles,cambiarCompatibles]=useState<Awaited<ReturnType<typeof consultarMovimientosOnline>>>([]),[cargando,cambiarCargando]=useState(false),[ocupado,cambiarOcupado]=useState(false),[, cambiarError]=useErrorNotificado('');
  useEffect(()=>{let activo=true;if(modo==='existente'){cambiarCargando(true);void consultarMovimientosOnline(operacion).then(m=>{if(activo)cambiarCompatibles(m);}).catch(()=>{if(activo)cambiarError('No se pudieron consultar tus movimientos.');}).finally(()=>{if(activo)cambiarCargando(false);});}return()=>{activo=false;};},[modo,operacion.clave,operacion.monto,operacion.tipo]);
  const [quitando,cambiarQuitando]=useState(false);
  const ejecutar=async(quitar=false)=>{
    if(bloqueo.current||cerrada)return;const liberar=iniciarOperacionFinanciera();if(!liberar)return;cambiarQuitando(quitar);bloqueo.current=true;finalizacion.iniciar();cambiarOcupado(true);alCambiarOcupado?.(true);cambiarError('');
    try{const seleccion=modo==='existente'?{movimientoId:movimiento!}:{depositoId:deposito!};if(cerrada)await incorporarOperacionPersonal(operacion,seleccion);else await elegirFinanciacionSala(salaId,operacion,seleccion,quitar);await social.recargar();if(!await finalizacion.confirmar())return;await alGuardar?.(quitar);mostrarAviso(quitar?'Selección eliminada.':cerrada?'Movimiento incorporado.':'Selección guardada.',{tipo:'exito'});}
    catch(e){cambiarError(mensajeErrorSocial(e,'No se pudo guardar.'));}
    finally{liberar();bloqueo.current=false;cambiarOcupado(false);alCambiarOcupado?.(false);}
  };
  return <View style={estilos.grupo}>
    <Text style={aspecto.estilosGlobales.etiqueta}>{operacion.descripcion} · {formatearMontoSocial(operacion.monto)}</Text>
    {operacion.necesitaRevision?<Text style={aspecto.estilosGlobales.textoError}>El gasto cambió. Revisá esta selección.</Text>:null}
    <SelectorSegmentado tema={aspecto.tema} opciones={[{id:'deposito',nombre:'Crear movimiento'},{id:'existente',nombre:'Adjuntar movimiento'}]} valor={modo} alSeleccionar={cambiarModo} etiqueta="Origen del movimiento"/>
    {modo==='deposito'?<SelectorDeposito depositos={social.depositos} seleccionadoId={deposito} alSeleccionar={cambiarDeposito} {...aspecto}/>:<>
      <OpcionesSeleccion opciones={compatibles.map(m=>({id:m.id,nombre:m.descripcion+' · '+m.deposito}))} elegida={movimiento||''} alElegir={cambiarMovimiento} {...aspecto}/>
      {cargando||!compatibles.length?<AvisoFormulario tema={aspecto.tema}>{cargando?'Buscando movimientos…':'No hay movimientos disponibles con ese importe y dirección.'}</AvisoFormulario>:null}
    </>}
    <AvisoFormulario tema={aspecto.tema}>{cerrada?'Los movimientos se confirmaron al cerrar la sala.': 'Tu saldo no cambia todavía. Se aplicará al cerrar la sala.'}</AvisoFormulario>

    <View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial texto={cerrada?'Incorporar':'Guardar'} cargando={ocupado&&!quitando} completado={finalizacion.completado} deshabilitado={cerrada||ocupado||cargando||(modo==='deposito'?!deposito:!movimiento)} alPresionar={()=>ejecutar()} {...aspecto}/></View>
    {!cerrada&&operacion.seleccion?<View style={estilos.columnaCampo}><BotonSocial secundario texto="Quitar" cargando={ocupado&&quitando} completado={finalizacion.completado} deshabilitado={ocupado} alPresionar={()=>ejecutar(true)} {...aspecto}/></View>:null}</View>
  </View>;
}
