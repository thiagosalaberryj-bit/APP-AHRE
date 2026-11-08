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
  const social=useDatosSociales(),estilos=crearEstilosCompartidos(aspecto.tema),bloqueo=useRef(false);
  const [deposito,cambiarDeposito]=useState<string|null>(operacion.seleccion?.depositoId||null),[movimiento,cambiarMovimiento]=useState<string|null>(operacion.seleccion?.movimientoId||null),[modo,cambiarModo]=useState(operacion.seleccion?.movimientoId?'existente':'deposito');
  const [compatibles,cambiarCompatibles]=useState<Awaited<ReturnType<typeof consultarMovimientosOnline>>>([]),[cargando,cambiarCargando]=useState(false),[ocupado,cambiarOcupado]=useState(false),[error,cambiarError]=useState('');
  useEffect(()=>{let activo=true;if(modo==='existente'){cambiarCargando(true);void consultarMovimientosOnline(operacion).then(m=>{if(activo)cambiarCompatibles(m);}).catch(()=>{if(activo)cambiarError('No se pudieron consultar tus movimientos.');}).finally(()=>{if(activo)cambiarCargando(false);});}return()=>{activo=false;};},[modo,operacion.clave,operacion.monto,operacion.tipo]);
  const ejecutar=async(quitar=false)=>{
    if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);alCambiarOcupado?.(true);cambiarError('');
    try{const seleccion=modo==='existente'?{movimientoId:movimiento!}:{depositoId:deposito!};if(cerrada)await incorporarOperacionPersonal(operacion,seleccion);else await elegirFinanciacionSala(salaId,operacion,seleccion,quitar);await social.recargar();await alGuardar?.(quitar);}
    catch(e){cambiarError(mensajeErrorSocial(e,'No se pudo guardar.'));}
    finally{bloqueo.current=false;cambiarOcupado(false);alCambiarOcupado?.(false);}
  };
  return <View style={estilos.grupo}>
    <Text style={aspecto.estilosGlobales.etiqueta}>{operacion.descripcion} · {formatearMontoSocial(operacion.monto)}</Text>
    {operacion.necesitaRevision?<Text style={aspecto.estilosGlobales.textoError}>El gasto cambió. Revisá esta selección.</Text>:null}
    <SelectorSegmentado tema={aspecto.tema} opciones={[{id:'deposito',nombre:'Crear movimiento'},{id:'existente',nombre:'Adjuntar movimiento'}]} valor={modo} alSeleccionar={cambiarModo} etiqueta="Origen del movimiento"/>
    {modo==='deposito'?<SelectorDeposito depositos={social.depositos} seleccionadoId={deposito} alSeleccionar={cambiarDeposito} {...aspecto}/>:<>
      <OpcionesSeleccion opciones={compatibles.map(m=>({id:m.id,nombre:m.descripcion+' · '+m.deposito}))} elegida={movimiento||''} alElegir={cambiarMovimiento} {...aspecto}/>
      {cargando||!compatibles.length?<Text style={aspecto.estilosGlobales.textoAyuda}>{cargando?'Buscando movimientos…':'No hay movimientos disponibles con ese importe y dirección.'}</Text>:null}
    </>}
    <Text style={aspecto.estilosGlobales.textoAyuda}>{cerrada?'Se registra solo en tu cuenta.': 'Tu saldo no cambia todavía. Se aplicará al cerrar la sala.'}</Text>
    {error?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
    <View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial texto={ocupado?'Guardando…':cerrada?'Incorporar':'Guardar'} deshabilitado={ocupado||cargando||(modo==='deposito'?!deposito:!movimiento)} alPresionar={()=>{void ejecutar();}} {...aspecto}/></View>
    {!cerrada&&operacion.seleccion?<View style={estilos.columnaCampo}><BotonSocial secundario texto="Quitar" deshabilitado={ocupado} alPresionar={()=>{void ejecutar(true);}} {...aspecto}/></View>:null}</View>
  </View>;
}
