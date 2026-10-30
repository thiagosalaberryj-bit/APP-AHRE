import { SALAS_SIMULADAS, LIMITE_SALAS_ACTIVAS, DEUDAS_SIMULADAS } from '../../social/socialMockData';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TituloSeccionSocial from './SocialSectionTitle';
import TarjetaResumenDeuda from './DebtSummaryCard';
import TarjetaResumenSala from './RoomSummaryCard';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/SocialPanelStyles';
export default function PanelSocial(propiedades) {
  const {
    alVerSalas,
    alVerPersonas,
    alVerAgenda,
    abrirSala,
    abrirRegistro,
    sinDeudas = false,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  const activas = SALAS_SIMULADAS.filter(sala => sala.estado === 'abierta').sort((a, b) => b.creadaEl.localeCompare(a.creadaEl)).slice(0, LIMITE_SALAS_ACTIVAS);
  const pendientes = sinDeudas ? [] : DEUDAS_SIMULADAS.filter(deuda => !deuda.saldada);
  const recientes = [...pendientes].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  return <>
      <View style={estilos.resumenPrincipal}>
        <View style={estilos.filaCampos}>
          <Ionicons color={tema.foco} name="swap-horizontal-outline" size={20} />
          <Text style={estilosGlobales.etiqueta}>Tus pendientes</Text>
        </View>
        <View style={estilos.totalesPanel}>
          <View style={[estilos.totalPanel, estilos.importePrincipalPanel]}><View style={estilos.etiquetaImportePersona}><Ionicons color={tema.foco} name="arrow-up-outline" size={20} /><Text style={estilosGlobales.etiqueta}>Te deben</Text></View><Text style={[estilosGlobales.monto, estilos.montoResumen]}>{sinDeudas ? '$ 0' : '$ 7.500'}</Text></View>
          <View style={[estilos.totalPanel, estilos.importePrincipalPanel]}><View style={estilos.etiquetaImportePersona}><Ionicons color={tema.error} name="arrow-down-outline" size={20} /><Text style={estilosGlobales.etiqueta}>Debés</Text></View><Text style={[estilosGlobales.monto, estilos.montoResumen]}>{sinDeudas ? '$ 0' : '$ 9.000'}</Text></View>
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
        }, {
          tipo: 'crear',
          texto: 'Nueva sala',
          etiqueta: 'Crear sala',
          icono: 'people-outline'
        }].map(accion => {
          const bloqueada = accion.tipo === 'crear' && activas.length >= LIMITE_SALAS_ACTIVAS;
          return <Pressable key={accion.tipo} accessibilityRole="button" accessibilityLabel={accion.etiqueta} accessibilityHint={bloqueada ? 'Ya tenés tres salas activas. Cerrá una para crear otra.' : undefined} accessibilityState={{
            disabled: bloqueada
          }} disabled={bloqueada} onPress={() => accion.tipo === 'personas' ? alVerAgenda() : abrirRegistro(accion.tipo)} style={[estilos.accionPanel, bloqueada && estilos.accionPanelDeshabilitada]}>
              <Ionicons color={tema.botonPrincipalTexto} name={accion.icono} size={24} />
              <Text style={estilos.textoAccionPanel}>{accion.texto}</Text>
              {accion.tipo === 'crear' ? <Text style={estilos.detalleAccionPanel}>{activas.length}/{LIMITE_SALAS_ACTIVAS} activas</Text> : null}
            </Pressable>;
        })}
      </View>
      </View>
      <View style={estilos.grupo}>
        <TituloSeccionSocial titulo="Deudas recientes" etiqueta="Ver todas las deudas" alAbrir={alVerPersonas} {...aspecto} />
        {recientes.length ? recientes.map(deuda => <TarjetaResumenDeuda key={deuda.id} deuda={deuda} alAbrir={() => abrirRegistro('detalleDeuda', {
        deudaId: deuda.id
      })} {...aspecto} />) : <View style={estilos.vacioDeudasPanel}><Ionicons color={tema.exito} name="checkmark-circle-outline" size={28} /><View style={estilos.textoFlexible}><Text style={estilosGlobales.etiqueta}>No tenés deudas pendientes</Text><Text style={estilosGlobales.textoAyuda}>Estás al día. Podés registrar una deuda cuando lo necesites.</Text></View></View>}
      </View>
      <View style={estilos.grupo}>
        <TituloSeccionSocial titulo="Salas" etiqueta="Ver todas las salas" alAbrir={alVerSalas} {...aspecto} />
        {activas.length ? activas.map(sala => <TarjetaResumenSala key={sala.id} sala={sala} alAbrir={() => abrirSala(sala.id)} {...aspecto} />) : <Text style={estilosGlobales.textoSecundario}>No tenés salas activas.</Text>}
      </View>
    </>;
}
