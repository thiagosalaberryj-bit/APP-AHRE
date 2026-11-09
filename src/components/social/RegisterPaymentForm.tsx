import {useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import SelectorSegmentado from '../SegmentedSelector';
import crearEstilosRegistroPago from '../../styles/social/RegisterPaymentFormStyles';
import {useDatosSociales} from '../../social/SocialDataContext';
import {registrarPagoDeuda,leerDatosOnline,observarSocialOnline,registrarPagoConSeleccion,confirmarPagoConSeleccion,enviarAccionSocial,incorporarOperacionPersonal,consultarMovimientosOnline,obtenerVistaSincronizacion} from '../../social/socialService';
import type {DeudaOnline,OperacionPersonal} from '../../social/online/types';
import {generarIdentificador} from '../../database/identifiers';
import {centavos,exigir,unidades} from '../../social/socialValidation';
import {montoParaEntrada,nombreCompletoPersona,formatearMontoSocial} from '../../social/socialHelpers';
import AccionesFormulario from './SocialFormActions';
import RegistroNoDisponible from './SocialRecordUnavailable';
import EstadoVacio from './SocialEmptyState';
import TarjetaDeuda from '../DebtCard';
import SelectorDeposito from '../DepositSelector';
import OpcionesSeleccion from './SocialChoiceGroup';
import MontoSocial from './SocialAmountInput';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function FormularioRegistrarPago({parametros,...aspecto}:import('../../social/types').AspectoSocial&{parametros:import('../../social/types').ParametrosSociales}){
  const social=useDatosSociales(),deuda=social.deudas.find(d=>d.id===parametros.deudaId),estilos=crearEstilosCompartidos(aspecto.tema);
  const [monto,cambiarMonto]=useState(deuda?montoParaEntrada(deuda.pendienteNumero):''),[modalidad,cambiarModalidad]=useState('todo'),[deposito,cambiarDeposito]=useState<string|null>(null),[enlace,cambiarEnlace]=useState('deposito'),[movimiento,cambiarMovimiento]=useState(''),[acuerdo,cambiarAcuerdo]=useState<DeudaOnline|null>(null),[operaciones,cambiarOperaciones]=useState<OperacionPersonal[]>([]),[compatibles,cambiarCompatibles]=useState<Awaited<ReturnType<typeof consultarMovimientosOnline>>>([]),[error,cambiarError]=useState('');
  const [cargando,cambiarCargando]=useState(!!deuda?.acuerdoOnlineId),[procesando,cambiarProcesando]=useState(false);
  const estilosPago=crearEstilosRegistroPago(aspecto.tema);
  const enviando=useRef(false);
  const clave=useRef(generarIdentificador()),solicitud=useRef<import('../../social/types').DatosPago|null>(null);
  useEffect(()=>{let activo=true;const cargar=async()=>{try{const [d,o]=await Promise.all([leerDatosOnline<DeudaOnline[]>(social.usuarioId,'deudas',[]),leerDatosOnline<OperacionPersonal[]>(social.usuarioId,'operaciones',[])]);if(activo){const actual=d.find(d=>d.id===deuda?.acuerdoOnlineId)||null;cambiarAcuerdo(actual);cambiarOperaciones(o);cambiarCargando(false);}}catch{if(activo){cambiarError('No se pudo cargar el pago.');cambiarCargando(false);}}};void cargar();const dejar=observarSocialOnline(()=>{void cargar();});return()=>{activo=false;dejar();};},[social.usuarioId,deuda?.acuerdoOnlineId]);
  const operacion=operaciones.find(o=>o.clave===parametros.operacionClave);
  const pago=parametros.pagoId?acuerdo?.pagos.find(p=>p.id===parametros.pagoId&&(p.estado==='informado'||enviando.current)):undefined;
  const pagoReferido=acuerdo?.pagos.find(p=>p.id===(parametros.pagoId||operacion?.pagoId));
  const esPago=deuda?.tipo==='debo',online=!!deuda?.acuerdoOnlineId,importe=operacion?.monto||(!esPago&&pago?pago.monto:(()=>{try{return centavos(monto)/100;}catch{return 0;}})());
  const tipo=operacion?.tipo||(esPago?'egreso':'ingreso');
  useEffect(()=>{let activo=true;cambiarMovimiento('');cambiarCompatibles([]);if(online&&enlace==='existente'&&Number.isFinite(importe)&&importe>0){void consultarMovimientosOnline({clave:'seleccion',tipo,monto:importe,categoria:tipo==='ingreso'?'devoluciones':'deudas',descripcion:'Pago',fecha:new Date().toISOString(),salaId:null}).then(m=>{if(activo)cambiarCompatibles(m);}).catch(()=>{if(activo)cambiarError('No se pudieron consultar los movimientos.');});}return()=>{activo=false;};},[online,enlace,importe,tipo]);
  if(!deuda)return <RegistroNoDisponible {...aspecto}/>;

  if(online&&deuda.estadoOnline!=='aceptada')return <RegistroNoDisponible {...aspecto}/>;
  const sinConexion=online&&!deuda.id.startsWith('demo-social:')&&['offline','sesion','revocado','local'].includes(obtenerVistaSincronizacion().estado);
  const confirmando=online&&!esPago&&!!pago&&!operacion;
  const nombre=nombreCompletoPersona(social.obtenerPersona(deuda.personaId));
  if(online&&cargando)return <View style={estilosPago.cargando}><ActivityIndicator color={aspecto.tema.foco}/><Text style={aspecto.estilosGlobales.textoSecundario}>Cargando información del pago…</Text></View>;
  if(online&&pagoReferido?.estado==='rechazado'&&!enviando.current)return <EstadoVacio icono="close-circle-outline" titulo="Este pago fue rechazado" descripcion="La deuda no se redujo. Si ya registraste un movimiento, se conserva en tu historial. No tenés que elegir otro depósito." {...aspecto}/>;
  if(deuda.saldada&&!parametros.operacionClave&&!enviando.current)return <EstadoVacio icono="checkmark-circle-outline" titulo="Esta deuda ya está saldada" descripcion="No quedan importes pendientes." {...aspecto}/>;
  if(online&&parametros.pagoId&&!operacion&&!enviando.current&&(!pago||esPago))return <EstadoVacio icono="time-outline" titulo={esPago?'Espera confirmación':'Este pago ya fue resuelto'} descripcion="Volvé al historial para consultar el estado actual del pago." {...aspecto}/>;
  const seleccion=enlace==='existente'?{movimientoId:movimiento}:{depositoId:deposito!};
  return <>
    <View style={estilos.grupoCampo}><Text style={aspecto.estilosGlobales.encabezadoSeccion}>{operacion?'Asociar movimiento':online?(confirmando?'Confirmar pago recibido':esPago?'Informar mi pago':'Registrar nuevo pago recibido'):esPago?'Registrar mi pago':'Registrar pago recibido'}</Text><TarjetaDeuda deuda={deuda} nombrePersona={nombreCompletoPersona(social.obtenerPersona(deuda.personaId))} soloLectura {...aspecto}/></View>
    {online?<View style={estilosPago.grupoEstado}><View style={estilosPago.estado}><Ionicons name={operacion?'link-outline':confirmando?'checkmark-circle-outline':esPago?'time-outline':'add-circle-outline'} size={16} color={aspecto.tema.foco}/><Text style={estilosPago.textoEstado}>{operacion?'Registro en tu depósito':confirmando?'Dinero por confirmar':esPago?'Pago que vas a enviar':'Cobro que recibiste'}</Text></View><Text style={aspecto.estilosGlobales.textoSecundario}>{operacion?(pagoReferido?.estado==='informado'?'La otra persona todavía debe confirmar. Aquí solo guardás tu egreso.':'El pago ya se confirmó. Elegí dónde registrar el dinero en tu cuenta.'):confirmando?nombre+' informó '+formatearMontoSocial(pago!.monto)+' · '+new Date(pago!.fecha).toLocaleDateString('es-AR')+'. Confirmá si lo recibiste.':esPago?'La otra persona debe confirmar la recepción.':'Registrás dinero que ya recibiste. Se confirma al guardar.'}</Text></View>:null}
    {operacion?<Text style={aspecto.estilosGlobales.etiqueta}>{operacion.descripcion} · {formatearMontoSocial(operacion.monto)}</Text>:online&&!esPago&&pago?<Text style={aspecto.estilosGlobales.etiqueta}>Importe informado: {formatearMontoSocial(pago.monto)}</Text>:<>
      <OpcionesSeleccion enLinea opciones={[{id:'todo',nombre:'Saldar todo'},{id:'otro',nombre:'Otro importe'}]} elegida={modalidad} alElegir={v=>{cambiarModalidad(v);cambiarMonto(v==='todo'?montoParaEntrada(deuda.pendienteNumero):'');}} {...aspecto}/>
      <MontoSocial etiqueta={esPago?'Monto que pagaste':'Monto recibido'} valor={monto} alCambiar={v=>{cambiarMonto(v);cambiarModalidad(v===montoParaEntrada(deuda.pendienteNumero)?'todo':'otro');}} {...aspecto}/>
    </>}
    {online?<View style={estilos.grupoCampo}><Text style={aspecto.estilosGlobales.etiqueta}>Cómo registrarlo en tus movimientos</Text><SelectorSegmentado tema={aspecto.tema} opciones={[{id:'deposito',nombre:'Crear movimiento'},{id:'existente',nombre:'Adjuntar movimiento'}]} valor={enlace} alSeleccionar={cambiarEnlace} etiqueta="Origen del movimiento"/><Text style={aspecto.estilosGlobales.textoAyuda}>{enlace==='existente'?'Elegí uno del mismo importe y dirección. Se vincula sin volver a modificar tu saldo.':tipo==='ingreso'?'Se creará un ingreso en el depósito que elijas.':'Se creará un egreso en el depósito que elijas.'}</Text>{enlace==='deposito'?<SelectorDeposito depositos={social.depositos} seleccionadoId={deposito} alSeleccionar={cambiarDeposito} {...aspecto}/>:<><OpcionesSeleccion opciones={compatibles.map(m=>({id:m.id,nombre:m.descripcion+' · '+m.deposito}))} elegida={movimiento} alElegir={cambiarMovimiento} {...aspecto}/>{!compatibles.length?<Text style={aspecto.estilosGlobales.textoAyuda}>No hay movimientos disponibles con ese importe y dirección.</Text>:null}</>}</View>:null}
    {error?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
    {sinConexion?<Text style={aspecto.estilosGlobales.textoAyuda}>Necesitás conexión para registrar este pago online.</Text>:null}
    <View style={estilos.filaCampos}><View style={estilos.columnaCampo}><AccionesFormulario texto={operacion?'Asociar a mis movimientos':online?(confirmando?'Confirmar':esPago?'Informar pago realizado':'Registrar pago nuevo'):esPago?'Registrar pago realizado':'Registrar pago recibido'} deshabilitado={procesando||(online?sinConexion||!acuerdo||(enlace==='deposito'?!deposito:!movimiento)||!importe:!monto.trim())}
      preparar={()=>{const valor=operacion?unidades(operacion.monto):online&&!esPago&&pago?unidades(pago.monto):centavos(monto);exigir(!!operacion||valor<=unidades(deuda.pendienteNumero),'El pago no puede superar el pendiente.');solicitud.current={deudaId:deuda.id,monto,claveOperacion:clave.current};return {operaciones:online?[]:[{clave:'pago',tipo:esPago?'egreso':'ingreso',monto:valor/100,descripcion:deuda.descripcion}]};}}
      alGuardar={async(datos)=>{if(!online)return registrarPagoDeuda(solicitud.current!,datos.pago||undefined);enviando.current=true;cambiarProcesando(true);try{if(operacion)await incorporarOperacionPersonal(operacion,seleccion);else if(!esPago&&pago)await confirmarPagoConSeleccion(pago.id,seleccion);else await registrarPagoConSeleccion(deuda.acuerdoOnlineId!,centavos(monto)/100,seleccion,!esPago);return {saldada:false};}catch(e){enviando.current=false;cambiarProcesando(false);throw e;}}}
      mensajeExito={resultado=>online?(esPago&&!operacion?'Pago informado. Espera confirmación.':'Registro guardado.'):resultado.saldada?'Deuda saldada.':'Pago registrado.'} recargarAntesDeCerrar={online} alExito={resultado=>{enviando.current=false;cambiarProcesando(false);if(resultado.saldada)social.irInicioSocial();else social.volver();}} {...aspecto}/></View>
    {online&&!esPago&&pago&&!operacion?<View style={estilos.columnaCampo}><AccionesFormulario texto="Rechazar" peligro deshabilitado={sinConexion||procesando} alGuardar={async()=>{enviando.current=true;cambiarProcesando(true);try{return await enviarAccionSocial('pago-decision:'+pago.id,'/pagos/'+pago.id+'/decidir',{decision:'rechazado'});}catch(e){enviando.current=false;cambiarProcesando(false);throw e;}}} recargarAntesDeCerrar alExito={()=>{enviando.current=false;cambiarProcesando(false);social.volver();}} {...aspecto}/></View>:null}</View>
  </>;
}
