import EtiquetaImporte from './AmountLabel';
import {iniciarOperacionFinanciera} from '../social/financialOperation';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {CATEGORIAS_EGRESO,CATEGORIAS_INGRESO} from '../constants/movimientos';
import {consultarRecurrenciasDeposito,actualizarRecurrencia,consultarHistorialRecurrencia,aceptarOcurrenciaRecurrencia} from '../recurrences/recurrenceService';
import {tiempoHastaRecurrencia} from '../recurrences/recurrencePresentation';
import {instanteCalendario,partesCalendario} from '../recurrences/recurrenceCalendar';
import {crearEstilosTarjetaMovimiento} from '../styles/MovementCardStyles';
import {crearEstilosRecurrencias} from '../styles/RecurrencePanelStyles';
import {crearEstilosDetalleMovimiento} from '../styles/MovementDetailScreenStyles';
import {crearEstilosGlobales} from '../styles/globalStyles';
import {crearEstilosEgreso} from '../styles/expenseStyles';
import type {Recurrencia} from '../database/types';
import type {Tema} from '../styles/colors';
import SelectorFecha from './DateSelector';
import SelectorHora from './TimeSelector';
import EntradaMonto from './MoneyInput';

const monto=(valor:number)=>'$ '+valor.toLocaleString('es-AR',{maximumFractionDigits:2});
export default function PanelRecurrencias({depositoId,tema,alCambiar,alCambiarCantidad,filtrar}:{
  depositoId:string;tema:Tema;alCambiar:()=>void;alCambiarCantidad?:(cantidad:number)=>void;filtrar?:(fila:Recurrencia)=>boolean;
}){
  const estilos=crearEstilosGlobales(tema),tarjeta=crearEstilosTarjetaMovimiento(tema),propios=crearEstilosRecurrencias(tema),modal=crearEstilosDetalleMovimiento(tema),estilosMovimiento=crearEstilosEgreso(tema);
  const [filas,establecerFilas]=useState<Recurrencia[]>([]),[seleccionadaId,establecerSeleccionadaId]=useState<string|null>(null),[editando,establecerEditando]=useState(false);
  const [ahora,establecerAhora]=useState(Date.now()),[fecha,establecerFecha]=useState(new Date()),[hora,establecerHora]=useState('12:00');
  const [error,establecerError]=useState(''),[guardando,establecerGuardando]=useState(false);
  const [importe,establecerImporte]=useState('');
  const [historial,establecerHistorial]=useState<Awaited<ReturnType<typeof consultarHistorialRecurrencia>>|null>(null),[errorHistorial,establecerErrorHistorial]=useState('');
  const consulta=useRef(0),bloqueo=useRef(false);
  const [accion,cambiarAccion]=useState('');
  const seleccionada=filas.find(f=>f.id===seleccionadaId);
  const recargar=useCallback(()=>consultarRecurrenciasDeposito(depositoId).then(datos=>{establecerFilas(datos);alCambiarCantidad?.(datos.length);establecerError('');}).catch(fallo=>establecerError(fallo.message)),[depositoId,alCambiarCantidad]);
  useFocusEffect(useCallback(()=>{establecerAhora(Date.now());void recargar();},[recargar]));
  useEffect(()=>{const reloj=setInterval(()=>{establecerAhora(Date.now());void recargar();},60000);return()=>clearInterval(reloj);},[recargar]);
  useEffect(()=>{
    const solicitud=++consulta.current;establecerHistorial(null);establecerErrorHistorial('');
    if(seleccionadaId)void consultarHistorialRecurrencia(seleccionadaId).then(datos=>{if(consulta.current===solicitud)establecerHistorial(datos);}).catch(fallo=>{if(consulta.current===solicitud)establecerErrorHistorial(fallo instanceof Error?fallo.message:'No se pudo consultar el historial.');});
    return()=>{consulta.current++;};
  },[seleccionadaId,seleccionada?.proxima_ejecucion,seleccionada?.monto]);
  const abrir=(fila:Recurrencia)=>{establecerError('');establecerEditando(false);establecerSeleccionadaId(fila.id);};
  const reprogramar=()=>{if(!seleccionada)return;const proxima=new Date(Date.parse(seleccionada.proxima_ejecucion)>Date.now()?Date.parse(seleccionada.proxima_ejecucion):Date.now()+86400000);const civil=partesCalendario(proxima.toISOString(),seleccionada.zona_horaria);establecerFecha(new Date(civil.anio,civil.mes-1,civil.dia));establecerHora(String(civil.hora).padStart(2,'0')+':'+String(civil.minuto).padStart(2,'0'));establecerImporte(String(seleccionada.monto).replace('.',','));establecerEditando(v=>!v);};
  const guardar=async(activa:boolean,cambiarFecha=false)=>{
    if(!seleccionada||bloqueo.current)return;const liberar=iniciarOperacionFinanciera();if(!liberar)return;bloqueo.current=true;cambiarAccion(cambiarFecha?'guardar':'desactivar');establecerGuardando(true);establecerError('');
    try{
      await actualizarRecurrencia(seleccionada.id,{activa,...(cambiarFecha?{monto:importe,proximaEjecucion:instanteCalendario({anio:fecha.getFullYear(),mes:fecha.getMonth()+1,dia:fecha.getDate(),hora:Number(hora.split(':')[0]),minuto:Number(hora.split(':')[1]),segundo:0},seleccionada.zona_horaria)}:{})});
      await recargar();establecerEditando(false);alCambiar();
    }catch(fallo){establecerError(fallo instanceof Error?fallo.message:'No se pudo guardar la programación.');}finally{liberar();bloqueo.current=false;establecerGuardando(false);cambiarAccion('');}
  };
  const aceptar=async()=>{
    if(!seleccionada||bloqueo.current)return;const liberar=iniciarOperacionFinanciera();if(!liberar)return;bloqueo.current=true;establecerGuardando(true);cambiarAccion('aceptar');establecerError('');
    try{await aceptarOcurrenciaRecurrencia(seleccionada.id,seleccionada.proxima_ejecucion);await recargar();alCambiar();}catch(e){establecerError(e instanceof Error?e.message:'No se pudo registrar.');}finally{liberar();bloqueo.current=false;establecerGuardando(false);cambiarAccion('');}
  };
  const visibles=filas.filter(f=>!filtrar||filtrar(f)).sort((a,b)=>b.activa-a.activa||Date.parse(a.proxima_ejecucion)-Date.parse(b.proxima_ejecucion));
  return <View style={propios.grupo}>
    <Text accessibilityRole="header" style={estilos.encabezadoSeccion}>Movimientos recurrentes</Text>
    <Text style={estilos.textoSecundario}>{visibles.length} de {filas.length} programados · {filas.filter(f=>f.activa).length} activos · {filas.filter(f=>f.activa&&Date.parse(f.proxima_ejecucion)<=ahora).length} pendientes de aceptar</Text>
    {!seleccionada&&error?<Text style={estilos.textoError}>{error}</Text>:null}
    {!visibles.length?<Text style={estilos.textoSecundario}>{filas.length?'No hay recurrencias que coincidan con los filtros.':'Este depósito no tiene recurrencias.'}</Text>:null}
    {visibles.map(fila=>{
      const ingreso=fila.tipo==='ingreso',color=ingreso?tema.exito:tema.error,categoria=(ingreso?CATEGORIAS_INGRESO:CATEGORIAS_EGRESO).find(c=>c.id===fila.categoria),restante=tiempoHastaRecurrencia(fila.proxima_ejecucion,!!fila.activa,ahora);
      return <Pressable key={fila.id} accessibilityRole="button" accessibilityLabel={fila.descripcion+'. '+monto(fila.monto)+'. '+restante+'. Ver opciones y resumen.'} onPress={()=>abrir(fila)} style={({pressed})=>[tarjeta.tarjeta,pressed&&tarjeta.presionada]}>
        <View style={[tarjeta.icono,{backgroundColor:color+'18'}]}><Ionicons color={color} name={categoria?.icono||'repeat-outline'} size={18}/></View>
        <View style={tarjeta.contenido}>
          <View style={tarjeta.filaTitulo}><Text numberOfLines={1} ellipsizeMode="tail" style={tarjeta.titulo}>{fila.descripcion}</Text></View>
          <View style={tarjeta.filaMetadatos}><Text numberOfLines={1} style={tarjeta.metadatos}>{categoria?.nombre||'Recurrente'}</Text><Text numberOfLines={1} style={[tarjeta.fecha,{color:fila.activa?tema.foco:tema.textoSecundario}]}>{restante}</Text></View>
        </View>
        <View style={tarjeta.franjaImporte}>
          <View style={tarjeta.filaTipo}><EtiquetaImporte style={[tarjeta.tipo,{color}]}>{ingreso?'Ingreso':'Egreso'}</EtiquetaImporte><Ionicons name="chevron-forward" size={16} color={tema.textoSecundario}/></View>
          <Text numberOfLines={1} adjustsFontSizeToFit style={tarjeta.importe}>{monto(fila.monto)}</Text>
        </View>
      </Pressable>;
    })}
    <Modal transparent animationType="fade" visible={!!seleccionada} onRequestClose={()=>!bloqueo.current&&establecerSeleccionadaId(null)}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={modal.fondoModalImporte}>
        <Pressable accessibilityLabel="Cerrar detalle recurrente" disabled={guardando} onPress={()=>{if(!bloqueo.current)establecerSeleccionadaId(null);}} style={modal.cierreModalImporte}/>
        <View accessibilityViewIsModal style={modal.tarjetaConfirmacion}>
          <View style={propios.encabezado}>
            <Text accessibilityRole="header" style={[modal.tituloConfirmacion,propios.textoFlexible]}>{seleccionada?.descripcion}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar detalle recurrente" disabled={guardando} onPress={()=>{if(!bloqueo.current)establecerSeleccionadaId(null);}} style={modal.botonCerrarImporte}><Ionicons name="close" size={24} color={tema.textoSecundario}/></Pressable>
          </View>
          {seleccionada?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={propios.grupo}>
            <View style={propios.hero}>
              <View style={propios.encabezado}><View style={propios.iconoModal}><Ionicons name="repeat-outline" size={24} color={tema.foco}/></View><View style={propios.textoFlexible}><Text style={estilos.textoSecundario}>{seleccionada.activa?'Programación activa':'Programación pausada'} · {seleccionada.frecuencia}</Text><Text style={propios.importeModal}>{monto(seleccionada.monto)}</Text></View></View>
              <Text style={estilos.etiqueta}>{tiempoHastaRecurrencia(seleccionada.proxima_ejecucion,!!seleccionada.activa,ahora)}</Text>
            </View>
            {seleccionada.activa&&Date.parse(seleccionada.proxima_ejecucion)<=ahora?<Pressable accessibilityRole="button" disabled={guardando} onPress={()=>{void aceptar();}} style={estilos.botonPrincipal}><Text style={estilos.textoBotonPrincipal}>{accion==='aceptar'?'Registrando…':'Aceptar y registrar'}</Text></Pressable>:null}
            <Text style={estilos.textoAyuda}>Cada fecha requiere tu aceptación. El saldo cambia únicamente cuando la registrás.</Text>
            <Text style={estilos.etiqueta}>Administrar programación</Text>
            <View style={propios.acciones}>
              <Pressable accessibilityRole="button" disabled={guardando} onPress={reprogramar} style={propios.accion}><Ionicons name={seleccionada.activa?'create-outline':'play-outline'} size={18} color={tema.foco}/><Text style={propios.textoAccion}>{seleccionada.activa?'Editar programación':'Reactivar'}</Text></Pressable>
              {seleccionada.activa?<Pressable accessibilityRole="button" disabled={guardando} onPress={()=>guardar(false)} style={propios.accion}><Ionicons name="pause-outline" size={18} color={tema.error}/><Text style={[propios.textoAccion,{color:tema.error}]}>{accion==='desactivar'?'Desactivando…':'Desactivar'}</Text></Pressable>:null}
            </View>
            {editando?<View style={propios.grupo}>
              <EntradaMonto tema={tema} estilosGlobales={estilos} estilosMovimiento={estilosMovimiento} etiqueta="Importe de los próximos registros" valor={importe} alCambiarTexto={establecerImporte} editable={!guardando}/>
              <SelectorFecha valor={fecha} alSeleccionar={establecerFecha} tema={tema} estilosMovimiento={estilosMovimiento}/>
              <SelectorHora valor={hora} alSeleccionar={establecerHora} tema={tema} estilosMovimiento={estilosMovimiento}/>
              <Pressable accessibilityRole="button" disabled={guardando} onPress={()=>guardar(true,true)} style={estilos.botonPrincipal}><Text style={estilos.textoBotonPrincipal}>{accion==='guardar'?'Guardando…':'Guardar programación'}</Text></Pressable>
            </View>:null}
            {error?<Text accessibilityLiveRegion="polite" style={estilos.textoError}>{error}</Text>:null}
            <View style={propios.historial}>
              <Text accessibilityRole="header" style={estilos.encabezadoSeccion}>Resumen acumulado</Text>
              {errorHistorial?<Text style={estilos.textoError}>{errorHistorial}</Text>:!historial?<ActivityIndicator color={tema.foco}/>:<>
                <View style={propios.hero}><Text style={estilos.textoSecundario}>{seleccionada.tipo==='egreso'?'Total gastado':'Total recibido'}</Text><Text style={propios.importeModal}>{monto(historial.total)}</Text></View>
                <Text style={estilos.textoSecundario}>Registrado {historial.repeticiones} {historial.repeticiones===1?'vez':'veces'}</Text>
                {historial.montoInicial!==null&&Math.round(seleccionada.monto*100)!==Math.round(historial.montoInicial*100)?<View style={propios.hero}>
                  <Text style={estilos.textoSecundario}>Importe inicial: {monto(historial.montoInicial)}</Text>
                  <Text style={estilos.etiqueta}>{seleccionada.monto>historial.montoInicial?'Aumentó':'Disminuyó'} {monto(Math.abs(Math.round(seleccionada.monto*100)-Math.round(historial.montoInicial*100))/100)}{historial.montoInicial>0?' ('+(Math.abs((seleccionada.monto-historial.montoInicial)/historial.montoInicial)*100).toLocaleString('es-AR',{maximumFractionDigits:1})+' %)':''} desde el inicio</Text>
                </View>:null}
              </>}
            </View>
          </ScrollView>:null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}
