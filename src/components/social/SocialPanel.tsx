import OpcionesSalas from './RoomActionsMenu';
import { nombreCompletoPersona } from '../../social/socialHelpers';
import type { NombreIcono } from '../../constants/movimientos';
import { useDatosSociales } from '../../social/SocialDataContext';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TituloSeccionSocial from './SocialSectionTitle';
import TarjetaDeuda from '../DebtCard';
import TarjetaResumenSala from './RoomSummaryCard';
import ResumenImporteSocial from './SocialAmountSummary';
import RequisitoCreacionSocial from './SocialCreationGate';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/SocialPanelStyles';
export default function PanelSocial(propiedades: import('../../social/types').AspectoSocial & ({alVerSalas:()=>void;alVerPersonas:()=>void;alVerAgenda:()=>void} & Pick<import('../../social/types').AccionesSociales,'abrirSala'|'abrirRegistro'>)) {
  const estilosPanel = crearEstilosPropios(propiedades.tema);
  const {
    salas: salasSociales,
    deudas: deudasSociales,
    totales,
    tienePendientesOnline,
    obtenerPersona,
    habilitadoParaCrear
  } = useDatosSociales();
  const {
    alVerSalas,
    alVerPersonas,
    alVerAgenda,
    abrirSala,
    abrirRegistro,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...estilosPanel
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  const activas = salasSociales.filter((sala) => sala.estado === 'abierta'||sala.movimientosPorRegistrar>0).sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || b.id.localeCompare(a.id));
  const pendientes = deudasSociales.filter(deuda => !deuda.saldada);
  const recientes = [...pendientes].sort((a, b) => (b.ultimaActividad||b.fechaISO).localeCompare(a.ultimaActividad||a.fechaISO) || b.id.localeCompare(a.id)).slice(0, 5);
  return <>
      {!habilitadoParaCrear ? <RequisitoCreacionSocial {...aspecto} /> : null}
      <View style={estilos.resumenPrincipal}>
        <View style={estilos.filaCampos}>
          <Ionicons color={tema.foco} name="swap-horizontal-outline" size={20} />
          <Text style={estilosGlobales.etiqueta}>Tus pendientes</Text>
        </View>
        <View style={estilos.totalesPanel}>
          <ResumenImporteSocial etiqueta="Te deben" valor={totales.porCobrar} icono="arrow-up-outline" color={tema.foco} estiloValor={[estilosGlobales.monto, estilos.montoResumen]} {...aspecto} />
          <ResumenImporteSocial etiqueta="Debés" valor={totales.porPagar} icono="arrow-down-outline" color={tema.error} estiloValor={[estilosGlobales.monto, estilos.montoResumen]} {...aspecto} />
        </View>
      <View style={estilos.accionesPanel}>
        {[{
          tipo: 'deuda',
          texto: 'Nueva deuda',
          etiqueta: 'Registrar deuda',
          icono: 'swap-horizontal-outline'
        }, {
          tipo: 'personas',
          texto: 'Personas',
          etiqueta: 'Ver personas',
          icono: 'people-outline'
        }].map(accion => {
          const bloqueada = accion.tipo !== 'personas' && !habilitadoParaCrear;
          return <Pressable key={accion.tipo} accessibilityRole="button" accessibilityLabel={accion.etiqueta} accessibilityHint={bloqueada ? 'No se puede registrar una deuda en este momento.' : undefined} accessibilityState={{
            disabled: bloqueada
          }} disabled={bloqueada} onPress={() => accion.tipo === 'personas' ? alVerAgenda() : abrirRegistro(accion.tipo)} style={[estilos.accionPanel, bloqueada && estilos.accionPanelDeshabilitada]}>
              <Ionicons color={tema.botonPrincipalTexto} name={accion.icono as NombreIcono} size={20} />
              <Text style={estilos.textoAccionPanel}>{accion.texto}</Text>
            </Pressable>;
        })}
        <OpcionesSalas {...aspecto} abrirSala={abrirSala} abrirRegistro={abrirRegistro}/>
      </View>
      </View>
      <View style={estilos.grupo}>
        <TituloSeccionSocial titulo="Deudas recientes" etiqueta="Ver todas las deudas" alAbrir={alVerPersonas} {...aspecto} />
        {recientes.length ? recientes.map(deuda => <TarjetaDeuda key={deuda.id} deuda={deuda} nombrePersona={nombreCompletoPersona(obtenerPersona(deuda.personaId))} alAbrir={() => abrirRegistro('detalleDeuda', {
        deudaId: deuda.id
      })} {...aspecto} />) : <View style={estilos.vacioDeudasPanel}><Ionicons color={tienePendientesOnline?tema.foco:tema.exito} name={tienePendientesOnline?'cloud-outline':'checkmark-circle-outline'} size={28} /><View style={estilos.textoFlexible}><Text style={estilosGlobales.etiqueta}>{tienePendientesOnline?'Tenés acuerdos online pendientes':'No tenés deudas pendientes'}</Text><Text style={estilosGlobales.textoAyuda}>{tienePendientesOnline?'Revisalos desde Deudas. Ya están incluidos en Tus pendientes.':'Estás al día. Podés registrar una deuda cuando lo necesites.'}</Text></View></View>}
      </View>
      <View style={estilos.grupo}>
        <TituloSeccionSocial titulo="Salas" etiqueta="Ver todas las salas" alAbrir={alVerSalas} {...aspecto} />
        {activas.length ? activas.map(sala => <TarjetaResumenSala key={sala.id} sala={sala} alAbrir={() => abrirSala(sala.id)} {...aspecto} />) : <Text style={estilosGlobales.textoSecundario}>No tenés salas abiertas ni movimientos de salas por registrar.</Text>}
      </View>
    </>;
}
