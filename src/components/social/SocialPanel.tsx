import type { AspectoSocial } from '../../social/types';
import type { NombreIcono } from '../../constants/movimientos';
import { useDatosSociales } from '../../social/SocialDataContext';
import { LIMITE_SALAS_ACTIVAS } from "../../social/socialConstants";
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TituloSeccionSocial from './SocialSectionTitle';
import TarjetaResumenDeuda from './DebtSummaryCard';
import TarjetaResumenSala from './RoomSummaryCard';
import ResumenImporteSocial from './SocialAmountSummary';
import RequisitoCreacionSocial from './SocialCreationGate';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/SocialPanelStyles';
export default function PanelSocial(propiedades: import('../../social/types').AspectoSocial & ({alVerSalas:()=>void;alVerPersonas:()=>void;alVerAgenda:()=>void} & Pick<import('../../social/types').AccionesSociales,'abrirSala'|'abrirRegistro'>)) {
  const {
    salas: salasSociales,
    deudas: deudasSociales,
    totales,
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
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    tema,
    estilos,
    estilosGlobales
  } = aspecto;
  const activas = salasSociales.filter((sala) => sala.estado === 'abierta').sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || b.id.localeCompare(a.id)).slice(0, LIMITE_SALAS_ACTIVAS);
  const pendientes = deudasSociales.filter(deuda => !deuda.saldada);
  const recientes = [...pendientes].sort((a, b) => b.fechaISO.localeCompare(a.fechaISO) || b.id.localeCompare(a.id)).slice(0, 5);
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
        }, {
          tipo: 'crear',
          texto: 'Nueva sala',
          etiqueta: 'Crear sala',
          icono: 'people-outline'
        }].map(accion => {
          const bloqueada = accion.tipo !== 'personas' && !habilitadoParaCrear || accion.tipo === 'crear' && activas.length >= LIMITE_SALAS_ACTIVAS;
          return <Pressable key={accion.tipo} accessibilityRole="button" accessibilityLabel={accion.etiqueta} accessibilityHint={bloqueada ? !habilitadoParaCrear ? 'Primero necesitás un depósito activo con dinero.' : 'Ya tenés tres salas activas. Cerrá una para crear otra.' : undefined} accessibilityState={{
            disabled: bloqueada
          }} disabled={bloqueada} onPress={() => accion.tipo === 'personas' ? alVerAgenda() : abrirRegistro(accion.tipo)} style={[estilos.accionPanel, bloqueada && estilos.accionPanelDeshabilitada]}>
              <Ionicons color={tema.botonPrincipalTexto} name={accion.icono as NombreIcono} size={24} />
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
