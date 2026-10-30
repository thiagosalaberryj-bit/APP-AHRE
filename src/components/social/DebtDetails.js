import { View, Text } from 'react-native';
import { useDatosSociales } from '../../social/SocialDataContext';
import { nombreCompletoPersona, formatearMontoSocial } from '../../social/socialHelpers';
import AvatarPersona from './PersonAvatar';
import EstadoVacio from './SocialEmptyState';
import ResumenImporteSocial from './SocialAmountSummary';
import AccionesDeuda from './DebtActions';
import EnlaceRelacionadoSocial from './SocialRelatedLink';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';

export default function DetalleDeuda({ deudaId, abrirPersona, abrirSala, abrirRegistro, ...aspecto }) {
  const { deudas, obtenerPersona } = useDatosSociales();
  const { tema, estilosGlobales } = aspecto;
  const estilos = crearEstilosCompartidos(tema);
  const deuda = deudas.find(d => d.id === deudaId);
  if (!deuda) return <EstadoVacio icono="alert-circle-outline" titulo="Deuda no disponible" descripcion="Volvé al historial para elegir otra deuda." {...aspecto} />;
  const persona = obtenerPersona(deuda.personaId), esPago = deuda.tipo === 'debo';
  const color = deuda.saldada ? tema.exito : esPago ? tema.error : tema.foco;
  const pagado = formatearMontoSocial(deuda.montoNumero - deuda.pendienteNumero);
  return <>
    <View style={[estilos.resumenPrincipal, estilos.perfilCompacto]}>
      <View style={estilos.filaCampos}>
        <AvatarPersona persona={persona} />
        <View style={estilos.textoFlexible}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.subtitulo}>{nombreCompletoPersona(persona)}</Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{persona.apodo}</Text>
        </View>
      </View>
      <View style={estilos.grupoCampo}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.encabezadoSeccion}>{deuda.descripcion}</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[estilosGlobales.etiqueta, { color }]}>{deuda.saldada ? 'Saldada' : deuda.estado.startsWith('Pago parcial') ? 'Pago parcial' : 'Pendiente'}</Text>
      </View>
      <ResumenImporteSocial enFila={false} etiqueta="Original" valor={deuda.monto} icono="receipt-outline" {...aspecto} />
      <View style={estilos.totalesPanel}>
        <ResumenImporteSocial etiqueta={deuda.saldada ? 'Sin pendiente' : esPago ? 'Le debés' : 'Te debe'} valor={deuda.pendiente}
          icono={deuda.saldada ? 'checkmark-circle-outline' : esPago ? 'arrow-down-outline' : 'arrow-up-outline'} color={color} {...aspecto} />
        <ResumenImporteSocial etiqueta={esPago ? 'Pagaste' : 'Recibiste'} valor={pagado} icono="checkmark-outline" color={tema.exito} {...aspecto} />
      </View>
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>Fecha: {deuda.fecha.split('-').reverse().join('/')}</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoSecundario}>{deuda.origen}</Text>
      <AccionesDeuda deuda={deuda} abrirRegistro={abrirRegistro} {...aspecto} />
    </View>
    <View style={estilos.grupoCampo}>
      <EnlaceRelacionadoSocial texto="Ver persona" icono="person-outline" alAbrir={() => abrirPersona(persona.id)} {...aspecto} />
      {deuda.salaId ? <EnlaceRelacionadoSocial texto="Ver sala de origen" icono="people-outline" alAbrir={() => abrirSala(deuda.salaId)} {...aspecto} /> : null}
    </View>
  </>;
}
