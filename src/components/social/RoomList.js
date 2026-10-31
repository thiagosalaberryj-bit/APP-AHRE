import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { LIMITE_SALAS_ACTIVAS } from "../../social/socialConstants";
import { CATEGORIAS_EGRESO } from '../../constants/movimientos';
import { View, TextInput, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TarjetaResumenSala from './RoomSummaryCard';
import EstadoVacio from './SocialEmptyState';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
export default function ListaSalas(propiedades) {
  const {
    obtenerPersona,
    salas: salasSociales
  } = useDatosSociales();
  const {
    abrirSala,
    abrirRegistro,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales,
    estilosMovimiento,
    tema
  } = aspecto;
  const [busqueda, establecerBusqueda] = useState('');
  const [estado, establecerEstado] = useState('todas');
  const consulta = normalizarNombrePersona(busqueda);
  const activas = salasSociales.filter(sala => sala.estado === 'abierta');
  const salas = salasSociales.filter(sala => {
    const categoria = CATEGORIAS_EGRESO.find(elemento => elemento.id === sala.categoriaId);
    const personas = sala.participantes.map(id => {
      const persona = obtenerPersona(id);
      return `${nombreCompletoPersona(persona)} ${persona.apodo}`;
    }).join(' ');
    return (estado === 'todas' || sala.estado === estado) && normalizarNombrePersona(`${sala.nombre} ${categoria?.nombre} ${personas} ${sala.creadaEl} ${sala.creadaEl.split('-').reverse().join('/')}`).includes(consulta);
  }).sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion) || b.id.localeCompare(a.id));
  const limpiar = () => {
    establecerBusqueda('');
    establecerEstado('todas');
  };
  return <>
      <View style={estilos.grupo}>
        <View style={estilos.filaCampos}>
          <View style={[estilosMovimiento.botonDeposito, estilos.columnaCampo, estilos.busquedaAgenda]}>
            <Ionicons color={tema.textoSecundario} name="search-outline" size={22} />
            <TextInput accessibilityLabel="Buscar salas" value={busqueda} onChangeText={establecerBusqueda} placeholder="Sala, categoría o persona" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosMovimiento.entradaDescripcion, estilos.entradaBusquedaAgenda]} />
            {busqueda ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda de salas" onPress={() => establecerBusqueda('')} style={estilos.accionIcono}><Ionicons color={tema.textoSecundario} name="close-circle-outline" size={22} /></Pressable> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Crear sala" accessibilityHint={activas.length >= LIMITE_SALAS_ACTIVAS ? 'Cerrá una sala para liberar un lugar.' : undefined} accessibilityState={{
          disabled: activas.length >= LIMITE_SALAS_ACTIVAS
        }} disabled={activas.length >= LIMITE_SALAS_ACTIVAS} onPress={() => abrirRegistro('crear')} style={[estilos.agregarPersonaAgenda, activas.length >= LIMITE_SALAS_ACTIVAS && estilos.accionPanelDeshabilitada]}><Ionicons color={tema.botonPrincipalTexto} name="add" size={28} /></Pressable>
        </View>
        <View style={estilos.repartoEnLinea}>
          {[{
          id: 'todas',
          nombre: 'Todas'
        }, {
          id: 'abierta',
          nombre: 'Activas'
        }, {
          id: 'cerrada',
          nombre: 'Cerradas'
        }].map(opcion => <Pressable key={opcion.id} accessibilityRole="radio" accessibilityLabel={`Salas ${opcion.nombre.toLocaleLowerCase('es')}`} accessibilityState={{
          checked: estado === opcion.id
        }} onPress={() => establecerEstado(opcion.id)} style={[estilos.opcionReparto, estado === opcion.id && estilos.pestanaActiva]}><Text numberOfLines={1} ellipsizeMode="tail" style={[estilos.textoPestana, estado === opcion.id && estilos.textoPestanaActiva]}>{opcion.nombre}</Text></Pressable>)}
        </View>
        <View style={estilos.filaTitulo}><Text accessibilityLiveRegion="polite" style={estilosGlobales.textoSecundario}>{salas.length} de {salasSociales.length} salas</Text><Text style={estilosGlobales.textoSecundario}>{activas.length}/{LIMITE_SALAS_ACTIVAS} activas</Text></View>
      </View>
      {salas.length ? [{
      id: 'abierta',
      nombre: 'Activas'
    }, {
      id: 'cerrada',
      nombre: 'Cerradas · Solo lectura'
    }].map(grupo => {
      const integrantes = salas.filter(sala => sala.estado === grupo.id);
      return integrantes.length ? <View key={grupo.id} style={estilos.grupo}><Text numberOfLines={1} ellipsizeMode="tail" accessibilityRole="header" style={estilosGlobales.encabezadoSeccion}>{grupo.nombre} · {integrantes.length}</Text>{integrantes.map(sala => <TarjetaResumenSala key={sala.id} sala={sala} alAbrir={() => abrirSala(sala.id)} {...aspecto} />)}</View> : null;
    }) : <EstadoVacio icono="search-outline" titulo="No encontramos salas" descripcion="Probá con otro nombre, categoría o persona, o cambiá el filtro de estado." {...aspecto} />}
      {consulta || estado !== 'todas' ? <BotonSocial texto="Limpiar búsqueda y filtros" simple alPresionar={limpiar} {...aspecto} /> : null}
    </>;
}
