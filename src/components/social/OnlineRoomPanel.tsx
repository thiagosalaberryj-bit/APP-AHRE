import {mensajeErrorSocial} from '../../social/socialHelpers';
import {useRef,useState} from 'react';
import {ActivityIndicator,Pressable,Text,TextInput,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import useVinculos from '../../social/online/useAccountLinks';
import useSalaOnline from '../../social/online/useRoomOnline';
import {useDatosSociales} from '../../social/SocialDataContext';
import {enviarAccionSocial,sincronizarSocialOnline,guardarSolicitudOnline,cambiarPermisoGastos,cambiarPersonasSala,decidirIngresoSala,guardarPersona,resolverConflictoSala,simularIngresoDemo,simularRespuestaSalaDemo,simularPermisoSalaDemo} from '../../social/socialService';
import type {AspectoSocial,SalaVista} from '../../social/types';
import {normalizarNombrePersona} from '../../social/socialHelpers';
import AgregarPersonas from './AddRoomPeopleModal';
import SelectorPersonas from './PeopleSelector';
import SelectorSegmentado from '../SegmentedSelector';
import Dialogo from './InvitationDialog';
import Confirmacion from './SocialConfirmationModal';
import Campo from './SocialTextField';
import BotonSocial from './SocialButton';
import AvatarPersona from './PersonAvatar';
import EstadoVacio from './SocialEmptyState';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPersonas from '../../styles/social/RoomPeopleStyles';
import crearEstilosDetalle from '../../styles/social/DebtDetailsStyles';

export default function PersonasOnline({sala,alCrearPersona,personaId,alAbrirPersona,...aspecto}:AspectoSocial&{sala:SalaVista;alCrearPersona:()=>void;personaId?:string;alAbrirPersona?:(id:string)=>void}){
  const social=useDatosSociales(),{vinculos}=useVinculos(social.usuarioId),detalle=useSalaOnline(sala.id);
  const estilos={...crearEstilosCompartidos(aspecto.tema),...crearEstilosPersonas(aspecto.tema)},tarjetas=crearEstilosDetalle(aspecto.tema);
  const [seccion,cambiarSeccion]=useState('integrantes'),[busqueda,cambiarBusqueda]=useState(''),[agregando,abrirAgregar]=useState(false);
  const persona=personaId||null;
  const [admision,elegirAdmision]=useState<string|null>(null),[ficha,elegirFicha]=useState(''),[modo,cambiarModo]=useState('agenda');
  const [texto,cambiarTexto]=useState(''),[nombre,cambiarNombre]=useState(''),[apellido,cambiarApellido]=useState(''),[apodo,cambiarApodo]=useState('');
  const [confirmarQuitar,cambiarConfirmarQuitar]=useState(false),[simulando,abrirSimulacion]=useState(false);
  const [ocupado,cambiarOcupado]=useState(false),[error,cambiarError]=useState(''),bloqueo=useRef(false);
  const ejecutar=async(accion:()=>Promise<unknown>)=>{
    if(bloqueo.current)return false;bloqueo.current=true;cambiarOcupado(true);cambiarError('');
    try{await accion();await sincronizarSocialOnline();await social.recargar();return true;}
    catch(e){cambiarError(mensajeErrorSocial(e,'No se pudo completar.'));return false;}
    finally{bloqueo.current=false;cambiarOcupado(false);}
  };
  if(!detalle)return <View style={estilos.grupo}><ActivityIndicator color={aspecto.tema.foco}/><Text style={aspecto.estilosGlobales.textoSecundario}>Cargando personas de la sala…</Text></View>;
  const abierta=sala.estado==='abierta',admin=sala.administrador;
  const pendientes=detalle.admisiones?.filter(a=>a.estado==='pendiente')||[],ingreso=pendientes.find(a=>a.id===admision);
  const participante=detalle.sala.participantes.find(p=>p.id===persona);
  if(persona&&!participante)return <EstadoVacio icono="person-outline" titulo="Integrante no disponible" descripcion="Volvé a la sala para elegir una persona." {...aspecto}/>;
  const solicitudes=detalle.solicitudes.filter(s=>s.personaId===persona&&(admin||persona===detalle.personaPropiaId)).sort((a,b)=>Number(b.estado==='pendiente')-Number(a.estado==='pendiente')||b.fecha.localeCompare(a.fecha));
  const consulta=normalizarNombrePersona(busqueda),personas=detalle.sala.participantes.filter(p=>p.activa&&normalizarNombrePersona(p.nombre).includes(consulta));
  const disponibles=social.personas.filter(p=>p.activa&&!detalle.identidades?.some(i=>i.personaId===p.id&&i.conCuenta)&&!vinculos.some(v=>v.persona_id===p.id&&v.estado==='confirmado'&&v.cuenta_id));
  const admitir=async(recuperar=false)=>{
    if(!ingreso)return;
    const ok=await ejecutar(async()=>{let id=ficha;if(modo==='nueva'){const p=await guardarPersona({nombre,apellido,apodo});if(!p)throw Error('No se pudo crear la ficha.');id=p.id;elegirFicha(id);cambiarModo('agenda');}await decidirIngresoSala(ingreso.id,'aceptada',id,recuperar);});
    if(ok)elegirAdmision(null);
  };
  const resolver=(id:string,decision:'resuelta'|'rechazada')=>ejecutar(()=>enviarAccionSocial('solicitud:'+id,'/solicitudes/'+id+'/decidir',{decision}));
  return <View style={estilos.grupo}>
    {!persona?<>
    {admin&&abierta?<SelectorSegmentado tema={aspecto.tema} opciones={[{id:'integrantes',nombre:'Integrantes'},{id:'ingresos',nombre:'Ingresos',contador:pendientes.length}]} valor={seccion} alSeleccionar={v=>{cambiarSeccion(v);cambiarError('');}} etiqueta="Personas de la sala"/>:null}
    {error&&!persona&&!admision&&!agregando&&!simulando?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
    {seccion==='ingresos'&&admin&&abierta?<View style={estilos.grupo}>
      <Text style={aspecto.estilosGlobales.textoSecundario}>Revisá quién quiere entrar. La sala se comparte después de tu aprobación.</Text>
      {pendientes.map(a=><Pressable key={a.id} accessibilityRole="button" accessibilityLabel={'Revisar ingreso de '+a.nombre} onPress={()=>{elegirAdmision(a.id);elegirFicha('');cambiarModo('agenda');cambiarNombre(a.nombre);cambiarApellido('');cambiarApodo('');cambiarError('');}} style={[tarjetas.registro,estilos.filaCampos]}>
        <Ionicons name="person-add-outline" size={24} color={aspecto.tema.foco}/><View style={estilos.textoFlexible}><Text style={aspecto.estilosGlobales.etiqueta}>{a.nombre}</Text><Text style={aspecto.estilosGlobales.textoAyuda}>Espera tu aprobación · {new Date(a.fecha).toLocaleDateString('es-AR')}</Text></View><Ionicons name="chevron-forward" size={20} color={aspecto.tema.textoSecundario}/>
      </Pressable>)}
      {!pendientes.length?<Text style={aspecto.estilosGlobales.textoSecundario}>No hay ingresos pendientes.</Text>:null}
    </View>:<>
      <View style={estilos.filaCampos}>
        <View style={[aspecto.estilosMovimiento.botonDeposito,estilos.busquedaAgenda]}><Ionicons name="search-outline" size={20} color={aspecto.tema.textoSecundario}/><TextInput accessibilityLabel="Buscar personas de la sala" value={busqueda} onChangeText={cambiarBusqueda} placeholder="Nombre de la persona" placeholderTextColor={aspecto.tema.textoSecundario} style={[aspecto.estilosMovimiento.entradaDescripcion,estilos.entradaBusquedaAgenda]}/></View>
        {admin&&abierta?<Pressable accessibilityRole="button" accessibilityLabel="Agregar personas a la sala" onPress={()=>{cambiarError('');abrirAgregar(true);}} style={estilos.agregarPersonaAgenda}><Ionicons name="add" size={24} color={aspecto.tema.botonPrincipalTexto}/></Pressable>:null}
      </View>
      <Text style={aspecto.estilosGlobales.textoSecundario}>{personas.length} integrantes</Text>
      {personas.map(p=>{const propia=p.id===detalle.personaPropiaId,datos=social.obtenerPersona(propia?'vos':p.id),identidad=detalle.identidades?.find(i=>i.personaId===p.id),n=(admin||propia)?detalle.solicitudes.filter(s=>s.personaId===p.id&&s.estado==='pendiente').length:0;
        return <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={'Solicitudes de '+p.nombre} onPress={()=>{alAbrirPersona?.(p.id);}} style={estilos.personaAgenda}>
          <AvatarPersona persona={datos||{id:p.id,nombre:p.nombre,iniciales:p.nombre.slice(0,2),activa:true}}/>
          <View style={estilos.textoFlexible}><Text numberOfLines={1} style={aspecto.estilosGlobales.etiqueta}>{propia?'Vos':p.nombre}</Text><Text style={aspecto.estilosGlobales.textoAyuda}>{identidad?.conCuenta?'Cuenta vinculada':identidad?.conAcceso?'Invitado':'Sin acceso online'}</Text></View>
          {n?<Text style={aspecto.estilosGlobales.etiqueta}>{n}</Text>:null}<Ionicons name="chevron-forward" size={20} color={aspecto.tema.textoSecundario}/>
        </Pressable>;
      })}
      {!personas.length?<Text style={aspecto.estilosGlobales.textoAyuda}>No encontramos personas con esos datos.</Text>:null}
    </>}
    </>:null}
    {agregando?<AgregarPersonas {...aspecto} personasSala={sala.participantes} guardando={ocupado} error={error} alCerrar={()=>abrirAgregar(false)} alCrear={()=>{abrirAgregar(false);alCrearPersona();}} alAgregar={ids=>{void ejecutar(()=>cambiarPersonasSala(sala.id,[...sala.participantes,...ids])).then(ok=>{if(ok)abrirAgregar(false);});}}/>:null}
    {persona&&participante?<View style={estilos.grupo}><Text style={aspecto.estilosGlobales.encabezadoSeccion}>Historial de solicitudes</Text><Text style={aspecto.estilosGlobales.etiqueta}>{participante.nombre}</Text>
      {solicitudes.map(s=><View key={s.id} style={tarjetas.registro}><View style={estilos.filaCampos}><Ionicons name={s.estado==='resuelta'?'checkmark-circle-outline':s.estado==='rechazada'?'close-circle-outline':'time-outline'} color={s.estado==='resuelta'?aspecto.tema.exito:s.estado==='rechazada'?aspecto.tema.error:aspecto.tema.textoSecundario} size={22}/><Text style={[aspecto.estilosGlobales.etiqueta,estilos.textoFlexible]}>{s.texto}</Text></View><Text style={aspecto.estilosGlobales.textoAyuda}>{detalle.sala.gastos.find(g=>g.id===s.gasto_id)?.descripcion} · {new Date(s.fecha).toLocaleString('es-AR')} · {s.estado==='resuelta'?'Aceptada':s.estado==='rechazada'?'Rechazada':'Espera respuesta'}</Text>
        {admin&&abierta&&s.estado==='pendiente'?<View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial texto="Aceptar" deshabilitado={ocupado} alPresionar={()=>{void resolver(s.id,'resuelta');}} {...aspecto}/></View><View style={estilos.columnaCampo}><BotonSocial secundario texto="Rechazar" deshabilitado={ocupado} alPresionar={()=>{void resolver(s.id,'rechazada');}} {...aspecto}/></View></View>:null}
        {sala.demo&&!admin&&s.estado==='pendiente'?<View style={estilos.grupoCampo}><Text style={aspecto.estilosGlobales.textoAyuda}>Simular respuesta del administrador</Text><View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial texto="Simular aceptación" deshabilitado={ocupado} alPresionar={()=>{void ejecutar(()=>simularRespuestaSalaDemo(sala.id,s.id,'resuelta'));}} {...aspecto}/></View><View style={estilos.columnaCampo}><BotonSocial secundario texto="Simular rechazo" deshabilitado={ocupado} alPresionar={()=>{void ejecutar(()=>simularRespuestaSalaDemo(sala.id,s.id,'rechazada'));}} {...aspecto}/></View></View></View>:null}
      </View>)}
      {!solicitudes.length?<Text style={aspecto.estilosGlobales.textoSecundario}>Sin solicitudes.</Text>:null}
      {admin&&abierta&&persona!==detalle.personaPropiaId?<View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial secundario texto={detalle.editores?.includes(persona)?'Quitar permiso':'Permitir editar'} deshabilitado={ocupado} alPresionar={()=>{void ejecutar(()=>cambiarPermisoGastos(sala.id,persona,!detalle.editores?.includes(persona)));}} {...aspecto}/></View><View style={estilos.columnaCampo}><BotonSocial secundario texto="Quitar" deshabilitado={ocupado} alPresionar={()=>cambiarConfirmarQuitar(true)} {...aspecto}/></View></View>:null}
      {!admin&&abierta&&persona===detalle.personaPropiaId?<><Campo etiqueta="Solicitud de cambio" valor={texto} alCambiar={cambiarTexto} limite={500} multilinea {...aspecto}/><BotonSocial texto="Enviar solicitud" deshabilitado={ocupado||!texto.trim()} alPresionar={()=>{void ejecutar(async()=>{await guardarSolicitudOnline(sala.id,texto);cambiarTexto('');});}} {...aspecto}/></>:null}
      {error?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
    </View>:null}
    {ingreso?<Dialogo {...aspecto} titulo={ingreso.nombre} descripcion="Revisar solicitud de ingreso" icono="person-add-outline" ocupado={ocupado} alCerrar={()=>elegirAdmision(null)}>
      <SelectorSegmentado tema={aspecto.tema} opciones={[{id:'agenda',nombre:'Ya está en mi agenda'},{id:'nueva',nombre:'Crear persona'}]} valor={modo} alSeleccionar={cambiarModo} etiqueta="Identidad del invitado"/>
      {modo==='agenda'?<SelectorPersonas etiqueta="Persona de mi agenda" personas={disponibles} seleccionadas={ficha?[ficha]:[]} alCambiar={ids=>elegirFicha(ids[0]||'')} {...aspecto}/>:<><Campo etiqueta="Nombre" valor={nombre} alCambiar={cambiarNombre} limite={80} {...aspecto}/><Campo etiqueta="Apellido" valor={apellido} alCambiar={cambiarApellido} limite={80} {...aspecto}/><Campo etiqueta="Apodo" valor={apodo} alCambiar={cambiarApodo} limite={20} {...aspecto}/></>}
      <Text style={aspecto.estilosGlobales.textoAyuda}>Confirmá quién es antes de admitirlo. Las fichas con una cuenta vinculada no se pueden asignar a otro invitado.</Text>
      {error?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}
      <View style={estilos.filaCampos}><View style={estilos.columnaCampo}><BotonSocial texto="Admitir" deshabilitado={ocupado||(modo==='agenda'?!ficha:!nombre.trim()||!apellido.trim()||!apodo.trim())} alPresionar={()=>{void admitir();}} {...aspecto}/></View><View style={estilos.columnaCampo}><BotonSocial secundario texto="Rechazar ingreso" deshabilitado={ocupado} alPresionar={()=>{void ejecutar(()=>decidirIngresoSala(ingreso.id,'rechazada')).then(ok=>{if(ok)elegirAdmision(null);});}} {...aspecto}/></View></View>
      {error.includes('ya tiene acceso')&&ficha?<BotonSocial secundario texto="Reemplazar acceso anterior" deshabilitado={ocupado} alPresionar={()=>{void admitir(true);}} {...aspecto}/>:null}
    </Dialogo>:null}
    {confirmarQuitar&&persona?<Confirmacion titulo="Quitar de la sala" descripcion="Se conservarán sus gastos, pagos y obligaciones." textoConfirmar="Quitar" peligro alCerrar={()=>cambiarConfirmarQuitar(false)} alConfirmar={()=>{cambiarConfirmarQuitar(false);void ejecutar(()=>cambiarPersonasSala(sala.id,sala.participantes.filter(id=>id!==persona))).then(ok=>{if(ok)social.volver();});}} {...aspecto}/>:null}
    {detalle.pendientes.some(p=>p.error)&&admin?<View style={tarjetas.registro}><Text style={aspecto.estilosGlobales.textoError}>Hay cambios pendientes de revisión.</Text><BotonSocial texto="Reenviar cambios revisados" deshabilitado={ocupado} alPresionar={()=>{void ejecutar(()=>resolverConflictoSala(sala.id,'reaplicar'));}} {...aspecto}/><BotonSocial secundario texto="Conservar versión del servidor" deshabilitado={ocupado} alPresionar={()=>{void ejecutar(()=>resolverConflictoSala(sala.id,'descartar'));}} {...aspecto}/></View>:null}
    {sala.demo&&!admin&&abierta?<BotonSocial secundario texto={sala.puedeEditarGastos?'Simular retiro del permiso de gastos':'Simular permiso para editar gastos'} deshabilitado={ocupado} alPresionar={()=>{void ejecutar(()=>simularPermisoSalaDemo(sala.id,!sala.puedeEditarGastos));}} {...aspecto}/>:null}
    {!persona&&sala.demo&&admin&&abierta?<BotonSocial secundario texto="Simular ingreso de un invitado" alPresionar={()=>{cambiarNombre('Invitado de prueba');abrirSimulacion(true);}} {...aspecto}/>:null}
    {simulando?<Dialogo titulo="Simular ingreso" descripcion="Solo se guarda en esta cuenta de prueba" icono="flask-outline" ocupado={ocupado} alCerrar={()=>abrirSimulacion(false)} {...aspecto}><Campo etiqueta="Nombre del invitado" valor={nombre} alCambiar={cambiarNombre} {...aspecto}/>{error?<Text style={aspecto.estilosGlobales.textoError}>{error}</Text>:null}<BotonSocial texto="Enviar solicitud de ingreso demo" deshabilitado={ocupado||!nombre.trim()} alPresionar={()=>{void ejecutar(()=>simularIngresoDemo(sala.id,nombre)).then(ok=>{if(ok){abrirSimulacion(false);cambiarSeccion('ingresos');}});}} {...aspecto}/></Dialogo>:null}
  </View>;
}
