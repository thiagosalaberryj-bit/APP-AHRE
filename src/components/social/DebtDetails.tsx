import HistorialActividadDeuda from './DebtActivityHistory';
import InvitacionDeuda from './DebtInvitation';
import ImporteDeuda from './DebtAmountCard';
import {Ionicons} from '@expo/vector-icons';
import PropuestaDeudaOnline from './OnlineDebtProposal';
import crearEstilosDetalle from '../../styles/social/DebtDetailsStyles';
import { View, Text, Pressable } from 'react-native';
import { useDatosSociales } from '../../social/SocialDataContext';
import { nombreCompletoPersona, formatearMontoSocial } from '../../social/socialHelpers';
import AvatarPersona from './PersonAvatar';
import EstadoVacio from './SocialEmptyState';
import AccionesDeuda from './DebtActions';
import EnlaceRelacionadoSocial from './SocialRelatedLink';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function DetalleDeuda({ deudaId, abrirPersona, abrirSala, abrirRegistro, ...aspecto }: import('../../social/types').AspectoSocial & ({deudaId?:string} & import('../../social/types').AccionesSociales)) {
  const { deudas, obtenerPersona, personas } = useDatosSociales();
  const { tema, estilosGlobales } = aspecto;
  const estilos = { ...crearEstilosCompartidos(tema), ...crearEstilosDetalle(tema) };
  const deuda = deudas.find(d => d.id === deudaId);
  if (!deuda) return <EstadoVacio icono="alert-circle-outline" titulo="Deuda no disponible" descripcion="Volvé al historial para elegir otra deuda." {...aspecto} />;
  const persona = obtenerPersona(deuda.personaId), esPago = deuda.tipo === 'debo';
  const tieneFicha = personas.some(p => p.id === deuda.personaId);
  if (!persona) return <EstadoVacio icono="alert-circle-outline" titulo="Persona no disponible" descripcion="Volvé al historial para elegir otra deuda." {...aspecto} />;
  const color = deuda.perdonadoNumero>0?tema.textoSecundario:deuda.saldada ? tema.exito : esPago ? tema.error : tema.foco;
  const pagado = formatearMontoSocial(deuda.montoNumero - deuda.pendienteNumero - deuda.perdonadoNumero);
  return <>
    <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Ver persona" disabled={!tieneFicha} onPress={()=>abrirPersona(persona.id)} style={estilos.filaCampos}>
        <AvatarPersona persona={persona} />
        <View style={estilos.textoFlexible}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.nombrePersona}>{nombreCompletoPersona(persona)}</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.detalle}>{persona.apodo}</Text>
        </View>
        {tieneFicha?<Ionicons name="chevron-forward" color={tema.textoSecundario} size={20}/>:null}
      </Pressable>
      <View style={estilos.grupoCampo}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={estilos.descripcion}>{deuda.descripcion}</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.etiqueta, { color }]}>{deuda.invitacionOnline?'Invitación pendiente':deuda.estadoOnline==='rechazada'?'Propuesta rechazada':deuda.saldada ? deuda.estado : deuda.estado.startsWith('Pago parcial') ? 'Pago parcial' : 'Pendiente'}</Text>
      </View>
      <View style={estilos.filaImportes}>
        <ImporteDeuda etiqueta="Original" valor={deuda.monto} icono="receipt-outline" color={tema.foco} {...aspecto}/>
        <ImporteDeuda etiqueta={esPago?'Le debés':'Te debe'} valor={deuda.pendiente} icono={esPago?'arrow-down-outline':'arrow-up-outline'} color={color} {...aspecto}/>
        <ImporteDeuda etiqueta={esPago?'Pagaste':'Recibiste'} valor={pagado} icono="checkmark-outline" color={tema.exito} {...aspecto}/>
      </View>
      <View style={estilos.metadatos}><Text style={estilos.detalle}>{deuda.fecha.split('-').reverse().join('/')}</Text><Text style={estilos.detalle}>{deuda.acuerdoOnlineId?'Vinculada online':deuda.salaId?'De sala':'Deuda personal'}</Text></View>
      {deuda.origen!=='Deuda personal'?<Text style={estilos.detalle}>{deuda.origen}</Text>:null}
      {deuda.perdonadoNumero>0?<Text style={estilos.detalle}>Perdonado sin pago · {formatearMontoSocial(deuda.perdonadoNumero)}</Text>:null}
      <AccionesDeuda deuda={deuda} abrirRegistro={abrirRegistro} {...aspecto} />
    </View>
      {!deuda.acuerdoOnlineId&&!deuda.salaId&&!deuda.saldada?<PropuestaDeudaOnline deudaId={deuda.id} {...aspecto}/>:null}
    {deuda.acuerdoOnlineId&&deuda.estadoOnline!=='aceptada'?<InvitacionDeuda key={deuda.id} deuda={deuda} {...aspecto}/>:<HistorialActividadDeuda key={deuda.id} deuda={deuda} {...aspecto}/>}
    <View style={estilos.grupoCampo}>

      {deuda.salaId ? <EnlaceRelacionadoSocial texto="Ver sala de origen" icono="people-outline" alAbrir={() => abrirSala(deuda.salaId!)} {...aspecto} /> : null}
    </View>
  </>;
}
