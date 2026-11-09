import SelectorSegmentado from '../SegmentedSelector';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useState } from 'react';
import { normalizarNombrePersona, nombreCompletoPersona } from '../../social/socialHelpers';
import { View, TextInput, Pressable, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TarjetaDeuda from '../DebtCard';
import EstadoVacio from './SocialEmptyState';
import crearEstilosHistorial from '../../styles/social/DebtHistoryStyles';
import { crearEstilosBusquedaFiltros } from '../../styles/MovementSearchFiltersStyles';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import EncabezadoSeccionPlegable from '../CollapsibleSectionHeader';
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
      ...crearEstilosHistorial(propiedades.tema)
    }
  };
  const {
    tema,
    estilos
  } = aspecto;
  const estilosFiltros = crearEstilosBusquedaFiltros(tema);
  const [enfocado, establecerEnfocado] = useState(false);
  const [busqueda, establecerBusqueda] = useState('');
  const [estado, establecerEstado] = useState('todas');
  const [origen,cambiarOrigen]=useState('todas');
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
    const coincideEstado = estado === 'todas' || (estado === 'invitaciones' ? !!deuda.invitacionOnline : estado === 'perdonadas' ? deuda.perdonadoNumero>0 : estado === 'saldadas' ? deuda.saldada&&!deuda.perdonadoNumero : !deuda.saldada&&deuda.tipo===estado);
    return (origen==='todas'||(origen==='online'?!!deuda.acuerdoOnlineId:!deuda.acuerdoOnlineId))&&coincideEstado && normalizarNombrePersona(`${nombreCompletoPersona(persona)} ${persona?.apodo || ''} ${deuda.descripcion} ${deuda.origen}`).includes(consulta);
  }).sort((a, b) => (b.ultimaActividad||b.fechaISO).localeCompare(a.ultimaActividad||a.fechaISO) || b.id.localeCompare(a.id));
  const grupos: {clave:string;deudas:import('../../social/types').DeudaVista[]}[] = [];
  deudas.forEach(deuda => {
    const clave = (deuda.ultimaActividad||deuda.fechaISO).slice(0, 7);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.clave === clave) ultimo.deudas.push(deuda);else grupos.push({
      clave,
      deudas: [deuda]
    });
  });
  return <View style={estilos.historial}>
      <View style={estilos.grupo}>
        <View style={estilos.filaCampos}>
          <View style={[estilos.buscador, enfocado && estilos.buscadorEnfocado]}>
            <Ionicons color={tema.textoSecundario} name="search-outline" size={20} />
            <TextInput accessibilityLabel="Buscar deudas por persona" value={busqueda} onChangeText={cambiarBusqueda} onFocus={() => establecerEnfocado(true)} onBlur={() => establecerEnfocado(false)} placeholder="Persona, apodo o deuda" placeholderTextColor={tema.textoSecundario} selectionColor={tema.foco} style={estilos.entradaBusqueda} />
            {busqueda ? <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda de deudas" onPress={() => cambiarBusqueda('')} style={estilos.accionBusqueda}><Ionicons color={tema.textoSecundario} name="close-circle-outline" size={22} /></Pressable> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Registrar deuda" onPress={() => abrirRegistro('deuda')} style={estilos.agregarDeuda}><Ionicons color={tema.botonPrincipalTexto} name="add" size={24} /></Pressable>
        </View>
        <SelectorSegmentado tema={tema} opciones={[{id:'todas',nombre:'Todas'},{id:'locales',nombre:'Locales'},{id:'online',nombre:'Online'}]} valor={origen} alSeleccionar={valor=>{cambiarOrigen(valor);if(estado==='invitaciones')cambiarEstado('todas');}} etiqueta="Origen de deudas"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filaFiltros}>
          {[{id:'todas',nombre:'Todas'},...(origen==='online'?[{id:'invitaciones',nombre:'Invitaciones'}]:[]),{id:'saldadas',nombre:'Saldadas'},{id:'perdonadas',nombre:'Perdonadas'},{id:'me_deben',nombre:'Me deben'},{id:'debo',nombre:'Debo'}].map(opcion=><Pressable key={opcion.id} accessibilityRole="radio" accessibilityLabel={opcion.nombre} accessibilityState={{checked:estado===opcion.id}} onPress={()=>cambiarEstado(opcion.id)} style={[estilosFiltros.filtro,estado===opcion.id&&estilosFiltros.filtroActivo]}><Text numberOfLines={1} style={[estilosFiltros.textoFiltro,estado===opcion.id&&estilosFiltros.textoActivo]}>{opcion.nombre}{opcion.id==='invitaciones'?' · '+deudasSociales.filter(d=>d.invitacionOnline).length:''}</Text></Pressable>)}
        </ScrollView>
        <Text accessibilityLiveRegion="polite" style={estilos.resultado}>{deudas.length} de {deudasSociales.length} deudas</Text>
      </View>

      <View style={estilos.grupo}>
        {deudas.length ? grupos.map(grupo => {
        const abierto = !mesesCerrados.includes(grupo.clave);
        const [anio, mes] = grupo.clave.split('-');
        const nombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][Number(mes) - 1] + ' ' + anio;
        return <View key={grupo.clave} style={estilos.grupo}>
              <EncabezadoSeccionPlegable tema={tema} titulo={nombre} resumen={`${grupo.deudas.filter(deuda => deuda.saldada).length} de ${grupo.deudas.length} deudas sin pendiente`} expandido={abierto}
                alAlternar={() => establecerMesesCerrados(anteriores => abierto ? [...anteriores, grupo.clave] : anteriores.filter(clave => clave !== grupo.clave))}/>
              {abierto ? grupo.deudas.map(deuda => <TarjetaDeuda key={deuda.id} deuda={deuda} nombrePersona={nombreCompletoPersona(obtenerPersona(deuda.personaId))} alAbrir={() => abrirRegistro('detalleDeuda', {
            deudaId: deuda.id
          })} {...aspecto} />) : null}
            </View>;
      }) : <EstadoVacio icono="search-outline" titulo={consulta ? 'No encontramos deudas' : estado === 'invitaciones' ? 'No hay invitaciones pendientes' : estado === 'perdonadas' ? 'No hay deudas perdonadas' : estado === 'saldadas' ? 'No hay deudas saldadas' : 'No hay deudas pendientes'} descripcion="Probá con otra persona o cambiá el estado seleccionado." {...aspecto} />}
      </View>
    </View>;
}
