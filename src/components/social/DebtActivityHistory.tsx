import {useEffect,useRef,useState} from 'react';
import {Text,View,Pressable} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial,DeudaVista} from '../../social/types';
import {useDatosSociales} from '../../social/SocialDataContext';
import {consultarHistorialDeuda,consultarMovimientosSociales,sincronizarSocialOnline,leerDatosOnline,observarSocialOnline,usuarioDemoActual,simularRespuestaDemo} from '../../social/socialService';
import {formatearMontoSocial} from '../../social/socialHelpers';
import type {PagoSocial} from '../../database/types';
import type {DeudaOnline,OperacionPersonal} from '../../social/online/types';
import crearEstilosDetalle from '../../styles/social/DebtDetailsStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import BotonSocial from './SocialButton';
import Dialogo from './InvitationDialog';

export default function HistorialActividadDeuda({deuda,...aspecto}:AspectoSocial&{deuda:DeudaVista}) {
  const social=useDatosSociales(),estilos=crearEstilosDetalle(aspecto.tema),compartidos=crearEstilosCompartidos(aspecto.tema);
  const [pagos,cambiarPagos]=useState<PagoSocial[]>([]),[acuerdo,cambiarAcuerdo]=useState<DeudaOnline|null>(null),[operaciones,cambiarOperaciones]=useState<OperacionPersonal[]>([]),[vinculos,cambiarVinculos]=useState<{clave:string;movimiento_id:string}[]>([]),[error,cambiarError]=useState('');
  const [esDemo,cambiarDemo]=useState(false),[simulando,cambiarSimulando]=useState(false),[ocupado,cambiarOcupado]=useState(false);
  const bloqueo=useRef(false),montado=useRef(true);
  useEffect(()=>{montado.current=true;return()=>{montado.current=false;};},[]);
  useEffect(()=>{
    let activo=true;
    const cargar=async()=>{
      try {
        const demo=deuda.id.startsWith('demo-social:')&&!!await usuarioDemoActual();
        if(demo)await sincronizarSocialOnline();
        const [privados,deudas,operaciones,vinculos]=await Promise.all([deuda.soloOnline?Promise.resolve([]):consultarHistorialDeuda(deuda.id),leerDatosOnline<DeudaOnline[]>(social.usuarioId,'deudas',[]),leerDatosOnline<OperacionPersonal[]>(social.usuarioId,'operaciones',[]),consultarMovimientosSociales()]);
        if(activo){cambiarPagos(privados);cambiarAcuerdo(deudas.find(d=>d.id===deuda.acuerdoOnlineId)||null);cambiarOperaciones(operaciones);cambiarVinculos(vinculos);cambiarDemo(demo);cambiarError('');}
      }catch{if(activo)cambiarError('No se pudo cargar el historial.');}
    };
    void cargar();const dejar=observarSocialOnline(()=>{void cargar();});
    return()=>{activo=false;dejar();};
  },[deuda.id,deuda.pendienteNumero,social.usuarioId,deuda.acuerdoOnlineId]);
  const nombre=social.obtenerPersona(deuda.personaId)?.nombre||'La otra persona';
  const responder=async(decision:'confirmado'|'rechazado'|'perdonado',pagoId?:string)=>{
    if(bloqueo.current||!acuerdo)return;
    bloqueo.current=true;cambiarOcupado(true);cambiarError('');
    try{
      await simularRespuestaDemo(acuerdo.id,{decision,pagoId,pendienteEsperado:acuerdo.pendiente});
      await social.recargar();
      if(montado.current)cambiarSimulando(false);
    }catch(e){if(montado.current)cambiarError(e instanceof Error?e.message:'No se pudo simular la respuesta.');}
    finally{bloqueo.current=false;if(montado.current)cambiarOcupado(false);}
  };
  const estados={
    pendiente:{icono:'time-outline',color:aspecto.tema.textoSecundario,etiqueta:'Pendiente de confirmación'},
    rechazado:{icono:'close-circle-outline',color:aspecto.tema.error,etiqueta:'Pago rechazado'},
    confirmado:{icono:'checkmark-circle-outline',color:aspecto.tema.exito,etiqueta:'Pago confirmado'},
    perdonado:{icono:'heart-outline',color:aspecto.tema.foco,etiqueta:'Deuda perdonada'},
    anulado:{icono:'close-circle-outline',color:aspecto.tema.error,etiqueta:'Pago anulado'},
    porRegistrar:{icono:'wallet-outline',color:aspecto.tema.foco,etiqueta:'Pendiente de registrar en tus movimientos'},
    registrado:{icono:'checkmark-circle-outline',color:aspecto.tema.exito,etiqueta:'Movimiento registrado'},
    origen:{icono:'document-text-outline',color:aspecto.tema.textoSecundario,etiqueta:'Origen de la deuda'},
  } as const;
  const registro=(id:string,titulo:string,fecha:string,descripcion:string,movimientoId?:string,accion?:()=>void,atencion=false,estado:keyof typeof estados='registrado')=>{
    const indicador=estados[estado];
    const contenido=<><View style={estilos.metadatos}><Ionicons accessible accessibilityLabel={indicador.etiqueta} name={indicador.icono} size={22} color={indicador.color}/><Text style={[aspecto.estilosGlobales.etiqueta,compartidos.textoFlexible]}>{titulo}</Text>{movimientoId||accion?<Ionicons name="chevron-forward" size={20} color={atencion?aspecto.tema.foco:aspecto.tema.textoSecundario}/>:null}</View><Text style={estilos.detalle}>{new Date(fecha).toLocaleString('es-AR')}</Text>{descripcion?<Text style={estilos.detalle}>{descripcion}</Text>:null}</>;
    return movimientoId||accion?<Pressable key={id} accessibilityRole="button" accessibilityLabel={(movimientoId?'Ver movimiento: ':'Gestionar registro: ')+titulo} onPress={movimientoId?()=>social.abrirMovimiento(movimientoId):accion} style={[estilos.registro,atencion&&estilos.registroPendiente]}>{contenido}</Pressable>:<View key={id} style={estilos.registro}>{contenido}</View>;
  };
  return <View style={estilos.historial}>
    <Text accessibilityRole="header" style={aspecto.estilosGlobales.encabezadoSeccion}>Historial de la deuda</Text>
    {error?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
    {deuda.perdonadoNumero>0?registro('perdon',(deuda.tipo==='debo'?'Te perdonaron · ':'Perdonaste · ')+formatearMontoSocial(deuda.perdonadoNumero),deuda.fechaPerdon||deuda.fechaISO,deuda.tipo==='debo'?nombre+' te perdonó este importe. No generó ingresos ni egresos.':'Cerraste este importe sin cobrarlo. No generó ingresos ni egresos.',undefined,undefined,false,'perdonado'):null}
    {pagos.filter(p=>p.clase!=='origen_deuda').map(p=>registro(p.id,(deuda.tipo==='debo'?'Pagaste':'Te pagó')+' · '+formatearMontoSocial(p.monto)+(p.estado==='anulado'?' · Anulado':''),p.fecha,p.descripcion||'',p.movimiento_id||undefined,undefined,false,p.estado==='anulado'?'anulado':'confirmado'))}
    {acuerdo?.estado==='aceptada'?[...acuerdo.pagos].sort((a,b)=>(b.fecha_decision||b.fecha).localeCompare(a.fecha_decision||a.fecha)).map(p=>{
      const operacion=operaciones.find(o=>o.pagoId===p.id&&(o.tipo==='egreso')===acuerdo.esDeudor),movimiento=operacion&&vinculos.find(v=>v.clave===operacion.clave)?.movimiento_id;
      const gestionar=p.estado!=='rechazado'&&(acuerdo.esAcreedor&&p.estado==='informado'||!!operacion&&!movimiento);
      const estado=p.estado==='informado'?(acuerdo.esAcreedor?'Por confirmar. Revisá si recibiste el dinero.':'En espera de '+nombre+'. La deuda sigue pendiente.'):p.estado==='rechazado'?(acuerdo.esDeudor?'Rechazado por '+nombre+'. La deuda no se redujo. Tu movimiento, si existe, se conserva.':'Rechazaste este pago. La deuda no se redujo.'):(acuerdo.esDeudor?'Confirmado por '+nombre+'.':'Cobro confirmado.')+(movimiento?'': ' Elegí dónde registrarlo en tus movimientos.');
      return registro(p.id,'Pago · '+formatearMontoSocial(p.monto),p.fecha_decision||p.fecha,estado,movimiento,gestionar?()=>social.abrirPago(deuda.id,p.id,operacion&&!movimiento?operacion.clave:undefined):undefined,gestionar,p.estado==='informado'?'pendiente':p.estado==='rechazado'?'rechazado':'confirmado');
    }):null}
    {acuerdo?.estado==='aceptada'?operaciones.filter(o=>o.deudaId===acuerdo.id&&!o.pagoId).map(o=>{const movimiento=vinculos.find(v=>v.clave===o.clave)?.movimiento_id;return registro(o.clave,o.descripcion+' · '+formatearMontoSocial(o.monto),o.fecha,movimiento?'Registrado en tus movimientos.':'Elegí dónde registrarlo en tus movimientos.',movimiento,()=>social.abrirPago(deuda.id,undefined,o.clave),!movimiento,movimiento?'registrado':'porRegistrar');}):null}
    {registro('creacion','Deuda registrada · '+deuda.monto,deuda.fechaISO,deuda.movimientoOrigen?'Movimiento de origen vinculado · '+deuda.movimientoOrigen.deposito:'',deuda.movimientoOrigen?.id,undefined,false,'origen')}
    {esDemo&&acuerdo?.esDeudor&&acuerdo.estado==='aceptada'&&acuerdo.pendiente>0?<BotonSocial secundario texto={'Simular respuesta de '+nombre} alPresionar={()=>cambiarSimulando(true)} {...aspecto}/>:null}
    {simulando&&esDemo&&acuerdo?.esDeudor?<Dialogo titulo={'Simular respuesta de '+nombre} descripcion="Solo cambia esta cuenta de prueba; no se envía al servidor." icono="flask-outline" ocupado={ocupado} alCerrar={()=>cambiarSimulando(false)} {...aspecto}>
      {acuerdo.pagos.filter(p=>p.estado==='informado').map(p=><View key={p.id} style={estilos.registro}>
        <Text style={aspecto.estilosGlobales.etiqueta}>Tu pago de {formatearMontoSocial(p.monto)}</Text>
        <View style={compartidos.filaCampos}>
          <View style={compartidos.columnaCampo}><BotonSocial texto={'Aceptar pago de '+formatearMontoSocial(p.monto)} deshabilitado={ocupado} alPresionar={()=>{void responder('confirmado',p.id);}} {...aspecto}/></View>
          <View style={compartidos.columnaCampo}><BotonSocial secundario texto={'Rechazar pago de '+formatearMontoSocial(p.monto)} deshabilitado={ocupado} alPresionar={()=>{void responder('rechazado',p.id);}} {...aspecto}/></View>
        </View>
      </View>)}
      {!acuerdo.pagos.some(p=>p.estado==='informado')?<Text style={aspecto.estilosGlobales.textoSecundario}>Registrá un pago desde tu lado para simular cómo te lo acepta o rechaza.</Text>:null}
      <BotonSocial secundario texto={'Perdonarme '+formatearMontoSocial(acuerdo.pendiente)} deshabilitado={ocupado||acuerdo.pendiente<=0} alPresionar={()=>{void responder('perdonado');}} {...aspecto}/>
      {error?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
    </Dialogo>:null}
  </View>;
}
