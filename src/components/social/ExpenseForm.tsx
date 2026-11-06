import { repartirGasto } from '../../social/socialValidation';
import { convertirMontoMovimiento } from '../../utils/movementValidation';
import SelectorSegmentado from '../SegmentedSelector';
import { useDatosSociales } from '../../social/SocialDataContext';
import { useEffect, useState } from 'react';
import { montoParaEntrada, nombreCompletoPersona } from '../../social/socialHelpers';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MontoSocial from './SocialAmountInput';
import CampoFormulario from './SocialTextField';
import SelectorPersonas from './PeopleSelector';
import FilaMontoManual from './ManualShareRow';
import OpcionPersona from './PaymentPersonOption';
import crearEstilosCompartidos from '../../styles/social/SharedStyles';
import crearEstilosPropios from '../../styles/social/ExpenseFormStyles';
export default function FormularioGasto(propiedades: import('../../social/types').AspectoSocial & ({participantes:import('../../social/types').PersonaVista[];gastoInicial?:import('../../social/types').GastoVista;borradorInicial?:import('../../social/types').EditorGasto | null;alCambiar:(datos:import('../../social/types').EditorGasto)=>void})) {
  const {
    obtenerPersona
  } = useDatosSociales();
  const {
    participantes,
    gastoInicial,
    borradorInicial,
    alCambiar,
    ...aspecto
  } = {
    ...propiedades,
    estilos: {
      ...crearEstilosCompartidos(propiedades.tema),
      ...crearEstilosPropios(propiedades.tema)
    }
  };
  const {
    estilos,
    estilosGlobales,
    tema
  } = aspecto;
  const [monto, establecerMonto] = useState<string>(borradorInicial?.monto || (gastoInicial ? montoParaEntrada(gastoInicial.montoNumero) : ''));
  const [descripcion, establecerDescripcion] = useState(borradorInicial?.descripcion || gastoInicial?.descripcion || '');
  const [pagadorId, establecerPagadorId] = useState(borradorInicial?.pagadorId || gastoInicial?.pagadorId || 'vos');
  const [reparto, establecerReparto] = useState(borradorInicial?.reparto || gastoInicial?.reparto || 'iguales');
  const [involucradas, establecerInvolucradas] = useState(borradorInicial?.involucradas || (gastoInicial ? gastoInicial.partes.map(parte => parte.personaId) : participantes.map(persona => persona.id)));
  const [pagaron, establecerPagaron] = useState(borradorInicial?.pagaron || gastoInicial?.partes.filter((parte) => parte.tipo === 'saldado').map(parte => parte.personaId) || []);
  const [montosManuales, establecerMontosManuales] = useState(() => borradorInicial?.montosManuales || Object.fromEntries((gastoInicial?.partes || []).map(parte => [parte.personaId, montoParaEntrada(parte.montoNumero)])));
  useEffect(() => { alCambiar({ monto, descripcion, pagadorId, reparto, involucradas, pagaron, montosManuales }); },
    [alCambiar, monto, descripcion, pagadorId, reparto, involucradas, pagaron, montosManuales]);
  const [mostrarPagos, establecerMostrarPagos] = useState(false);
  const personasGasto = participantes.filter(persona => involucradas.includes(persona.id));
  const montoNumero = convertirMontoMovimiento(monto);
  const totalCentavos = Math.round((montoNumero || 0) * 100);
  const montosAsignados = personasGasto.map(persona => convertirMontoMovimiento(montosManuales[persona.id]));
  const asignadoCentavos = montosAsignados.reduce<number>((total, valor) => total + Math.round((valor || 0) * 100), 0);
  const diferenciaCentavos = totalCentavos - asignadoCentavos;
  const repartoCompleto = montoNumero !== null && personasGasto.length > 0 && montosAsignados.every(valor => valor !== null) && diferenciaCentavos === 0;
  const formatearParte = (centavos: number) => '$ ' + (centavos / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let partesIguales: ReturnType<typeof repartirGasto>['partes'] = [];
  if (montoNumero !== null && involucradas.length) {
    try { partesIguales = repartirGasto({ monto, reparto: 'iguales', involucradas }, participantes.map(persona => persona.id)).partes; } catch { /* El resumen espera un importe y participantes válidos. */ }
  }
  const pagador = obtenerPersona(pagadorId) || { nombre: 'Persona no disponible' };
  const partesPagadas = personasGasto.filter(persona => persona.id === pagadorId || pagaron.includes(persona.id)).length;
  const todasPagaron = personasGasto.length > 0 && partesPagadas === personasGasto.length;
  const alternar = (lista: string[], id: string) => lista.includes(id) ? lista.filter(actual => actual !== id) : [...lista, id];
  const estadoPago = (persona: import('../../social/types').PersonaVista) => {
    if (persona.id === pagadorId) return 'Su parte ya está pagada';
    if (pagaron.includes(persona.id)) return pagadorId === 'vos' ? 'Ya te dio su parte' : `Ya le dio su parte a ${pagador.nombre}`;
    if (pagadorId === 'vos') return 'Todavía te debe su parte';
    return persona.id === 'vos' ? `Le debés tu parte a ${pagador.nombre}` : `Debe su parte a ${pagador.nombre}`;
  };
  return <View style={estilos.grupo}>
      <MontoSocial etiqueta="Importe del ítem" valor={monto} alCambiar={establecerMonto} {...aspecto} />
      <CampoFormulario etiqueta="Qué se pagó" ejemplo="Ej.: Pizzas, bebidas, taxi" valor={descripcion} limite={500} alCambiar={establecerDescripcion} {...aspecto} />
      <View style={estilos.filaCampos}>
        <SelectorPersonas etiqueta="Quién pagó" etiquetaCorta="Pagó" compacto desplegable personas={participantes} seleccionadas={[pagadorId]} alCambiar={ids => {
        establecerPagadorId(ids[0]);
        establecerPagaron([]);
      }} {...aspecto} />
        <SelectorPersonas etiqueta="Personas involucradas" etiquetaCorta="Participan" compacto desplegable personas={participantes} multiple seleccionadas={involucradas} alCambiar={establecerInvolucradas} {...aspecto} />
      </View>
      <View style={estilos.grupoCampo}>
        <Text style={estilosGlobales.etiqueta}>¿Cómo se reparte?</Text>
        <SelectorSegmentado tema={tema} opciones={[{ id: 'iguales', nombre: 'Iguales' }, { id: 'manual', nombre: 'Manual' }]} valor={reparto} alSeleccionar={establecerReparto} etiqueta="Cómo se reparte" />
      </View>
      <View style={[estilos.resumenReparto, reparto === 'manual' && estilos.resumenManual]}>
        <View style={estilos.encabezadoReparto}>
          <Text style={estilos.tituloReparto}>{reparto === 'iguales' ? 'La parte de cada persona' : 'Asigná los importes'}</Text>
          <Text style={estilos.cantidadReparto}>{personasGasto.length} {personasGasto.length === 1 ? 'persona' : 'personas'}</Text>
        </View>
        {reparto === 'iguales' ? partesIguales.length ? <>
          {partesIguales.map(parte => <View key={parte.personaId} style={estilos.filaReparto}>
            <Text style={estilos.nombreReparto}>{nombreCompletoPersona(obtenerPersona(parte.personaId))}</Text>
            <Text style={estilos.importeReparto}>{formatearParte(parte.centavos)}</Text>
          </View>)}
          {new Set(partesIguales.map(parte => parte.centavos)).size > 1 ? <Text style={estilos.ayudaReparto}>Los centavos restantes se reparten entre las primeras personas.</Text> : null}
        </> : <Text style={estilos.ayudaReparto}>{!personasGasto.length ? 'Elegí quiénes participan para calcular sus partes.' : montoNumero === null ? 'Ingresá el importe para ver cuánto le corresponde a cada persona.' : 'El importe debe alcanzar para asignar al menos un centavo a cada persona.'}</Text> : <>
          {personasGasto.length ? personasGasto.map(persona => <FilaMontoManual key={persona.id} persona={persona} valor={String(montosManuales[persona.id] || '')} alCambiar={valor => establecerMontosManuales(anteriores => ({ ...anteriores, [persona.id]: valor }))} {...aspecto} />) : <Text style={estilos.ayudaReparto}>Elegí quiénes participan para asignar sus partes.</Text>}
          <View accessibilityLiveRegion="polite" style={estilos.totalReparto}>
            <View style={estilos.encabezadoReparto}>
              <Text style={estilos.ayudaReparto}>Total asignado</Text>
              <Text style={estilos.importeReparto}>{formatearParte(asignadoCentavos)}</Text>
            </View>
            <Text style={[estilos.estadoReparto, { color: repartoCompleto ? tema.exito : diferenciaCentavos < 0 && montoNumero !== null ? tema.error : tema.textoSecundario }]}>
              {montoNumero === null ? 'Ingresá el importe total del ítem.' : diferenciaCentavos < 0 ? 'Excede el importe por ' + formatearParte(-diferenciaCentavos) : diferenciaCentavos > 0 ? 'Falta asignar ' + formatearParte(diferenciaCentavos) : repartoCompleto ? 'El reparto coincide con el importe.' : 'Completá el importe de cada persona.'}
            </Text>
          </View>
        </>}
      </View>
      <View style={estilos.ticket}>
        <Pressable accessibilityRole="button" accessibilityLabel={mostrarPagos ? 'Ocultar pagos' : 'Ver pagos'} accessibilityState={{
        expanded: mostrarPagos
      }} onPress={() => establecerMostrarPagos(!mostrarPagos)} style={estilos.filaTactil}>
          <View style={estilos.textoFlexible}><Text style={estilosGlobales.etiqueta}>Pagos y pendientes</Text><Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoAyuda}>{partesPagadas} de {personasGasto.length} partes pagadas · {pagadorId === 'vos' ? 'Cobrás vos' : `Cobra ${pagador.nombre}`}</Text></View>
          <Ionicons color={tema.textoSecundario} name={mostrarPagos ? 'chevron-up' : 'chevron-down'} size={20} />
        </Pressable>
        {mostrarPagos ? <>
            <Text numberOfLines={1} ellipsizeMode="tail" style={estilosGlobales.textoAyuda}>{pagadorId === 'vos' ? '¿Quién ya te dio su parte?' : `¿Quién ya le dio su parte a ${pagador.nombre}?`}</Text>
            <Pressable accessibilityRole="checkbox" accessibilityState={{
          checked: todasPagaron
        }} onPress={() => establecerPagaron(todasPagaron ? [] : personasGasto.map(persona => persona.id))} style={estilos.opcionPersona}>
              <Ionicons color={tema.foco} name={todasPagaron ? 'checkbox' : 'square-outline'} size={24} /><Text style={[estilosGlobales.texto, estilos.textoFlexible]}>Todos ya pagaron su parte</Text>
            </Pressable>
            {personasGasto.map(persona => <OpcionPersona key={persona.id} persona={persona} marcada={persona.id === pagadorId || pagaron.includes(persona.id)} deshabilitada={persona.id === pagadorId} detalle={estadoPago(persona)} alPresionar={() => establecerPagaron(alternar(pagaron, persona.id))} {...aspecto} />)}
          </> : null}
        {todasPagaron ? <Text style={estilosGlobales.texto}>Sin deudas pendientes. El gasto queda repartido y saldado.</Text> : null}
      </View>
    </View>;
}
