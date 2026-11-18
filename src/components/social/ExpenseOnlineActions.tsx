import {useAccionConfirmada} from '../../hooks/useConfirmedAction';
import {conRespuestaVisual} from '../../utils/pressFeedback';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import AccionesSolicitud from './RequestDecisionActions';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';
import { useContext } from 'react';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useErrorNotificado } from '../../hooks/useErrorNotice';
import crearEstilosGasto from '../../styles/social/ExpenseDetailsStyles';
import {mensajeErrorSocial} from '../../social/socialHelpers';
import {useEffect,useRef,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import type {AspectoSocial,GastoVista,SalaVista} from '../../social/types';
import type {OperacionPersonal} from '../../social/online/types';
import useSalaOnline from '../../social/online/useRoomOnline';
import {useDatosSociales} from '../../social/SocialDataContext';
import {marcarPartePagada,informarPartePagada,enviarAccionSocial,sincronizarSocialOnline,leerDatosOnline,observarSocialOnline,consultarMovimientosSociales} from '../../social/socialService';
import BotonSocial from './SocialButton';
import Dialogo from './InvitationDialog';
import Seleccion from './RoomFinanceSelection';
import crearEstilosDetalle from '../../styles/social/DebtDetailsStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function AccionesGastoOnline({sala,gasto,seccion,...aspecto}:AspectoSocial&{sala:SalaVista;gasto:GastoVista;seccion:'partes'|'movimientos'}){
 const respuesta=useAccionConfirmada();
  const { mostrarAviso } = useContext(ContextoAvisos);
  const estilosPago=crearEstilosGasto(aspecto.tema),controles=crearEstilosSocialOnline(aspecto.tema);
  const detalle=useSalaOnline(sala.id,sala.online),social=useDatosSociales(),estilos=crearEstilosDetalle(aspecto.tema),compartidos=crearEstilosCompartidos(aspecto.tema),bloqueo=useRef(false);
  const [enviando,cambiarEnviando]=useState<{id:string;accion:'aceptar'|'rechazar'}|null>(null);
  const [seleccion,abrirSeleccion]=useState<OperacionPersonal|null>(null),[intencion,cambiarIntencion]=useState<'asociar'|'informar'|'marcar'>('asociar'),[operaciones,cambiarOperaciones]=useState<OperacionPersonal[]>([]),[ocupado,cambiarOcupado]=useState(false),[, cambiarError]=useErrorNotificado('');
  useEffect(()=>{let activo=true;const cargar=()=>{void leerDatosOnline<OperacionPersonal[]>(social.usuarioId,'operaciones',[]).then(async o=>{const locales=await consultarMovimientosSociales();if(activo)cambiarOperaciones(o.map(p=>({...p,incorporada:p.incorporada||locales.some(l=>l.clave===p.clave)})));}).catch(()=>{if(activo)cambiarError('No se pudieron cargar tus movimientos.');});};cargar();const dejar=observarSocialOnline(cargar);return()=>{activo=false;dejar();};},[social.usuarioId]);
  if(!sala.online||!detalle)return null;
  const remoto=detalle.sala.gastos.find(g=>g.id===gasto.id);if(!remoto)return null;
  const propia=detalle.personaPropiaId,pedido=detalle.solicitudes.find(s=>s.gasto_id===gasto.id&&s.personaId===propia&&s.tipo==='parte_pagada'&&s.estado==='pendiente'),abierta=sala.estado==='abierta';
  const misFinanzas=abierta?(detalle.misFinanzas||[]).filter(o=>o.gastoId===gasto.id&&(o.clave.startsWith('compra:')||o.tipo==='ingreso'||remoto.pagaron.includes(propia))):[];
  const ejecutar=async(accion:()=>Promise<unknown>)=>{if(bloqueo.current)return;bloqueo.current=true;cambiarOcupado(true);cambiarError('');try{await respuesta.ejecutar(async()=>{await accion();await sincronizarSocialOnline();await social.recargar();},()=>mostrarAviso('Cambios guardados.',{tipo:'exito'}));}catch(e){cambiarError(mensajeErrorSocial(e,'No se pudo guardar.'));}finally{bloqueo.current=false;cambiarOcupado(false);}};
  const elegirPago=(modo:'informar'|'marcar')=>{const opcion=detalle.misFinanzas?.find(o=>o.gastoId===gasto.id&&o.tipo==='egreso');if(opcion){cambiarIntencion(modo);abrirSeleccion(opcion);}};
  return <View style={estilos.historial}>

    {seccion==='partes'?<>
      {remoto.partes.map(p=>{const pagada=p.personaId===remoto.pagadorId||remoto.pagaron.includes(p.personaId),editable=abierta&&sala.administrador&&p.personaId!==remoto.pagadorId;
        const parte=gasto.partes.find(v=>v.personaId===(p.personaId===propia?'vos':p.personaId));
        const nombre=social.obtenerPersona(p.personaId===propia?'vos':p.personaId)?.nombre||'Participante';
        return <View key={p.personaId} style={compartidos.grupoCampo}><View style={compartidos.filaCampos}>
          <Ionicons name={pagada?'checkmark-circle-outline':'time-outline'} size={22} color={pagada?aspecto.tema.exito:aspecto.tema.textoSecundario}/>
          <Text numberOfLines={1} style={[aspecto.estilosGlobales.texto,compartidos.textoFlexible]}>{nombre}</Text><Text style={aspecto.estilosGlobales.etiqueta}>{parte?.monto}</Text>
                    {p.personaId===remoto.pagadorId&&sala.administrador?<Ionicons name="lock-closed-outline" size={20} color={aspecto.tema.textoSecundario}/>:editable?<Pressable android_ripple={RETROALIMENTACION_PULSACION} style={estilosPago.controlPago} hitSlop={12} accessibilityRole="checkbox" accessibilityLabel={nombre+' · '+(pagada?'Marcar pendiente':'Marcar que ya pagó')} accessibilityState={{checked:pagada,disabled:ocupado}} disabled={ocupado} onPress={conRespuestaVisual(()=>{if(p.personaId===propia&&!pagada)elegirPago('marcar');else void ejecutar(()=>marcarPartePagada(sala.id,gasto.id,p.personaId,!pagada));})}><Ionicons name={pagada?'checkbox':'square-outline'} size={20} color={aspecto.tema.foco}/></Pressable>:null}

        </View><Text style={aspecto.estilosGlobales.textoAyuda}>{parte?.resumen}</Text></View>;
      })}

    {abierta&&sala.administrador?detalle.solicitudes.filter(s=>s.gasto_id===gasto.id&&s.estado==='pendiente').map(s=><View key={s.id} style={estilos.registro}><View style={controles.flexible}><Text style={aspecto.estilosGlobales.etiqueta}>{social.obtenerPersona(s.personaId||'')?.nombre} · {s.texto}</Text></View><AccionesSolicitud completado={respuesta.completado} tema={aspecto.tema} etiquetaAceptar="Aceptar solicitud" etiquetaRechazar="Rechazar solicitud" deshabilitado={ocupado} procesando={enviando?.id===s.id?enviando.accion:null} alAceptar={()=>{if(bloqueo.current)return;cambiarEnviando({id:s.id,accion:'aceptar'});return ejecutar(()=>enviarAccionSocial('solicitud:'+s.id,'/solicitudes/'+s.id+'/decidir',{decision:'resuelta'})).finally(()=>cambiarEnviando(null));}} alRechazar={()=>{if(bloqueo.current)return;cambiarEnviando({id:s.id,accion:'rechazar'});return ejecutar(()=>enviarAccionSocial('solicitud:'+s.id,'/solicitudes/'+s.id+'/decidir',{decision:'rechazada'})).finally(()=>cambiarEnviando(null));}}/></View>):null}
    </>:null}
    {seccion==='movimientos'?<>
    {abierta&&!sala.administrador&&remoto.pagadorId!==propia&&remoto.partes.some(p=>p.personaId===propia)?<BotonSocial texto={remoto.pagaron.includes(propia)?'Tu parte está pagada':pedido?'Espera aprobación':'Ya pagué mi parte'} deshabilitado={ocupado||!!pedido||remoto.pagaron.includes(propia)} alPresionar={()=>elegirPago('informar')} {...aspecto}/>:null}
    <Text style={aspecto.estilosGlobales.encabezadoSeccion}>Mis movimientos</Text>
      {misFinanzas.map(o=><Pressable android_ripple={RETROALIMENTACION_PULSACION} key={o.clave} accessibilityRole="button" accessibilityLabel={o.descripcion} onPress={conRespuestaVisual(()=>{cambiarIntencion('asociar');abrirSeleccion(o);})} style={[estilos.registro,compartidos.filaCampos]}><Ionicons name="wallet-outline" size={24} color={aspecto.tema.foco}/><View style={compartidos.textoFlexible}><Text style={aspecto.estilosGlobales.etiqueta}>{o.descripcion}</Text><Text style={aspecto.estilosGlobales.textoAyuda}>{o.necesitaRevision?'Revisar selección':o.seleccion?'Al cerrar → '+(social.depositos.find(d=>d.id===o.seleccion?.depositoId)?.nombre||'Movimiento existente'):abierta?'Anotar en mi depósito':'Elegir dónde registrarlo'}</Text></View><Ionicons name="chevron-forward" size={20} color={aspecto.tema.textoSecundario}/></Pressable>)}
      {!misFinanzas.length?<Text style={aspecto.estilosGlobales.textoAyuda}>{abierta?'Si debés tu parte, elegís el depósito cuando informes que pagaste.':'No tenés movimientos pendientes de incorporar.'}</Text>:null}
    </>:null}
    {seleccion?<Dialogo {...aspecto} titulo="Mis movimientos" descripcion={abierta?'Se aplicará al cerrar la sala':'Incorporar operación propia'} icono="wallet-outline" ocupado={ocupado} alCerrar={()=>{if(!bloqueo.current)abrirSeleccion(null);}}><Seleccion {...aspecto} operacion={seleccion} salaId={sala.id} cerrada={!abierta} alCambiarOcupado={valor=>{bloqueo.current=valor;cambiarOcupado(valor);}} alGuardar={async(quitar)=>{if(!quitar){if(intencion==='informar')await informarPartePagada(sala.id,gasto.id);else if(intencion==='marcar')await marcarPartePagada(sala.id,gasto.id,'vos',true);}abrirSeleccion(null);}}/></Dialogo>:null}
  </View>;
}
