import type { AspectoSocial } from '../../social/types';
import { useDatosSociales } from '../../social/SocialDataContext';
import { SetStateAction, useState } from 'react';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { View, TextInput, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TarjetaResumenDeuda from './DebtSummaryCard';
import EstadoVacio from './SocialEmptyState';
import BotonSocial from './SocialButton';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/DebtHistoryStyles';
export default function HistorialDeudas(propiedades: import('../../social/types').AspectoSocial & (Pick<import('../../social/types').AccionesSociales,'abrirRegistro'>)) {
  const {
    obtenerPersona,
    deudas: deudasSociales
  } = useDatosSociales();
  const {
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
    estilosGlobales,
    estilosMovimiento
  } = aspecto;
  const [busqueda, establecerBusqueda] = useState('');
  const [estado, establecerEstado] = useState('todas');
  const [mesesCerrados, establecerMesesCerrados] = useState<string[]>([]);
  const cambiarBusqueda = (valor: string) => {
    establecerBusqueda(valor);
    establecerMesesCerrados([]);
  };
  const cambiarEstado = (valor: string) => {
    establecerEstado(valor);
    establecerMesesCerrados([]);
  };
  const consulta = normalizarNombrePersona(busqueda);
  const deudas = deudasSociales.filter(deuda => {
    const persona = obtenerPersona(deuda.personaId);
    const coincideEstado = estado === 'todas' || (estado === 'saldadas' ? deuda.saldada : !deuda.saldada);
    return coincideEstado && normalizarNombrePersona(`${nombreCompletoPersona(persona)} ${persona?.apodo || ''} ${deuda.descripcion} ${deuda.origen}`).includes(consulta);
  }).sort((a, b) => b.fechaISO.localeCompare(a.fechaISO) || b.id.localeCompare(a.id));
  const grupos: {clave:string;deudas:import('../../social/types').DeudaVista[]}[] = [];
  deudas.forEach(deuda => {
    const clave = deuda.fecha.slice(0, 7);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.clave === clave) ultimo.deudas.push(deuda);else grupos.push({
      clave,
      deudas: [deuda]
    });
  });
  const limpiar = () => {
    cambiarBusqueda('');
    cambiarEstado('todas');
  };
  return <>
      <View style={estilos.grupo}>
        <View style={estilos.filaCampos}>
          <View style={[estilosMovimiento.botonDeposito, estilos.columnaCampo, estilos.busquedaAgenda]}>
            <Ionicons color={tema.textoSecundario} name="search-outline" size={22} />
            <TextInput accessibilityLabel="Buscar deudas por persona" value={busqueda} onChangeText={cambiarBusqueda} placeholder="Persona, apodo o deuda" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={[estilosMovimiento.entradaDescripcion, estilos.entradaBusquedaAgenda]} />
            {busqueda ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda de deudas" onPress={() => cambiarBusqueda('')} style={estilos.accionIcono}><Ionicons color={tema.textoSecundario} name="close-circle-outline" size={22} /></Pressable> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Registrar deuda" onPress={() => abrirRegistro('deuda')} style={estilos.agregarPersonaAgenda}><Ionicons color={tema.botonPrincipalTexto} name="add" size={28} /></Pressable>
        </View>
        <View style={estilos.repartoEnLinea}>
          {[{
          id: 'todas',
          nombre: 'Todas'
        }, {
          id: 'pendientes',
          nombre: 'Pendientes'
        }, {
          id: 'saldadas',
          nombre: 'Saldadas'
        }].map(opcion => <Pressable key={opcion.id} accessibilityRole="radio" accessibilityLabel={opcion.nombre} accessibilityState={{
          checked: estado === opcion.id
        }} onPress={() => cambiarEstado(opcion.id)} style={[estilos.opcionReparto, estado === opcion.id && estilos.pestanaActiva]}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[estilos.textoPestana, estado === opcion.id && estilos.textoPestanaActiva]}>{opcion.nombre}</Text>
            </Pressable>)}
        </View>
        <Text accessibilityLiveRegion="polite" style={estilosGlobales.textoSecundario}>{deudas.length} de {deudasSociales.length} deudas</Text>
      </View>
      <View style={estilos.grupo}>
        {deudas.length ? grupos.map(grupo => {
        const abierto = !mesesCerrados.includes(grupo.clave);
        const [anio, mes] = grupo.clave.split('-');
        const nombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][Number(mes) - 1] + ' ' + anio;
        return <View key={grupo.clave} style={estilos.grupo}>
              <Pressable accessibilityRole="button" accessibilityLabel={nombre} accessibilityState={{
            expanded: abierto
          }} onPress={() => establecerMesesCerrados(anteriores => abierto ? [...anteriores, grupo.clave] : anteriores.filter(clave => clave !== grupo.clave))} style={estilos.encabezadoMesDeudas}>
                <View style={estilos.textoFlexible}><Text style={estilosGlobales.encabezadoSeccion}>{nombre}</Text><Text style={estilosGlobales.textoSecundario}>{grupo.deudas.filter(deuda => deuda.saldada).length} de {grupo.deudas.length} deudas saldadas</Text></View>
                <Ionicons color={tema.foco} name={abierto ? 'chevron-up' : 'chevron-down'} size={22} />
              </Pressable>
              {abierto ? grupo.deudas.map(deuda => <TarjetaResumenDeuda key={deuda.id} deuda={deuda} alAbrir={() => abrirRegistro('detalleDeuda', {
            deudaId: deuda.id
          })} {...aspecto} />) : null}
            </View>;
      }) : <EstadoVacio icono="search-outline" titulo={consulta ? 'No encontramos deudas' : estado === 'saldadas' ? 'No hay deudas saldadas' : 'No hay deudas pendientes'} descripcion="Probá con otra persona o cambiá el estado seleccionado." {...aspecto} />}
        {consulta || estado !== 'todas' ? <BotonSocial texto="Limpiar búsqueda y filtros" simple alPresionar={limpiar} {...aspecto} /> : null}
      </View>
    </>;
}
