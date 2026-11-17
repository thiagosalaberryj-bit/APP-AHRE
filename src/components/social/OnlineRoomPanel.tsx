import {useFinalizacionAccion} from '../../hooks/useActionCompletion';
import {conRespuestaVisual} from '../../utils/pressFeedback';
import {crearEstilosGlobales} from '../../styles/globalStyles';
import { RETROALIMENTACION_PULSACION } from '../../styles/globalStyles';
import PuntosCarga from '../LoadingDots';
import {crearEstilosHistorialSolicitudes} from '../../styles/social/RoomRequestHistoryStyles';
import {iniciarOperacionFinanciera} from '../../social/financialOperation';
import AccionesSolicitud from './RequestDecisionActions';
import {crearEstilosSocialOnline} from '../../styles/social/OnlineSocialStyles';
import { useContext } from 'react';
import { ContextoAvisos } from '../../contexts/ToastContext';
import { useErrorNotificado } from '../../hooks/useErrorNotice';
import {mensajeErrorSocial} from '../../social/socialHelpers';
import {useRef,useState} from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import useVinculos from '../../social/online/useAccountLinks';
import useSalaOnline from '../../social/online/useRoomOnline';
import {useDatosSociales} from '../../social/SocialDataContext';
import {enviarAccionSocial,sincronizarSocialOnline,guardarSolicitudOnline,cambiarPermisoGastos,cambiarPersonasSala,decidirIngresoSala,resolverConflictoSala,simularIngresoDemo,simularRespuestaSalaDemo,simularPermisoSalaDemo} from '../../social/socialService';
import type {AspectoSocial,SalaVista} from '../../social/types';
import {normalizarNombrePersona} from '../../social/socialHelpers';
import AgregarPersonas from './AddRoomPeopleModal';
import ListaPersonas from './PersonSelectionList';
import SelectorSegmentado from '../SegmentedSelector';
import Dialogo from './InvitationDialog';
import Campo from './SocialTextField';
import BotonSocial from './SocialButton';
import AvatarPersona from './PersonAvatar';
import EstadoVacio from './SocialEmptyState';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPersonas from '../../styles/social/RoomPeopleStyles';
import crearEstilosDetalle from '../../styles/social/DebtDetailsStyles';

export default function PersonasOnline({sala,alCrearPersona,personaId,alAbrirPersona,...aspecto}:AspectoSocial&{sala:SalaVista;alCrearPersona:()=>void;personaId?:string;alAbrirPersona?:(id:string)=>void}){
 const finalizacion=useFinalizacionAccion();
 const [botonActivo,cambiarBotonActivo]=useState('');
 const [focoEntrada,cambiarFocoEntrada]=useState<string|null>(null);
 const estilosEntrada=crearEstilosGlobales(aspecto.tema);

  const { mostrarAviso } = useContext(ContextoAvisos);
  const social=useDatosSociales(),{vinculos}=useVinculos(social.usuarioId),detalle=useSalaOnline(sala.id);
  const controles=crearEstilosSocialOnline(aspecto.tema),historial=crearEstilosHistorialSolicitudes(aspecto.tema);
  const estilos={...crearEstilosCompartidos(aspecto.tema),...crearEstilosPersonas(aspecto.tema)},tarjetas=crearEstilosDetalle(aspecto.tema);
  const [seccion,cambiarSeccion]=useState('integrantes'),[busqueda,cambiarBusqueda]=useState(''),[agregando,abrirAgregar]=useState(false);
  const persona=personaId||null;
  const [enviando,cambiarEnviando]=useState<{id:string;accion:'aceptar'|'rechazar'}|null>(null);
  const [erroresAdmision,cambiarErroresAdmision]=useState<Record<string,string>>({});
  const [admision,elegirAdmision]=useState<string|null>(null),[ficha,elegirFicha]=useState(''),[modo,cambiarModo]=useState('agenda');
  const [texto,cambiarTexto]=useState(''),[nombre,cambiarNombre]=useState(''),[apellido,cambiarApellido]=useState(''),[apodo,cambiarApodo]=useState('');
  const [confirmarQuitar,cambiarConfirmarQuitar]=useState(false),[simulando,abrirSimulacion]=useState(false);
  const [ocupado,cambiarOcupado]=useState(false),[error,cambiarError]=useErrorNotificado(''),bloqueo=useRef(false);
  const ejecutar=async(accion:()=>Promise<unknown>)=>{
    if(bloqueo.current)return false;const liberar=iniciarOperacionFinanciera();if(!liberar)return false;bloqueo.current=true;finalizacion.iniciar();cambiarOcupado(true);cambiarError('');
    try{await accion();await sincronizarSocialOnline();await social.recargar();if(!await finalizacion.confirmar())return false;mostrarAviso('Cambios guardados.',{tipo:'exito'});return true;}
    catch(e){cambiarError(mensajeErrorSocial(e,'No se pudo completar.'));return false;}
    finally{liberar();bloqueo.current=false;cambiarOcupado(false);}
  };
  if(!detalle)return <View style={estilos.grupo}><PuntosCarga color={aspecto.tema.foco}/><Text style={aspecto.estilosGlobales.textoSecundario}>Cargando personas de la sala…</Text></View>;
  const abierta=sala.estado==='abierta',admin=sala.administrador;
  const pendientes=detalle.admisiones?.filter(a=>a.estado==='pendiente')||[],ingreso=pendientes.find(a=>a.id===admision);
  const participante=detalle.sala.participantes.find(p=>p.id===persona);
  if(persona&&!participante)return <EstadoVacio icono="person-outline" titulo="Integrante no disponible" descripcion="Volvé a la sala para elegir una persona." {...aspecto}/>;
  if(persona&&admin&&persona===detalle.personaPropiaId)return <EstadoVacio icono="shield-checkmark-outline" titulo="Administrador" descripcion="Administrás esta sala. Las solicitudes se revisan desde los demás integrantes." {...aspecto}/>;
  const solicitudes=detalle.solicitudes.filter(s=>s.personaId===persona&&(admin||persona===detalle.personaPropiaId)).sort((a,b)=>Number(b.estado==='pendiente')-Number(a.estado==='pendiente')||b.fecha.localeCompare(a.fecha));
  const consulta=normalizarNombrePersona(busqueda),personas=detalle.sala.participantes.filter(p=>p.activa&&normalizarNombrePersona(p.nombre).includes(consulta));
  const cuentaIngreso=detalle.admisiones?.find(a=>a.id===admision)?.cuentaId;
  const disponibles=social.personas.filter(p=>{const vinculo=vinculos.find(v=>v.persona_id===p.id&&v.cuenta_id&&['confirmado','relacionado','solicitado'].includes(v.estado));return vinculo?!!cuentaIngreso&&vinculo.cuenta_id===cuentaIngreso:!detalle.identidades?.some(i=>i.personaId===p.id&&i.conCuenta);});
  const admitir=async(recuperar=false)=>{
    if(!ingreso)return;
    const campos:Record<string,string>={};if(modo==='nueva'){if(!nombre.trim())campos.nombre='Completá el nombre.';if(!apellido.trim()&&!ingreso.cuentaId)campos.apellido='Completá el apellido.';if(!apodo.trim()||apodo.trim().length>20)campos.apodo='Completá un apodo de hasta 20 caracteres.';}else if(!ficha)campos.persona='Seleccioná una persona.';cambiarErroresAdmision(campos);if(Object.keys(campos).length)return;
    const ok=await ejecutar(()=>decidirIngresoSala(ingreso.id,'aceptada',modo==='agenda'?ficha:undefined,recuperar,modo==='nueva'?{nombre,apellido,apodo}:undefined));
    if(ok)elegirAdmision(null);
  };
  const decidir=(id:string,accion:'aceptar'|'rechazar',tarea:()=>Promise<unknown>)=>{if(bloqueo.current)return;cambiarEnviando({id,accion});void ejecutar(tarea).finally(()=>cambiarEnviando(null));};
  return <View style={estilos.grupo}>
    {!persona?<>
    {admin&&abierta?<SelectorSegmentado tema={aspecto.tema} opciones={[{id:'integrantes',nombre:'Integrantes'},{id:'ingresos',nombre:'Ingresos',contador:pendientes.length}]} valor={seccion} alSeleccionar={v=>{cambiarSeccion(v);cambiarError('');}} etiqueta="Personas de la sala"/>:null}

    {seccion==='ingresos'&&admin&&abierta?<View style={estilos.grupo}>
      <Text style={aspecto.estilosGlobales.textoSecundario}>Revisá quién quiere entrar. La sala se comparte después de tu aprobación.</Text>
      {pendientes.map(a=><View key={a.id} style={tarjetas.registro}>
        <Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel={'Revisar ingreso de '+a.nombre} disabled={ocupado} onPress={conRespuestaVisual(()=>{const amigo=vinculos.find(v=>v.estado==='confirmado'&&v.cuenta_id===a.cuentaId);elegirAdmision(a.id);elegirFicha(amigo?.persona_id||'');cambiarModo('agenda');cambiarNombre(a.nombre);cambiarApellido(a.apellido||'');cambiarApodo('');cambiarErroresAdmision({});cambiarError('');})} style={[estilos.filaCampos,controles.flexible]}><Ionicons name="person-add-outline" size={24} color={aspecto.tema.foco}/><View style={estilos.textoFlexible}><Text style={aspecto.estilosGlobales.etiqueta}>{a.nombre}</Text><Text style={aspecto.estilosGlobales.textoAyuda}>Espera tu aprobación · {new Date(a.fecha).toLocaleDateString('es-AR')}</Text></View></Pressable>
        <AccionesSolicitud completado={finalizacion.completado} tema={aspecto.tema} etiquetaAceptar={'Aceptar ingreso de '+a.nombre} etiquetaRechazar={'Rechazar ingreso de '+a.nombre} deshabilitado={ocupado} procesando={enviando?.id===a.id?enviando.accion:null} alAceptar={()=>{const amigo=vinculos.find(v=>v.estado==='confirmado'&&v.cuenta_id===a.cuentaId);elegirAdmision(a.id);elegirFicha(amigo?.persona_id||'');cambiarModo('agenda');cambiarNombre(a.nombre);cambiarApellido(a.apellido||'');cambiarApodo('');cambiarErroresAdmision({});cambiarError('');}} alRechazar={()=>decidir(a.id,'rechazar',()=>decidirIngresoSala(a.id,'rechazada'))}/>
      </View>)}
      {!pendientes.length?<Text style={aspecto.estilosGlobales.textoSecundario}>No hay ingresos pendientes.</Text>:null}
    </View>:<>
      <View style={estilos.filaCampos}>
        <View style={[[aspecto.estilosMovimiento.botonDeposito,estilos.busquedaAgenda],estilosEntrada.superficieCampo,focoEntrada==="0"&&estilosEntrada.campoEnfocado]}><Ionicons name="search-outline" size={20} color={focoEntrada==="0"?aspecto.tema.foco:aspecto.tema.textoSecundario}/><TextInput onFocus={()=>cambiarFocoEntrada("0")} onBlur={()=>cambiarFocoEntrada(null)} accessibilityLabel="Buscar personas de la sala" value={busqueda} onChangeText={cambiarBusqueda} placeholder="Nombre de la persona" placeholderTextColor={aspecto.tema.textoSecundario} style={[aspecto.estilosMovimiento.entradaDescripcion,estilos.entradaBusquedaAgenda]}/></View>
        {admin&&abierta?<Pressable android_ripple={RETROALIMENTACION_PULSACION} accessibilityRole="button" accessibilityLabel="Agregar personas a la sala" onPress={conRespuestaVisual(()=>{cambiarError('');abrirAgregar(true);})} style={estilos.agregarPersonaAgenda}><Ionicons name="add" size={24} color={aspecto.tema.botonPrincipalTexto}/></Pressable>:null}
      </View>
      <Text style={aspecto.estilosGlobales.textoSecundario}>{personas.length} integrantes</Text>
      {personas.map(p=>{const propia=p.id===detalle.personaPropiaId,datos=social.obtenerPersona(propia?'vos':p.id),identidad=detalle.identidades?.find(i=>i.personaId===p.id),n=(admin||propia)?detalle.solicitudes.filter(s=>s.personaId===p.id&&s.estado==='pendiente').length:0;
        const administradorPropio=admin&&propia;
        const contenido=<><AvatarPersona persona={datos||{id:p.id,nombre:p.nombre,iniciales:p.nombre.slice(0,2),activa:true}}/>
          <View style={estilos.textoFlexible}><Text numberOfLines={1} style={aspecto.estilosGlobales.etiqueta}>{administradorPropio?'Administrador':propia?'Vos':p.nombre}</Text><Text style={aspecto.estilosGlobales.textoAyuda}>{administradorPropio?'Administrás esta sala':identidad?.conCuenta?'Cuenta vinculada':identidad?.conAcceso?'Invitado':'Sin acceso online'}</Text></View>
          {!administradorPropio?<>{n?<Text style={aspecto.estilosGlobales.etiqueta}>{n}</Text>:null}<Ionicons name="chevron-forward" size={20} color={focoEntrada==="0"?aspecto.tema.foco:aspecto.tema.textoSecundario}/></>:null}</>;
        return administradorPropio?<View key={p.id} style={estilos.personaAgenda}>{contenido}</View>:<Pressable android_ripple={RETROALIMENTACION_PULSACION} key={p.id} accessibilityRole="button" accessibilityLabel={'Solicitudes de '+p.nombre} onPress={conRespuestaVisual(()=>{alAbrirPersona?.(p.id);})} style={estilos.personaAgenda}>{contenido}</Pressable>;
      })}
      {!personas.length?<Text style={aspecto.estilosGlobales.textoAyuda}>No encontramos personas con esos datos.</Text>:null}
    </>}
    </>:null}
    {agregando?<AgregarPersonas {...aspecto} personasSala={sala.participantes} guardando={ocupado} completado={finalizacion.completado} alCerrar={()=>abrirAgregar(false)} alCrear={()=>{abrirAgregar(false);alCrearPersona();}} alAgregar={ids=>{void ejecutar(()=>cambiarPersonasSala(sala.id,[...sala.participantes,...ids])).then(ok=>{if(ok)abrirAgregar(false);});}}/>:null}
    {persona&&participante?<View style={historial.grupo}>
      <View style={historial.resumen}>
        <AvatarPersona persona={social.obtenerPersona(persona===detalle.personaPropiaId?'vos':persona)||{id:persona,nombre:participante.nombre,iniciales:participante.nombre.slice(0,2),activa:true}}/>
        <View style={estilos.textoFlexible}><Text style={aspecto.estilosGlobales.etiqueta}>{persona===detalle.personaPropiaId?'Vos':participante.nombre}</Text><Text style={aspecto.estilosGlobales.textoSecundario}>{detalle.editores?.includes(persona)?'Puede registrar y editar gastos':'Integrante de la sala'}</Text></View>
      </View>
      <View style={historial.encabezado}><Text style={aspecto.estilosGlobales.encabezadoSeccion}>Historial de solicitudes</Text><Text style={aspecto.estilosGlobales.textoAyuda}>{solicitudes.filter(s=>s.estado==='pendiente').length} pendientes</Text></View>
      {solicitudes.map(s=>{
        const gasto=detalle.sala.gastos.find(g=>g.id===s.gasto_id);
        const color=s.estado==='resuelta'?aspecto.tema.exito:s.estado==='rechazada'?aspecto.tema.error:aspecto.tema.textoSecundario;
        return <View key={s.id} style={[aspecto.estilosGlobales.tarjeta,historial.tarjeta]}>
          <View style={historial.encabezado}><View style={historial.estado}><Ionicons name={s.estado==='resuelta'?'checkmark-circle-outline':s.estado==='rechazada'?'close-circle-outline':'time-outline'} color={color} size={20}/><Text style={[aspecto.estilosGlobales.etiqueta,{color}]}>{s.estado==='resuelta'?'Aceptada':s.estado==='rechazada'?'Rechazada':'Pendiente'}</Text></View><Text style={aspecto.estilosGlobales.textoAyuda}>{new Date(s.fecha).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'})}</Text></View>
          <Text style={historial.mensaje}>{s.texto}</Text>
          {gasto?<View style={historial.referencia}><Ionicons name="receipt-outline" size={18} color={aspecto.tema.foco}/><Text style={[aspecto.estilosGlobales.textoSecundario,estilos.textoFlexible]}>{gasto.descripcion}</Text></View>:null}
          <View style={historial.pie}>{s.estado!=='pendiente'&&s.fecha_decision?<Text style={aspecto.estilosGlobales.textoAyuda}>{'Respondida el '+new Date(s.fecha_decision).toLocaleString('es-AR')}</Text>:null}
          {admin&&abierta&&s.estado==='pendiente'?<View style={historial.decisiones}><AccionesSolicitud expandido completado={finalizacion.completado} tema={aspecto.tema} etiquetaAceptar="Aceptar solicitud" etiquetaRechazar="Rechazar solicitud" deshabilitado={ocupado} procesando={enviando?.id===s.id?enviando.accion:null} alAceptar={()=>decidir(s.id,'aceptar',()=>enviarAccionSocial('solicitud:'+s.id,'/solicitudes/'+s.id+'/decidir',{decision:'resuelta'}))} alRechazar={()=>decidir(s.id,'rechazar',()=>enviarAccionSocial('solicitud:'+s.id,'/solicitudes/'+s.id+'/decidir',{decision:'rechazada'}))}/></View>:null}</View>
          {sala.demo&&!admin&&s.estado==='pendiente'?<View style={estilos.grupoCampo}><Text style={aspecto.estilosGlobales.textoAyuda}>Simular respuesta del administrador</Text><View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial texto="Simular aceptación" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-1");return (()=>ejecutar(()=>simularRespuestaSalaDemo(sala.id,s.id,'resuelta')))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-1"} completado={finalizacion.completado&&botonActivo==="boton-1"}/></View><View style={estilos.columnaCampo}><BotonSocial secundario texto="Simular rechazo" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-2");return (()=>ejecutar(()=>simularRespuestaSalaDemo(sala.id,s.id,'rechazada')))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-2"} completado={finalizacion.completado&&botonActivo==="boton-2"}/></View></View></View>:null}
        </View>;
      })}
      {!solicitudes.length?<View style={[aspecto.estilosGlobales.tarjeta,historial.tarjeta]}><View style={historial.estado}><Ionicons name="mail-open-outline" size={24} color={aspecto.tema.foco}/><Text style={aspecto.estilosGlobales.etiqueta}>Sin solicitudes</Text></View></View>:null}
      {admin&&abierta?<View style={[aspecto.estilosGlobales.tarjeta,historial.tarjeta]}><Text style={aspecto.estilosGlobales.encabezadoSeccion}>Permisos del integrante</Text><View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial secundario texto={detalle.editores?.includes(persona)?'Quitar permiso':'Permitir editar'} deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-3");return (()=>ejecutar(()=>cambiarPermisoGastos(sala.id,persona,!detalle.editores?.includes(persona))))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-3"} completado={finalizacion.completado&&botonActivo==="boton-3"}/></View><View style={estilos.columnaCampo}><BotonSocial peligro texto="Quitar" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-4");return (()=>cambiarConfirmarQuitar(true))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-4"} completado={finalizacion.completado&&botonActivo==="boton-4"}/></View></View></View>:null}
      {!admin&&abierta&&persona===detalle.personaPropiaId?<View style={[aspecto.estilosGlobales.tarjeta,historial.tarjeta]}><Text style={aspecto.estilosGlobales.encabezadoSeccion}>Nueva solicitud</Text><Text style={aspecto.estilosGlobales.textoSecundario}>Contale al administrador qué necesitás cambiar.</Text><Campo etiqueta="Solicitud de cambio" ejemplo="Describí el cambio que necesitás" valor={texto} alCambiar={cambiarTexto} limite={500} multilinea editable={!ocupado} {...aspecto}/><BotonSocial texto="Enviar solicitud" deshabilitado={ocupado||!texto.trim()} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-5");return (()=>ejecutar(async()=>{await guardarSolicitudOnline(sala.id,texto);cambiarTexto('');}))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-5"} completado={finalizacion.completado&&botonActivo==="boton-5"}/></View>:null}
    </View>:null}
    {ingreso?<Dialogo {...aspecto} titulo={ingreso.nombre} descripcion="Revisar solicitud de ingreso" icono="person-add-outline" ocupado={ocupado} alCerrar={()=>elegirAdmision(null)}>
      <SelectorSegmentado tema={aspecto.tema} opciones={[{id:'nueva',nombre:'Nueva persona'},{id:'agenda',nombre:'Seleccionar persona'}]} valor={modo} alSeleccionar={cambiarModo} etiqueta="Identidad del invitado"/>
      {erroresAdmision.persona?<Text style={aspecto.estilosGlobales.textoError}>{erroresAdmision.persona}</Text>:null}
      {modo==='agenda'?<ListaPersonas personas={disponibles} elegida={ficha} alElegir={elegirFicha} ocupado={ocupado} {...aspecto}/>:<><Campo error={erroresAdmision.nombre} etiqueta="Nombre" valor={nombre} alCambiar={cambiarNombre} limite={80} {...aspecto}/><Campo error={erroresAdmision.apellido} etiqueta="Apellido" valor={apellido} alCambiar={cambiarApellido} limite={80} {...aspecto}/><Campo error={erroresAdmision.apodo} etiqueta="Apodo" valor={apodo} alCambiar={cambiarApodo} limite={20} {...aspecto}/></>}
      <Text style={aspecto.estilosGlobales.textoAyuda}>Confirmá quién es antes de admitirlo. Las fichas con una cuenta vinculada no se pueden asignar a otro invitado.</Text>

      <View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial texto="Admitir"  deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-6");return (()=>admitir())();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-6"} completado={finalizacion.completado&&botonActivo==="boton-6"}/></View><View style={estilos.columnaCampo}><BotonSocial secundario texto="Rechazar ingreso" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-7");return (()=>ejecutar(()=>decidirIngresoSala(ingreso.id,'rechazada')).then(ok=>{if(ok)elegirAdmision(null);}))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-7"} completado={finalizacion.completado&&botonActivo==="boton-7"}/></View></View>
      {error.includes('ya tiene acceso')&&ficha?<BotonSocial secundario texto="Reemplazar acceso anterior" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-8");return (()=>admitir(true))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-8"} completado={finalizacion.completado&&botonActivo==="boton-8"}/>:null}
    </Dialogo>:null}
    {confirmarQuitar&&persona&&participante?<Dialogo titulo="Quitar integrante" descripcion={participante.nombre} icono="person-remove-outline" etiquetaCerrar="Cerrar confirmación" ocupado={ocupado} alCerrar={()=>cambiarConfirmarQuitar(false)} {...aspecto} pie={<View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial secundario texto="Cancelar" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-9");return (()=>cambiarConfirmarQuitar(false))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-9"} completado={finalizacion.completado&&botonActivo==="boton-9"}/></View><View style={estilos.columnaCampo}><BotonSocial peligro texto="Quitar de la sala" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-10");return (()=>{return ejecutar(()=>cambiarPersonasSala(sala.id,sala.participantes.filter(id=>id!==persona))).then(ok=>{if(ok){cambiarConfirmarQuitar(false);social.volver();}});})();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-10"} completado={finalizacion.completado&&botonActivo==="boton-10"}/></View></View>}>
      <Text style={aspecto.estilosGlobales.texto}>Perderá el acceso a la sala. Para volver a ingresar necesitará tu aprobación.</Text>
      <View style={historial.avisoQuitar}><Ionicons name="information-circle-outline" size={20} color={aspecto.tema.error}/><Text style={[aspecto.estilosGlobales.textoSecundario,estilos.textoFlexible]}>Sus gastos y obligaciones se conservan. Los pendientes deben revisarse antes de cerrar la sala.</Text></View>
      {detalle.sala.gastos.some(g=>g.estado==='vigente'&&(g.autorId===persona||g.pagadorId===persona||g.partes.some(p=>p.personaId===persona)))?<View style={estilos.grupoCampo}><Text style={aspecto.estilosGlobales.etiqueta}>Gastos para revisar</Text>{detalle.sala.gastos.filter(g=>g.estado==='vigente'&&(g.autorId===persona||g.pagadorId===persona||g.partes.some(p=>p.personaId===persona))).map(g=><View key={g.id} style={historial.referencia}><Ionicons name="receipt-outline" size={18} color={aspecto.tema.textoSecundario}/><Text style={[aspecto.estilosGlobales.textoSecundario,estilos.textoFlexible]}>{g.descripcion}</Text></View>)}</View>:null}
    </Dialogo>:null}
    {detalle.pendientes.some(p=>p.error)&&admin?<View style={tarjetas.registro}><Text style={aspecto.estilosGlobales.textoError}>Hay cambios pendientes de revisión.</Text><BotonSocial texto="Reenviar cambios revisados" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-11");return (()=>ejecutar(()=>resolverConflictoSala(sala.id,'reaplicar')))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-11"} completado={finalizacion.completado&&botonActivo==="boton-11"}/><BotonSocial secundario texto="Conservar versión del servidor" deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-12");return (()=>ejecutar(()=>resolverConflictoSala(sala.id,'descartar')))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-12"} completado={finalizacion.completado&&botonActivo==="boton-12"}/></View>:null}
    {sala.demo&&!admin&&abierta?<BotonSocial secundario texto={sala.puedeEditarGastos?'Simular retiro del permiso de gastos':'Simular permiso para editar gastos'} deshabilitado={ocupado} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-13");return (()=>ejecutar(()=>simularPermisoSalaDemo(sala.id,!sala.puedeEditarGastos)))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-13"} completado={finalizacion.completado&&botonActivo==="boton-13"}/>:null}
    {!persona&&sala.demo&&admin&&abierta?<BotonSocial secundario texto="Simular ingreso de un invitado" alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-14");return (()=>{cambiarNombre('Invitado de prueba');abrirSimulacion(true);})();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-14"} completado={finalizacion.completado&&botonActivo==="boton-14"}/>:null}
    {simulando?<Dialogo titulo="Simular ingreso" descripcion="Solo se guarda en esta cuenta de prueba" icono="flask-outline" ocupado={ocupado} alCerrar={()=>abrirSimulacion(false)} {...aspecto}><Campo etiqueta="Nombre del invitado" valor={nombre} alCambiar={cambiarNombre} {...aspecto}/><BotonSocial texto="Enviar solicitud de ingreso demo" deshabilitado={ocupado||!nombre.trim()} alPresionar={()=>{if(bloqueo.current)return; cambiarBotonActivo("boton-15");return (()=>ejecutar(()=>simularIngresoDemo(sala.id,nombre)).then(ok=>{if(ok){abrirSimulacion(false);cambiarSeccion('ingresos');}}))();}} {...aspecto} cargando={ocupado&&botonActivo==="boton-15"} completado={finalizacion.completado&&botonActivo==="boton-15"}/></Dialogo>:null}
  </View>;
}
