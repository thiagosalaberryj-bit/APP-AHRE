import useVinculosOnline from '../../social/online/useAccountLinks';
import ResumenImporteSocial from './SocialAmountSummary';
import OpcionesPersona from './PersonOptionsMenu';
import { crearEstilosDetalleSocial } from '../../styles/social/SocialDetailStyles';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AvatarPersona from './PersonAvatar';
import { nombreCompletoPersona, formatearMontoSocial } from '../../social/socialHelpers';
import { Ionicons } from '@expo/vector-icons';
import TarjetaDeuda from './DebtCard';
import ModalPersona from './PersonModal';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function DetallePersona(propiedades: import('../../social/types').AspectoSocial & ({persona:import('../../social/types').PersonaVista} & import('../../social/types').AccionesSociales)) {
  const social=useDatosSociales();
  const {
    deudas: deudasSociales
  } = social;
  const {
    persona,
    abrirSala,
    abrirRegistro,
    abrirPersona,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosDetalleSocial(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  const [editando, establecerEditando] = useState(false);
  const [cerradas,cambiarCerradas]=useState<string[]>([]);
  const {vinculos,sinConexion}=useVinculosOnline(social.usuarioId);
  const vinculo=vinculos.find(v=>v.persona_id===persona.id&&v.direccion!=='recibida');
  const estadoCuenta=vinculo?.estado==='confirmado'?'Cuenta vinculada':vinculo?.estado==='solicitado'?'Vínculo pendiente':vinculo?.estado==='pendiente'&&vinculo.cuenta_id?'Confirmación pendiente':'Sin cuenta vinculada';
  const deudas = deudasSociales.filter(deuda => deuda.personaId === persona.id);
  return <View style={estilos.pagina}>
      <View style={estilos.tarjeta}>
        <View style={estilos.cabecera}>
          <AvatarPersona persona={persona} />
          <View style={estilos.identidad}><Text accessibilityLabel={nombreCompletoPersona(persona)} style={estilos.nombre}>{nombreCompletoPersona(persona)}</Text><View style={estilos.filaApodoCuenta}>{persona.apodo ? <Text accessibilityLabel={persona.apodo} numberOfLines={1} ellipsizeMode="tail" style={[estilos.secundario,estilos.apodoCompacto]}>{persona.apodo}</Text> : null}<View style={estilos.estadoCuenta}><Ionicons name={vinculo?.estado==='confirmado'?'link-outline':vinculo?.estado==='solicitado'||vinculo?.estado==='pendiente'&&vinculo.cuenta_id?'time-outline':'person-outline'} size={15} color={vinculo?.estado==='confirmado'?tema.foco:tema.textoSecundario}/><Text accessibilityLiveRegion="polite" numberOfLines={1} style={estilos.textoEstadoCuenta}>{estadoCuenta}</Text></View></View></View>
          <OpcionesPersona persona={persona} vinculo={vinculo} sinConexion={sinConexion} alEditar={()=>establecerEditando(true)} {...aspecto}/>
        </View>
        {!persona.activa ? <Text style={estilos.secundario}>Persona inactiva · Su historial se conserva.</Text> : null}
        <View style={estilos.cifras}>
          <ResumenImporteSocial etiqueta="Te debe" valor={persona.porCobrar||formatearMontoSocial(0)} icono="arrow-up-outline" color={tema.foco} estiloValor={estilosGlobales.monto} {...aspecto}/>
          <ResumenImporteSocial etiqueta="Le debés" valor={persona.porPagar||formatearMontoSocial(0)} icono="arrow-down-outline" color={tema.error} estiloValor={estilosGlobales.monto} {...aspecto}/>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Registrar deuda" disabled={!persona.activa} onPress={() => abrirRegistro('deuda', { personaId: persona.id })} style={[estilos.registrar, !persona.activa && estilos.deshabilitado]}><Text style={estilos.textoRegistrar}>Registrar deuda</Text></Pressable>
      </View>
      {[
        {id:'me_deben',titulo:'Lo que te debe',icono:'arrow-up-outline' as const,color:tema.exito},
        {id:'debo',titulo:'Lo que le debés',icono:'arrow-down-outline' as const,color:tema.error},
        {id:'saldadas',titulo:'Pagos saldados',icono:'checkmark-circle-outline' as const,color:tema.textoSecundario},
      ].map(grupo=>{
        const registros=deudas.filter(d=>grupo.id==='saldadas'?d.saldada:!d.saldada&&d.tipo===grupo.id).sort((a,b)=>(b.ultimaActividad||b.fechaISO).localeCompare(a.ultimaActividad||a.fechaISO));
        const expandida=!cerradas.includes(grupo.id);
        return <View key={grupo.id} style={estilos.seccionDeudas}>
          <Pressable accessibilityRole="button" accessibilityLabel={grupo.titulo} accessibilityValue={{text:registros.length?registros.length+' deudas':'Sin deudas'}} accessibilityState={{expanded:expandida}} onPress={()=>cambiarCerradas(actual=>expandida?[...actual,grupo.id]:actual.filter(id=>id!==grupo.id))} style={estilos.cabeceraDeudas}>
            <Ionicons name={grupo.icono} color={grupo.color} size={20}/>
            <Text style={estilos.tituloDeudas}>{grupo.titulo}</Text>
            <Text style={estilos.cantidadDeudas}>{registros.length?registros.length+' '+(registros.length===1?'deuda':'deudas'):'Sin deudas'}</Text>
            <Ionicons name={expandida?'chevron-up':'chevron-down'} color={tema.textoSecundario} size={20}/>
          </Pressable>
          {expandida?registros.map(deuda=><TarjetaDeuda key={deuda.id} deuda={deuda} abrirRegistro={abrirRegistro} {...aspecto}/>):null}
        </View>;
      })}
      <ModalPersona visible={editando} personaInicial={persona} alCerrar={() => establecerEditando(false)} abrirPersona={abrirPersona} {...aspecto} />
    </View>;
}
